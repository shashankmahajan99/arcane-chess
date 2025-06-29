package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ArenaTheme string

const (
	ArenaThemeClassic ArenaTheme = "classic"
	ArenaThemeMystic  ArenaTheme = "mystic"
	ArenaThemeFuture  ArenaTheme = "future"
	ArenaThemeNature  ArenaTheme = "nature"
	ArenaThemeFire    ArenaTheme = "fire"
	ArenaThemeIce     ArenaTheme = "ice"
)

type Arena struct {
	ID          uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Name        string     `gorm:"size:100;not null" json:"name"`
	Theme       ArenaTheme `gorm:"default:'classic'" json:"theme"`
	MaxPlayers  int        `gorm:"default:100" json:"max_players"`
	MaxGames    int        `gorm:"default:10" json:"max_games"`
	IsPublic    bool       `gorm:"default:true" json:"is_public"`
	Description string     `gorm:"type:text" json:"description"`
	Settings    string     `gorm:"type:text" json:"settings"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`

	// Relationships
	Games []Game `gorm:"foreignKey:ArenaID" json:"games,omitempty"`
}

func (a *Arena) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}
