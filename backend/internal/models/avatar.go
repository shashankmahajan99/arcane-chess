package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Avatar struct {
	ID           uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID       uuid.UUID  `gorm:"type:uuid;not null;uniqueIndex" json:"user_id"`
	Name         string     `gorm:"size:50;not null" json:"name"`
	ModelType    string     `gorm:"size:50;default:'wizard'" json:"model_type"`
	ColorScheme  string     `gorm:"size:20;default:'blue'" json:"color_scheme"`
	Accessories  string     `gorm:"type:text" json:"accessories"`
	Animations   string     `gorm:"type:text" json:"animations"`
	PositionX    float64    `gorm:"default:0" json:"position_x"`
	PositionY    float64    `gorm:"default:0" json:"position_y"`
	PositionZ    float64    `gorm:"default:0" json:"position_z"`
	RotationY    float64    `gorm:"default:0" json:"rotation_y"`
	CurrentArena *uuid.UUID `gorm:"type:uuid" json:"current_arena"`
	IsVisible    bool       `gorm:"default:true" json:"is_visible"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`

	// Relationships
	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (a *Avatar) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}
