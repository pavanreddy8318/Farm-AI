-- FarmAI database bootstrap for the pgvector Docker image.
-- Runs automatically on first container start.
CREATE EXTENSION IF NOT EXISTS vector;

-- Load the full application schema (tables, indexes, triggers).
\i /docker-entrypoint-initdb.d/02_schema.sql
