import client from './client';
import type { Conversation } from '../types';

export const sendMessage = (
  query: string,
  conversationId: string,
  fileIds?: string[],
  signal?: AbortSignal
) => {
  const params = new URLSearchParams();
  params.set('query', query);
  if (conversationId) params.set('conversation_id', conversationId);
  if (fileIds?.length) params.set('file_ids', fileIds.join(','));

  return fetch(`/api/chat/completion?${params}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    signal,
  });
};

export const getHistory = () =>
  client.get<Conversation[]>('/chat/history');

export const getConversation = (id: string) =>
  client.get<Conversation>(`/chat/history/${id}`);

export const deleteConversation = (id: string) =>
  client.delete(`/chat/history/${id}`);

export const uploadFile = (file: File) => {
  const form = new FormData();
  form.append('file', file);
  return client.post<{ file_id: string }>('/chat/upload', form);
};

export const exportConversation = (id: string) =>
  client.post(`/chat/export/${id}`, {}, { responseType: 'blob' });
