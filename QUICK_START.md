# 🚀 Arcane Chess - Quick Start Guide

Get up and running with Arcane Chess in under 5 minutes!

## Prerequisites

- **Node.js** 18+ (for frontend)
- **Go** 1.21+ (for backend)
- **Modern browser** with WebGL support

## 🏃‍♂️ Quick Start (Development Mode)

### 1. Start the Backend (Terminal 1)
```bash
cd backend
go mod tidy
go run cmd/dev-server/main.go
```

✅ Backend should start on `http://localhost:8080`

### 2. Start the Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```

✅ Frontend should start on `http://localhost:5173`

### 3. Open Your Browser
Navigate to `http://localhost:5173`

## 🎮 What You Can Do Right Now

### 🌟 Explore the 3D World
- **Tab**: Switch between camera modes
- **WASD**: Move your avatar (first-person mode)
- **Mouse**: Look around / rotate camera
- **C**: Open avatar selector

### 🔐 Try Authentication
1. Click **"Sign Up"** in the header
2. Use any username/email/password (mock data)
3. See your profile appear in the header

### 🏟️ Join an Arena
1. Choose from 3 themed arenas:
   - 🏛️ **Classic Arena**: Traditional chess
   - 🔮 **Mystic Realm**: Magical environment  
   - 🤖 **Cyber Arena**: Futuristic setting

### 💬 Chat with Others
1. Click the chat bubble (💬) in bottom-right
2. Send messages (requires login)
3. Watch typing indicators

### ♟️ Play Chess
1. Join an arena
2. Use "Find Match" for quick games
3. Click on chess pieces to move them
4. Switch between camera and first-person views

## 🔧 Development Features

### Mock Authentication
- Any email/password combination works
- Users persist in browser storage
- Test different usernames to see multiple profiles

### Mock Game Data
- Pre-populated arenas and games
- Simulated matchmaking (finds match in ~3 seconds)
- Sample chat messages for testing

### Live Reload
- Frontend: Automatic reload on file changes
- Backend: Restart server to see Go changes

## 🛠️ Customization

### Change Backend Port
```bash
PORT=9000 go run cmd/dev-server/main.go
```

### Update Frontend API URL
Edit `frontend/.env.development`:
```
REACT_APP_API_URL=http://localhost:9000/api/v1
```

## 🐛 Troubleshooting

### Frontend Won't Start
```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Backend Won't Start
```bash
# Ensure Go modules are clean
cd backend
go clean -modcache
go mod tidy
go run cmd/dev-server/main.go
```

### CORS Errors
- Backend dev server includes CORS headers
- Try refreshing the browser
- Check browser console for specific errors

## 🎯 Key Testing Scenarios

### ✅ Complete User Flow
1. Sign up with username "testplayer"
2. Join "Classic Arena"
3. Start a quick match (10 minutes)
4. Send a chat message: "Hello world!"
5. Switch to first-person mode (Tab)
6. Move around the chess board (WASD)

### ✅ Multiple Users Simulation
1. Open incognito window
2. Sign up with different username
3. Join same arena
4. Both users can see lobby updates

## 📱 Browser Compatibility

✅ **Chrome/Chromium** (Recommended)  
✅ **Firefox** (Good)  
✅ **Safari** (Good)  
⚠️ **Edge** (Most features work)

## 🔄 What's Missing (Coming Soon)

- Real WebSocket connections (currently mock)
- Move synchronization between players  
- Spectator mode functionality
- Possession mode (become a chess piece)

## 🆘 Need Help?

Check the detailed documentation:
- `DEVELOPMENT_STATUS.md` - Full feature status
- `README.md` - Project overview
- `frontend/src/` - Component documentation

---

🎮 **Have fun exploring your magical chess world!** ♟️✨