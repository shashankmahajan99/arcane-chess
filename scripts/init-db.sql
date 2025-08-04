-- Initialize Arcane Chess Development Database
-- This script runs when PostgreSQL container starts for the first time

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: GORM will auto-migrate the tables, but we can add seed data here
-- once the application starts and creates the tables

-- Seed data will be added by the application after migration
-- This file serves as a placeholder for any manual database setup if needed

-- Example: Set timezone
SET timezone = 'UTC';