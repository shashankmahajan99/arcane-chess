# Makefile for Arcane Chess Backend Testing

.PHONY: test test-unit test-integration test-stress test-all test-coverage test-coverage-html benchmark benchmark-unit clean setup-test-db

# Go parameters
GOCMD=go
GOBUILD=$(GOCMD) build
GOCLEAN=$(GOCMD) clean
GOTEST=$(GOCMD) test
GOGET=$(GOCMD) get
GOMOD=$(GOCMD) mod

# Test parameters
BINARY_NAME=arcane-chess
BINARY_UNIX=$(BINARY_NAME)_unix
TEST_TIMEOUT=30m
COVERAGE_FILE=coverage.out
COVERAGE_HTML=coverage.html

# Default environment variables for testing
export JWT_SECRET ?= test-jwt-secret-that-is-long-enough-for-validation-requirements-and-testing
export GO_ENV ?= test
export DB_HOST ?= localhost
export DB_PORT ?= 5432
export DB_NAME ?= arcane_chess_test
export DB_USER ?= postgres
export DB_PASSWORD ?= 
export REDIS_HOST ?= localhost
export REDIS_PORT ?= 6379
export REDIS_PASSWORD ?= 
export REDIS_DB ?= 1

# Test targets
test: test-unit
	@echo "✅ Unit tests completed"

test-unit:
	@echo "🧪 Running unit tests..."
	$(GOTEST) -v -timeout $(TEST_TIMEOUT) ./internal/services/... ./internal/testutil/...

test-integration:
	@echo "🔗 Running integration tests..."
	@echo "⚠️  Make sure PostgreSQL and Redis are running"
	RUN_INTEGRATION_TESTS=true $(GOTEST) -v -timeout $(TEST_TIMEOUT) ./internal/integration/...

test-stress:
	@echo "⚡ Running stress tests..."
	@echo "⚠️  This will take several minutes and requires database/Redis"
	RUN_STRESS_TESTS=true $(GOTEST) -v -timeout $(TEST_TIMEOUT) ./internal/stress/...

test-all: test-unit test-integration test-stress
	@echo "✅ All tests completed"

test-coverage:
	@echo "📊 Running tests with coverage..."
	$(GOTEST) -v -timeout $(TEST_TIMEOUT) -coverprofile=$(COVERAGE_FILE) ./internal/services/... ./internal/testutil/...
	$(GOCMD) tool cover -func=$(COVERAGE_FILE)

test-coverage-html: test-coverage
	@echo "🌐 Generating HTML coverage report..."
	$(GOCMD) tool cover -html=$(COVERAGE_FILE) -o $(COVERAGE_HTML)
	@echo "Coverage report generated: $(COVERAGE_HTML)"

test-coverage-integration:
	@echo "📊 Running integration tests with coverage..."
	RUN_INTEGRATION_TESTS=true $(GOTEST) -v -timeout $(TEST_TIMEOUT) -coverprofile=integration_$(COVERAGE_FILE) ./internal/integration/...
	$(GOCMD) tool cover -func=integration_$(COVERAGE_FILE)

test-coverage-all:
	@echo "📊 Running all tests with coverage..."
	$(GOTEST) -v -timeout $(TEST_TIMEOUT) -coverprofile=unit_$(COVERAGE_FILE) ./internal/services/... ./internal/testutil/...
	RUN_INTEGRATION_TESTS=true $(GOTEST) -v -timeout $(TEST_TIMEOUT) -coverprofile=integration_$(COVERAGE_FILE) ./internal/integration/...
	@echo "Coverage reports generated: unit_$(COVERAGE_FILE), integration_$(COVERAGE_FILE)"

benchmark:
	@echo "🏃 Running benchmarks..."
	$(GOTEST) -bench=. -benchmem -timeout $(TEST_TIMEOUT) ./internal/services/...
	RUN_INTEGRATION_TESTS=true $(GOTEST) -bench=. -benchmem -timeout $(TEST_TIMEOUT) ./internal/integration/...

benchmark-unit:
	@echo "🏃 Running unit benchmarks..."
	$(GOTEST) -bench=. -benchmem -timeout $(TEST_TIMEOUT) ./internal/services/...

benchmark-stress:
	@echo "🏃 Running stress benchmarks..."
	RUN_STRESS_TESTS=true $(GOTEST) -bench=. -benchmem -timeout $(TEST_TIMEOUT) ./internal/stress/...

# Test database setup
setup-test-db:
	@echo "🗄️  Setting up test database..."
	@command -v psql >/dev/null 2>&1 || { echo "PostgreSQL client not found. Please install PostgreSQL."; exit 1; }
	@psql -h $(DB_HOST) -p $(DB_PORT) -U postgres -c "DROP DATABASE IF EXISTS $(DB_NAME);" || true
	@psql -h $(DB_HOST) -p $(DB_PORT) -U postgres -c "CREATE DATABASE $(DB_NAME);"
	@echo "✅ Test database created: $(DB_NAME)"

setup-test-redis:
	@echo "🔴 Checking Redis connection..."
	@command -v redis-cli >/dev/null 2>&1 || { echo "Redis client not found. Please install Redis."; exit 1; }
	@redis-cli -h $(REDIS_HOST) -p $(REDIS_PORT) ping > /dev/null || { echo "Redis not running. Please start Redis server."; exit 1; }
	@redis-cli -h $(REDIS_HOST) -p $(REDIS_PORT) -n $(REDIS_DB) flushdb
	@echo "✅ Test Redis database cleared: $(REDIS_DB)"

setup-test-env: setup-test-db setup-test-redis
	@echo "🌍 Test environment ready"

# Development targets
deps:
	@echo "📦 Installing dependencies..."
	$(GOMOD) download
	$(GOMOD) tidy

deps-test:
	@echo "📦 Installing test dependencies..."
	$(GOGET) github.com/stretchr/testify/assert
	$(GOGET) github.com/stretchr/testify/mock
	$(GOGET) github.com/stretchr/testify/suite
	$(GOGET) github.com/DATA-DOG/go-sqlmock
	$(GOGET) github.com/alicebob/miniredis/v2

build:
	@echo "🔨 Building application..."
	$(GOBUILD) -o $(BINARY_NAME) -v ./cmd/server

build-linux:
	@echo "🔨 Building for Linux..."
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 $(GOBUILD) -o $(BINARY_UNIX) -v ./cmd/server

clean:
	@echo "🧹 Cleaning up..."
	$(GOCLEAN)
	rm -f $(BINARY_NAME)
	rm -f $(BINARY_UNIX)
	rm -f $(COVERAGE_FILE)
	rm -f integration_$(COVERAGE_FILE)
	rm -f unit_$(COVERAGE_FILE)
	rm -f $(COVERAGE_HTML)

# Docker targets for testing
docker-test-db:
	@echo "🐳 Starting test database in Docker..."
	docker run --name arcane-chess-test-db -d \
		-e POSTGRES_DB=$(DB_NAME) \
		-e POSTGRES_USER=$(DB_USER) \
		-e POSTGRES_PASSWORD=$(DB_PASSWORD) \
		-p $(DB_PORT):5432 \
		postgres:15-alpine

docker-test-redis:
	@echo "🐳 Starting test Redis in Docker..."
	docker run --name arcane-chess-test-redis -d \
		-p $(REDIS_PORT):6379 \
		redis:7-alpine

docker-test-env: docker-test-db docker-test-redis
	@echo "🐳 Waiting for services to be ready..."
	@sleep 5
	@echo "✅ Docker test environment ready"

docker-test-cleanup:
	@echo "🐳 Cleaning up Docker test containers..."
	-docker stop arcane-chess-test-db arcane-chess-test-redis
	-docker rm arcane-chess-test-db arcane-chess-test-redis

# CI/CD targets
ci-test: deps
	@echo "🤖 Running CI tests..."
	$(MAKE) test-unit

ci-test-full: deps setup-test-env
	@echo "🤖 Running full CI tests..."
	$(MAKE) test-all

ci-coverage: deps
	@echo "🤖 Running CI with coverage..."
	$(MAKE) test-coverage

# Linting and formatting
lint:
	@echo "🔍 Running linter..."
	@command -v golangci-lint >/dev/null 2>&1 || { echo "golangci-lint not found. Installing..."; go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest; }
	golangci-lint run

fmt:
	@echo "🎨 Formatting code..."
	$(GOCMD) fmt ./...

vet:
	@echo "🔍 Running go vet..."
	$(GOCMD) vet ./...

check: fmt vet lint
	@echo "✅ Code quality checks completed"

# Help target
help:
	@echo "🏛️  Arcane Chess Backend - Test Commands"
	@echo ""
	@echo "Basic Testing:"
	@echo "  make test              - Run unit tests only"
	@echo "  make test-unit         - Run unit tests"
	@echo "  make test-integration  - Run integration tests"
	@echo "  make test-stress       - Run stress tests"
	@echo "  make test-all          - Run all tests"
	@echo ""
	@echo "Coverage:"
	@echo "  make test-coverage     - Run tests with coverage"
	@echo "  make test-coverage-html - Generate HTML coverage report"
	@echo ""
	@echo "Benchmarks:"
	@echo "  make benchmark         - Run all benchmarks"
	@echo "  make benchmark-unit    - Run unit benchmarks"
	@echo ""
	@echo "Environment Setup:"
	@echo "  make setup-test-env    - Setup test database and Redis"
	@echo "  make setup-test-db     - Setup test database only"
	@echo "  make setup-test-redis  - Setup test Redis only"
	@echo ""
	@echo "Docker Testing:"
	@echo "  make docker-test-env   - Start test services in Docker"
	@echo "  make docker-test-cleanup - Clean up Docker test containers"
	@echo ""
	@echo "Development:"
	@echo "  make deps              - Install dependencies"
	@echo "  make build             - Build application"
	@echo "  make clean             - Clean build artifacts"
	@echo "  make check             - Run code quality checks"
	@echo ""
	@echo "CI/CD:"
	@echo "  make ci-test           - Run CI tests"
	@echo "  make ci-test-full      - Run full CI test suite"
	@echo "  make ci-coverage       - Run CI with coverage"
