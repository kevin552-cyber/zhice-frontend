import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Select, message, Modal, Space } from 'antd';
import {
  MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined,
  UploadOutlined, SendOutlined,
  PlusOutlined, DeleteOutlined, QuestionCircleOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { sendMessage, getHistory, deleteConversation, uploadFile, exportConversation, getConversation } from '../../api/chat';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import type { Message } from '../../types';

const WELCOME = "我是医保支付与编码及DRG专家大模型，专注于医保支付、ICD编码、DRG/DIP分组、费用计算、诊疗价值评估和合规预警等领域。";

const SUGGESTIONS = [
  "宫颈癌根治术，合并盆腔淋巴结转移（C77.501）应选C53.901（宫颈恶性肿瘤）还是C77.501（盆腔淋巴结继发恶性肿瘤）作为主诊断？",
  "股骨颈骨折，术前发现急性肺炎，经治疗后行全髋关节置换术，医生填写急性肺炎为主诊断是否正确？",
];

function generateFollowUps(answer: string, query: string): string[] {
  const qs: string[] = [];
  const combined = (query + ' ' + answer).toLowerCase();
  if (/编码|icd|诊断/.test(combined)) {
    qs.push("对应的ICD-9-CM-3手术编码是什么？");
    qs.push("如果合并其他疾病，主诊断选择规则是什么？");
  } else if (/drg|入组|分组|mdc|adrg/.test(combined)) {
    qs.push("这个DRG组的权重和费率是多少？");
    qs.push("伴有MCC/CC时入组有什么变化？");
  } else if (/支付|费用|点数|结算|倍率|盈亏/.test(combined)) {
    qs.push("低倍率和高倍率的判定标准是什么？");
    qs.push("这个病例在南京DRG点数法下的实际拨付是多少？");
  } else if (/合规|违规|分解|重复收费|处罚/.test(combined)) {
    qs.push("《医疗保障基金使用监督管理条例》第三十八条的具体规定是什么？");
    qs.push("飞检中如何核查这类违规行为？");
  } else if (/路径|icel|疗效|成本效果/.test(combined)) {
    qs.push("两种方案的ICER值是否低于支付意愿阈值？");
    qs.push("这个路径的标准住院日是多少？");
  } else {
    qs.push("能详细解释一下依据和原理吗？");
    qs.push("这个结论在临床实践中有什么指导意义？");
  }
  return qs.slice(0, 3);
}

function Avatar({ role }: { role: 'user' | 'assistant' }) {
  const bg = role === 'user'
    ? 'linear-gradient(135deg, #5B8D8C, #7AA9A8)'
    : 'linear-gradient(135deg, #D4A76A, #E0C08A)';
  const text = role === 'user' ? '用户' : '智策';
  return (
    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[13px] font-bold shrink-0"
      style={{ background: bg, boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
      {text}
    </div>
  );
}

export default function ChatPage() {
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const { conversations, currentId, messages, streaming,
    setConversations, setCurrent, setMessages,
    appendMessage, updateLastAssistant, setStreaming } = useChatStore();

  const [collapsed, setCollapsed] = useState(false);
  const [input, setInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; file_id: string }[]>([]);
  const [model, setModel] = useState('qwen3.5-397b-a17b');
  const [followUps, setFollowUps] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const msgEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { refreshHistory(); }, []);
  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, followUps]);

  const refreshHistory = () => getHistory().then((r) => setConversations(r.data)).catch(() => {});

  const loadConversation = async (id: string) => {
    try {
      const res = await getConversation(id);
      if (res.data) {
        const msgs = Array.isArray(res.data.messages) ? res.data.messages : [];
        setCurrent(id);
        setMessages(msgs);
        setFollowUps([]);
        return;
      }
    } catch { /* fallback to local */ }
    const conv = conversations.find((c) => c.id === id);
    if (conv) {
      const msgs = Array.isArray(conv.messages) ? conv.messages : [];
      setCurrent(id);
      setMessages(msgs);
      setFollowUps([]);
    } else {
      message.warning('无法加载该对话');
    }
  };

  const handleSend = async (query?: string) => {
    const text = query || input;
    if (!text.trim() && uploadedFiles.length === 0) return;
    const userMsg: Message = { role: 'user', content: text, files: uploadedFiles.length > 0 ? uploadedFiles : undefined };
    appendMessage(userMsg);
    setInput(''); setUploadedFiles([]); setFollowUps([]);
    setStreaming(true);
    appendMessage({ role: 'assistant', content: '' });

    const controller = new AbortController();
    abortRef.current = controller;
    let fullAnswer = '';
    const convId = useChatStore.getState().currentId || '';
    try {
      const resp = await sendMessage(text, convId, uploadedFiles.map((f) => f.file_id), controller.signal);
      if (!resp.ok) { const t = await resp.text(); throw new Error(t); }
      const reader = resp.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = ''; let newConvId = convId;

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.event === 'message' && data.answer) {
                fullAnswer += data.answer;
                updateLastAssistant(fullAnswer);
              }
              if (data.event === 'message_end' && data.conversation_id) {
                newConvId = data.conversation_id;
                setCurrent(data.conversation_id);
              }
            } catch { /* ignore */ }
          }
        }
      }
      if (fullAnswer) setFollowUps(generateFollowUps(fullAnswer, text));
      refreshHistory();
    } catch (e: any) {
      if (e.name !== 'AbortError') message.error('请求失败，请重试');
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const handleFileUpload = () => {
    const el = document.createElement('input');
    el.type = 'file';
    el.accept = '.pdf,.doc,.docx,.xlsx,.xls,.jpg,.jpeg,.png,.txt';
    el.onchange = async () => {
      const file = el.files?.[0]; if (!file) return;
      try {
        const res = await uploadFile(file);
        const fid = res.data?.upload_file_id || res.data?.id;
        if (fid) { setUploadedFiles((p) => [...p, { name: file.name, file_id: fid }]); message.success('文件上传成功'); }
        else message.error('上传失败：返回数据异常');
      } catch (e: any) { message.error('上传失败：' + (e.response?.data?.message || e.message)); }
    };
    el.click();
  };

  const handleExport = async () => {
    if (!currentId) { message.warning('没有可导出的对话'); return; }
    try {
      const res = await exportConversation(currentId);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url;
      a.download = `对话记录_${new Date().toISOString().slice(0, 10)}.docx`;
      a.click(); URL.revokeObjectURL(url);
    } catch { message.error('导出失败'); }
  };

  const newChat = () => { setCurrent(null); setMessages([]); setFollowUps([]); };
  const handleStop = () => { abortRef.current?.abort(); setStreaming(false); };

  const adminLinks = role === 'admin' ? (
    <div className="border-t pt-3 mt-3" style={{ borderColor: '#C5D6D5' }}>
      <div className="text-xs px-3 mb-1.5" style={{ color: '#9BB5B4' }}>管理后台</div>
      {[{ label: '📊 仪表盘', p: '/admin' }, { label: '📋 审核管理', p: '/admin/reviews' }, { label: '👥 用户管理', p: '/admin/users' }, { label: '📊 日志管理', p: '/admin/logs' }]
        .map(({ label, p }) => (
          <Button key={label} type="text" block size="small" className="text-left"
            style={{ color: '#2D4A49', justifyContent: 'flex-start', paddingLeft: 12 }}
            onClick={() => navigate(p)}>{label}</Button>
        ))}
    </div>
  ) : null;

  return (
    <div className="h-screen flex" style={{ background: '#F0F5F4' }}>
      {/* 侧边栏 */}
      <div className={`flex flex-col transition-all duration-300 ${collapsed ? 'w-0 overflow-hidden' : 'w-64'}`}
        style={{ background: '#EAF2F0', borderRight: '1px solid #C5D6D5' }}>
        <div className="p-5 border-b" style={{ borderColor: '#C5D6D5' }}>
          <div className="font-bold text-lg tracking-tight" style={{ color: '#2D4A49' }}>智策医保大模型</div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {conversations.length === 0 && <div className="text-sm text-center py-8" style={{ color: '#9BB5B4' }}>暂无对话记录</div>}
          {conversations.map((c) => (
            <div key={c.id}
              onClick={() => loadConversation(c.id)}
              className="flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer text-sm transition-all duration-200"
              style={{ background: currentId === c.id ? '#D5E2E1' : 'transparent', color: '#2D4A49' }}
              onMouseEnter={(e) => { if (currentId !== c.id) (e.currentTarget as HTMLElement).style.background = '#DCE8E6'; }}
              onMouseLeave={(e) => { if (currentId !== c.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
              <span className="truncate flex-1 text-[15px]">{c.title}</span>
              <DeleteOutlined className="text-sm" style={{ color: '#B5CBCA' }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = '#D4A76A'}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = '#B5CBCA'}
                onClick={(e) => { e.stopPropagation(); deleteConversation(c.id).then(refreshHistory); }} />
            </div>
          ))}
        </div>
        <div className="p-3 border-t" style={{ borderColor: '#C5D6D5' }}>
          <Button icon={<PlusOutlined />} block size="large" onClick={newChat}
            style={{ borderRadius: 12, borderColor: '#B5CBCA', color: '#2D4A49', height: 44, fontSize: 15, background: 'rgba(255,255,255,0.6)' }}>
            新建对话
          </Button>
          {adminLinks}
        </div>
      </div>

      {/* 主区域 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部导航 */}
        <div className="h-16 flex items-center shrink-0 px-4"
          style={{ background: 'linear-gradient(135deg, #E0EBE9, #E8F0EF)', borderBottom: '1px solid #C5D6D5' }}>
          <div className="flex items-center" style={{ width: 200 }}>
            <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)} style={{ color: '#2D4A49', fontSize: 18 }} />
          </div>
          <div className="flex-1 flex justify-center text-lg font-medium" style={{ color: '#2D4A49' }}>智策医保大模型</div>
          <div className="flex items-center justify-end gap-2" style={{ width: 480 }}>
            <Select value={model} onChange={setModel} style={{ width: 180, borderRadius: 10 }}
              options={[{ value: 'qwen3.5-397b-a17b', label: 'qwen3.5-397b-a17b' }, { value: 'qwen3.6-27b', label: 'qwen3.6-27b' }]} />
            <Button type="text" icon={<UserOutlined />} onClick={() => navigate('/user-center')} style={{ color: '#2D4A49', fontSize: 15 }}>用户中心</Button>
            <Button type="text" icon={<QuestionCircleOutlined />} style={{ color: '#2D4A49' }}
              onClick={() => Modal.info({ title: '人工协助', content: '如遇问题请发送邮件至：support@zhice-medical.com' })} />
          </div>
        </div>

        {/* 对话区域 */}
        <div className="flex-1 overflow-y-auto px-6 py-8 chat-bg">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <img src="/logo.png" alt="logo" className="mb-6" style={{ width: 240, height: 240, objectFit: 'contain' }}
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
              <p className="text-lg leading-relaxed mb-8 max-w-xl" style={{ color: '#2D4A49' }}>{WELCOME}</p>
              <div className="space-y-3 w-full max-w-2xl">
                {SUGGESTIONS.map((q, i) => (
                  <div key={i}
                    className="rounded-xl p-4 text-[15px] cursor-pointer transition-all duration-200"
                    style={{ background: '#FFFFFF', border: '1px solid #D5E2E1', color: '#2D4A49', boxShadow: '0 1px 4px rgba(91,141,140,0.08)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#7AA9A8'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(91,141,140,0.15)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#D5E2E1'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(91,141,140,0.08)'; }}
                    onClick={() => setInput(q)}>{q}</div>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg, i) => (
                <div key={i}>
                  <div className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <Avatar role={msg.role} />
                    <div className={`rounded-2xl px-5 py-4 text-[15px] leading-relaxed ${msg.role === 'user' ? 'rounded-br-md' : 'rounded-bl-md'}`}
                      style={{
                        maxWidth: '75%',
                        background: msg.role === 'user' ? '#E0EDEB' : '#FFFFFF',
                        color: '#2D4A49',
                        border: msg.role === 'user' ? 'none' : '1px solid #D5E2E1',
                      }}>
                      {msg.files?.map((f, fi) => (
                        <div key={fi} className="flex items-center gap-1.5 text-sm mb-2" style={{ color: '#6B8F8E' }}>
                          <UploadOutlined /> {f.name}
                        </div>
                      ))}
                      {msg.content ? (
                        <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                      ) : (msg.role === 'assistant' && streaming && i === messages.length - 1 ? (
                        <span style={{ color: '#7AA9A8' }}>▍</span>
                      ) : '')}
                    </div>
                  </div>
                  {msg.role === 'assistant' && i === messages.length - 1 && !streaming && followUps.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 ml-13">
                      {followUps.map((q, fi) => (
                        <span key={fi} onClick={() => handleSend(q)}
                          className="inline-block px-4 py-2 rounded-full text-sm cursor-pointer transition-all duration-200"
                          style={{ background: '#EAF2F0', border: '1px solid #D5E2E1', color: '#6B8F8E' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#D5E2E1'; e.currentTarget.style.color = '#2D4A49'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#EAF2F0'; e.currentTarget.style.color = '#6B8F8E'; }}>{q}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div ref={msgEndRef} />
            </div>
          )}
        </div>

        {/* 输入区域 */}
        <div className="shrink-0 px-6 py-4" style={{ background: 'linear-gradient(0deg, #F0F5F4, transparent)' }}>
          {uploadedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 max-w-4xl mx-auto">
              {uploadedFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm"
                  style={{ background: '#EAF2F0', border: '1px solid #C5D6D5', color: '#2D4A49' }}>
                  <UploadOutlined /> {f.name}
                  <span className="cursor-pointer ml-1 text-base" style={{ color: '#B5CBCA' }}
                    onClick={() => setUploadedFiles((p) => p.filter((_, j) => j !== i))}>×</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-3 items-end max-w-4xl mx-auto">
            <button type="button" onClick={handleFileUpload}
              className="flex items-center justify-center shrink-0 transition-all duration-200"
              style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.8)', border: '1px solid #C5D6D5', color: '#6B8F8E', cursor: 'pointer', fontSize: 20 }}>
              <UploadOutlined />
            </button>
            <div className="flex-1 relative" style={{ borderRadius: 16, background: '#FFFFFF', border: '1px solid #C5D6D5', boxShadow: '0 2px 12px rgba(91,141,140,0.1)' }}>
              <Input.TextArea value={input} onChange={(e) => setInput(e.target.value)}
                onPressEnter={(e) => { if (!e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="请输入您的问题，Shift+Enter换行"
                rows={3} style={{ border: 'none', borderRadius: 16, padding: '16px 20px', fontSize: 16, background: 'transparent', resize: 'vertical', boxShadow: 'none', minHeight: 56 }}
                disabled={streaming} />
            </div>
            {streaming ? (
              <button type="button" onClick={handleStop}
                className="flex items-center justify-center shrink-0 transition-all duration-200"
                style={{ width: 48, height: 48, borderRadius: 14, background: '#D4A76A', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
                停止</button>
            ) : (
              <button type="button" onClick={() => handleSend()}
                className="flex items-center justify-center shrink-0 transition-all duration-200"
                style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #5B8D8C, #7AA9A8)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 20, boxShadow: '0 2px 8px rgba(91,141,140,0.3)' }}>
                <SendOutlined />
              </button>
            )}
            <button type="button" onClick={handleExport}
              className="flex items-center justify-center shrink-0 transition-all duration-200"
              style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.8)', border: '1px solid #C5D6D5', color: '#6B8F8E', cursor: 'pointer', fontSize: 20 }}>
              <DownloadOutlined />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
