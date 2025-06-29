package chess

import (
	"fmt"
	"strings"
)

type Engine struct {
	board *Board
}

type Move struct {
	Piece         string
	CapturedPiece *string
	Promotion     *string
	IsCheck       bool
	IsCheckmate   bool
	IsStalemate   bool
	Notation      string
	FENAfter      string
}

func NewEngine(fen string) *Engine {
	return &Engine{
		board: NewBoardFromFEN(fen),
	}
}

func (e *Engine) ValidateMove(from, to string) (*Move, error) {
	fromPos, err := parseSquare(from)
	if err != nil {
		return nil, fmt.Errorf("invalid from square: %w", err)
	}

	toPos, err := parseSquare(to)
	if err != nil {
		return nil, fmt.Errorf("invalid to square: %w", err)
	}

	piece := e.board.GetPiece(fromPos.rank, fromPos.file)
	if piece == "" {
		return nil, fmt.Errorf("no piece at %s", from)
	}

	// Validate piece color matches current turn
	if !e.isPieceColorValid(piece) {
		return nil, fmt.Errorf("not your piece")
	}

	// Validate move is legal for this piece type
	if !e.isMoveLegal(fromPos, toPos, piece) {
		return nil, fmt.Errorf("illegal move for %s", piece)
	}

	// Execute move and check for checks/checkmate
	capturedPiece := e.board.GetPiece(toPos.rank, toPos.file)
	e.board.MovePiece(fromPos.rank, fromPos.file, toPos.rank, toPos.file)

	// Check for check/checkmate/stalemate
	isCheck := e.isInCheck(e.getOpponentColor())
	isCheckmate := isCheck && e.isCheckmate(e.getOpponentColor())
	isStalemate := !isCheck && e.isStalemate(e.getOpponentColor())

	move := &Move{
		Piece:       piece,
		IsCheck:     isCheck,
		IsCheckmate: isCheckmate,
		IsStalemate: isStalemate,
		Notation:    e.generateNotation(from, to, piece, capturedPiece != ""),
		FENAfter:    e.board.ToFEN(),
	}

	if capturedPiece != "" {
		move.CapturedPiece = &capturedPiece
	}

	return move, nil
}

func (e *Engine) isPieceColorValid(piece string) bool {
	isWhitePiece := strings.ToUpper(piece) == piece
	return (e.board.currentTurn == "white" && isWhitePiece) ||
		(e.board.currentTurn == "black" && !isWhitePiece)
}

func (e *Engine) isMoveLegal(from, to Position, piece string) bool {
	pieceType := strings.ToLower(piece)

	switch pieceType {
	case "p":
		return e.isPawnMoveLegal(from, to, piece)
	case "r":
		return e.isRookMoveLegal(from, to)
	case "n":
		return e.isKnightMoveLegal(from, to)
	case "b":
		return e.isBishopMoveLegal(from, to)
	case "q":
		return e.isQueenMoveLegal(from, to)
	case "k":
		return e.isKingMoveLegal(from, to)
	default:
		return false
	}
}

func (e *Engine) isPawnMoveLegal(from, to Position, piece string) bool {
	direction := 1
	if strings.ToUpper(piece) == piece { // White piece
		direction = -1
	}

	rankDiff := to.rank - from.rank
	fileDiff := to.file - from.file

	// Forward move
	if fileDiff == 0 {
		// Single step
		if rankDiff == direction {
			return e.board.GetPiece(to.rank, to.file) == ""
		}
		// Double step from starting position
		if rankDiff == 2*direction {
			startingRank := 6
			if direction == -1 {
				startingRank = 1
			}
			return from.rank == startingRank &&
				e.board.GetPiece(to.rank, to.file) == "" &&
				e.board.GetPiece(from.rank+direction, from.file) == ""
		}
	}

	// Diagonal capture
	if abs(fileDiff) == 1 && rankDiff == direction {
		return e.board.GetPiece(to.rank, to.file) != ""
	}

	return false
}

func (e *Engine) isRookMoveLegal(from, to Position) bool {
	if from.rank != to.rank && from.file != to.file {
		return false
	}
	return e.isPathClear(from, to)
}

func (e *Engine) isKnightMoveLegal(from, to Position) bool {
	rankDiff := abs(to.rank - from.rank)
	fileDiff := abs(to.file - from.file)
	return (rankDiff == 2 && fileDiff == 1) || (rankDiff == 1 && fileDiff == 2)
}

func (e *Engine) isBishopMoveLegal(from, to Position) bool {
	if abs(to.rank-from.rank) != abs(to.file-from.file) {
		return false
	}
	return e.isPathClear(from, to)
}

func (e *Engine) isQueenMoveLegal(from, to Position) bool {
	return e.isRookMoveLegal(from, to) || e.isBishopMoveLegal(from, to)
}

func (e *Engine) isKingMoveLegal(from, to Position) bool {
	return abs(to.rank-from.rank) <= 1 && abs(to.file-from.file) <= 1
}

func (e *Engine) isPathClear(from, to Position) bool {
	rankStep := sign(to.rank - from.rank)
	fileStep := sign(to.file - from.file)

	currentRank := from.rank + rankStep
	currentFile := from.file + fileStep

	for currentRank != to.rank || currentFile != to.file {
		if e.board.GetPiece(currentRank, currentFile) != "" {
			return false
		}
		currentRank += rankStep
		currentFile += fileStep
	}

	return true
}

func (e *Engine) isInCheck(color string) bool {
	// Find king position
	kingPiece := "K"
	if color == "black" {
		kingPiece = "k"
	}

	kingPos := e.findKing(kingPiece)
	if kingPos == nil {
		return false
	}

	// Check if any opponent piece can attack the king
	for rank := 0; rank < 8; rank++ {
		for file := 0; file < 8; file++ {
			piece := e.board.GetPiece(rank, file)
			if piece != "" && e.isPieceColor(piece, e.getOpponentColor()) {
				if e.isMoveLegal(Position{rank, file}, *kingPos, piece) {
					return true
				}
			}
		}
	}

	return false
}

func (e *Engine) isCheckmate(color string) bool {
	// King must be in check for checkmate
	if !e.isInCheck(color) {
		return false
	}
	
	// Check if any legal move can get out of check
	return !e.hasLegalMoves(color)
}

func (e *Engine) isStalemate(color string) bool {
	// King must NOT be in check for stalemate
	if e.isInCheck(color) {
		return false
	}
	
	// Check if no legal moves are available
	return !e.hasLegalMoves(color)
}

func (e *Engine) findKing(kingPiece string) *Position {
	for rank := 0; rank < 8; rank++ {
		for file := 0; file < 8; file++ {
			if e.board.GetPiece(rank, file) == kingPiece {
				return &Position{rank, file}
			}
		}
	}
	return nil
}

func (e *Engine) isPieceColor(piece, color string) bool {
	if color == "white" {
		return strings.ToUpper(piece) == piece
	}
	return strings.ToLower(piece) == piece
}

func (e *Engine) getOpponentColor() string {
	if e.board.currentTurn == "white" {
		return "black"
	}
	return "white"
}

func (e *Engine) hasLegalMoves(color string) bool {
	// Check all pieces of the given color
	for rank := 0; rank < 8; rank++ {
		for file := 0; file < 8; file++ {
			piece := e.board.GetPiece(rank, file)
			if piece != "" && e.isPieceColor(piece, color) {
				// Check all possible moves for this piece
				for toRank := 0; toRank < 8; toRank++ {
					for toFile := 0; toFile < 8; toFile++ {
						from := Position{rank, file}
						to := Position{toRank, toFile}
						
						// Skip if moving to same position
						if from.rank == to.rank && from.file == to.file {
							continue
						}
						
						// Test if this move is legal (including not leaving king in check)
						if e.isMoveLegal(from, to, piece) {
							// Make a temporary move to see if it leaves king in check
							originalPiece := e.board.GetPiece(to.rank, to.file)
							e.board.SetPiece(to.rank, to.file, piece)
							e.board.SetPiece(from.rank, from.file, "")
							
							// Check if king is still in check after this move
							inCheck := e.isInCheck(color)
							
							// Restore board state
							e.board.SetPiece(from.rank, from.file, piece)
							e.board.SetPiece(to.rank, to.file, originalPiece)
							
							// If this move gets us out of check, we have a legal move
							if !inCheck {
								return true
							}
						}
					}
				}
			}
		}
	}
	return false
}

func (e *Engine) generateNotation(from, to, piece string, isCapture bool) string {
	// Simplified notation generation
	notation := ""
	if strings.ToLower(piece) != "p" {
		notation += strings.ToUpper(piece)
	}
	if isCapture {
		notation += "x"
	}
	notation += to
	return notation
}

// Helper functions
func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}

func sign(x int) int {
	if x > 0 {
		return 1
	} else if x < 0 {
		return -1
	}
	return 0
}
