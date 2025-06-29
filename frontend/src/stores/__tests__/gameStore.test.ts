import { useGameStore } from '../gameStore';
import { Chess } from 'chess.js';
import { Game } from '../../types';

// Mock chess.js
jest.mock('chess.js');

describe('GameStore', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useGameStore.getState().reset();
    jest.clearAllMocks();
  });

  describe('Game initialization', () => {
    it('should initialize with empty state', () => {
      const state = useGameStore.getState();
      
      expect(state.currentGame).toBeNull();
      expect(state.selectedSquare).toBeNull();
      expect(state.possibleMoves).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.chessEngine).toBeNull();
    });

    it('should set current game correctly', () => {
      const mockGame: Game = {
        id: 'game-123',
        arena_id: 'arena-456',
        white_player_id: 'user-1',
        black_player_id: 'user-2',
        white_player: {
          id: 'user-1',
          username: 'Player1',
          email: 'player1@example.com',
          rating: 1500,
          avatar_id: 'avatar-1',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
        black_player: {
          id: 'user-2',
          username: 'Player2',
          email: 'player2@example.com',
          rating: 1600,
          avatar_id: 'avatar-2',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
        status: 'active',
        current_turn: 'white',
        move_count: 0,
        white_time: 900,
        black_time: 900,
        time_control: 900,
        board_state: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      const mockChessInstance = {
        fen: jest.fn().mockReturnValue('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'),
        turn: jest.fn().mockReturnValue('w'),
        board: jest.fn().mockReturnValue(Array(8).fill(null).map(() => Array(8).fill(null))),
        moveNumber: jest.fn().mockReturnValue(1),
      };
      
      (Chess as jest.MockedClass<typeof Chess>).mockImplementation(() => mockChessInstance as any);
      
      const store = useGameStore.getState();
      store.setCurrentGame(mockGame);
      
      const state = useGameStore.getState();
      expect(state.currentGame).toEqual(mockGame);
      expect(state.whitePlayer).toEqual(mockGame.white_player);
      expect(state.blackPlayer).toEqual(mockGame.black_player);
    });

    it('should initialize chess engine with FEN', () => {
      const mockChessInstance = {
        fen: jest.fn().mockReturnValue('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'),
        turn: jest.fn().mockReturnValue('w'),
        board: jest.fn().mockReturnValue(Array(8).fill(null).map(() => Array(8).fill(null))),
        moveNumber: jest.fn().mockReturnValue(1),
      };
      
      (Chess as jest.MockedClass<typeof Chess>).mockImplementation(() => mockChessInstance as any);
      
      const store = useGameStore.getState();
      store.initializeChess('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      
      const state = useGameStore.getState();
      expect(state.chessEngine).toBeDefined();
      expect(Chess).toHaveBeenCalledWith('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    });
  });

  describe('Square selection', () => {
    let mockChessInstance: Chess;

    beforeEach(() => {
      mockChessInstance = {
        get: jest.fn(),
        moves: jest.fn(),
        fen: jest.fn().mockReturnValue('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'),
        turn: jest.fn().mockReturnValue('w'),
        board: jest.fn().mockReturnValue(Array(8).fill(null).map(() => Array(8).fill(null))),
        moveNumber: jest.fn().mockReturnValue(1),
      };
      
      (Chess as jest.MockedClass<typeof Chess>).mockImplementation(() => mockChessInstance);
    });

    it('should select square with valid piece', () => {
      mockChessInstance.get.mockReturnValue({ color: 'w', type: 'p' });
      mockChessInstance.moves.mockReturnValue([
        { from: 'e2', to: 'e3', san: 'e3' },
        { from: 'e2', to: 'e4', san: 'e4' }
      ]);

      const store = useGameStore.getState();
      store.initializeChess();
      store.setCurrentUser({
        id: 'user-1',
        username: 'Player1',
        email: 'player1@example.com',
        rating: 1500,
        avatar_id: 'avatar-1',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      });
      
      // Set up game where it's white's turn and user is white
      const mockGame: Game = {
        id: 'game-123',
        arena_id: 'arena-456',
        white_player_id: 'user-1',
        black_player_id: 'user-2',
        status: 'active',
        current_turn: 'white',
        move_count: 0,
        white_time: 900,
        black_time: 900,
        time_control: 900,
        board_state: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };
      
      store.setCurrentGame(mockGame);
      store.selectSquare('e2');
      
      const state = useGameStore.getState();
      expect(state.selectedSquare).toBe('e2');
      expect(state.possibleMoves).toEqual(['e3', 'e4']);
    });

    it('should deselect when clicking same square', () => {
      mockChessInstance.get.mockReturnValue({ color: 'w', type: 'p' });
      mockChessInstance.moves.mockReturnValue([
        { from: 'e2', to: 'e3', san: 'e3' },
        { from: 'e2', to: 'e4', san: 'e4' }
      ]);

      const store = useGameStore.getState();
      store.initializeChess();
      store.setCurrentUser({
        id: 'user-1',
        username: 'Player1',
        email: 'player1@example.com',
        rating: 1500,
        avatar_id: 'avatar-1',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      });
      
      const mockGame: Game = {
        id: 'game-123',
        arena_id: 'arena-456',
        white_player_id: 'user-1',
        black_player_id: 'user-2',
        status: 'active',
        current_turn: 'white',
        move_count: 0,
        white_time: 900,
        black_time: 900,
        time_control: 900,
        board_state: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };
      
      store.setCurrentGame(mockGame);
      store.selectSquare('e2');
      store.selectSquare('e2'); // Deselect
      
      const state = useGameStore.getState();
      expect(state.selectedSquare).toBeNull();
      expect(state.possibleMoves).toEqual([]);
    });

    it('should not select when not player turn', () => {
      const store = useGameStore.getState();
      store.initializeChess();
      
      // Don't set isMyTurn to true
      store.selectSquare('e2');
      
      const state = useGameStore.getState();
      expect(state.selectedSquare).toBeNull();
    });
  });

  describe('Move execution', () => {
    let mockChessInstance: Chess;

    beforeEach(() => {
      mockChessInstance = {
        move: jest.fn(),
        fen: jest.fn().mockReturnValue('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'),
        turn: jest.fn().mockReturnValue('b'),
        board: jest.fn().mockReturnValue(Array(8).fill(null).map(() => Array(8).fill(null))),
        moveNumber: jest.fn().mockReturnValue(1),
        inCheck: jest.fn().mockReturnValue(false),
        isCheckmate: jest.fn().mockReturnValue(false),
        isStalemate: jest.fn().mockReturnValue(false),
      };
      
      (Chess as jest.MockedClass<typeof Chess>).mockImplementation(() => mockChessInstance);
    });

    it('should execute valid moves', async () => {
      mockChessInstance.move.mockReturnValue({
        from: 'e2',
        to: 'e4',
        piece: 'p',
        color: 'w',
        san: 'e4',
        captured: undefined,
      });

      const store = useGameStore.getState();
      store.initializeChess();
      store.setCurrentGame({
        id: 'game-123',
        arena_id: 'arena-456',
        white_player_id: 'user-1',
        black_player_id: 'user-2',
        status: 'active',
        current_turn: 'white',
        move_count: 0,
        white_time: 900,
        black_time: 900,
        time_control: 900,
        board_state: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      });
      
      store.setCurrentUser({
        id: 'user-1',
        username: 'Player1',
        email: 'player1@example.com',
        rating: 1500,
        avatar_id: 'avatar-1',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      });
      
      const result = await store.makeMove('e2', 'e4');
      
      expect(result).toBe(true);
      expect(mockChessInstance.move).toHaveBeenCalledWith({ from: 'e2', to: 'e4', promotion: undefined });
    });

    it('should reject invalid moves', async () => {
      mockChessInstance.move.mockReturnValue(null); // Invalid move

      const store = useGameStore.getState();
      store.initializeChess();
      store.setCurrentGame({
        id: 'game-123',
        arena_id: 'arena-456',
        white_player_id: 'user-1',
        black_player_id: 'user-2',
        status: 'active',
        current_turn: 'white',
        move_count: 0,
        white_time: 900,
        black_time: 900,
        time_control: 900,
        board_state: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      });
      
      const result = await store.makeMove('e2', 'e5'); // Invalid move
      
      expect(result).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should handle chess engine errors gracefully', async () => {
      const mockChessInstance = {
        move: jest.fn().mockImplementation(() => {
          throw new Error('Chess engine error');
        }),
        fen: jest.fn().mockReturnValue('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'),
        turn: jest.fn().mockReturnValue('w'),
        board: jest.fn().mockReturnValue(Array(8).fill(null).map(() => Array(8).fill(null))),
        moveNumber: jest.fn().mockReturnValue(1),
      };
      
      (Chess as jest.MockedClass<typeof Chess>).mockImplementation(() => mockChessInstance);
      
      const store = useGameStore.getState();
      store.initializeChess();
      store.setCurrentGame({
        id: 'game-123',
        arena_id: 'arena-456',
        white_player_id: 'user-1',
        black_player_id: 'user-2',
        status: 'active',
        current_turn: 'white',
        move_count: 0,
        white_time: 900,
        black_time: 900,
        time_control: 900,
        board_state: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      });
      
      const result = await store.makeMove('e2', 'e4');
      
      expect(result).toBe(false);
    });

    it('should set error message on move failure', async () => {
      const store = useGameStore.getState();
      
      store.setError('Test error');
      
      const state = useGameStore.getState();
      expect(state.error).toBe('Test error');
    });
  });

  describe('Store reset', () => {
    it('should reset all state to initial values', () => {
      const store = useGameStore.getState();
      
      // Set up some state
      store.setCurrentGame({
        id: 'game-123',
        arena_id: 'arena-456',
        white_player_id: 'user-1',
        black_player_id: 'user-2',
        status: 'active',
        current_turn: 'white',
        move_count: 0,
        white_time: 900,
        black_time: 900,
        time_control: 900,
        board_state: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      });
      
      store.setError('Test error');
      store.setLoading(true);
      
      // Reset
      store.reset();
      
      // Check all values are back to initial state
      const state = useGameStore.getState();
      expect(state.currentGame).toBeNull();
      expect(state.chessBoard).toBeNull();
      expect(state.chessEngine).toBeNull();
      expect(state.gameHistory).toEqual([]);
      expect(state.selectedSquare).toBeNull();
      expect(state.possibleMoves).toEqual([]);
      expect(state.isMyTurn).toBe(false);
      expect(state.whitePlayer).toBeNull();
      expect(state.blackPlayer).toBeNull();
      expect(state.error).toBeNull();
      expect(state.showMoveHistory).toBe(false);
    });
  });
});