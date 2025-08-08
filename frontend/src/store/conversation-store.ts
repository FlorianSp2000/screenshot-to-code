import { create } from "zustand";

export interface ConversationMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  images?: string[]; // Support for attached images
  isTyping?: boolean;
  metadata?: {
    messageType?: 'status' | 'artifact' | 'thinking';
    artifactType?: 'code' | 'json';
    artifactData?: unknown;
    statusType?: 'extracting' | 'analyzing' | 'generating' | 'complete' | 'error';
    isActive?: boolean; // For marking current/active artifacts
  };
}

interface ConversationStore {
  messages: ConversationMessage[];
  addMessage: (message: Omit<ConversationMessage, 'id' | 'timestamp'>) => string;
  updateMessage: (id: string, updates: Partial<ConversationMessage>) => void;
  clearConversation: () => void;
  getMessageById: (id: string) => ConversationMessage | undefined;
}

export const useConversationStore = create<ConversationStore>((set, get) => ({
  messages: [],

  addMessage: (message) => {
    const id = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newMessage: ConversationMessage = {
      ...message,
      id,
      timestamp: new Date(),
    };

    set(state => ({
      messages: [...state.messages, newMessage]
    }));

    console.log("💬 Added conversation message:", newMessage.content);
    return id;
  },

  updateMessage: (id, updates) => {
    set(state => ({
      messages: state.messages.map(msg => 
        msg.id === id ? { ...msg, ...updates } : msg
      )
    }));
  },

  clearConversation: () => {
    set({ messages: [] });
  },

  getMessageById: (id) => {
    return get().messages.find(msg => msg.id === id);
  },
}));