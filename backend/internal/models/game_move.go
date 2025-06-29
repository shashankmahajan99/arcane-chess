package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type GameMove struct {
	ID            uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	GameID        uuid.UUID `gorm:"type:uuid;not null" json:"game_id"`
	PlayerID      uuid.UUID `gorm:"type:uuid;not null" json:"player_id"`
	MoveNumber    int       `gorm:"not null" json:"move_number"`
	FromSquare    string    `gorm:"size:2;not null" json:"from_square"` // e.g., "e2"
	ToSquare      string    `gorm:"size:2;not null" json:"to_square"`   // e.g., "e4"
	Piece         string    `gorm:"size:2;not null" json:"piece"`       // e.g., "P" for pawn
	CapturedPiece *string   `gorm:"size:2" json:"captured_piece,omitempty"`
	Promotion     *string   `gorm:"size:1" json:"promotion,omitempty"` // Q, R, B, N
	IsCheck       bool      `gorm:"default:false" json:"is_check"`
	IsCheckmate   bool      `gorm:"default:false" json:"is_checkmate"`
	IsStalemate   bool      `gorm:"default:false" json:"is_stalemate"`
	Notation      string    `gorm:"size:10;not null" json:"notation"` // Standard algebraic notation
	FENAfter      string    `gorm:"type:text;not null" json:"fen_after"`
	TimeLeft      int       `json:"time_left"` // Time left for player after move
	CreatedAt     time.Time `json:"created_at"`

	// Relationships
	Game   Game `gorm:"foreignKey:GameID" json:"game,omitempty"`
	Player User `gorm:"foreignKey:PlayerID" json:"player,omitempty"`
}

func (gm *GameMove) BeforeCreate(tx *gorm.DB) error {
	if gm.ID == uuid.Nil {
		gm.ID = uuid.New()
	}
	return nil
}
