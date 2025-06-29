import { io, Socket } from 'socket.io-client';
import { GameEvent, AvatarState, ChatMessage } from '../types';

export interface WebSocketEvents {
  // Game events
  'game:move': (data: any) => void;
  'game:update': (data: any) => void;
  'game:end': (data: any) => void;
  'game:player_join': (data: any) => void;
  'game:player_leave': (data: any) => void;
  
  // Avatar events
  'avatar:move': (data: AvatarState) => void;
  'avatar:animation': (data: { user_id: string; animation: string }) => void;
  'avatar:join': (data: AvatarState) => void;
  'avatar:leave': (data: { user_id: string }) => void;
  
  // Chat events
  'chat:message': (data: ChatMessage) => void;
  'chat:user_typing': (data: { user_id: string; typing: boolean }) => void;
  
  // Arena events
  'arena:join': (data: { arena_id: string; user_count: number }) => void;
  'arena:leave': (data: { arena_id: string; user_count: number }) => void;
}

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnected = false;

  connect(token: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(process.env.REACT_APP_WS_URL || 'ws://localhost:8080', {
          auth: {
            token
          },
          transports: ['websocket'],
          upgrade: false,
          rememberUpgrade: false,
        });

        this.socket.on('connect', () => {
          console.log('✅ WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve(true);
        });

        this.socket.on('disconnect', (reason) => {
          console.log('❌ WebSocket disconnected:', reason);
          this.isConnected = false;
          this.handleReconnection();
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ WebSocket connection error:', error);
          this.isConnected = false;
          reject(error);
        });

        // Handle reconnection
        this.socket.on('reconnect', () => {
          console.log('🔄 WebSocket reconnected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
        });

        this.socket.on('reconnect_error', (error) => {
          console.error('❌ WebSocket reconnection error:', error);
          this.handleReconnectionError();
        });

      } catch (error) {
        console.error('❌ Failed to create WebSocket connection:', error);
        reject(error);
      }
    });
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
    }
  }

  private handleReconnectionError(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      // Could trigger a UI notification here
    }
  }

  // Event subscription methods
  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.socket) {
      console.warn('⚠️ WebSocket not connected');
      return;
    }
    this.socket.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    if (!this.socket) return;
    this.socket.off(event, callback);
  }

  // Emit methods
  emit(event: string, data?: any): void {
    if (!this.socket || !this.isConnected) {
      console.warn('⚠️ WebSocket not connected, cannot emit:', event);
      return;
    }
    this.socket.emit(event, data);
  }

  // Game-specific methods
  joinArena(arenaId: string): void {
    this.emit('arena:join', { arena_id: arenaId });
  }

  leaveArena(arenaId: string): void {
    this.emit('arena:leave', { arena_id: arenaId });
  }

  joinGame(gameId: string): void {
    this.emit('game:join', { game_id: gameId });
  }

  makeMove(gameId: string, from: string, to: string, promotion?: string): void {
    this.emit('game:move', {
      game_id: gameId,
      from,
      to,
      promotion
    });
  }

  updateAvatarPosition(position: { x: number; y: number; z: number }, rotation: number): void {
    this.emit('avatar:move', {
      position,
      rotation,
      timestamp: Date.now()
    });
  }

  playAvatarAnimation(animation: string): void {
    this.emit('avatar:animation', {
      animation,
      timestamp: Date.now()
    });
  }

  sendChatMessage(message: string, type: 'chat' | 'emote' = 'chat'): void {
    this.emit('chat:message', {
      message,
      type,
      timestamp: Date.now()
    });
  }

  setTyping(typing: boolean): void {
    this.emit('chat:typing', {
      typing,
      timestamp: Date.now()
    });
  }

  // Connection status
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  // Cleanup
  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting WebSocket');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Get socket instance (for advanced usage)
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Create singleton instance
export const websocketService = new WebSocketService();

// React hook for WebSocket integration
import { useEffect, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useAvatarStore } from '../stores/avatarStore';

export const useWebSocket = (token?: string) => {
 const gameStore = useGameStore();
 const avatarStore = useAvatarStore();

 const connect = useCallback(async () => {
   if (!token || websocketService.isSocketConnected()) return;

   try {
     await websocketService.connect(token);
     
     // Set up game event handlers
     websocketService.on('game:move', (moveData) => {
       gameStore.addMove(moveData);
     });

     websocketService.on('game:update', (gameData) => {
       gameStore.updateGameState(gameData);
     });

     websocketService.on('game:player_join', (playerData) => {
       console.log('Player joined game:', playerData);
     });

     websocketService.on('game:player_leave', (playerData) => {
       console.log('Player left game:', playerData);
     });

     // Set up avatar event handlers
     websocketService.on('avatar:move', (avatarData) => {
       avatarStore.updateOtherAvatar(avatarData.user_id, avatarData);
     });

     websocketService.on('avatar:animation', (animationData) => {
       const avatarState = avatarStore.otherAvatars.get(animationData.user_id);
       if (avatarState) {
         avatarStore.updateOtherAvatar(animationData.user_id, {
           ...avatarState,
           animation: animationData.animation
         });
       }
     });

     websocketService.on('avatar:join', (avatarData) => {
       avatarStore.updateOtherAvatar(avatarData.user_id, avatarData);
     });

     websocketService.on('avatar:leave', (leaveData) => {
       avatarStore.removeOtherAvatar(leaveData.user_id);
     });

     // Set up chat event handlers
     websocketService.on('chat:message', (messageData) => {
       // Handle chat messages - could add to a chat store
       console.log('New chat message:', messageData);
     });

     websocketService.on('chat:user_typing', (typingData) => {
       // Handle typing indicators
       console.log('User typing:', typingData);
     });

   } catch (error) {
     console.error('Failed to connect WebSocket:', error);
     gameStore.setError('Connection failed. Please refresh to try again.');
   }
 }, [token, gameStore, avatarStore]);

 const disconnect = useCallback(() => {
   websocketService.disconnect();
 }, []);

 useEffect(() => {
   if (token) {
     connect();
   }

   return () => {
     disconnect();
   };
 }, [token, connect, disconnect]);

 return {
   isConnected: websocketService.isSocketConnected(),
   connect,
   disconnect,
   socket: websocketService
 };
};
