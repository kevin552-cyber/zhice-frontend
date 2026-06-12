import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function AuthGuard({ children, role }: { children: React.ReactNode; role?: 'user' | 'admin' }) {
  const { token, role: userRole } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (role && userRole !== role) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
