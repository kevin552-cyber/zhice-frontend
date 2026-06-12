import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Checkbox, message, Modal } from 'antd';
import { sendCode, register } from '../../api/auth';

const STEPS = ['阅读须知', '填写信息', '手机验证', '提交申请'];

const NEICE_NOTICE = `智策医保大模型 内测须知

感谢您参与智策医保大模型的内测。在您使用本系统前，请仔细阅读以下条款：

第一条 内测目的
本系统目前处于内测阶段，旨在收集用户反馈、优化系统性能。内测期间，系统功能可能不稳定或发生变更。

第二条 用户资格
1. 用户须为年满18周岁的自然人。
2. 用户需提供真实、准确的个人信息进行实名认证。
3. 每个手机号仅限注册一个账号。

第三条 用户权利
1. 用户有权在内测期间免费使用本系统的各项功能。
2. 用户有权就系统问题提出反馈和建议。
3. 用户有权按照相关法律法规要求查阅、更正、删除个人信息。

第四条 用户义务
1. 用户不得将账号出借、转让给他人使用。
2. 用户不得利用本系统从事任何违法违规活动。
3. 用户不得对本系统进行反向工程、破解或攻击。
4. 用户不得利用系统生成的内容进行医保欺诈、虚假申报等违法活动。

第五条 免责声明
1. 本系统生成的内容仅供参考，不构成医疗建议或法律意见。
2. 内测期间因系统故障、数据异常等造成的损失，平台不承担责任。
3. 平台有权根据内测情况随时暂停或终止服务。

第六条 隐私保护
1. 平台将严格保护用户的个人信息安全。
2. 用户信息仅用于账号管理和服务优化，不会向第三方泄露。`;

const SERVICE_AGREEMENT = `智策医保大模型 服务协议

本协议是您（以下简称"用户"）与智策医保大模型平台（以下简称"平台"）之间关于使用本服务所订立的协议。

第一条 服务内容
1. 平台提供医保政策查询、ICD编码检索、DRG/DIP分组分析、支付计算、诊疗路径评估和合规预警等智能问答服务。
2. 平台通过大模型技术结合医保知识库，为用户提供专业、准确的信息服务。

第二条 账号管理
1. 用户注册时应提供真实、准确的个人信息。
2. 用户对账号下的一切行为承担法律责任。
3. 如发现账号异常，用户应立即通知平台。

第三条 知识产权
1. 平台所提供的内容、技术、软件等知识产权归平台所有。
2. 未经平台书面许可，用户不得复制、传播、修改平台内容。

第四条 服务限制
1. 平台不对服务的连续性、准确性做任何明示或默示的保证。
2. 平台有权在必要时修改或中断服务，无需对用户或第三方承担责任。
3. 平台不对因不可抗力导致的损失承担责任。

第五条 违规处理
1. 对于违反本协议的用户，平台有权采取警告、限制功能、禁用账号等措施。
2. 对于涉嫌违法的行为，平台有权向有关部门举报。

第六条 协议修改
1. 平台有权根据法律法规变化或业务需要修改本协议。
2. 修改后的协议一经公布即生效，如用户继续使用服务视为同意修改。`;

function StepCircle({ num, label, state, onClick }: { num: number; label: string; state: 'done' | 'current' | 'pending'; onClick?: () => void }) {
  return (
    <div className="flex items-center gap-3 py-2 cursor-pointer" onClick={state === 'done' ? onClick : undefined}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all ${
          state === 'done' ? 'bg-[#5B8D8C] text-white' :
          state === 'current' ? 'bg-[#5B8D8C] text-white' :
          'bg-[#D5E2E1] text-[#9BB5B4]'
        }`}
      >
        {state === 'done' ? '✓' : num}
      </div>
      <span className={`text-sm ${state === 'current' ? 'text-[#2D4A49] font-medium' : 'text-[#9BB5B4]'}`}>{label}</span>
    </div>
  );
}

function AgreementModal({ title, content, open, onClose }: { title: string; content: string; open: boolean; onClose: () => void }) {
  return (
    <Modal title={title} open={open} onCancel={onClose} footer={<Button onClick={onClose} type="primary">我知道了</Button>} width={600}>
      <div style={{ maxHeight: 400, overflow: 'auto', whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.8, color: '#2D4A49' }}>{content}</div>
    </Modal>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    real_name: '', email: '', id_number: '', organization: '',
    phone: '', password: '', confirm_password: ''
  });
  const [agree1, setAgree1] = useState(false);
  const [agree2, setAgree2] = useState(false);
  const [modal, setModal] = useState<'none' | 'notice' | 'service'>('none');
  const [codeLoading, setCodeLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const startCountdown = () => {
    setCountdown(60);
    const t = setInterval(() => { setCountdown((c) => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }); }, 1000);
  };

  const sendCodeHandler = async () => {
    if (!/^1\d{10}$/.test(form.phone)) { message.warning('请输入正确的手机号'); return; }
    setCodeLoading(true);
    try { await sendCode(form.phone); message.success('验证码已发送'); startCountdown(); }
    catch { message.error('发送失败'); }
    finally { setCodeLoading(false); }
  };

  const goToStep = (s: number) => {
    if (s < step) { setStep(s); return; }
    if (s === step + 1) {
      if (s === 2) { setStep(2); return; }
      if (s === 3) {
        if (!form.real_name) { message.warning('请输入真实姓名'); return; }
        if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) { message.warning('请输入有效的电子邮箱'); return; }
        if (!form.id_number || form.id_number.length !== 18) { message.warning('请输入18位身份证号'); return; }
        const birth = form.id_number.substring(6, 14);
        const y = parseInt(birth.substring(0, 4)), m = parseInt(birth.substring(4, 6)) - 1, d = parseInt(birth.substring(6, 8));
        const age = (new Date().getFullYear() - y) - (new Date() < new Date(new Date().getFullYear(), m, d) ? 1 : 0);
        if (age < 18) { message.error('未满18周岁暂不支持注册'); return; }
        if (!form.organization) { message.warning('请输入所在单位'); return; }
        if (!form.phone || !/^1\d{10}$/.test(form.phone)) { message.warning('请输入正确的手机号'); return; }
        if (!form.password || form.password.length < 6) { message.warning('密码至少6位'); return; }
        if (form.password !== form.confirm_password) { message.warning('两次密码输入不一致'); return; }
        if (!agree1 || !agree2) { message.warning('请阅读并同意相关协议'); return; }
        setStep(3);
      }
    }
  };

  const submitRegister = async () => {
    if (!form.phone || !form.password) { message.warning('数据异常，请重新填写'); return; }
    try { await register({ real_name: form.real_name, email: form.email, id_number: form.id_number, organization: form.organization, phone: form.phone, code: '123456' }); navigate('/register/success'); }
    catch (e: any) { message.error(e.response?.data?.message || '提交失败'); }
  };

  const stepContent = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#2D4A49' }}>内测须知</h2>
            <div className="space-y-3 mb-4">
              <details className="rounded-xl" style={{ background: '#F0F5F4' }}>
                <summary className="px-4 py-3 cursor-pointer font-medium text-sm" style={{ color: '#2D4A49' }}>📋 内测须知</summary>
                <div className="px-4 pb-4 text-sm leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto" style={{ color: '#6B8F8E' }}>{NEICE_NOTICE}</div>
              </details>
              <details className="rounded-xl" style={{ background: '#F0F5F4' }}>
                <summary className="px-4 py-3 cursor-pointer font-medium text-sm" style={{ color: '#2D4A49' }}>📋 服务协议</summary>
                <div className="px-4 pb-4 text-sm leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto" style={{ color: '#6B8F8E' }}>{SERVICE_AGREEMENT}</div>
              </details>
            </div>
            <Button type="primary" size="large" onClick={() => goToStep(2)} style={{ borderRadius: 12, height: 44, fontSize: 15 }}>我已阅读，下一步</Button>
          </div>
        );
      case 2:
        return (
          <div>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#2D4A49' }}>内测注册申请</h2>
            <div className="space-y-3 max-w-md">
              <div>
                <label className="block text-sm mb-1" style={{ color: '#6B8F8E' }}>真实姓名</label>
                <Input placeholder="请输入真实姓名" value={form.real_name} onChange={(e) => setForm({ ...form, real_name: e.target.value })} size="large" />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: '#6B8F8E' }}>电子邮箱</label>
                <Input placeholder="请输入电子邮箱" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} size="large" />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: '#6B8F8E' }}>身份证号</label>
                <Input placeholder="请输入18位身份证号" maxLength={18} value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })} size="large" />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: '#6B8F8E' }}>所在单位</label>
                <Input placeholder="请输入所在单位" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} size="large" />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: '#6B8F8E' }}>手机号</label>
                <Input placeholder="请输入手机号" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} size="large" />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: '#6B8F8E' }}>密码</label>
                <Input.Password placeholder="请输入密码（至少6位）" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} size="large" />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: '#6B8F8E' }}>确认密码</label>
                <Input.Password placeholder="请再次输入密码" value={form.confirm_password} onChange={(e) => setForm({ ...form, confirm_password: e.target.value })} size="large" />
              </div>
              <div className="space-y-1 pt-2">
                <Checkbox checked={agree1} onChange={(e) => setAgree1(e.target.checked)} style={{ color: '#6B8F8E' }}>
                  我已阅读并同意 <a href="#" onClick={(e) => { e.preventDefault(); setModal('notice'); }} style={{ color: '#5B8D8C' }}>《内测须知》</a>
                </Checkbox><br />
                <Checkbox checked={agree2} onChange={(e) => setAgree2(e.target.checked)} style={{ color: '#6B8F8E' }}>
                  我已阅读并同意 <a href="#" onClick={(e) => { e.preventDefault(); setModal('service'); }} style={{ color: '#5B8D8C' }}>《服务协议》</a>
                </Checkbox>
              </div>
              <Button type="primary" size="large" block className="mt-2" style={{ borderRadius: 12, height: 44, fontSize: 15 }} onClick={() => goToStep(3)}>下一步</Button>
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#2D4A49' }}>手机验证</h2>
            <p className="text-sm mb-4" style={{ color: '#6B8F8E' }}>已向您的手机号 {form.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')} 发送了验证码，请查收</p>
            <Input placeholder="验证码" maxLength={6} size="large" style={{ width: 200, textAlign: 'center', fontSize: 20, letterSpacing: 8, borderRadius: 12 }} />
            <div className="mt-2 mb-4">
              <Button onClick={sendCodeHandler} disabled={countdown > 0} type="link" style={{ color: '#5B8D8C', padding: 0 }}>{countdown > 0 ? `重新获取（${countdown}s）` : '重新获取验证码'}</Button>
            </div>
            <Button type="primary" size="large" style={{ borderRadius: 12, height: 44, fontSize: 15 }} onClick={() => setStep(4)}>确认验证</Button>
          </div>
        );
      case 4:
        return (
          <div>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#2D4A49' }}>提交申请</h2>
            <div className="rounded-xl p-4 text-sm space-y-2 mb-4" style={{ background: '#F0F5F4' }}>
              <p style={{ color: '#6B8F8E' }}>真实姓名：{form.real_name}</p>
              <p style={{ color: '#6B8F8E' }}>电子邮箱：{form.email.replace(/(.{1}).*(@.*)/, '$1***$2')}</p>
              <p style={{ color: '#6B8F8E' }}>身份证号：{form.id_number.replace(/^(\d{3})\d+(\d{4})$/, '$1***********$2')}</p>
              <p style={{ color: '#6B8F8E' }}>手机号：{form.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</p>
              <p style={{ color: '#6B8F8E' }}>所在单位：{form.organization}</p>
            </div>
            <Button type="primary" size="large" block style={{ borderRadius: 12, height: 44, fontSize: 15, background: 'linear-gradient(135deg, #5B8D8C, #7AA9A8)' }} onClick={submitRegister}>确认提交</Button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #E0EBE9, #F0F5F4)' }}>
      <div className="bg-white rounded-2xl shadow-lg flex w-[820px] min-h-[520px]" style={{ boxShadow: '0 8px 40px rgba(91,141,140,0.12)' }}>
        <div className="w-56 rounded-l-2xl p-8 border-r" style={{ background: '#F0F5F4', borderColor: '#D5E2E1' }}>
          {STEPS.map((label, i) => (
            <StepCircle key={i} num={i + 1} label={label}
              state={i + 1 < step ? 'done' : i + 1 === step ? 'current' : 'pending'}
              onClick={() => goToStep(i + 1)} />
          ))}
        </div>
        <div className="flex-1 p-8">{stepContent()}</div>
      </div>
      <AgreementModal title="《内测须知》" content={NEICE_NOTICE} open={modal === 'notice'} onClose={() => setModal('none')} />
      <AgreementModal title="《服务协议》" content={SERVICE_AGREEMENT} open={modal === 'service'} onClose={() => setModal('none')} />
    </div>
  );
}
