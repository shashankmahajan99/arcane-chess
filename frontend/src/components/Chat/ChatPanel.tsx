import React, { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { ChatMessage } from '../../types';

const ChatMessageComponent: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const { user } = useAuthStore();
  const isOwnMessage = user?.id === message.user_id;
  const isSystem = message.type === 'system';
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-gray-700 text-gray-300 text-xs px-3 py-1 rounded-full">
          {message.message}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex mb-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-1' : 'order-2'}`}>
        {!isOwnMessage && (
          <div className="text-xs text-gray-400 mb-1">{message.username}</div>
        )}
        <div className={`px-4 py-2 rounded-lg ${
          isOwnMessage 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-700 text-gray-100'
        } ${message.type === 'emote' ? 'italic' : ''}`}>
          {message.type === 'emote' ? `*${message.message}*` : message.message}
        </div>
        <div className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
};

const TypingIndicator: React.FC<{ typingUsers: Set<string> }> = ({ typingUsers }) => {
  if (typingUsers.size === 0) return null;

  const typingArray = Array.from(typingUsers);
  const displayText = typingArray.length === 1 
    ? `${typingArray[0]} is typing...`
    : typingArray.length === 2
    ? `${typingArray[0]} and ${typingArray[1]} are typing...`
    : `${typingArray.length} people are typing...`;

  return (
    <div className="flex items-center space-x-2 px-4 py-2 text-gray-400 text-sm">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
      <span>{displayText}</span>
    </div>
  );
};

export const ChatPanel: React.FC = () => {
  const {
    messages,
    isOpen,
    inputValue,
    typingUsers,
    unreadCount,
    setInputValue,
    sendMessage,
    toggleChat,
    closeChat,
  } = useChatStore();

  const { isAuthenticated, user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && isAuthenticated) {
      await sendMessage(inputValue.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={toggleChat}
        className="fixed bottom-4 right-4 z-30 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-colors"
      >
        <div className="relative">
          💬
          {unreadCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </div>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-30 bg-gray-800 border border-gray-600 rounded-lg shadow-xl transition-all ${
      isMinimized ? 'h-12' : 'h-96'
    } w-80`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-600 bg-gray-750 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <div className="text-white font-medium">Chat</div>
          {typingUsers.size > 0 && !isMinimized && (
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {isMinimized ? '📈' : '📉'}
          </button>
          <button
            onClick={closeChat}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 h-64 bg-gray-800">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-8">
                No messages yet. Be the first to say hello! 👋
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <ChatMessageComponent key={message.id} message={message} />
                ))}
                <TypingIndicator typingUsers={typingUsers} />
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-600">
            {isAuthenticated ? (
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  maxLength={500}
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  Send
                </button>
              </form>
            ) : (
              <div className="text-center text-gray-400 text-sm py-2">
                <div>Sign in to chat with other players</div>
                <button 
                  onClick={() => {/* Open login modal */}}
                  className="text-blue-400 hover:text-blue-300 underline mt-1"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};