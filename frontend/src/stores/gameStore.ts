import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Game, GameMove, ChessBoard, User } from '../types';
import { Chess, Square, Move } from 'chess.js';

interface GameState {
  // Current game data
  currentGame: Game | null;
  chessBoard: ChessBoard | null;
  chessEngine: Chess | null;
  
  // Game history
  gameHistory: GameMove[];
  
  // Game controls
  selectedSquare: string | null;
  possibleMoves: string[];
  isMyTurn: boolean;
  
  // Players
  currentUser: User | null;
  whitePlayer: User | null;
  blackPlayer: User | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  showMoveHistory: boolean;
  
  // Actions
  setCurrentGame: (game: Game | null) => void;
  setCurrentUser: (user: User | null) => void;
  initializeChess: (fen?: string) => void;
  selectSquare: (square: string) => void;
  makeMove: (from: string, to: string, promotion?: string) => Promise<boolean>;
  addMove: (move: GameMove) => void;
  updateGameState: (updates: Partial<Game>) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  toggleMoveHistory: () => void;
  reset: () => void;
  
  // Helper methods
  updateChessBoard: () => void;
  updateTurnState: () => void;
  isPieceOwnedByCurrentPlayer: (pieceColor: string) => boolean;
}

export const useGameStore = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentGame: null,
    chessBoard: null,
    chessEngine: null,
    gameHistory: [],
    selectedSquare: null,
    possibleMoves: [],
    isMyTurn: false,
    currentUser: null,
    whitePlayer: null,
    blackPlayer: null,
    isLoading: false,
    error: null,
    showMoveHistory: false,

    // Actions
    setCurrentGame: (game) => {
      set({ currentGame: game });
      if (game) {
        get().initializeChess(game.board_state);
        set({
          whitePlayer: game.white_player || null,
          blackPlayer: game.black_player || null,
        });
        get().updateTurnState();
      }
    },

    setCurrentUser: (user) => {
      set({ currentUser: user });
      get().updateTurnState();
    },

    initializeChess: (fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') => {
      const chess = new Chess(fen);
      set({ chessEngine: chess });
      get().updateChessBoard();
    },

    selectSquare: (square) => {
      const { selectedSquare, chessEngine, isMyTurn } = get();
      
      if (!isMyTurn || !chessEngine) return;

      if (selectedSquare === square) {
        // Deselect
        set({ selectedSquare: null, possibleMoves: [] });
        return;
      }

      if (selectedSquare) {
        // Try to make a move
        get().makeMove(selectedSquare, square).then(moveResult => {
          if (moveResult) {
            set({ selectedSquare: null, possibleMoves: [] });
          }
        });
      } else {
        // Select new square
        const piece = chessEngine.get(square as Square);
        if (piece && get().isPieceOwnedByCurrentPlayer(piece.color)) {
          const moves = chessEngine.moves({ square: square as Square, verbose: true });
          const possibleMoves = moves.map((move: any) => move.to);
          set({ selectedSquare: square, possibleMoves });
        }
      }
    },

    makeMove: async (from, to, promotion) => {
      const { chessEngine, currentGame } = get();
      
      if (!chessEngine || !currentGame) return false;

      try {
        // Validate move locally first
        const move = chessEngine.move({ from, to, promotion });
        if (!move) return false;

        // Send move to server (would be implemented in network layer)
        // await gameService.makeMove(currentGame.id, from, to, promotion);
        
        get().updateChessBoard();
        get().addMove({
          id: `temp-${Date.now()}`,
          game_id: currentGame.id,
          player_id: get().currentUser?.id || '',
          move_number: chessEngine.moveNumber(),
          from_square: from,
          to_square: to,
          piece: move.piece,
          captured_piece: move.captured || undefined,
          promotion: promotion,
          is_check: chessEngine.inCheck(),
          is_checkmate: chessEngine.isCheckmate(),
          is_stalemate: chessEngine.isStalemate(),
          notation: move.san,
          fen_after: chessEngine.fen(),
          time_left: 0,
          created_at: new Date().toISOString(),
        });

        return true;
      } catch (error) {
        console.error('Move failed:', error);
        get().setError('Invalid move');
        return false;
      }
    },

    addMove: (move) => {
      set(state => ({
        gameHistory: [...state.gameHistory, move]
      }));
    },

    updateGameState: (updates) => {
      set(state => ({
        currentGame: state.currentGame 
          ? { ...state.currentGame, ...updates }
          : null
      }));
      get().updateTurnState();
    },

    setError: (error) => set({ error }),
    setLoading: (isLoading) => set({ isLoading }),
    toggleMoveHistory: () => set(state => ({ showMoveHistory: !state.showMoveHistory })),

    reset: () => set({
      currentGame: null,
      chessBoard: null,
      chessEngine: null,
      gameHistory: [],
      selectedSquare: null,
      possibleMoves: [],
      isMyTurn: false,
      whitePlayer: null,
      blackPlayer: null,
      error: null,
      showMoveHistory: false,
    }),

    // Helper methods
    updateChessBoard: () => {
      const { chessEngine } = get();
      if (!chessEngine) return;

      const board = chessEngine.board();
      const fen = chessEngine.fen();
      const fenParts = fen.split(' ');
      
      const chessBoard: ChessBoard = {
        pieces: {},
        currentTurn: chessEngine.turn() === 'w' ? 'white' : 'black',
        castlingRights: {
          whiteKingSide: fenParts[2].includes('K'),
          whiteQueenSide: fenParts[2].includes('Q'),
          blackKingSide: fenParts[2].includes('k'),
          blackQueenSide: fenParts[2].includes('q'),
        },
        enPassantTarget: fenParts[3] !== '-' ? fenParts[3] : undefined,
        halfmoveClock: parseInt(fenParts[4]) || 0,
        fullmoveNumber: chessEngine.moveNumber(),
      };

      // Convert board to pieces object
      for (let rank = 0; rank < 8; rank++) {
        for (let file = 0; file < 8; file++) {
          const piece = board[rank][file];
          if (piece) {
            const square = String.fromCharCode(97 + file) + (8 - rank);
            chessBoard.pieces[square] = {
              type: piece.type as 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king',
              color: piece.color === 'w' ? 'white' : 'black',
              position: square,
              hasMoved: true, // Simplified - would need game history to determine accurately
            };
          }
        }
      }

      set({ chessBoard });
    },

    updateTurnState: () => {
      const { currentGame, currentUser, chessEngine } = get();
      
      if (!currentGame || !currentUser || !chessEngine) {
        set({ isMyTurn: false });
        return;
      }

      const currentTurn = chessEngine.turn() === 'w' ? 'white' : 'black';
      const isWhitePlayer = currentGame.white_player_id === currentUser.id;
      const isBlackPlayer = currentGame.black_player_id === currentUser.id;
      
      const isMyTurn = (currentTurn === 'white' && isWhitePlayer) || 
                       (currentTurn === 'black' && isBlackPlayer);
      
      set({ isMyTurn });
    },

    isPieceOwnedByCurrentPlayer: (pieceColor: string) => {
      const { currentGame, currentUser } = get();
      
      if (!currentGame || !currentUser) return false;
      
      const isWhitePlayer = currentGame.white_player_id === currentUser.id;
      const isBlackPlayer = currentGame.black_player_id === currentUser.id;
      
      return (pieceColor === 'w' && isWhitePlayer) || 
             (pieceColor === 'b' && isBlackPlayer);
    },
  }))
);
