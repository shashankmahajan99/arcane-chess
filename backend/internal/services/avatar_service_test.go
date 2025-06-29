package services

import (
	"arcane-chess/internal/testutil"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
)

func TestAvatarService_GetAvatarByUserID(t *testing.T) {
	db, mock := testutil.MockDB(t)
	redisClient, redisServer := testutil.MockRedis(t)
	defer func() {
		sqlDB, _ := db.DB()
		testutil.CleanupDB(sqlDB)
		testutil.CleanupRedis(redisServer)
	}()

	avatarService := NewAvatarService(db, redisClient)
	userID := uuid.New()
	testAvatar := testutil.TestAvatar(userID)

	avatarRows := sqlmock.NewRows([]string{
		"id", "user_id", "name", "model_type", "color_scheme", "accessories", "animations",
		"position_x", "position_y", "position_z", "rotation_y", "current_arena", "is_visible",
		"created_at", "updated_at",
	}).AddRow(
		testAvatar.ID, testAvatar.UserID, testAvatar.Name, testAvatar.ModelType, testAvatar.ColorScheme,
		testAvatar.Accessories, testAvatar.Animations, testAvatar.PositionX, testAvatar.PositionY,
		testAvatar.PositionZ, testAvatar.RotationY, testAvatar.CurrentArena, testAvatar.IsVisible,
		testAvatar.CreatedAt, testAvatar.UpdatedAt,
	)

	mock.ExpectQuery(`SELECT \* FROM "avatars" WHERE user_id = \$1`).
		WithArgs(userID.String()).
		WillReturnRows(avatarRows)

	avatar, err := avatarService.GetAvatarByUserID(userID.String())

	assert.NoError(t, err)
	assert.Equal(t, testAvatar.ID, avatar.ID)
	assert.Equal(t, testAvatar.UserID, avatar.UserID)
	assert.Equal(t, testAvatar.Name, avatar.Name)
	assert.Equal(t, testAvatar.ModelType, avatar.ModelType)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestAvatarService_GetAvatarByUserID_NotFound(t *testing.T) {
	db, mock := testutil.MockDB(t)
	redisClient, redisServer := testutil.MockRedis(t)
	defer func() {
		sqlDB, _ := db.DB()
		testutil.CleanupDB(sqlDB)
		testutil.CleanupRedis(redisServer)
	}()

	avatarService := NewAvatarService(db, redisClient)
	userID := uuid.New()

	mock.ExpectQuery(`SELECT \* FROM "avatars" WHERE user_id = \$1`).
		WithArgs(userID.String()).
		WillReturnError(gorm.ErrRecordNotFound)

	avatar, err := avatarService.GetAvatarByUserID(userID.String())

	assert.Error(t, err)
	assert.Equal(t, gorm.ErrRecordNotFound, err)
	assert.Empty(t, avatar.ID)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestAvatarService_UpdateAvatar(t *testing.T) {
	db, mock := testutil.MockDB(t)
	redisClient, redisServer := testutil.MockRedis(t)
	defer func() {
		sqlDB, _ := db.DB()
		testutil.CleanupDB(sqlDB)
		testutil.CleanupRedis(redisServer)
	}()

	avatarService := NewAvatarService(db, redisClient)
	testAvatar := testutil.TestAvatar(uuid.New())
	testAvatar.Name = "Updated Avatar Name"

	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "avatars" SET`).
		WithArgs(
			testAvatar.UserID,
			testAvatar.Name,
			testAvatar.ModelType,
			testAvatar.ColorScheme,
			testAvatar.Accessories,
			testAvatar.Animations,
			testAvatar.PositionX,
			testAvatar.PositionY,
			testAvatar.PositionZ,
			testAvatar.RotationY,
			testAvatar.CurrentArena,
			testAvatar.IsVisible,
			testutil.AnyTime{}, // created_at
			testutil.AnyTime{}, // updated_at
			testAvatar.ID,
		).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	err := avatarService.UpdateAvatar(testAvatar)

	assert.NoError(t, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestAvatarService_UpdateAvatar_DatabaseError(t *testing.T) {
	db, mock := testutil.MockDB(t)
	redisClient, redisServer := testutil.MockRedis(t)
	defer func() {
		sqlDB, _ := db.DB()
		testutil.CleanupDB(sqlDB)
		testutil.CleanupRedis(redisServer)
	}()

	avatarService := NewAvatarService(db, redisClient)
	testAvatar := testutil.TestAvatar(uuid.New())

	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "avatars" SET`).
		WillReturnError(gorm.ErrInvalidDB)
	mock.ExpectRollback()

	err := avatarService.UpdateAvatar(testAvatar)

	assert.Error(t, err)
	assert.Equal(t, gorm.ErrInvalidDB, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestAvatarService_UpdateAvatarPosition(t *testing.T) {
	db, mock := testutil.MockDB(t)
	redisClient, redisServer := testutil.MockRedis(t)
	defer func() {
		sqlDB, _ := db.DB()
		testutil.CleanupDB(sqlDB)
		testutil.CleanupRedis(redisServer)
	}()

	avatarService := NewAvatarService(db, redisClient)
	userID := uuid.New().String()
	x, y, z, rotation := 10.5, 20.0, 15.2, 90.0

	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "avatars" SET`).
		WithArgs(x, y, z, rotation, testutil.AnyTime{}, userID).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	err := avatarService.UpdateAvatarPosition(userID, x, y, z, rotation)

	assert.NoError(t, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestAvatarService_UpdateAvatarPosition_DatabaseError(t *testing.T) {
	db, mock := testutil.MockDB(t)
	redisClient, redisServer := testutil.MockRedis(t)
	defer func() {
		sqlDB, _ := db.DB()
		testutil.CleanupDB(sqlDB)
		testutil.CleanupRedis(redisServer)
	}()

	avatarService := NewAvatarService(db, redisClient)
	userID := uuid.New().String()
	x, y, z, rotation := 10.5, 20.0, 15.2, 90.0

	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "avatars" SET`).
		WillReturnError(gorm.ErrInvalidTransaction)
	mock.ExpectRollback()

	err := avatarService.UpdateAvatarPosition(userID, x, y, z, rotation)

	assert.Error(t, err)
	assert.Equal(t, gorm.ErrInvalidTransaction, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func BenchmarkAvatarService_GetAvatarByUserID(b *testing.B) {
	db, mock := testutil.MockDB(&testing.T{})
	redisClient, redisServer := testutil.MockRedis(&testing.T{})
	defer func() {
		sqlDB, _ := db.DB()
		testutil.CleanupDB(sqlDB)
		testutil.CleanupRedis(redisServer)
	}()

	avatarService := NewAvatarService(db, redisClient)
	userID := uuid.New()
	testAvatar := testutil.TestAvatar(userID)

	// Setup mock expectations for benchmark
	for i := 0; i < b.N; i++ {
		avatarRows := sqlmock.NewRows([]string{
			"id", "user_id", "name", "model_type", "color_scheme", "accessories", "animations",
			"position_x", "position_y", "position_z", "rotation_y", "current_arena", "is_visible",
			"created_at", "updated_at",
		}).AddRow(
			testAvatar.ID, testAvatar.UserID, testAvatar.Name, testAvatar.ModelType, testAvatar.ColorScheme,
			testAvatar.Accessories, testAvatar.Animations, testAvatar.PositionX, testAvatar.PositionY,
			testAvatar.PositionZ, testAvatar.RotationY, testAvatar.CurrentArena, testAvatar.IsVisible,
			testAvatar.CreatedAt, testAvatar.UpdatedAt,
		)

		mock.ExpectQuery(`SELECT \* FROM "avatars" WHERE user_id = \$1`).
			WithArgs(userID.String()).
			WillReturnRows(avatarRows)
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = avatarService.GetAvatarByUserID(userID.String())
	}
}

func BenchmarkAvatarService_UpdateAvatarPosition(b *testing.B) {
	db, mock := testutil.MockDB(&testing.T{})
	redisClient, redisServer := testutil.MockRedis(&testing.T{})
	defer func() {
		sqlDB, _ := db.DB()
		testutil.CleanupDB(sqlDB)
		testutil.CleanupRedis(redisServer)
	}()

	avatarService := NewAvatarService(db, redisClient)
	userID := uuid.New().String()
	x, y, z, rotation := 10.5, 20.0, 15.2, 90.0

	// Setup mock expectations for benchmark
	for i := 0; i < b.N; i++ {
		mock.ExpectBegin()
		mock.ExpectExec(`UPDATE "avatars" SET`).
			WithArgs(x, y, z, rotation, testutil.AnyTime{}, userID).
			WillReturnResult(sqlmock.NewResult(1, 1))
		mock.ExpectCommit()
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = avatarService.UpdateAvatarPosition(userID, x, y, z, rotation)
	}
}
