# Backend Testing Guide

Welcome to the Arcane Chess Backend Testing Suite! This guide will help you test all backend functionalities interactively and visually.

## 🚀 Quick Start

### Option 1: Interactive Testing Menu
```bash
./test_backend.sh
```
This opens an interactive menu where you can choose which functionality to test.

### Option 2: Quick Automated Test
```bash
./quick_test.sh
```
Runs a quick test of all functionalities to verify they're working.

### Option 3: Comprehensive Verification
```bash
./testing/scripts/verify_backend.sh
```
Runs all unit tests, integration tests, and generates a complete report.

## 🎯 Available Interactive Testers

### 1. Chess Game Tester (`./testing/scripts/run_chess_tester.sh`)
Test chess game functionality interactively:
- **create** - Create a new chess game
- **join <game_id>** - Join an existing game
- **move <from> <to>** - Make a chess move (e.g., "e2 e4")
- **status** - Get current game status
- **board** - Display current board state
- **quit** - Exit the tester

**Example Session:**
```
🏁 Interactive Chess Game Tester
🎮 Enter command: create
🎮 Enter command: move e2 e4
🎮 Enter command: status
🎮 Enter command: quit
```

### 2. Chat System Tester (`./testing/scripts/run_chat_tester.sh`)
Test real-time chat functionality:
- **room <room_id>** - Join a chat room
- **send <message>** - Send a message
- **leave** - Leave current room
- **users** - List users in room
- **quit** - Exit the tester

**Example Session:**
```
💬 Interactive Chat Tester
🎮 Enter command: room lobby
🎮 Enter command: send Hello everyone!
🎮 Enter command: quit
```

### 3. Avatar Movement Tester (`./testing/scripts/run_avatar_tester.sh`)
Test avatar positioning and customization:
- **move <x> <y> <z>** - Move avatar to coordinates
- **rotate <degrees>** - Rotate avatar
- **teleport <x> <z>** - Quick teleport (Y=0)
- **customize <type>** - Change avatar type (wizard/knight/archer)
- **animate <action>** - Play animation (walk/idle/attack/cast)
- **broadcast** - Send position to room
- **status** - Show current avatar status
- **quit** - Exit the tester

**Example Session:**
```
🧙 Interactive Avatar Tester
🎮 Enter command: move 10.5 0 -5.2
🎮 Enter command: customize wizard
🎮 Enter command: animate cast
🎮 Enter command: broadcast
🎮 Enter command: quit
```

### 4. Arena & Room Management Tester (`./testing/scripts/run_arena_tester.sh`)
Test room/arena management:
- **join <room_id>** - Join a room/arena
- **leave <room_id>** - Leave a room/arena
- **create <name> <theme>** - Create new arena
- **list** - List available arenas
- **switch <room_id>** - Switch active room
- **broadcast <message>** - Send message to room
- **explore <area>** - Explore areas (lobby/games/chat)
- **status** - Show current status
- **rooms** - Show joined rooms
- **quit** - Exit the tester

**Example Session:**
```
🏟️ Interactive Arena & Room Tester
🎮 Enter command: create MyArena mystic
🎮 Enter command: join MyArena
🎮 Enter command: broadcast Welcome to my arena!
🎮 Enter command: explore games
🎮 Enter command: quit
```

## 🔧 Advanced Testing Tools

### Visual WebSocket Simulator
```bash
cd testing/tools
go run visual_websocket_simulator.go ws://localhost:8080/ws
```
Interactive WebSocket client with visual feedback.

### WebSocket Stress Test
```bash
cd testing/tools
go run test_websocket_server.go ws://localhost:8080/ws 10
```
Test with multiple concurrent connections.

### HTML Testing Interface
```bash
open testing/tools/frontend_test.html
```
Web-based testing interface with buttons for each message type.

## 📁 File Structure

```
backend/
├── test_backend.sh              # Master interactive testing menu
├── quick_test.sh               # Quick automated test
├── testing/
│   ├── scripts/               # Shell script runners
│   │   ├── run_chess_tester.sh
│   │   ├── run_chat_tester.sh
│   │   ├── run_avatar_tester.sh
│   │   ├── run_arena_tester.sh
│   │   └── verify_backend.sh
│   ├── tools/                 # Advanced testing tools
│   │   ├── visual_websocket_simulator.go
│   │   ├── test_websocket_server.go
│   │   └── frontend_test.html
│   └── interactive/           # Interactive CLI testers
│       ├── chess_tester.go
│       ├── chat_tester.go
│       ├── avatar_tester.go
│       └── arena_tester.go
```

## 🎮 Usage Tips

1. **Start the backend server first:**
   ```bash
   go run ./cmd/server
   ```

2. **Use the master menu for guided testing:**
   ```bash
   ./test_backend.sh
   ```

3. **Test specific functionality:**
   ```bash
   ./testing/scripts/run_chess_tester.sh
   ```

4. **Multiple testers can run simultaneously** to test real-time features like chat and avatar movement.

5. **Each tester has a `help` command** that shows all available commands.

6. **Use custom WebSocket URLs:**
   ```bash
   ./testing/scripts/run_chess_tester.sh ws://localhost:8080/ws
   ```

## 🐛 Troubleshooting

- **"Connection failed"**: Make sure the backend server is running on port 8080
- **"Permission denied"**: Run `chmod +x *.sh` to make scripts executable
- **"Command not found"**: Make sure you're in the backend directory
- **Go compilation errors**: The interactive testers are meant to be run individually using the shell scripts

## 🎯 Testing Scenarios

### Scenario 1: Multiplayer Chess
1. Run two chess testers simultaneously
2. Create a game in one tester
3. Join the game from the other tester
4. Make moves alternately and see real-time updates

### Scenario 2: Multi-Room Chat
1. Run two chat testers
2. Join the same room from both
3. Send messages and see real-time broadcasting

### Scenario 3: Avatar Interaction
1. Run two avatar testers
2. Join the same arena
3. Move avatars and see position updates in real-time

### Scenario 4: Arena Management
1. Create an arena with specific theme
2. Join from multiple testers
3. Test room switching and broadcasting

The testing suite is designed to be **visual, interactive, and modular** - perfect for tinkering with each backend feature individually! 🎮
