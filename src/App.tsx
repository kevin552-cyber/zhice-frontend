import { Component, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Button } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import LoginPage from './pages/login';
import RegisterPage from './pages/register';
import RegisterSuccess from './pages/register/success';
import ForgotPasswordPage from './pages/forgot-password';
import ChatPage from './pages/chat';
import UserCenterPage from './pages/user-center';
import AdminPage from './pages/admin';
import { AuthGuard } from './components/AuthGuard';

const theme = {
  token: { colorPrimary: '#1677FF', borderRadius: 8 },
};

// 全局错误边界
class AppErrorBoundary extends Component<{ children: ReactNode }> {
  state = { hasError: false, error: '' };
  static getDerivedStateFromError(e: Error) { return { hasError: true, error: e.message }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F0F5F4', color: '#2D4A49', padding: 40 }}>
          <h2 style={{ marginBottom: 12 }}>页面遇到了意外错误</h2>
          <p style={{ color: '#6B8F8E', marginBottom: 20, maxWidth: 400, textAlign: 'center' }}>{this.state.error}</p>
          <Button type="primary" onClick={() => { this.setState({ hasError: false, error: '' }); window.location.href = '/chat'; }}>
            重新加载
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ConfigProvider locale={zhCN} theme={theme}>
      <AppErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/register/success" element={<RegisterSuccess />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/chat" element={<AuthGuard><ChatPage /></AuthGuard>} />
            <Route path="/user-center" element={<AuthGuard><UserCenterPage /></AuthGuard>} />
            <Route path="/user-center/:tab" element={<AuthGuard><UserCenterPage /></AuthGuard>} />
            <Route path="/admin" element={<AuthGuard role="admin"><AdminPage /></AuthGuard>} />
            <Route path="/admin/:tab" element={<AuthGuard role="admin"><AdminPage /></AuthGuard>} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AppErrorBoundary>
    </ConfigProvider>
  );
}
