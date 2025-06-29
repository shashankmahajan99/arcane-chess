
import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../../services/websocket';

interface Message {
  user: string;
  message: string;
  timestamp: string;
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const socket = useWebSocket('ws://localhost:8080/ws');

  useEffect(() => {
    if (socket) {
      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'chat_message') {
          setMessages((prevMessages) => [...prevMessages, message.payload]);
        }
      };
    }
  }, [socket]);

  const handleSendMessage = () => {
    if (input.trim() && socket) {
      const message = {
        type: 'chat_message',
        payload: {
          user: 'Player1', // Replace with actual user
          message: input,
          timestamp: new Date().toISOString(),
        },
      };
      socket.send(JSON.stringify(message));
      setInput('');
    }
  };

  return (
    <div className="bg-black bg-opacity-50 rounded-lg p-4 h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4">Chat</h2>
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
          className="bg-blue-600 hover:bg-blue-700 rounded-r-lg px-4 py-2 font-semibold transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
