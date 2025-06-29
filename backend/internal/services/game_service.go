package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"arcane-chess/internal/chess"
	"arcane-chess/internal/models"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type GameService struct {
	db    *gorm.DB
	redis *redis.Client
}

func NewGameService(db *gorm.DB, redis *redis.Client) *GameService {
	return &GameService{
		db:    db,
		redis: redis,
	}
}

func (gs *GameService) CreateGame(arenaID uuid.UUID, playerID uuid.UUID) (*models.Game, error) {
	game := &models.Game{
		ArenaID:     arenaID,
		WhitePlayerID: &playerID,
		Status:      models.GameStatusWaiting,
		TimeControl: 600, // 10 minutes
		WhiteTime:   600,
		BlackTime:   600,
	}

	if err := gs.db.Create(game).Error; err != nil {
		return nil, fmt.Errorf("failed to create game: %w", err)
	}

	// Cache game state in Redis
	gs.cacheGameState(game)

	return game, nil
}

func (gs *GameService) JoinGame(gameID uuid.UUID, playerID uuid.UUID) (*models.Game, error) {
	var game models.Game
	if err := gs.db.First(&game, "id = ?", gameID).Error; err != nil {
		return nil, fmt.Errorf("game not found: %w", err)
	}

	if game.Status != models.GameStatusWaiting {
		return nil, fmt.Errorf("game is not available to join")
	}

	if game.WhitePlayerID != nil && *game.WhitePlayerID == playerID {
		return nil, fmt.Errorf("player already in game")
	}

	// Assign as black player
	game.BlackPlayerID = &playerID
	game.Status = models.GameStatusActive
	now := time.Now()
	game.StartedAt = &now

	if err := gs.db.Save(&game).Error; err != nil {
		return nil, fmt.Errorf("failed to join game: %w", err)
	}

	// Update cache
	gs.cacheGameState(&game)

	return &game, nil
}

func (gs *GameService) MakeMove(gameID uuid.UUID, playerID uuid.UUID, from, to string) (*models.GameMove, error) {
	// Get game from cache first
	game, err := gs.getGameFromCache(gameID)
	if err != nil {
		// Fallback to database
		if err := gs.db.Preload("WhitePlayer").Preload("BlackPlayer").First(&game, "id = ?", gameID).Error; err != nil {
			return nil, fmt.Errorf("game not found: %w", err)
		}
	}

	// Validate player's turn
	if !gs.isPlayerTurn(&game, playerID) {
		return nil, fmt.Errorf("not player's turn")
	}

	// Validate and execute move using chess engine
	chessEngine := chess.NewEngine(game.BoardState)
	move, err := chessEngine.ValidateMove(from, to)
	if err != nil {
		return nil, fmt.Errorf("invalid move: %w", err)
	}

	// Create move record
	gameMove := &models.GameMove{
		GameID:        gameID,
		PlayerID:      playerID,
		MoveNumber:    game.MoveCount + 1,
		FromSquare:    from,
		ToSquare:      to,
		Piece:         move.Piece,
		CapturedPiece: move.CapturedPiece,
		Promotion:     move.Promotion,
		IsCheck:       move.IsCheck,
		IsCheckmate:   move.IsCheckmate,
		IsStalemate:   move.IsStalemate,
		Notation:      move.Notation,
		FENAfter:      move.FENAfter,
	}

	// Update game state
	game.BoardState = move.FENAfter
	game.MoveCount++
	game.CurrentTurn = gs.getOpponentColor(game.CurrentTurn)

	// Handle game end conditions
	if move.IsCheckmate || move.IsStalemate {
		game.Status = models.GameStatusFinished
		now := time.Now()
		game.FinishedAt = &now

		if move.IsCheckmate {
			if game.CurrentTurn == "white" {
				game.Result = &[]models.GameResult{models.GameResultWhiteWins}[0]
			} else {
				game.Result = &[]models.GameResult{models.GameResultBlackWins}[0]
			}
		} else {
			game.Result = &[]models.GameResult{models.GameResultDraw}[0]
		}
	}

	// Save to database
	tx := gs.db.Begin()
	if err := tx.Create(gameMove).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to save move: %w", err)
	}
	if err := tx.Save(&game).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to update game: %w", err)
	}
	tx.Commit()

	// Update cache
	gs.cacheGameState(&game)

	// Publish move to Redis for real-time updates
	gs.publishGameUpdate(gameID, "move", gameMove)

	return gameMove, nil
}

func (gs *GameService) GetActiveGames(arenaID uuid.UUID) ([]models.Game, error) {
	var games []models.Game
	err := gs.db.Where("arena_id = ? AND status IN ?", arenaID, []models.GameStatus{
		models.GameStatusWaiting,
		models.GameStatusActive,
	}).Preload("WhitePlayer").Preload("BlackPlayer").Find(&games).Error

	return games, err
}

func (gs *GameService) cacheGameState(game *models.Game) {
	ctx := context.Background()
	gameJSON, _ := json.Marshal(game)
	gs.redis.Set(ctx, fmt.Sprintf("game:%s", game.ID), gameJSON, time.Hour)
}

func (gs *GameService) getGameFromCache(gameID uuid.UUID) (models.Game, error) {
	ctx := context.Background()
	var game models.Game
	
	gameJSON, err := gs.redis.Get(ctx, fmt.Sprintf("game:%s", gameID)).Result()
	if err != nil {
		return game, err
	}
	
	err = json.Unmarshal([]byte(gameJSON), &game)
	return game, err
}

func (gs *GameService) isPlayerTurn(game *models.Game, playerID uuid.UUID) bool {
	if game.CurrentTurn == "white" && game.WhitePlayerID != nil && *game.WhitePlayerID == playerID {
		return true
	}
	if game.CurrentTurn == "black" && game.BlackPlayerID != nil && *game.BlackPlayerID == playerID {
		return true
	}
	return false
}

func (gs *GameService) getOpponentColor(currentTurn string) string {
	if currentTurn == "white" {
		return "black"
	}
	return "white"
}

func (gs *GameService) publishGameUpdate(gameID uuid.UUID, eventType string, data interface{}) {
	ctx := context.Background()
	update := map[string]interface{}{
		"game_id":    gameID,
		"event_type": eventType,
		"data":       data,
		"timestamp":  time.Now(),
	}
	
	updateJSON, _ := json.Marshal(update)
	gs.redis.Publish(ctx, fmt.Sprintf("game:%s", gameID), updateJSON)
}