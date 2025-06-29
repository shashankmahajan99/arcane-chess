package services

import (
	"arcane-chess/internal/models"
	"errors"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type UserService struct {
	db *gorm.DB
}

func NewUserService(db *gorm.DB) *UserService {
	return &UserService{
		db: db,
	}
}

func (us *UserService) CreateUser(user *models.User) error {
	return us.db.Create(user).Error
}

func (us *UserService) GetUserByID(id string) (*models.User, error) {
	var user models.User
	err := us.db.Preload("Avatar").First(&user, "id = ?", id).Error
	return &user, err
}

func (us *UserService) GetUserByEmail(email string) (*models.User, error) {
	var user models.User
	err := us.db.First(&user, "email = ?", email).Error
	return &user, err
}

func (us *UserService) UpdateUser(user *models.User) error {
	return us.db.Save(user).Error
}

func (us *UserService) GetUserByUsername(username string) (*models.User, error) {
	var user models.User
	err := us.db.First(&user, "username = ?", username).Error
	return &user, err
}

func (us *UserService) CreateUserWithHashedPassword(username, email, password string) (*models.User, error) {
	// Check if user already exists
	_, err := us.GetUserByEmail(email)
	if err == nil {
		return nil, errors.New("user with this email already exists")
	}

	_, err = us.GetUserByUsername(username)
	if err == nil {
		return nil, errors.New("user with this username already exists")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &models.User{
		Username:  username,
		Email:     email,
		Password:  string(hashedPassword),
		Rating:    1200,
		IsOnline:  false,
		LastSeen:  time.Now(),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	err = us.CreateUser(user)
	if err != nil {
		return nil, err
	}

	return user, nil
}

func (us *UserService) AuthenticateUser(email, password string) (*models.User, error) {
	user, err := us.GetUserByEmail(email)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	// Update last seen and online status
	user.LastSeen = time.Now()
	user.IsOnline = true
	us.UpdateUser(user)

	return user, nil
}

func (us *UserService) SetUserOffline(userID string) error {
	var user models.User
	err := us.db.First(&user, "id = ?", userID).Error
	if err != nil {
		return err
	}

	user.IsOnline = false
	user.LastSeen = time.Now()
	return us.UpdateUser(&user)
}
