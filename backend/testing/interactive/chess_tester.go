package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/gorilla/websocket"
)

type ChessMove struct {
	Type string `json:"type"`
	Data struct {
		GameID string `json:"game_id"`
		From   string `json:"from"`
		To     string `json:"to"`
		Piece  string `json:"piece"`
	} `json:"data"`
	Room string `json:"room"`
}

type Message struct {
	Type     string      `json:"type"`
	Data     interface{} `json:"data"`
	UserID   string      `json:"user_id,omitempty"`
	Username string      `json:"username,omitempty"`
	Room     string      `json:"room,omitempty"`
}

func main() {
	if len(os.Args) < 2 {
		log.Fatal("Usage: go run chess_tester.go <websocket_url>")
	}

	wsURL := os.Args[1]
	if !strings.Contains(wsURL, "user_id") {
		wsURL += "?user_id=chess-tester&username=ChessPlayer"
	}

	fmt.Println("🏁 Interactive Chess Game Tester")
	fmt.Println("=================================")
	fmt.Printf("🔗 Connecting to: %s\n\n", wsURL)

	// Connect to WebSocket
	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		log.Fatal("Failed to connect:", err)
	}
	defer conn.Close()

	fmt.Println("✅ Connected! Welcome to the Chess Tester")
	fmt.Println()

	// Start listening for messages
	go func() {
		for {
			_, message, err := conn.ReadMessage()
			if err != nil {
				log.Printf("❌ Read error: %v", err)
				return
			}

			var msg Message
			if err := json.Unmarshal(message, &msg); err == nil {
				switch msg.Type {
				case "game_move":
					fmt.Printf("♟️  Move received: %+v\n", msg.Data)
				case "game_update":
					fmt.Printf("🎯 Game update: %+v\n", msg.Data)
				case "connection_established":
					fmt.Printf("🤝 Connection established: %+v\n", msg.Data)
				default:
					fmt.Printf("📨 Message: %s - %+v\n", msg.Type, msg.Data)
				}
			} else {
				fmt.Printf("📨 Raw message: %s\n", string(message))
			}
		}
	}()

	// Interactive commands
	scanner := bufio.NewScanner(os.Stdin)

	fmt.Println("🎮 Chess Commands:")
	fmt.Println("  move <from> <to> [piece] - Make a chess move (e.g., 'move e2 e4 pawn')")
	fmt.Println("  join <game_id>          - Join a game")
	fmt.Println("  create                  - Create a new game")
	fmt.Println("  status                  - Get game status")
	fmt.Println("  help                    - Show this help")
	fmt.Println("  quit                    - Exit")
	fmt.Println()

	gameID := "test-game-1" // Default game ID

	for {
		fmt.Print("chess> ")
		if !scanner.Scan() {
			break
		}

		input := strings.TrimSpace(scanner.Text())
		if input == "" {
			continue
		}

		parts := strings.Fields(input)
		command := parts[0]

		switch command {
		case "move":
			if len(parts) < 3 {
				fmt.Println("❌ Usage: move <from> <to> [piece]")
				continue
			}

			piece := "pawn"
			if len(parts) > 3 {
				piece = parts[3]
			}

			move := Message{
				Type: "game_move",
				Data: map[string]interface{}{
					"game_id": gameID,
					"from":    parts[1],
					"to":      parts[2],
					"piece":   piece,
				},
				UserID:   "chess-tester",
				Username: "ChessPlayer",
				Room:     "chess-room",
			}

			if err := conn.WriteJSON(move); err != nil {
				fmt.Printf("❌ Failed to send move: %v\n", err)
			} else {
				fmt.Printf("✅ Sent move: %s → %s (%s)\n", parts[1], parts[2], piece)
			}

		case "join":
			if len(parts) < 2 {
				fmt.Println("❌ Usage: join <game_id>")
				continue
			}

			gameID = parts[1]
			joinMsg := Message{
				Type: "join_room",
				Data: map[string]interface{}{
					"room":    "chess-room",
					"game_id": gameID,
				},
				UserID:   "chess-tester",
				Username: "ChessPlayer",
			}

			if err := conn.WriteJSON(joinMsg); err != nil {
				fmt.Printf("❌ Failed to join game: %v\n", err)
			} else {
				fmt.Printf("✅ Joined game: %s\n", gameID)
			}

		case "create":
			createMsg := Message{
				Type: "create_game",
				Data: map[string]interface{}{
					"arena_id":     "arena-1",
					"time_control": "10+0",
				},
				UserID:   "chess-tester",
				Username: "ChessPlayer",
			}

			if err := conn.WriteJSON(createMsg); err != nil {
				fmt.Printf("❌ Failed to create game: %v\n", err)
			} else {
				fmt.Println("✅ Sent game creation request")
			}

		case "status":
			statusMsg := Message{
				Type: "game_status",
				Data: map[string]interface{}{
					"game_id": gameID,
				},
				UserID:   "chess-tester",
				Username: "ChessPlayer",
			}

			if err := conn.WriteJSON(statusMsg); err != nil {
				fmt.Printf("❌ Failed to get status: %v\n", err)
			} else {
				fmt.Printf("✅ Requested status for game: %s\n", gameID)
			}

		case "help":
			fmt.Println("\n🎮 Chess Commands:")
			fmt.Println("  move <from> <to> [piece] - Make a chess move (e.g., 'move e2 e4 pawn')")
			fmt.Println("  join <game_id>          - Join a game")
			fmt.Println("  create                  - Create a new game")
			fmt.Println("  status                  - Get game status")
			fmt.Println("  help                    - Show this help")
			fmt.Println("  quit                    - Exit")
			fmt.Println()
			fmt.Printf("📋 Current game ID: %s\n\n", gameID)

		case "quit", "exit":
			fmt.Println("👋 Goodbye!")
			return

		default:
			fmt.Printf("❌ Unknown command: %s. Type 'help' for available commands.\n", command)
		}
	}
}
