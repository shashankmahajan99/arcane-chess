package chess

import (
	"fmt"
	"strconv"
	"strings"
)

type Board struct {
	squares     [8][8]string
	currentTurn string
	castling    map[string]bool
	enPassant   string
	halfmove    int
	fullmove    int
}

type Position struct {
	rank int
	file int
}

func NewBoardFromFEN(fen string) *Board {
	board := &Board{
		castling: make(map[string]bool),
	}
	board.loadFromFEN(fen)
	return board
}

func (b *Board) loadFromFEN(fen string) {
	parts := strings.Split(fen, " ")
	if len(parts) < 6 {
		// Default starting position
		parts = strings.Split("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", " ")
	}

	// Parse position
	ranks := strings.Split(parts[0], "/")
	for rank := 0; rank < 8; rank++ {
		file := 0
		for _, char := range ranks[rank] {
			if char >= '1' && char <= '8' {
				// Empty squares
				emptyCount := int(char - '0')
				for i := 0; i < emptyCount; i++ {
					b.squares[rank][file] = ""
					file++
				}
			} else {
				// Piece
				b.squares[rank][file] = string(char)
				file++
			}
		}
	}

	// Parse turn
	b.currentTurn = parts[1]

	// Parse castling rights
	castling := parts[2]
	b.castling = map[string]bool{
		"K": strings.Contains(castling, "K"),
		"Q": strings.Contains(castling, "Q"),
		"k": strings.Contains(castling, "k"),
		"q": strings.Contains(castling, "q"),
	}

	// Parse en passant
	b.enPassant = parts[3]

	// Parse move counters
	if halfmove, err := strconv.Atoi(parts[4]); err == nil {
		b.halfmove = halfmove
	}
	if fullmove, err := strconv.Atoi(parts[5]); err == nil {
		b.fullmove = fullmove
	}
}

func (b *Board) GetPiece(rank, file int) string {
	if rank < 0 || rank > 7 || file < 0 || file > 7 {
		return ""
	}
	return b.squares[rank][file]
}

func (b *Board) SetPiece(rank, file int, piece string) {
	if rank < 0 || rank > 7 || file < 0 || file > 7 {
		return
	}
	b.squares[rank][file] = piece
}

func (b *Board) MovePiece(fromRank, fromFile, toRank, toFile int) {
	if fromRank < 0 || fromRank > 7 || fromFile < 0 || fromFile > 7 ||
		toRank < 0 || toRank > 7 || toFile < 0 || toFile > 7 {
		return
	}

	piece := b.squares[fromRank][fromFile]
	b.squares[toRank][toFile] = piece
	b.squares[fromRank][fromFile] = ""
}

func (b *Board) ToFEN() string {
	var fen strings.Builder

	// Position
	for rank := 0; rank < 8; rank++ {
		emptyCount := 0
		for file := 0; file < 8; file++ {
			piece := b.squares[rank][file]
			if piece == "" {
				emptyCount++
			} else {
				if emptyCount > 0 {
					fen.WriteString(strconv.Itoa(emptyCount))
					emptyCount = 0
				}
				fen.WriteString(piece)
			}
		}
		if emptyCount > 0 {
			fen.WriteString(strconv.Itoa(emptyCount))
		}
		if rank < 7 {
			fen.WriteString("/")
		}
	}

	// Turn
	fen.WriteString(" " + b.currentTurn)

	// Castling
	fen.WriteString(" ")
	castlingStr := ""
	if b.castling["K"] {
		castlingStr += "K"
	}
	if b.castling["Q"] {
		castlingStr += "Q"
	}
	if b.castling["k"] {
		castlingStr += "k"
	}
	if b.castling["q"] {
		castlingStr += "q"
	}
	if castlingStr == "" {
		castlingStr = "-"
	}
	fen.WriteString(castlingStr)

	// En passant
	fen.WriteString(" " + b.enPassant)

	// Halfmove and fullmove
	fen.WriteString(fmt.Sprintf(" %d %d", b.halfmove, b.fullmove))

	return fen.String()
}

func parseSquare(square string) (Position, error) {
	if len(square) != 2 {
		return Position{}, fmt.Errorf("invalid square: %s", square)
	}

	file := int(square[0] - 'a')
	rank := 8 - int(square[1]-'0')

	if file < 0 || file > 7 || rank < 0 || rank > 7 {
		return Position{}, fmt.Errorf("invalid square: %s", square)
	}

	return Position{rank: rank, file: file}, nil
}
