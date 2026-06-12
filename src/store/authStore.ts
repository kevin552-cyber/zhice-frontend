import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  token: string | null;
  role: 'user' | 'admin' | null;
  user: User | null;
  setAuth: (token: string, role: 'user' | 'admin', user: User) => void;
  logout: () => void;
  isLoggedIn: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('token'),
  role: localStorage.getItem('role') as 'user' | 'admin' | null,
  user: null,
  setAuth: (token, role, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    set({ token, role, user });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    set({ token: null, role: null, user: null });
  },
  isLoggedIn: () => !!get().token,
}));
