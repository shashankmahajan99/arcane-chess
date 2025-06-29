import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';

interface Message {
  user: string;
  message: string;
  timestamp: string;
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const socket = useWebSocket('ws://localhost:8080/ws?user_id=test-user&username=TestUser');

  useEffect(() => {
    if (socket) {
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received WebSocket message:', data);
          
          // Handle different message types based on backend structure
          if (data.type === 'chat_message' && data.data) {
            const chatData = data.data;
            // Only add message if it's from a different user to avoid duplicates
            const newMessage: Message = {
              user: chatData.username || data.username || 'Unknown',
              message: chatData.message || 'No message',
              timestamp: new Date().toISOString()
            };
            setMessages((prevMessages) => [...prevMessages, newMessage]);
          } else if (data.type === 'connection_established') {
            console.log('WebSocket connection established:', data.data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      socket.onopen = () => {
        console.log('WebSocket connected to backend');
        
        // Join the global chat room when connected
        const joinMessage = {
          type: 'join_room',
          data: {
            room_id: 'global',
          },
        };
        socket.send(JSON.stringify(joinMessage));
        console.log('Joined global chat room');
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      socket.onclose = () => {
        console.log('WebSocket connection closed');
      };
    }
  }, [socket]);

  const handleSendMessage = () => {
    if (input.trim() && socket && socket.readyState === WebSocket.OPEN) {
      const message = {
        type: 'chat_message',
        data: {
          user_id: 'test-user',
          username: 'TestUser',
          message: input,
          room: 'global',
        },
        room: 'global',
      };
      
      console.log('Sending message:', message);
      socket.send(JSON.stringify(message));
      setInput('');
    }
  };

  return (
    <div className="bg-black bg-opacity-50 rounded-lg p-4 h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4">Chat</h2>
      <div className="text-sm mb-2 text-gray-400">
        WebSocket Status: {socket ? (socket.readyState === WebSocket.OPEN ? '🟢 Connected' : '🔴 Disconnected') : '⚫ Not initialized'}
      </div>
      <div className="flex-1 overflow-y-auto mb-4">
        {messages.map((msg, index) => (
          <div key={index} className="mb-2">
            <span className="font-semibold text-blue-400">{msg.user}: </span>
            <span>{msg.message}</span>
            <span className="text-xs text-gray-500 ml-2">{new Date(msg.timestamp).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
      <div className="flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          className="flex-1 bg-gray-800 rounded-l-lg px-4 py-2 focus:outline-none"
          placeholder="Type a message..."
        />
        <button
          onClick={handleSendMessage}
          disabled={!socket || socket.readyState !== WebSocket.OPEN}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-r-lg px-4 py-2 font-semibold transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
