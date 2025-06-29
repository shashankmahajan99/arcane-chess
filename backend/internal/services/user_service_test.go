package services

import (
	"arcane-chess/internal/models"
	"arcane-chess/internal/testutil"
	"errors"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func TestUserService_CreateUser(t *testing.T) {
	db, mock := testutil.MockDB(t)
	defer func() {
		sqlDB, _ := db.DB()
		testutil.CleanupDB(sqlDB)
	}()

	userService := NewUserService(db)
	testUser := testutil.TestUser()

	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO "users"`).
		WithArgs(
			testUser.Username,  // username
			testUser.Email,     // email
			testUser.Password,  // password
			testUser.Rating,    // rating
			testUser.IsOnline,  // is_online
			testutil.AnyTime{}, // last_seen
			testutil.AnyTime{}, // created_at
			testutil.AnyTime{}, // updated_at
			testUser.ID,        // id
		).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(testUser.ID))
	mock.ExpectCommit()

	err := userService.CreateUser(testUser)

	assert.NoError(t, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestUserService_CreateUser_DatabaseError(t *testing.T) {
	db, mock := testutil.MockDB(t)
	defer func() {
		sqlDB, _ := db.DB()
		testutil.CleanupDB(sqlDB)
	}()

	userService := NewUserService(db)
	testUser := testutil.TestUser()

	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO "users"`).
		WillReturnError(errors.New("database error"))
	mock.ExpectRollback()

	err := userService.CreateUser(testUser)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "database error")
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestUserService_GetUserByID(t *testing.T) {
	db, mock := testutil.MockDB(t)
	defer func() {
		sqlDB, _ := db.DB()
		testutil.CleanupDB(sqlDB)
	}()

	userService := NewUserService(db)
	testUser := testutil.TestUser()

	// Mock the user query
	userRows := sqlmock.NewRows([]string{
		"id", "username", "email", "password", "rating", "is_online", "last_seen", "created_at", "updated_at",
	}).AddRow(
		testUser.ID, testUser.Username, testUser.Email, testUser.Password,
		testUser.Rating, testUser.IsOnline, testUser.LastSeen, testUser.CreatedAt, testUser.UpdatedAt,
	)

	mock.ExpectQuery(`SELECT \* FROM "users" WHERE id = \$1`).
		WithArgs(testUser.ID.String()).
		WillReturnRows(userRows)

	// Mock the avatar preload query (even if no avatar exists)
	mock.ExpectQuery(`SELECT \* FROM "avatars" WHERE "avatars"\."user_id" = \$1`).
		WithArgs(testUser.ID).
		WillReturnRows(sqlmock.NewRows([]string{"id", "user_id", "name"}))

	user, err := userService.GetUserByID(testUser.ID.String())

	assert.NoError(t, err)
	assert.Equal(t, testUser.ID, user.ID)
	assert.Equal(t, testUser.Username, user.Username)
	assert.Equal(t, testUser.Email, user.Email)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestUserService_GetUserByID_NotFound(t *testing.T) {
	db, mock := testutil.MockDB(t)
	defer func() {
		sqlDB, _ := db.DB()
		testutil.CleanupDB(sqlDB)
	}()

	userService := NewUserService(db)
	userID := uuid.New().String()

	mock.ExpectQuery(`SELECT \* FROM "users" WHERE id = \$1`).
		WithArgs(userID).
		WillReturnError(gorm.ErrRecordNotFound)

	user, err := userService.GetUserByID(userID)

	assert.Error(t, err)
	assert.Equal(t, gorm.ErrRecordNotFound, err)
	assert.Nil(t, user.Avatar)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestUserService_GetUserByEmail(t *testing.T) {
	db, mock := testutil.MockDB(t)
	defer func() {
		sqlDB, _ := db.DB()
		testutil.CleanupDB(sqlDB)
	}()

	userService := NewUserService(db)
	testUser := testutil.TestUser()

	userRows := sqlmock.NewRows([]string{
		"id", "username", "email", "password", "rating", "is_online", "last_seen", "created_at", "updated_at",
	}).AddRow(
		testUser.ID, testUser.Username, testUser.Email, testUser.Password,
		testUser.Rating, testUser.IsOnline, testUser.LastSeen, testUser.CreatedAt, testUser.UpdatedAt,
	)

	mock.ExpectQuery(`SELECT \* FROM "users" WHERE email = \$1`).
		WithArgs(testUser.Email).
		WillReturnRows(userRows)

	user, err := userService.GetUserByEmail(testUser.Email)

	assert.NoError(t, err)
	assert.Equal(t, testUser.Email, user.Email)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestUserService_GetUserByUsername(t *testing.T) {
	db, mock := testutil.MockDB(t)
	defer func() {
		sqlDB, _ := db.DB()
		testutil.CleanupDB(sqlDB)
	}()

	userService := NewUserService(db)
	testUser := testutil.TestUser()

	userRows := sqlmock.NewRows([]string{
		"id", "username", "email", "password", "rating", "is_online", "last_seen", "created_at", "updated_at",
	}).AddRow(
		testUser.ID, testUser.Username, testUser.Email, testUser.Password,
		testUser.Rating, testUser.IsOnline, testUser.LastSeen, testUser.CreatedAt, testUser.UpdatedAt,
	)

	mock.ExpectQuery(`SELECT \* FROM "users" WHERE username = \$1`).
		WithArgs(testUser.Username).
		WillReturnRows(userRows)

	user, err := userService.GetUserByUsername(testUser.Username)

	assert.NoError(t, err)
	assert.Equal(t, testUser.Username, user.Username)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestUserService_UpdateUser(t *testing.T) {
	db, mock := testutil.MockDB(t)
	defer func() {
		sqlDB, _ := db.DB()
		testutil.CleanupDB(sqlDB)
	}()

	userService := NewUserService(db)
	testUser := testutil.TestUser()
	testUser.Rating = 1300 // Update rating

	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "users" SET`).
		WithArgs(
			testUser.Username,  // username
			testUser.Email,     // email
			testUser.Password,  // password
			testUser.Rating,    // rating
			testUser.IsOnline,  // is_online
			testUser.LastSeen,  // last_seen
			testutil.AnyTime{}, // created_at
			testutil.AnyTime{}, // updated_at
			testUser.ID,        // id (WHERE clause)
		).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	err := userService.UpdateUser(testUser)

	assert.NoError(t, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestUserService_CreateUserWithHashedPassword(t *testing.T) {
	db, mock := testutil.MockDB(t)
	defer func() {
		sqlDB, _ := db.DB()
		testutil.CleanupDB(sqlDB)
	}()

	userService := NewUserService(db)

	// First, expect the email check (user doesn't exist)
	mock.ExpectQuery(`SELECT \* FROM "users" WHERE email = \$1`).
		WithArgs("newuser@example.com").
		WillReturnError(gorm.ErrRecordNotFound)

	// Then expect the username check (user doesn't exist)
	mock.ExpectQuery(`SELECT \* FROM "users" WHERE username = \$1`).
		WithArgs("newuser").
		WillReturnError(gorm.ErrRecordNotFound)

	// Then expect the user creation
	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO "users"`).
		WithArgs(
			"newuser",             // username
			"newuser@example.com", // email
			sqlmock.AnyArg(),      // hashed password
			1200,                  // default rating
			false,                 // not online
			testutil.AnyTime{},    // last_seen
			testutil.AnyTime{},    // created_at
			testutil.AnyTime{},    // updated_at
			testutil.AnyUUID{},    // id
		).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(uuid.New()))
	mock.ExpectCommit()

	user, err := userService.CreateUserWithHashedPassword("newuser", "newuser@example.com", "password123")

	assert.NoError(t, err)
	assert.Equal(t, "newuser", user.Username)
	assert.Equal(t, "newuser@example.com", user.Email)
	assert.Equal(t, 1200, user.Rating)

	// Verify password was hashed
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte("password123"))
	assert.NoError(t, err)

	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestUserService_CreateUserWithHashedPassword_UserExists(t *testing.T) {
	db, mock := testutil.MockDB(t)
	defer func() {
		sqlDB, _ := db.DB()
		testutil.CleanupDB(sqlDB)
	}()

	userService := NewUserService(db)
	existingUser := testutil.TestUser()

	// Mock existing user found
	userRows := sqlmock.NewRows([]string{
		"id", "username", "email", "password", "rating", "is_online", "last_seen", "created_at", "updated_at",
	}).AddRow(
		existingUser.ID, existingUser.Username, existingUser.Email, existingUser.Password,
		existingUser.Rating, existingUser.IsOnline, existingUser.LastSeen,
		existingUser.CreatedAt, existingUser.UpdatedAt,
	)

	mock.ExpectQuery(`SELECT \* FROM "users" WHERE email = \$1`).
		WithArgs(existingUser.Email).
		WillReturnRows(userRows)

	user, err := userService.CreateUserWithHashedPassword("testuser", existingUser.Email, "password123")

	assert.Error(t, err)
	assert.Nil(t, user)
	assert.Contains(t, err.Error(), "already exists")
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestUserService_AuthenticateUser(t *testing.T) {
	db, mock := testutil.MockDB(t)
	defer func() {
		sqlDB, _ := db.DB()
		testutil.CleanupDB(sqlDB)
	}()

	userService := NewUserService(db)

	// Create a user with a known hashed password
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("correctpassword"), bcrypt.DefaultCost)
	testUser := &models.User{
		ID:        uuid.New(),
		Username:  "testuser",
		Email:     "test@example.com",
		Password:  string(hashedPassword),
		Rating:    1200,
		IsOnline:  false,
		LastSeen:  time.Now(),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	userRows := sqlmock.NewRows([]string{
		"id", "username", "email", "password", "rating", "is_online", "last_seen", "created_at", "updated_at",
	}).AddRow(
		testUser.ID, testUser.Username, testUser.Email, testUser.Password,
		testUser.Rating, testUser.IsOnline, testUser.LastSeen, testUser.CreatedAt, testUser.UpdatedAt,
	)

	mock.ExpectQuery(`SELECT \* FROM "users" WHERE email = \$1`).
		WithArgs(testUser.Email).
		WillReturnRows(userRows)

	// Expect the update for setting user online
	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "users" SET`).
		WithArgs(
			testUser.Username,  // username
			testUser.Email,     // email
			testUser.Password,  // password
			testUser.Rating,    // rating
			true,               // is_online set to true
			testutil.AnyTime{}, // last_seen updated
			testutil.AnyTime{}, // created_at
			testutil.AnyTime{}, // updated_at
			testUser.ID,        // id (WHERE clause)
		).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	user, err := userService.AuthenticateUser(testUser.Email, "correctpassword")

	assert.NoError(t, err)
	assert.Equal(t, testUser.Email, user.Email)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestUserService_AuthenticateUser_WrongPassword(t *testing.T) {
	db, mock := testutil.MockDB(t)
	defer func() {
		sqlDB, _ := db.DB()
		testutil.CleanupDB(sqlDB)
	}()

	userService := NewUserService(db)

	// Create a user with a known hashed password
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("correctpassword"), bcrypt.DefaultCost)
	testUser := &models.User{
		ID:        uuid.New(),
		Username:  "testuser",
		Email:     "test@example.com",
		Password:  string(hashedPassword),
		Rating:    1200,
		IsOnline:  false,
		LastSeen:  time.Now(),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	userRows := sqlmock.NewRows([]string{
		"id", "username", "email", "password", "rating", "is_online", "last_seen", "created_at", "updated_at",
	}).AddRow(
		testUser.ID, testUser.Username, testUser.Email, testUser.Password,
		testUser.Rating, testUser.IsOnline, testUser.LastSeen, testUser.CreatedAt, testUser.UpdatedAt,
	)

	mock.ExpectQuery(`SELECT \* FROM "users" WHERE email = \$1`).
		WithArgs(testUser.Email).
		WillReturnRows(userRows)

	user, err := userService.AuthenticateUser(testUser.Email, "wrongpassword")

	assert.Error(t, err)
	assert.Nil(t, user)
	assert.Contains(t, err.Error(), "invalid credentials")
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestUserService_SetUserOffline(t *testing.T) {
	db, mock := testutil.MockDB(t)
	defer func() {
		sqlDB, _ := db.DB()
		testutil.CleanupDB(sqlDB)
	}()

	userService := NewUserService(db)
	testUser := testutil.TestUser()

	// Expect finding the user first
	userRows := sqlmock.NewRows([]string{
		"id", "username", "email", "password", "rating", "is_online", "last_seen", "created_at", "updated_at",
	}).AddRow(
		testUser.ID, testUser.Username, testUser.Email, testUser.Password,
		testUser.Rating, testUser.IsOnline, testUser.LastSeen, testUser.CreatedAt, testUser.UpdatedAt,
	)

	mock.ExpectQuery(`SELECT \* FROM "users" WHERE id = \$1`).
		WithArgs(testUser.ID.String()).
		WillReturnRows(userRows)

	// Expect the update for setting user offline
	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "users" SET`).
		WithArgs(
			testUser.Username,  // username
			testUser.Email,     // email
			testUser.Password,  // password
			testUser.Rating,    // rating
			false,              // is_online set to false
			testutil.AnyTime{}, // last_seen updated
			testutil.AnyTime{}, // created_at
			testutil.AnyTime{}, // updated_at
			testUser.ID,        // id (WHERE clause)
		).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	err := userService.SetUserOffline(testUser.ID.String())

	assert.NoError(t, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func BenchmarkUserService_CreateUser(b *testing.B) {
	db, mock := testutil.MockDB(&testing.T{})
	defer func() {
		sqlDB, _ := db.DB()
		testutil.CleanupDB(sqlDB)
	}()

	userService := NewUserService(db)

	// Setup mock expectations for benchmark
	for i := 0; i < b.N; i++ {
		testUser := testutil.TestUser()
		testUser.ID = uuid.New() // Ensure unique ID for each iteration

		mock.ExpectBegin()
		mock.ExpectQuery(`INSERT INTO "users"`).
			WithArgs(
				testUser.ID,
				testUser.Username,
				testUser.Email,
				testUser.Password,
				testUser.Rating,
				testUser.IsOnline,
				testutil.AnyTime{},
				testutil.AnyTime{},
				testutil.AnyTime{},
			).
			WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(testUser.ID))
		mock.ExpectCommit()
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		testUser := testutil.TestUser()
		testUser.ID = uuid.New() // Ensure unique ID for each iteration
		_ = userService.CreateUser(testUser)
	}
}
