package main

import (
	"bufio"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/gorilla/websocket"
)

type AvatarPosition struct {
	Type string `json:"type"`
	Data struct {
		UserID   string  `json:"user_id"`
		Username string  `json:"username"`
		X        float64 `json:"x"`
		Y        float64 `json:"y"`
		Z        float64 `json:"z"`
		Rotation float64 `json:"rotation"`
	} `json:"data"`
	Room string `json:"room"`
}

type AvatarCustomization struct {
	Type string `json:"type"`
	Data struct {
		UserID      string `json:"user_id"`
		Username    string `json:"username"`
		ModelType   string `json:"model_type"`
		ColorScheme string `json:"color_scheme"`
		Accessories string `json:"accessories"`
		Animations  string `json:"animations"`
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

var (
	currentRoom     = "main-arena"
	currentUsername = "AvatarTester"
	currentUserID   = "avatar-tester-001"
	currentX        = 0.0
	currentY        = 0.0
	currentZ        = 0.0
	currentRotation = 0.0
)

func main() {
	if len(os.Args) < 2 {
		log.Fatal("Usage: go run avatar_tester.go <websocket_url>")
	}

	wsURL := os.Args[1]
	if !strings.Contains(wsURL, "user_id") {
		wsURL += fmt.Sprintf("?user_id=%s&username=%s", currentUserID, currentUsername)
	}

	fmt.Println("🧙 Interactive Avatar Movement & Customization Tester")
	fmt.Println("====================================================")
	fmt.Printf("🔗 Connecting to: %s\n", wsURL)
	fmt.Printf("👤 User: %s (%s)\n", currentUsername, currentUserID)
	fmt.Printf("🏟️  Current Room: %s\n\n", currentRoom)

	// Connect to WebSocket
	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		log.Fatal("Failed to connect:", err)
	}
	defer conn.Close()

	// Start message reader in background
	go readMessages(conn)

	// Join the main arena room
	joinRoom(conn, currentRoom)

	// Main interaction loop
	scanner := bufio.NewScanner(os.Stdin)
	showMenu()

	for {
		fmt.Print("\n🎮 Enter command: ")
		if !scanner.Scan() {
			break
		}

		input := strings.TrimSpace(scanner.Text())
		if input == "" {
			continue
		}

		parts := strings.Fields(input)
		command := strings.ToLower(parts[0])

		switch command {
		case "help", "h":
			showMenu()

		case "move", "m":
			handleMoveCommand(conn, parts[1:])

		case "rotate", "r":
			handleRotateCommand(conn, parts[1:])

		case "teleport", "tp":
			handleTeleportCommand(conn, parts[1:])

		case "customize", "c":
			handleCustomizeCommand(conn, parts[1:])

		case "animate", "a":
			handleAnimateCommand(conn, parts[1:])

		case "status", "s":
			showCurrentStatus()

		case "room":
			handleRoomCommand(conn, parts[1:])

		case "broadcast", "b":
			broadcastPosition(conn)

		case "quit", "q", "exit":
			fmt.Println("👋 Goodbye!")
			return

		default:
			fmt.Printf("❌ Unknown command: %s\n", command)
			fmt.Println("💡 Type 'help' to see available commands")
		}
	}
}

func showMenu() {
	fmt.Println("\n📋 Available Commands:")
	fmt.Println("🏃 Movement:")
	fmt.Println("  move <x> <y> <z>    - Move avatar to position")
	fmt.Println("  rotate <degrees>    - Rotate avatar")
	fmt.Println("  teleport <x> <z>    - Quick teleport (Y=0)")
	fmt.Println("  broadcast           - Send current position to room")
	fmt.Println("")
	fmt.Println("🎨 Appearance:")
	fmt.Println("  customize <type>    - Change model type (wizard/knight/archer)")
	fmt.Println("  animate <action>    - Trigger animation (walk/idle/attack/cast)")
	fmt.Println("")
	fmt.Println("🏟️  Room Management:")
	fmt.Println("  room <room_id>      - Switch to different room")
	fmt.Println("")
	fmt.Println("📊 Info:")
	fmt.Println("  status              - Show current avatar status")
	fmt.Println("  help                - Show this menu")
	fmt.Println("  quit                - Exit tester")
}

func handleMoveCommand(conn *websocket.Conn, args []string) {
	if len(args) < 3 {
		fmt.Println("❌ Usage: move <x> <y> <z>")
		return
	}

	x, err1 := strconv.ParseFloat(args[0], 64)
	y, err2 := strconv.ParseFloat(args[1], 64)
	z, err3 := strconv.ParseFloat(args[2], 64)

	if err1 != nil || err2 != nil || err3 != nil {
		fmt.Println("❌ Invalid coordinates. Use numbers (e.g., move 10.5 0 -5.2)")
		return
	}

	currentX, currentY, currentZ = x, y, z
	sendAvatarPosition(conn)
	fmt.Printf("🏃 Moved to position: (%.2f, %.2f, %.2f)\n", x, y, z)
}

func handleRotateCommand(conn *websocket.Conn, args []string) {
	if len(args) < 1 {
		fmt.Println("❌ Usage: rotate <degrees>")
		return
	}

	rotation, err := strconv.ParseFloat(args[0], 64)
	if err != nil {
		fmt.Println("❌ Invalid rotation. Use number (e.g., rotate 90)")
		return
	}

	currentRotation = rotation
	sendAvatarPosition(conn)
	fmt.Printf("🔄 Rotated to: %.2f degrees\n", rotation)
}

func handleTeleportCommand(conn *websocket.Conn, args []string) {
	if len(args) < 2 {
		fmt.Println("❌ Usage: teleport <x> <z>")
		return
	}

	x, err1 := strconv.ParseFloat(args[0], 64)
	z, err2 := strconv.ParseFloat(args[1], 64)

	if err1 != nil || err2 != nil {
		fmt.Println("❌ Invalid coordinates. Use numbers (e.g., teleport 10 -5)")
		return
	}

	currentX, currentY, currentZ = x, 0, z
	sendAvatarPosition(conn)
	fmt.Printf("⚡ Teleported to: (%.2f, 0, %.2f)\n", x, z)
}

func handleCustomizeCommand(conn *websocket.Conn, args []string) {
	if len(args) < 1 {
		fmt.Println("❌ Usage: customize <wizard|knight|archer|rogue|mage>")
		return
	}

	modelType := args[0]
	validTypes := []string{"wizard", "knight", "archer", "rogue", "mage"}

	valid := false
	for _, vt := range validTypes {
		if strings.ToLower(modelType) == vt {
			valid = true
			modelType = vt
			break
		}
	}

	if !valid {
		fmt.Printf("❌ Invalid model type. Choose from: %s\n", strings.Join(validTypes, ", "))
		return
	}

	customization := AvatarCustomization{
		Type: "avatar_customization",
		Data: struct {
			UserID      string `json:"user_id"`
			Username    string `json:"username"`
			ModelType   string `json:"model_type"`
			ColorScheme string `json:"color_scheme"`
			Accessories string `json:"accessories"`
			Animations  string `json:"animations"`
		}{
			UserID:      currentUserID,
			Username:    currentUsername,
			ModelType:   modelType,
			ColorScheme: "blue", // Default color
			Accessories: "staff,hat",
			Animations:  "idle,walk",
		},
		Room: currentRoom,
	}

	if err := conn.WriteJSON(customization); err != nil {
		fmt.Printf("❌ Failed to send customization: %v\n", err)
		return
	}

	fmt.Printf("🎨 Changed avatar to: %s\n", modelType)
}

func handleAnimateCommand(conn *websocket.Conn, args []string) {
	if len(args) < 1 {
		fmt.Println("❌ Usage: animate <walk|idle|attack|cast|dance|bow>")
		return
	}

	animation := args[0]
	validAnimations := []string{"walk", "idle", "attack", "cast", "dance", "bow", "victory"}

	valid := false
	for _, va := range validAnimations {
		if strings.ToLower(animation) == va {
			valid = true
			animation = va
			break
		}
	}

	if !valid {
		fmt.Printf("❌ Invalid animation. Choose from: %s\n", strings.Join(validAnimations, ", "))
		return
	}

	animationMsg := Message{
		Type: "avatar_animation",
		Data: map[string]interface{}{
			"user_id":   currentUserID,
			"username":  currentUsername,
			"animation": animation,
			"duration":  2.0, // 2 seconds
		},
		Room: currentRoom,
	}

	if err := conn.WriteJSON(animationMsg); err != nil {
		fmt.Printf("❌ Failed to send animation: %v\n", err)
		return
	}

	fmt.Printf("🎭 Playing animation: %s\n", animation)
}

func handleRoomCommand(conn *websocket.Conn, args []string) {
	if len(args) < 1 {
		fmt.Println("❌ Usage: room <room_id>")
		return
	}

	newRoom := args[0]

	// Leave current room
	leaveRoom(conn, currentRoom)

	// Join new room
	currentRoom = newRoom
	joinRoom(conn, currentRoom)

	fmt.Printf("🏠 Switched to room: %s\n", currentRoom)
}

func showCurrentStatus() {
	fmt.Println("\n📊 Current Avatar Status:")
	fmt.Printf("  👤 User: %s (%s)\n", currentUsername, currentUserID)
	fmt.Printf("  📍 Position: (%.2f, %.2f, %.2f)\n", currentX, currentY, currentZ)
	fmt.Printf("  🔄 Rotation: %.2f°\n", currentRotation)
	fmt.Printf("  🏟️  Room: %s\n", currentRoom)
}

func sendAvatarPosition(conn *websocket.Conn) {
	position := AvatarPosition{
		Type: "avatar_position",
		Data: struct {
			UserID   string  `json:"user_id"`
			Username string  `json:"username"`
			X        float64 `json:"x"`
			Y        float64 `json:"y"`
			Z        float64 `json:"z"`
			Rotation float64 `json:"rotation"`
		}{
			UserID:   currentUserID,
			Username: currentUsername,
			X:        currentX,
			Y:        currentY,
			Z:        currentZ,
			Rotation: currentRotation,
		},
		Room: currentRoom,
	}

	if err := conn.WriteJSON(position); err != nil {
		fmt.Printf("❌ Failed to send position: %v\n", err)
	}
}

func broadcastPosition(conn *websocket.Conn) {
	sendAvatarPosition(conn)
	fmt.Printf("📡 Broadcasted position to room '%s'\n", currentRoom)
}

func joinRoom(conn *websocket.Conn, roomID string) {
	joinMsg := Message{
		Type: "join_room",
		Data: map[string]interface{}{
			"room_id": roomID,
		},
	}

	if err := conn.WriteJSON(joinMsg); err != nil {
		fmt.Printf("❌ Failed to join room: %v\n", err)
	}
}

func leaveRoom(conn *websocket.Conn, roomID string) {
	leaveMsg := Message{
		Type: "leave_room",
		Data: map[string]interface{}{
			"room_id": roomID,
		},
	}

	if err := conn.WriteJSON(leaveMsg); err != nil {
		fmt.Printf("❌ Failed to leave room: %v\n", err)
	}
}

func readMessages(conn *websocket.Conn) {
	for {
		var message Message
		err := conn.ReadJSON(&message)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		// Display received messages
		switch message.Type {
		case "connection_established":
			fmt.Printf("✅ Connected successfully!\n")

		case "avatar_position":
			if data, ok := message.Data.(map[string]interface{}); ok {
				username, _ := data["username"].(string)
				x, _ := data["x"].(float64)
				y, _ := data["y"].(float64)
				z, _ := data["z"].(float64)
				rotation, _ := data["rotation"].(float64)

				if username != currentUsername {
					fmt.Printf("👥 %s moved to (%.2f, %.2f, %.2f) rotation: %.2f°\n",
						username, x, y, z, rotation)
				}
			}

		case "avatar_customization":
			if data, ok := message.Data.(map[string]interface{}); ok {
				username, _ := data["username"].(string)
				modelType, _ := data["model_type"].(string)

				if username != currentUsername {
					fmt.Printf("🎨 %s changed to model: %s\n", username, modelType)
				}
			}

		case "avatar_animation":
			if data, ok := message.Data.(map[string]interface{}); ok {
				username, _ := data["username"].(string)
				animation, _ := data["animation"].(string)

				if username != currentUsername {
					fmt.Printf("🎭 %s is playing animation: %s\n", username, animation)
				}
			}

		default:
			fmt.Printf("📨 Received: %s\n", message.Type)
		}
	}
}
