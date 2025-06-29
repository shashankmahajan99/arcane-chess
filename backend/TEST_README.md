# Test Configuration for Arcane Chess Backend

## Environment Variables for Testing

# Unit Tests - always run
RUN_UNIT_TESTS=true

# Integration Tests - require database and Redis
RUN_INTEGRATION_TESTS=false

# Stress Tests - resource intensive
RUN_STRESS_TESTS=false

# Test Database Configuration
TEST_DB_HOST=localhost
TEST_DB_PORT=5432
TEST_DB_NAME=arcane_chess_test
TEST_DB_USER=postgres
TEST_DB_PASSWORD=

# Test Redis Configuration
TEST_REDIS_HOST=localhost
TEST_REDIS_PORT=6379
TEST_REDIS_PASSWORD=
TEST_REDIS_DB=1

# JWT Secret for testing (minimum 32 characters)
JWT_SECRET=test-jwt-secret-that-is-long-enough-for-validation-requirements-and-testing

# Server Configuration for Tests
SERVER_PORT=8081
SERVER_HOST=localhost
GO_ENV=test
CORS_ORIGINS=http://localhost:3001

## Test Categories

### Unit Tests
Unit tests test individual functions and methods in isolation using mocks and stubs.
- Located in `*_test.go` files alongside source code
- Use database and Redis mocks
- Fast execution (< 1s per test)
- No external dependencies

### Integration Tests
Integration tests test the interaction between components with real database and Redis.
- Located in `internal/integration/`
- Require real database and Redis instances
- Test HTTP endpoints end-to-end
- Moderate execution time (1-10s per test)

### Stress Tests
Stress tests evaluate system performance under high load.
- Located in `internal/stress/`
- Test concurrent operations
- Measure throughput and error rates
- Long execution time (30s-5min per test)

## Running Tests

### Prerequisites
1. Go 1.21 or later
2. PostgreSQL (for integration/stress tests)
3. Redis (for integration/stress tests)

### Quick Test (Unit tests only)
```bash
make test
```

### Full Test Suite
```bash
make test-all
```

### Specific Test Categories
```bash
make test-unit        # Unit tests only
make test-integration # Integration tests only
make test-stress      # Stress tests only
```

### With Coverage
```bash
make test-coverage    # Generate coverage report
make test-coverage-html # Generate HTML coverage report
```

### Benchmarks
```bash
make benchmark        # Run all benchmarks
make benchmark-unit   # Unit test benchmarks only
```

## Test Database Setup

### PostgreSQL
```sql
CREATE DATABASE arcane_chess_test;
CREATE USER test_user WITH PASSWORD 'test_password';
GRANT ALL PRIVILEGES ON DATABASE arcane_chess_test TO test_user;
```

### Redis
Redis should be running on localhost:6379 with database 1 reserved for tests.

## Continuous Integration

The test suite is designed to run in CI/CD environments:

1. **Pull Request**: Unit tests only
2. **Merge to main**: Unit + Integration tests
3. **Release**: Full test suite including stress tests

## Test Data Management

- Unit tests use mocked data
- Integration tests create and cleanup test data
- Stress tests use dedicated test users (cleaned up after)

## Performance Expectations

### Unit Tests
- Individual test: < 100ms
- Full suite: < 30s

### Integration Tests
- Individual test: < 5s
- Full suite: < 2min

### Stress Tests
- User registration: > 95% success rate at 1000 concurrent users
- Game operations: > 90% success rate at 500 concurrent games
- Avatar updates: > 95% success rate at 1000 concurrent updates
- Sustained load: > 90% success rate over 30 seconds

## Security Testing

Tests include validation of:
- JWT token authentication
- Input validation and sanitization
- SQL injection prevention
- Authorization checks
- Rate limiting (when implemented)

## Monitoring and Metrics

Tests track:
- Response times
- Success rates
- Throughput (requests/second)
- Memory usage patterns
- Database connection utilization
- Redis cache hit rates
