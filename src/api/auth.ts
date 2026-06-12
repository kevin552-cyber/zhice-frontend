import client from './client';
import type { AuthResponse } from '../types';

export const login = (phone: string, password: string) =>
  client.post<AuthResponse>('/auth/login', { phone, password });

export const register = (data: {
  real_name: string; email: string; id_number: string;
  organization: string; phone: string; code: string;
}) => client.post('/auth/register', data);

export const sendCode = (phone: string) =>
  client.post('/auth/send-code', { phone });

export const verifyCode = (phone: string, code: string) =>
  client.post('/auth/verify-code', { phone, code });

export const forgotPassword = (phone: string, code: string, newPassword: string) =>
  client.post('/auth/forgot-password', { phone, code, newPassword });

export const getUserInfo = () => client.get('/auth/user-info');
