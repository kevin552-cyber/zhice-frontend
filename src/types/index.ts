export interface User {
  id: number;
  phone: string;
  real_name: string;
  email: string;
  id_number: string;
  organization: string;
  role: 'user' | 'admin';
  status: 'pending' | 'active' | 'disabled' | 'rejected';
  created_at: string;
}

export interface AuthResponse {
  token: string;
  role: 'user' | 'admin';
  user: User;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  files?: { name: string; file_id: string }[];
}

export interface ReviewItem {
  id: number;
  real_name: string;
  phone: string;
  email: string;
  id_number: string;
  organization: string;
  status: 'pending' | 'approved' | 'rejected';
  reject_reason?: string;
  created_at: string;
}

export interface LogItem {
  id: number;
  user_id: number;
  user_name?: string;
  action: string;
  detail: string;
  ip: string;
  created_at: string;
}
