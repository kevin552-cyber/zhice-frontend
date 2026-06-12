import client from './client';
import type { LogItem } from '../types';

export const getProfile = () => client.get('/user/profile');
export const updateProfile = (data: Record<string, string>) =>
  client.put('/user/profile', data);
export const updatePhone = (phone: string, code: string) =>
  client.put('/user/phone', { phone, code });
export const updateEmail = (email: string) =>
  client.put('/user/email', { email });
export const updatePassword = (oldPwd: string, newPwd: string) =>
  client.put('/user/password', { old_password: oldPwd, new_password: newPwd });
export const exportData = (code: string) =>
  client.post('/user/data/export', { code });
export const deleteAccount = (code: string) =>
  client.post('/user/data/delete', { code });
export const getLogs = () => client.get<LogItem[]>('/user/logs');
