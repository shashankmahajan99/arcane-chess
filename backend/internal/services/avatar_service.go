package services

import (
	"arcane-chess/internal/models"

	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type AvatarService struct {
	db    *gorm.DB
	redis *redis.Client
}

func NewAvatarService(db *gorm.DB, redis *redis.Client) *AvatarService {
	return &AvatarService{
		db:    db,
		redis: redis,
	}
}

func (as *AvatarService) GetAvatarByUserID(userID string) (*models.Avatar, error) {
	var avatar models.Avatar
	err := as.db.First(&avatar, "user_id = ?", userID).Error
	return &avatar, err
}

func (as *AvatarService) UpdateAvatar(avatar *models.Avatar) error {
	return as.db.Save(avatar).Error
}

func (as *AvatarService) UpdateAvatarPosition(userID string, x, y, z, rotation float64) error {
	return as.db.Model(&models.Avatar{}).
		Where("user_id = ?", userID).
		Updates(map[string]interface{}{
			"position_x": x,
			"position_y": y,
			"position_z": z,
			"rotation_y": rotation,
		}).Error
}
