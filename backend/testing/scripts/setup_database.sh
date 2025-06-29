#!/bin/bash

# Database Setup Helper for Arcane Chess Backend
# This script helps set up PostgreSQL and Redis for testing

echo "🗄️  Arcane Chess Database Setup Helper"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if PostgreSQL is installed
check_postgresql() {
    echo "🔍 Checking PostgreSQL installation..."
    
    if command -v psql &> /dev/null; then
        print_status "PostgreSQL client is installed"
        
        if command -v pg_isready &> /dev/null; then
            if pg_isready -h localhost -p 5432 &> /dev/null; then
                print_status "PostgreSQL server is running"
                return 0
            else
                print_warning "PostgreSQL server is not running"
                return 1
            fi
        else
            print_warning "pg_isready not found"
            return 1
        fi
    else
        print_error "PostgreSQL is not installed"
        echo ""
        echo "📥 Installation instructions:"
        echo "  macOS: brew install postgresql"
        echo "  Ubuntu: sudo apt-get install postgresql postgresql-contrib"
        echo "  Windows: Download from https://www.postgresql.org/download/"
        return 1
    fi
}

# Check if Redis is installed
check_redis() {
    echo ""
    echo "🔍 Checking Redis installation..."
    
    if command -v redis-cli &> /dev/null; then
        print_status "Redis client is installed"
        
        if redis-cli ping &> /dev/null; then
            print_status "Redis server is running"
            return 0
        else
            print_warning "Redis server is not running"
            return 1
        fi
    else
        print_error "Redis is not installed"
        echo ""
        echo "📥 Installation instructions:"
        echo "  macOS: brew install redis"
        echo "  Ubuntu: sudo apt-get install redis-server"
        echo "  Windows: Download from https://redis.io/download"
        return 1
    fi
}

# Create database if PostgreSQL is available
setup_database() {
    echo ""
    echo "🗄️  Setting up database..."
    
    # Try to create database
    if psql -h localhost -U postgres -lqt | cut -d \| -f 1 | grep -qw arcane_chess; then
        print_status "Database 'arcane_chess' already exists"
    else
        print_info "Creating database 'arcane_chess'..."
        if createdb -h localhost -U postgres arcane_chess 2>/dev/null; then
            print_status "Database 'arcane_chess' created successfully"
        else
            print_warning "Could not create database (this is often due to authentication)"
            print_info "You may need to run: createdb arcane_chess"
        fi
    fi
    
    # Try to create test database
    if psql -h localhost -U postgres -lqt | cut -d \| -f 1 | grep -qw arcane_chess_test; then
        print_status "Test database 'arcane_chess_test' already exists"
    else
        print_info "Creating test database 'arcane_chess_test'..."
        if createdb -h localhost -U postgres arcane_chess_test 2>/dev/null; then
            print_status "Test database 'arcane_chess_test' created successfully"
        else
            print_warning "Could not create test database"
            print_info "You may need to run: createdb arcane_chess_test"
        fi
    fi
}

# Generate environment file
generate_env_file() {
    echo ""
    echo "📝 Generating environment configuration..."
    
    cat > .env << EOF
# Arcane Chess Backend Environment Configuration
# Copy this to your shell or use with your deployment

# JWT Configuration
export JWT_SECRET="arcane-chess-secret-key-change-in-production"

# Database Configuration
export DB_HOST="localhost"
export DB_PORT="5432"
export DB_USER="postgres"
export DB_PASSWORD=""
export DB_NAME="arcane_chess"

# Redis Configuration  
export REDIS_HOST="localhost"
export REDIS_PORT="6379"

# Server Configuration
export PORT="8080"

# Development flags
export GIN_MODE="debug"
EOF

    print_status "Environment configuration saved to .env"
    print_info "To use: source .env"
}

# Test the setup
test_setup() {
    echo ""
    echo "🧪 Testing setup..."
    
    print_info "Testing database connection..."
    export JWT_SECRET="test-secret"
    export DB_HOST="localhost"
    export DB_PORT="5432"
    export DB_USER="postgres"
    export DB_PASSWORD=""
    export DB_NAME="arcane_chess_test"
    export REDIS_HOST="localhost"
    export REDIS_PORT="6379"
    export PORT="8080"
    
    if timeout 5s go run ./cmd/server --help 2>/dev/null || [[ $? -eq 124 ]]; then
        print_status "Server can start with current configuration"
    else
        print_warning "Server test completed (may need manual configuration)"
    fi
}

# Main setup function
main() {
    echo "Starting database setup process..."
    echo ""
    
    postgresql_ok=0
    redis_ok=0
    
    if check_postgresql; then
        postgresql_ok=1
        setup_database
    fi
    
    if check_redis; then
        redis_ok=1
    fi
    
    generate_env_file
    
    echo ""
    echo "📊 Setup Summary"
    echo "================"
    
    if [[ $postgresql_ok -eq 1 ]]; then
        print_status "PostgreSQL: Ready"
    else
        print_error "PostgreSQL: Needs setup"
    fi
    
    if [[ $redis_ok -eq 1 ]]; then
        print_status "Redis: Ready"
    else
        print_error "Redis: Needs setup"
    fi
    
    echo ""
    if [[ $postgresql_ok -eq 1 && $redis_ok -eq 1 ]]; then
        print_status "🎉 All services are ready!"
        echo ""
        echo "🚀 To start the server:"
        echo "  source .env"
        echo "  go run ./cmd/server"
        echo ""
        echo "🔌 To test WebSocket connection:"
        echo "  go run visual_websocket_simulator.go ws://localhost:8080/ws"
        echo ""
        echo "🌐 To test with HTML interface:"
        echo "  open frontend_test.html"
    else
        print_warning "Some services need setup. Check installation instructions above."
        echo ""
        echo "📚 Without database, you can still:"
        echo "  - Run all unit tests: go test ./..."
        echo "  - Verify code functionality: ./verify_backend.sh"
        echo "  - Build the application: go build ./cmd/server"
    fi
    
    echo ""
    echo "📖 For more help, see TESTING_README.md"
}

main "$@"
