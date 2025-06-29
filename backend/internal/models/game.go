package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type GameStatus string

const (
	GameStatusWaiting   GameStatus = "waiting"
	GameStatusActive    GameStatus = "active"
	GameStatusFinished  GameStatus = "finished"
	GameStatusAbandoned GameStatus = "abandoned"
)

type GameResult string

const (
	GameResultWhiteWins GameResult = "white_wins"
	GameResultBlackWins GameResult = "black_wins"
	GameResultDraw      GameResult = "draw"
	GameResultAbandoned GameResult = "abandoned"
)

type Game struct {
	ID            uuid.UUID   `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	ArenaID       uuid.UUID   `gorm:"type:uuid;not null" json:"arena_id"`
	WhitePlayerID *uuid.UUID  `gorm:"type:uuid" json:"white_player_id"`
	BlackPlayerID *uuid.UUID  `gorm:"type:uuid" json:"black_player_id"`
	Status        GameStatus  `gorm:"default:'waiting'" json:"status"`
	Result        *GameResult `json:"result,omitempty"`
	CurrentTurn   string      `gorm:"default:'white'" json:"current_turn"` // 'white' or 'black'
	BoardState    string      `gorm:"type:text" json:"board_state"`        // FEN notation
	MoveCount     int         `gorm:"default:0" json:"move_count"`
	TimeControl   int         `gorm:"default:600" json:"time_control"` // seconds
	WhiteTime     int         `json:"white_time"`
	BlackTime     int         `json:"black_time"`
	StartedAt     *time.Time  `json:"started_at"`
	FinishedAt    *time.Time  `json:"finished_at"`
	CreatedAt     time.Time   `json:"created_at"`
	UpdatedAt     time.Time   `json:"updated_at"`

	// Relationships
	Arena       Arena      `gorm:"foreignKey:ArenaID" json:"arena,omitempty"`
	WhitePlayer *User      `gorm:"foreignKey:WhitePlayerID" json:"white_player,omitempty"`
	BlackPlayer *User      `gorm:"foreignKey:BlackPlayerID" json:"black_player,omitempty"`
	Moves       []GameMove `gorm:"foreignKey:GameID" json:"moves,omitempty"`
}

func (g *Game) BeforeCreate(tx *gorm.DB) error {
	if g.ID == uuid.Nil {
		g.ID = uuid.New()
	}
	// Initialize with standard chess starting position
	if g.BoardState == "" {
		g.BoardState = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
	}
	return nil
}
