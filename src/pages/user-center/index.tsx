import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Descriptions, Input, message, Modal, Table, Tag, Card, Space, Tabs } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { getProfile, updatePassword, updatePhone, exportData, deleteAccount, getLogs } from '../../api/user';
import { sendCode } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import type { User, LogItem } from '../../types';

export default function UserCenterPage() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [user, setUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [tab, setTab] = useState('account');

  useEffect(() => {
    getProfile().then((r) => setUser(r.data)).catch(() => {});
    getLogs().then((r) => setLogs(r.data)).catch(() => {});
  }, []);

  const maskPhone = (p: string) => p?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  const maskEmail = (e: string) => e?.replace(/(.{1}).*(@.*)/, '$1***$2');
  const maskId = (id: string) => id?.replace(/^(\d{3})\d+(\d{4})$/, '$1***********$2');

  const [pwdModal, setPwdModal] = useState(false);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [phoneModal, setPhoneModal] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [dataModal, setDataModal] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [dataAction, setDataAction] = useState('');

  const content = () => {
    switch (tab) {
      case 'account':
        return (
          <Card title={<span style={{ fontSize: 18 }}>账号信息</span>} style={{ borderRadius: 16 }}>
            <Descriptions column={1} labelStyle={{ fontSize: 15, color: '#8B8580', paddingBottom: 12 }}
              contentStyle={{ fontSize: 16, color: '#5C5552' }}>
              <Descriptions.Item label="手机号">{maskPhone(user?.phone || '')}</Descriptions.Item>
              <Descriptions.Item label="电子邮箱">{maskEmail(user?.email || '')}</Descriptions.Item>
              <Descriptions.Item label="注册时间">{user?.created_at?.slice(0, 10)}</Descriptions.Item>
              <Descriptions.Item label="账号状态">
                <Tag color={user?.status === 'active' ? 'green' : user?.status === 'pending' ? 'orange' : 'red'}
                  style={{ fontSize: 14, padding: '2px 12px', borderRadius: 8 }}>
                  {user?.status === 'active' ? '正常' : user?.status === 'pending' ? '待审核' : '禁用'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        );
      case 'certification':
        return (
          <Card title={<span style={{ fontSize: 18 }}>实名认证信息</span>} style={{ borderRadius: 16 }}>
            <Descriptions column={1} labelStyle={{ fontSize: 15, color: '#8B8580', paddingBottom: 12 }}
              contentStyle={{ fontSize: 16, color: '#5C5552' }}>
              <Descriptions.Item label="真实姓名">{user?.real_name}</Descriptions.Item>
              <Descriptions.Item label="身份证号">{maskId(user?.id_number || '')}</Descriptions.Item>
              <Descriptions.Item label="手机号">{maskPhone(user?.phone || '')}</Descriptions.Item>
              <Descriptions.Item label="电子邮箱">{maskEmail(user?.email || '')}</Descriptions.Item>
              <Descriptions.Item label="所在单位">{user?.organization}</Descriptions.Item>
              <Descriptions.Item label="认证状态">
                <Tag color={user?.status === 'active' ? 'green' : 'orange'}
                  style={{ fontSize: 14, padding: '2px 12px', borderRadius: 8 }}>
                  {user?.status === 'active' ? '✅ 已认证' : user?.status === 'pending' ? '⏳ 待审核' : '❌ 未认证'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="帐号状态">
                <Tag color={user?.status === 'active' ? 'green' : 'red'}
                  style={{ fontSize: 14, padding: '2px 12px', borderRadius: 8 }}>
                  {user?.status === 'active' ? '正常' : '禁用'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        );
      case 'security':
        return (
          <div className="space-y-5">
            <Card title={<span style={{ fontSize: 18 }}>修改密码</span>} size="default" style={{ borderRadius: 16 }}>
              <Space direction="vertical" className="w-full" size="middle">
                <Input.Password placeholder="原密码" size="large" value={oldPwd}
                  onChange={(e) => setOldPwd(e.target.value)} style={{ borderRadius: 12, padding: '10px 16px' }} />
                <Input.Password placeholder="新密码（至少6位）" size="large" value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)} style={{ borderRadius: 12, padding: '10px 16px' }} />
                <Button type="primary" size="large" style={{ borderRadius: 12, height: 44, fontSize: 15 }}
                  onClick={async () => {
                    if (newPwd.length < 6) { message.warning('密码至少6位'); return; }
                    await updatePassword(oldPwd, newPwd); message.success('密码修改成功'); setOldPwd(''); setNewPwd('');
                  }}>确认修改</Button>
              </Space>
            </Card>
            <Card title={<span style={{ fontSize: 18 }}>修改手机号</span>} size="default" style={{ borderRadius: 16 }}>
              <Space direction="vertical" className="w-full" size="middle">
                <Input placeholder="新手机号" size="large" value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)} style={{ borderRadius: 12, padding: '10px 16px' }} />
                <Space>
                  <Input placeholder="验证码" size="large" value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    style={{ borderRadius: 12, padding: '10px 16px', width: 200 }} />
                  <Button size="large" style={{ borderRadius: 12, height: 44 }}
                    onClick={async () => { await sendCode(newPhone); message.success('验证码已发送'); }}>获取验证码</Button>
                </Space>
                <Button type="primary" size="large" style={{ borderRadius: 12, height: 44, fontSize: 15 }}
                  onClick={async () => { await updatePhone(newPhone, phoneCode); message.success('手机号修改成功'); }}>确认修改</Button>
              </Space>
            </Card>
          </div>
        );
      case 'data':
        return (
          <Card title={<span style={{ fontSize: 18 }}>个人信息管理</span>} style={{ borderRadius: 16 }}>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: '📖 查阅个人信息', action: 'view' },
                { label: '📋 复制个人信息', action: 'copy' },
                { label: '✏️ 更正个人信息', action: 'correct' },
                { label: '🗑️ 删除个人信息', action: 'delete' },
              ].map(({ label, action }) => (
                <Button key={action} size="large" style={{ height: 80, borderRadius: 14, fontSize: 16, borderColor: '#E5DDD6', color: '#5C5552' }}
                  onClick={() => { setDataAction(action); setDataModal(true); }}>{label}</Button>
              ))}
            </div>
            <Modal title="身份验证" open={dataModal} onCancel={() => setDataModal(false)} footer={null}>
              <p className="text-sm mb-3" style={{ color: '#8B8580' }}>请输入注册手机号的验证码以验证身份</p>
              <Input placeholder="验证码" size="large" value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                style={{ borderRadius: 12, padding: '10px 16px' }} />
              <Button className="mt-2" size="large" style={{ borderRadius: 12 }}
                onClick={() => sendCode(user?.phone || '').then(() => message.success('验证码已发送'))}>获取验证码</Button>
              <div className="mt-4 flex gap-2">
                <Button size="large" style={{ borderRadius: 12 }} onClick={() => setDataModal(false)}>取消</Button>
                <Button type="primary" size="large" style={{ borderRadius: 12 }} onClick={async () => {
                  if (!verifyCode) { message.warning('请输入验证码'); return; }
                  if (dataAction === 'copy') { const r = await exportData(verifyCode); message.success('个人信息已复制'); setDataModal(false); }
                  else if (dataAction === 'delete') { await deleteAccount(verifyCode); message.success('账号已删除'); logout(); navigate('/login'); }
                  else if (dataAction === 'view') {
                    setDataModal(false);
                    Modal.info({
                      title: '个人信息',
                      width: 520,
                      content: (
                        <div style={{ color: '#2D4A49' }}>
                          <div style={{ marginBottom: 8 }}><span style={{ color: '#6B8F8E', width: 80, display: 'inline-block' }}>手机号：</span>{user?.phone}</div>
                          <div style={{ marginBottom: 8 }}><span style={{ color: '#6B8F8E', width: 80, display: 'inline-block' }}>真实姓名：</span>{user?.real_name}</div>
                          <div style={{ marginBottom: 8 }}><span style={{ color: '#6B8F8E', width: 80, display: 'inline-block' }}>身份证号：</span>{user?.id_number}</div>
                          <div style={{ marginBottom: 8 }}><span style={{ color: '#6B8F8E', width: 80, display: 'inline-block' }}>电子邮箱：</span>{user?.email}</div>
                          <div style={{ marginBottom: 8 }}><span style={{ color: '#6B8F8E', width: 80, display: 'inline-block' }}>所在单位：</span>{user?.organization}</div>
                          <div style={{ marginBottom: 8 }}><span style={{ color: '#6B8F8E', width: 80, display: 'inline-block' }}>注册时间：</span>{user?.created_at?.slice(0, 10)}</div>
                          <div><span style={{ color: '#6B8F8E', width: 80, display: 'inline-block' }}>账号状态：</span>{user?.status === 'active' ? '正常' : user?.status === 'pending' ? '待审核' : '禁用'}</div>
                        </div>
                      ),
                    });
                  }
                  else { message.success('已提交更正申请，等待管理员审核'); setDataModal(false); }
                }}>确认</Button>
              </div>
            </Modal>
          </Card>
        );
      case 'logs':
        return (
          <Card title={<span style={{ fontSize: 18 }}>操作记录</span>} style={{ borderRadius: 16 }}>
            <Table dataSource={logs} rowKey="id" size="middle" style={{ fontSize: 14 }}
              columns={[
                { title: '时间', dataIndex: 'created_at', render: (v: string) => v?.slice(0, 16), width: 160 },
                { title: '操作', dataIndex: 'action', width: 120 },
                { title: '详情', dataIndex: 'detail' },
                { title: 'IP', dataIndex: 'ip', width: 130 },
              ]}
            />
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#F5F0EB' }}>
      <div className="px-6 py-4 flex items-center gap-3" style={{ background: '#EDE6DF', borderBottom: '1px solid #E5DDD6' }}>
        <Button type="text" icon={<ArrowLeftOutlined style={{ fontSize: 18 }} />} onClick={() => navigate('/chat')} style={{ color: '#5C5552' }} />
        <span className="text-lg font-medium" style={{ color: '#5C5552' }}>个人中心</span>
      </div>
      <div className="max-w-4xl mx-auto p-8">
        <Tabs activeKey={tab} onChange={setTab} size="large"
          items={['账号信息', '实名认证', '安全设置', '数据管理', '操作记录'].map((label) => ({
            key: { '账号信息': 'account', '实名认证': 'certification', '安全设置': 'security', '数据管理': 'data', '操作记录': 'logs' }[label] || label,
            label: <span style={{ fontSize: 16 }}>{label}</span>
          }))}
          style={{ marginBottom: 24 }}
        />
        {content()}
      </div>
    </div>
  );
}
