import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import { PhoneOutlined, LockOutlined } from '@ant-design/icons';
import { login } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const onFinish = async (values: { phone: string; password: string }) => {
    setLoading(true);
    try {
      const res = await login(values.phone, values.password);
      const { token, role, user } = res.data;
      setAuth(token, role, user);
      message.success('登录成功');
      navigate('/chat');
    } catch {
      message.error('手机号或密码错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #EDE6DF 0%, #F5F0EB 50%, #E8E0D9 100%)' }}>
      <div className="rounded-3xl shadow-lg p-10 w-[420px]" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#5C5552' }}>智策医保大模型</h1>
          <p className="mt-2" style={{ color: '#8B8580' }}>请登录您的账号</p>
        </div>
        <Form layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item name="phone" rules={[{ required: true, message: '请输入手机号' }, { pattern: /^1\d{10}$/, message: '手机号格式不正确' }]}>
            <Input prefix={<PhoneOutlined style={{ color: '#8B8580' }} />} placeholder="请输入手机号" size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined style={{ color: '#8B8580' }} />} placeholder="请输入密码" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large"
              style={{ background: '#8BA4B8', borderColor: '#8BA4B8', borderRadius: 12, height: 48, fontSize: 16 }}>
              登录
            </Button>
          </Form.Item>
        </Form>
        <div className="text-center text-sm space-x-4" style={{ color: '#8B8580' }}>
          <Link to="/forgot-password" className="hover:underline" style={{ color: '#8BA4B8' }}>忘记密码？</Link>
          <span>|</span>
          <Link to="/register" className="hover:underline" style={{ color: '#8BA4B8' }}>还没有账号？去注册</Link>
        </div>
      </div>
    </div>
  );
}
