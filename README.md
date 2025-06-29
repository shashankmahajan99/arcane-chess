# Arcane Chess - Open World Chess Experience

A browser-based multiplayer chess game that blends classic chess with 3D open-world exploration, avatar customization, and real-time social interaction. This project aims to create an immersive and social environment for chess enthusiasts.

## Features

- **Open-World 3D Arena**: Navigate and explore visually rich 3D environments, including magical chess stadiums, with your customizable avatar.
- **Classic & Hybrid Chess**: Play traditional chess or engage in innovative game modes like 'possession mode' (details to be defined).
- **Real-Time Multiplayer**: Experience seamless real-time interactions, including live avatar movement, integrated chat, and spectating of ongoing matches.
- **Avatar Customization**: Personalize your in-game presence with a wide array of customizable characters, outfits, and visual effects.
- **Social Experience**: Beyond playing, interact with other players, watch high-stakes matches, and join a vibrant community.

## Tech Stack

- **Frontend**: Built with React for dynamic UI, Three.js for 3D rendering, and React Three Fiber for declarative Three.js scenes within React.
- **Backend**: Developed in Go, utilizing the Gin web framework for robust API handling and WebSocket for real-time communication.
- **Database**: PostgreSQL serves as the primary relational database for persistent data, complemented by Redis for high-speed caching and real-time data.
- **Real-time**: WebSocket communication is central to enabling live updates for game states, chat messages, and avatar movements.

## Getting Started

To get Arcane Chess up and running on your local machine for development, follow these steps:

### Prerequisites

Ensure you have the following installed:
- **Node.js**: Version 18 or higher (for frontend development). We recommend using `nvm` for managing Node.js versions.
- **Go**: Version 1.21 or higher (for backend development).
- **PostgreSQL**: Version 14 or higher. Make sure it's running and you have a user with appropriate permissions.
- **Redis**: Version 6 or higher. Ensure the Redis server is running.

### Development Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/arcane-chess.git
    cd arcane-chess
    ```

2.  **Backend Setup**:
    Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
    Initialize Go modules and download dependencies:
    ```bash
    go mod tidy
    ```
    Copy the example environment file and configure your database connection and other settings. **Crucially, update the database credentials to match your local PostgreSQL setup.**
    ```bash
    cp .env.example .env
    # Open .env and edit database connection string, etc.
    ```
    Run database migrations (ensure your PostgreSQL server is running and accessible):
    ```bash
    # This command might vary based on your migration tool. 
    # Check backend/Makefile or backend/quick_test.sh for specific migration commands.
    # Example (if using 'migrate' tool): migrate -path database/migrations -database "$DATABASE_URL" up
    # A common pattern is to use `make migrate` or `go run cmd/migrate/main.go`
    ```
    Start the backend server:
    ```bash
    go run cmd/server/main.go
    # Or use `make run` if a Makefile target exists
    ```
    The backend server should now be running, typically on `http://localhost:8080`.

3.  **Frontend Setup**:
    Open a new terminal and navigate to the `frontend` directory:
    ```bash
    cd ../frontend
    ```
    Install JavaScript dependencies:
    ```bash
    npm install
    ```
    Start the frontend development server:
    ```bash
    npm run dev
    ```
    The frontend application should now be accessible in your browser, typically at `http://localhost:5173`.

### Running Tests

- **Backend Tests**: From the `backend` directory, run:
    ```bash
    go test ./...
    ```
- **Frontend Tests**: From the `frontend` directory, run:
    ```bash
    npm test
    ```

## Project Structure

```
arcane-chess/
├── frontend/          # React + Three.js client application
│   ├── public/        # Static assets
│   ├── src/           # Frontend source code
│   │   ├── components/ # Reusable React components (UI, 3D models)
│   │   │   ├── 3d/     # Three.js/R3F components (e.g., ChessBoard, ChessPiece)
│   │   │   └── UI/     # Standard UI components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── services/   # API communication, WebSocket logic
│   │   ├── stores/     # State management (e.g., Zustand, Redux)
│   │   ├── types/      # TypeScript type definitions
│   │   └── utils/      # Utility functions
│   └── ...
├── backend/           # Go server application
│   ├── cmd/           # Main entry points for executables (e.g., server, migrations)
│   │   └── server/     # Main server application
│   ├── internal/      # Internal packages (not exposed outside backend)
│   │   ├── auth/       # Authentication logic (JWT)
│   │   ├── chess/      # Core chess game logic
│   │   ├── config/     # Configuration loading
│   │   ├── database/   # Database connection and ORM setup
│   │   ├── handlers/   # HTTP and WebSocket request handlers
│   │   ├── models/     # Data models (structs for users, games, etc.)
│   │   ├── services/   # Business logic and service layer
│   │   └── testutil/   # Utilities for testing
│   ├── testing/       # Tools and scripts for testing (e.g., interactive testers)
│   └── ...
├── shared/            # (Placeholder/Future) Shared types and utilities between frontend/backend
├── docs/              # Project documentation, design documents, etc.
├── .env.example       # Example environment variables for the root directory
├── .gitignore         # Git ignore rules
└── README.md          # This file
```

## Development Workflow

This project is developed by an autonomous LLM team following incremental delivery practices. All changes are proposed explicitly with file paths and code blocks. When contributing, please ensure your changes align with the existing code style and conventions.

## Contributing

We welcome contributions to Arcane Chess! Here are some ways you can help:

-   **Bug Reports**: If you find a bug, please open an issue on GitHub with a clear description and steps to reproduce.
-   **Feature Requests**: Have an idea for a new feature? Open an issue to discuss it.
-   **Code Contributions**: 
    1.  Fork the repository.
    2.  Create a new branch for your feature or bug fix (`git checkout -b feature/your-feature-name`).
    3.  Make your changes, ensuring they adhere to the existing code style.
    4.  Write or update tests for your changes.
    5.  Ensure all tests pass (`go test ./...` and `npm test`).
    6.  Commit your changes (`git commit -m "feat: Add new feature"`).
    7.  Push to your fork (`git push origin feature/your-feature-name`).
    8.  Open a Pull Request to the `main` branch of the original repository.

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.