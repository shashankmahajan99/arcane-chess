export interface User {
  id: string;
  username: string;
  email: string;
  rating: number;
  is_online: boolean;
  last_seen: string;
  created_at: string;
  updated_at: string;
  avatar?: Avatar;
}

export interface Avatar {
  id: string;
  user_id: string;
  name: string;
  model_type: string;
  color_scheme: string;
  accessories: string;
  animations: string;
  position_x: number;
  position_y: number;
  position_z: number;
  rotation_y: number;
  current_arena?: string;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  user?: User;
  thumbnail?: string;
}

export interface Game {
  id: string;
  arena_id: string;
  white_player_id?: string;
  black_player_id?: string;
  status: GameStatus;
  result?: GameResult;
  current_turn: 'white' | 'black';
  board_state: string; // FEN notation
  move_count: number;
  time_control: number;
  white_time: number;
  black_time: number;
  started_at?: string;
  finished_at?: string;
  created_at: string;
  updated_at: string;
  arena?: Arena;
  white_player?: User;
  black_player?: User;
  moves?: GameMove[];
}

export type GameStatus = 'waiting' | 'active' | 'finished' | 'abandoned';
export type GameResult = 'white_wins' | 'black_wins' | 'draw' | 'abandoned';

export interface GameMove {
  id: string;
  game_id: string;
  player_id: string;
  move_number: number;
  from_square: string;
  to_square: string;
  piece: string;
  captured_piece?: string;
  promotion?: string;
  is_check: boolean;
  is_checkmate: boolean;
  is_stalemate: boolean;
  notation: string;
  fen_after: string;
  time_left: number;
  created_at: string;
  game?: Game;
  player?: User;
}

export interface Arena {
  id: string;
  name: string;
  theme: ArenaTheme;
  max_players: number;
  max_games: number;
  is_public: boolean;
  description: string;
  settings: string;
  created_at: string;
  updated_at: string;
  games?: Game[];
}

export type ArenaTheme = 'classic' | 'mystic' | 'future' | 'nature' | 'fire' | 'ice';

// 3D and Game-specific types
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface ChessPiece {
  id: string;
  type: 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
  color: 'white' | 'black';
  position: string; // e.g., "e4"
  hasMoved: boolean;
}

export interface ChessBoard {
  pieces: { [square: string]: ChessPiece };
  currentTurn: 'white' | 'black';
  castlingRights: {
    whiteKingSide: boolean;
    whiteQueenSide: boolean;
    blackKingSide: boolean;
    blackQueenSide: boolean;
  };
  enPassantTarget?: string;
  halfmoveClock: number;
  fullmoveNumber: number;
}

export interface GameEvent {
  type: 'move' | 'chat' | 'avatar_move' | 'player_join' | 'player_leave' | 'game_end';
  data: any;
  timestamp: string;
  user_id?: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  message: string;
  timestamp: string;
  type: 'chat' | 'system' | 'emote';
}

export interface AvatarState {
  user_id: string;
  position: Vector3;
  rotation: number;
  animation: string;
  model_type: string;
  color_scheme: string;
  name: string;
  accessories: string;
  is_visible: boolean;
}

export interface ArenaSettings {
  lighting: {
    ambientIntensity: number;
    directionalIntensity: number;
    shadows: boolean;
  };
  camera: {
    defaultPosition: Vector3;
    defaultTarget: Vector3;
    minDistance: number;
    maxDistance: number;
  };
  physics: {
    gravity: number;
    avatarSpeed: number;
    collisionEnabled: boolean;
  };
  effects: {
    particles: boolean;
    postProcessing: boolean;
    bloom: boolean;
  };
}
