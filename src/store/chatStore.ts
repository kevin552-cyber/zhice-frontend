import { create } from 'zustand';
import type { Conversation, Message } from '../types';

interface ChatState {
  conversations: Conversation[];
  currentId: string | null;
  messages: Message[];
  streaming: boolean;
  setConversations: (list: Conversation[]) => void;
  setCurrent: (id: string | null) => void;
  setMessages: (msgs: Message[]) => void;
  appendMessage: (msg: Message) => void;
  updateLastAssistant: (text: string) => void;
  setStreaming: (v: boolean) => void;
  addConversation: (c: Conversation) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  currentId: null,
  messages: [],
  streaming: false,
  setConversations: (list) => set({ conversations: list }),
  setCurrent: (id) => set({ currentId: id }),
  setMessages: (msgs) => set({ messages: msgs }),
  appendMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),
  updateLastAssistant: (text) =>
    set((s) => {
      const msgs = [...s.messages];
      const last = msgs[msgs.length - 1];
      if (last?.role === 'assistant') {
        msgs[msgs.length - 1] = { ...last, content: text };
      }
      return { messages: msgs };
    }),
  setStreaming: (v) => set({ streaming: v }),
  addConversation: (c) =>
    set((s) => ({ conversations: [c, ...s.conversations] })),
}));
