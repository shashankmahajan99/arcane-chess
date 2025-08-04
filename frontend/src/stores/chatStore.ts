import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { ChatMessage } from '../types';

interface ChatState {
  // Chat state
  messages: ChatMessage[];
  isOpen: boolean;
  isTyping: boolean;
  typingUsers: Set<string>;
  unreadCount: number;
  
  // UI state
  inputValue: string;
  isEmojiPickerOpen: boolean;
  
  // Actions
  addMessage: (message: ChatMessage) => void;
  addSystemMessage: (text: string) => void;
  sendMessage: (text: string, type?: 'chat' | 'emote') => Promise<void>;
  setInputValue: (value: string) => void;
  setTyping: (typing: boolean) => void;
  addTypingUser: (userId: string) => void;
  removeTypingUser: (userId: string) => void;
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;
  markAsRead: () => void;
  clearMessages: () => void;
  toggleEmojiPicker: () => void;
  
  // Helper methods
  getRecentMessages: (limit?: number) => ChatMessage[];
  getUserMessages: (userId: string) => ChatMessage[];
}

export const useChatStore = create<ChatState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    messages: [],
    isOpen: false,
    isTyping: false,
    typingUsers: new Set(),
    unreadCount: 0,
    inputValue: '',
    isEmojiPickerOpen: false,

    // Actions
    addMessage: (message: ChatMessage) => {
      set(state => {
        const newMessages = [...state.messages, message];
        // Keep only last 100 messages for performance
        if (newMessages.length > 100) {
          newMessages.splice(0, newMessages.length - 100);
        }
        
        return {
          messages: newMessages,
          unreadCount: state.isOpen ? 0 : state.unreadCount + 1,
        };
      });
    },

    addSystemMessage: (text: string) => {
      const systemMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        user_id: 'system',
        username: 'System',
        message: text,
        timestamp: new Date().toISOString(),
        type: 'system',
      };
      get().addMessage(systemMessage);
    },

    sendMessage: async (text: string, type: 'chat' | 'emote' = 'chat') => {
      // This would integrate with the WebSocket service
      // For now, we'll add a placeholder implementation
      
      // Reset typing state
      get().setTyping(false);
      
      // Clear input
      set({ inputValue: '' });
      
      // TODO: Send via WebSocket
      // websocketService.sendChatMessage(text, type);
      
      // For development, add a mock message immediately
      if (process.env.REACT_APP_ENV === 'development') {
        const mockMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          user_id: 'current-user',
          username: 'You',
          message: text,
          timestamp: new Date().toISOString(),
          type,
        };
        get().addMessage(mockMessage);
      }
    },

    setInputValue: (inputValue: string) => {
      set({ inputValue });
      
      // Auto-trigger typing indicator
      if (inputValue.length > 0 && !get().isTyping) {
        get().setTyping(true);
      } else if (inputValue.length === 0 && get().isTyping) {
        get().setTyping(false);
      }
    },

    setTyping: (isTyping: boolean) => {
      set({ isTyping });
      // TODO: Send typing indicator via WebSocket
      // websocketService.setTyping(isTyping);
    },

    addTypingUser: (userId: string) => {
      set(state => ({
        typingUsers: new Set(state.typingUsers).add(userId)
      }));
    },

    removeTypingUser: (userId: string) => {
      set(state => {
        const newTypingUsers = new Set(state.typingUsers);
        newTypingUsers.delete(userId);
        return { typingUsers: newTypingUsers };
      });
    },

    toggleChat: () => {
      set(state => {
        const newIsOpen = !state.isOpen;
        return {
          isOpen: newIsOpen,
          unreadCount: newIsOpen ? 0 : state.unreadCount,
        };
      });
    },

    openChat: () => {
      set({ isOpen: true, unreadCount: 0 });
    },

    closeChat: () => {
      set({ isOpen: false });
    },

    markAsRead: () => {
      set({ unreadCount: 0 });
    },

    clearMessages: () => {
      set({ messages: [] });
    },

    toggleEmojiPicker: () => {
      set(state => ({ isEmojiPickerOpen: !state.isEmojiPickerOpen }));
    },

    // Helper methods
    getRecentMessages: (limit = 50) => {
      const { messages } = get();
      return messages.slice(-limit);
    },

    getUserMessages: (userId: string) => {
      const { messages } = get();
      return messages.filter(message => message.user_id === userId);
    },
  }))
);

// Add some default system messages for development
if (process.env.REACT_APP_ENV === 'development') {
  // Initialize with welcome message
  setTimeout(() => {
    useChatStore.getState().addSystemMessage('Welcome to Arcane Chess! Chat with other players here.');
  }, 1000);
}