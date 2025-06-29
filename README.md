# Arcane Chess - Open World Chess Experience

A browser-based multiplayer chess game that blends classic chess with 3D open-world exploration, avatar customization, and real-time social interaction.

## Features

- **Open-World 3D Arena**: Move your avatar freely around magical chess stadiums
- **Classic & Hybrid Chess**: Traditional chess with innovative possession mode
- **Real-Time Multiplayer**: Live avatar movement, chat, and spectating
- **Avatar Customization**: Express yourself with unique characters and effects
- **Social Experience**: Watch matches, interact with other players, join the audience

## Tech Stack

- **Frontend**: React + Three.js + React Three Fiber
- **Backend**: Go + Gin + WebSocket
- **Database**: PostgreSQL + Redis
- **Real-time**: WebSocket communication

## Getting Started

### Prerequisites
- Node.js 18+
- Go 1.21+
- PostgreSQL 14+
- Redis 6+

### Development Setup

1. Clone the repository
2. Set up backend dependencies: `cd backend && go mod init arcane-chess`
3. Set up frontend dependencies: `cd frontend && npm install`
4. Copy `.env.example` to `.env` and configure
5. Start development servers (see individual README files)

## Project Structure
arcane-chess/
├── frontend/          # React + Three.js client
├── backend/           # Go server
├── shared/            # Shared types and utilities
└── docs/              # Documentation

## Development Workflow

This project is developed by an autonomous LLM team following incremental delivery practices. All changes are proposed explicitly with file paths and code blocks.

## License

MIT License - See LICENSE file for details
