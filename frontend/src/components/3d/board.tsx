

export class Board {
  private squares: { [key: string]: string } = {};
  public currentTurn: 'white' | 'black' = 'white';
  private castlingRights = {
    whiteKingSide: true,
    whiteQueenSide: true,
    blackKingSide: true,
    blackQueenSide: true,
  };

  constructor(fen?: string) {
    if (fen) {
      this.loadFromFEN(fen);
    } else {
      this.initializeStartingPosition();
    }
  }

  static NewBoardFromFEN(fen: string): Board {
    return new Board(fen);
  }

  private initializeStartingPosition(): void {
    // Starting position
    const startingPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    this.loadFromFEN(startingPosition);
  }

  private loadFromFEN(fen: string): void {
    const parts = fen.split(' ');
    const position = parts[0];
    this.currentTurn = parts[1] === 'w' ? 'white' : 'black';

    // Clear board
    this.squares = {};

    // Parse position
    const ranks = position.split('/');
    for (let rank = 0; rank < 8; rank++) {
      let file = 0;
      for (const char of ranks[rank]) {
        if (char >= '1' && char <= '8') {
          // Empty squares
          file += parseInt(char);
        } else {
          // Piece
          const square = String.fromCharCode(97 + file) + (8 - rank);
          this.squares[square] = char;
          file++;
        }
      }
    }

    // Parse castling rights
    const castling = parts[2];
    this.castlingRights = {
      whiteKingSide: castling.includes('K'),
      whiteQueenSide: castling.includes('Q'),
      blackKingSide: castling.includes('k'),
      blackQueenSide: castling.includes('q'),
    };
  }

  GetPiece(rank: number, file: number): string {
    const square = String.fromCharCode(97 + file) + (8 - rank);
    return this.squares[square] || '';
  }

  MovePiece(fromRank: number, fromFile: number, toRank: number, toFile: number): void {
    const fromSquare = String.fromCharCode(97 + fromFile) + (8 - fromRank);
    const toSquare = String.fromCharCode(97 + toFile) + (8 - toRank);
    
    const piece = this.squares[fromSquare];
    if (piece) {
      this.squares[toSquare] = piece;
      delete this.squares[fromSquare];
    }
  }

  ToFEN(): string {
    let fen = '';
    
    // Position
    for (let rank = 0; rank < 8; rank++) {
      let emptyCount = 0;
      let rankStr = '';
      
      for (let file = 0; file < 8; file++) {
        const piece = this.GetPiece(rank, file);
        if (piece) {
          if (emptyCount > 0) {
            rankStr += emptyCount.toString();
            emptyCount = 0;
          }
          rankStr += piece;
        } else {
          emptyCount++;
        }
      }
      
      if (emptyCount > 0) {
        rankStr += emptyCount.toString();
      }
      
      fen += rankStr;
      if (rank < 7) fen += '/';
    }

    // Turn
    fen += ` ${this.currentTurn === 'white' ? 'w' : 'b'}`;

    // Castling
    let castling = '';
    if (this.castlingRights.whiteKingSide) castling += 'K';
    if (this.castlingRights.whiteQueenSide) castling += 'Q';
    if (this.castlingRights.blackKingSide) castling += 'k';
    if (this.castlingRights.blackQueenSide) castling += 'q';
    fen += ` ${castling || '-'}`;

    // En passant, halfmove, fullmove (simplified)
    fen += ' - 0 1';

    return fen;
  }
}

// Position helper
export interface Position {
  rank: number;
  file: number;
}

export function parseSquare(square: string): Position {
  if (square.length !== 2) {
    throw new Error(`Invalid square: ${square}`);
  }
  
  const file = square.charCodeAt(0) - 97; // a=0, b=1, etc.
  const rank = 8 - parseInt(square[1]); // 8=0, 7=1, etc.
  
  if (file < 0 || file > 7 || rank < 0 || rank > 7) {
    throw new Error(`Invalid square: ${square}`);
  }
  
  return { rank, file };
}
