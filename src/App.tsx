import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
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

export default function App() {
  return (
    <ConfigProvider locale={zhCN} theme={theme}>
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
    </ConfigProvider>
  );
}
