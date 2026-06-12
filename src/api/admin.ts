import client from './client';
import type { ReviewItem, LogItem, User } from '../types';

export const getDashboard = () =>
  client.get<{ pending_count: number; total_users: number; today_new: number }>('/admin/dashboard');

export const getReviews = () =>
  client.get<ReviewItem[]>('/admin/reviews');

export const approveReview = (id: number) =>
  client.post(`/admin/reviews/${id}/approve`);

export const rejectReview = (id: number, reason: string) =>
  client.post(`/admin/reviews/${id}/reject`, { reason });

export const getUsers = () =>
  client.get<User[]>('/admin/users');

export const getUserDetail = (id: number) =>
  client.get<User>(`/admin/users/${id}`);

export const setUserStatus = (id: number, status: 'active' | 'disabled') =>
  client.put(`/admin/users/${id}/status`, { status });

export const getAdminLogs = () =>
  client.get<LogItem[]>('/admin/logs');
