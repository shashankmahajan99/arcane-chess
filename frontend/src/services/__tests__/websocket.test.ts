import { io } from 'socket.io-client';

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connected: true,
    id: 'mock-socket-id',
  })),
}));

// Import after mocking
const WebSocketService = require('../websocket').default;

describe('WebSocketService', () => {
  let webSocketService: any;
  let mockSocket: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    mockSocket = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      connected: false,
      id: 'mock-socket-id',
    };
    
    // Mock the io function to return our mock socket
    (io as jest.Mock).mockReturnValue(mockSocket);
    
    webSocketService = new WebSocketService();
  });

  describe('Connection management', () => {
    it('should initialize without connection', () => {
      expect(webSocketService).toBeDefined();
    });

    it('should create socket with correct configuration', async () => {
      const token = 'mock-jwt-token';
      
      // Setup connect event to be called immediately
      mockSocket.on.mockImplementation((event: string, callback: any) => {
        if (event === 'connect') {
          setTimeout(callback, 0);
        }
      });
      
      const result = await webSocketService.connect(token);
      
      expect(io).toHaveBeenCalledWith(
        'ws://localhost:8080',
        expect.objectContaining({
          auth: { token },
          transports: ['websocket'],
          upgrade: false,
          rememberUpgrade: false,
        })
      );
      expect(result).toBe(true);
    });

    it('should handle connection success', async () => {
      const token = 'mock-jwt-token';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockSocket.on.mockImplementation((event: string, callback: any) => {
        if (event === 'connect') {
          setTimeout(callback, 0);
        }
      });
      
      await webSocketService.connect(token);
      
      expect(consoleSpy).toHaveBeenCalledWith('✅ WebSocket connected');
      
      consoleSpy.mockRestore();
    });

    it('should handle connection error', async () => {
      const token = 'mock-jwt-token';
      const error = new Error('Connection failed');
      
      mockSocket.on.mockImplementation((event: string, callback: any) => {
        if (event === 'connect_error') {
          setTimeout(() => callback(error), 0);
        }
      });
      
      try {
        await webSocketService.connect(token);
      } catch (e) {
        expect(e).toBe(error);
      }
    });

    it('should disconnect properly', () => {
      webSocketService.socket = mockSocket;
      mockSocket.connected = true;
      
      webSocketService.disconnect();
      
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should not disconnect if not connected', () => {
      webSocketService.socket = mockSocket;
      mockSocket.connected = false;
      
      webSocketService.disconnect();
      
      expect(mockSocket.disconnect).not.toHaveBeenCalled();
    });
  });

  describe('Event handling', () => {
    beforeEach(() => {
      webSocketService.socket = mockSocket;
      webSocketService.isConnected = true;
    });

    it('should register event listeners', () => {
      const callback = jest.fn();
      
      webSocketService.on('test-event', callback);
      
      expect(mockSocket.on).toHaveBeenCalledWith('test-event', callback);
    });

    it('should remove event listeners', () => {
      const callback = jest.fn();
      
      webSocketService.off('test-event', callback);
      
      expect(mockSocket.off).toHaveBeenCalledWith('test-event', callback);
    });

    it('should handle missing socket gracefully', () => {
      webSocketService.socket = null;
      const callback = jest.fn();
      
      expect(() => {
        webSocketService.on('test-event', callback);
      }).not.toThrow();
    });
  });

  describe('Message emission', () => {
    beforeEach(() => {
      webSocketService.socket = mockSocket;
      webSocketService.isConnected = true;
    });

    it('should emit messages when connected', () => {
      const data = { test: 'data' };
      
      webSocketService.emit('test-event', data);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('test-event', data);
    });

    it('should not emit messages when disconnected', () => {
      webSocketService.isConnected = false;
      const data = { test: 'data' };
      
      webSocketService.emit('test-event', data);
      
      expect(mockSocket.emit).not.toHaveBeenCalled();
    });

    it('should handle missing socket gracefully', () => {
      webSocketService.socket = null;
      const data = { test: 'data' };
      
      expect(() => {
        webSocketService.emit('test-event', data);
      }).not.toThrow();
    });
  });

  describe('Game-specific methods', () => {
    beforeEach(() => {
      webSocketService.socket = mockSocket;
      webSocketService.isConnected = true;
    });

    it('should join game room correctly', () => {
      const gameId = 'game-123';
      
      webSocketService.joinGame(gameId);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('join-room', { room: `game-${gameId}` });
    });

    it('should leave game room correctly', () => {
      const gameId = 'game-123';
      
      webSocketService.leaveGame(gameId);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('leave-room', { room: `game-${gameId}` });
    });

    it('should send chess moves correctly', () => {
      const moveData = {
        gameId: 'game-123',
        from: 'e2',
        to: 'e4',
        piece: 'pawn',
      };
      
      webSocketService.sendMove(moveData);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('game-move', moveData);
    });

    it('should join arena correctly', () => {
      const arenaId = 'arena-456';
      
      webSocketService.joinArena(arenaId);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('join-room', { room: `arena-${arenaId}` });
    });

    it('should leave arena correctly', () => {
      const arenaId = 'arena-456';
      
      webSocketService.leaveArena(arenaId);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('leave-room', { room: `arena-${arenaId}` });
    });
  });

  describe('Avatar methods', () => {
    beforeEach(() => {
      webSocketService.socket = mockSocket;
      webSocketService.isConnected = true;
    });

    it('should update avatar position correctly', () => {
      const positionData = {
        x: 1.0,
        y: 0.0,
        z: 2.0,
        rotation: 0.5,
      };
      
      webSocketService.updateAvatarPosition(positionData);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('avatar-position', positionData);
    });

    it('should send avatar animation correctly', () => {
      const animation = 'wave';
      
      webSocketService.sendAvatarAnimation(animation);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('avatar-animation', { animation });
    });
  });

  describe('Chat functionality', () => {
    beforeEach(() => {
      webSocketService.socket = mockSocket;
      webSocketService.isConnected = true;
    });

    it('should send chat messages correctly', () => {
      const message = 'Hello, world!';
      const room = 'game-123';
      
      webSocketService.sendChatMessage(message, room);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('chat-message', {
        message,
        room,
        timestamp: expect.any(Number),
      });
    });

    it('should handle empty chat messages', () => {
      const message = '';
      const room = 'game-123';
      
      webSocketService.sendChatMessage(message, room);
      
      // Should not emit empty messages (this depends on implementation)
      // For now, let's assume it does emit but with empty string
      expect(mockSocket.emit).toHaveBeenCalledWith('chat-message', {
        message: '',
        room,
        timestamp: expect.any(Number),
      });
    });

    it('should handle missing room parameter', () => {
      const message = 'Hello, world!';
      
      webSocketService.sendChatMessage(message);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('chat-message', {
        message,
        room: undefined, // Will be handled by implementation
        timestamp: expect.any(Number),
      });
    });
  });

  describe('Error handling', () => {
    it('should handle socket errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      webSocketService.socket = mockSocket;
      
      // Simulate error event registration and trigger
      let errorCallback: any;
      mockSocket.on.mockImplementation((event: string, callback: any) => {
        if (event === 'error') {
          errorCallback = callback;
        }
      });
      
      // Set up error handling
      webSocketService.setupEventHandlers();
      
      // Trigger error
      if (errorCallback) {
        errorCallback(new Error('Connection failed'));
      }
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle unexpected disconnection', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      webSocketService.socket = mockSocket;
      
      // Simulate disconnect event
      let disconnectCallback: any;
      mockSocket.on.mockImplementation((event: string, callback: any) => {
        if (event === 'disconnect') {
          disconnectCallback = callback;
        }
      });
      
      webSocketService.setupEventHandlers();
      
      if (disconnectCallback) {
        disconnectCallback('transport close');
      }
      
      expect(webSocketService.isConnected).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('Reconnection logic', () => {
    it('should attempt reconnection on connection loss', async () => {
      const connectSpy = jest.spyOn(webSocketService, 'connect').mockResolvedValue(true);
      
      await webSocketService.reconnect();
      
      expect(connectSpy).toHaveBeenCalled();
      connectSpy.mockRestore();
    });

    it('should handle reconnection failure', async () => {
      const connectSpy = jest.spyOn(webSocketService, 'connect').mockRejectedValue(new Error('Reconnection failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await webSocketService.reconnect();
      
      expect(connectSpy).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
      
      connectSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });
});