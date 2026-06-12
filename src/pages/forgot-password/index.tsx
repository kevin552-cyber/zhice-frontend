import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Tabs, Input, Button, message } from 'antd';
import { sendCode, verifyCode, forgotPassword } from '../../api/auth';

export default function ForgotPasswordPage() {
  const [tab, setTab] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [step, setStep] = useState(1); // 1=验证身份 2=设置密码 3=完成
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  const sendCodeHandler = async () => {
    if (tab === 'phone' && !/^1\d{10}$/.test(phone)) { message.warning('请输入正确的手机号'); return; }
    try {
      await sendCode(phone);
      message.success('验证码已发送');
      setCountdown(60);
      const t = setInterval(() => { setCountdown((c) => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }); }, 1000);
    } catch { message.error('发送失败'); }
  };

  const verifyHandler = async () => {
    if (!code || code.length !== 6) { message.warning('请输入验证码'); return; }
    try {
      await verifyCode(phone, code);
      setStep(2);
    } catch { message.error('验证码错误'); }
  };

  const resetPwd = async () => {
    if (newPwd.length < 6) { message.warning('密码至少6位'); return; }
    if (newPwd !== confirmPwd) { message.warning('两次密码不一致'); return; }
    try {
      await forgotPassword(phone, code, newPwd);
      message.success('密码重置成功');
      setStep(3);
    } catch { message.error('重置失败'); }
  };

  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0958D9] to-[#1677FF]">
        <div className="bg-white rounded-2xl shadow-xl p-10 w-[400px] text-center">
          <div className="text-5xl mb-4">🔑</div>
          <h2 className="text-xl font-bold mb-2">密码重置成功</h2>
          <p className="text-gray-500 mb-6">请使用新密码登录</p>
          <Button type="primary" size="large" onClick={() => navigate('/login')}>返回登录</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0958D9] to-[#1677FF]">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-[420px]">
        <h2 className="text-xl font-bold text-center mb-6">忘记密码</h2>
        {step === 1 ? (
          <>
            <Tabs activeKey={tab} onChange={(k) => setTab(k as 'phone')} centered items={[
              { key: 'phone', label: '手机号重置', children: (
                <div className="space-y-3">
                  <Input placeholder="请输入手机号" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  <div className="flex gap-2">
                    <Input placeholder="验证码" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} />
                    <Button onClick={sendCodeHandler} disabled={countdown > 0}>{countdown > 0 ? `${countdown}s` : '获取验证码'}</Button>
                  </div>
                  <Button type="primary" block size="large" onClick={verifyHandler}>下一步</Button>
                </div>
              )},
              { key: 'email', label: '邮箱重置', children: (
                <div className="space-y-3">
                  <Input placeholder="请输入邮箱" />
                  <Button type="primary" block size="large" onClick={() => { message.success('重置链接已发送至您的邮箱'); setStep(2); }}>发送重置链接</Button>
                </div>
              )},
            ]} />
          </>
        ) : (
          <div className="space-y-3">
            <Input.Password placeholder="请输入新密码（至少6位）" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
            <Input.Password placeholder="确认新密码" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} />
            <Button type="primary" block size="large" onClick={resetPwd}>确认重置</Button>
          </div>
        )}
        <div className="text-center mt-4">
          <Link to="/login" className="text-sm text-gray-400 hover:text-[#1677FF]">返回登录</Link>
        </div>
      </div>
    </div>
  );
}
