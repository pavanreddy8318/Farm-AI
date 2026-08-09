-- PostgreSQL production-ready schema for FarmAI
-- Normalize users, diagnosis records, chat messages, farming plans, and vector knowledge.

-- 1. Users table: store authentication and identity data.
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(64) NOT NULL UNIQUE,
  email VARCHAR(256),
  password_hash TEXT,
  firebase_uid VARCHAR(128),
  role VARCHAR(32) NOT NULL DEFAULT 'farmer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users (firebase_uid);

-- 2. Diagnoses table: store pathology results and metadata.
CREATE TABLE IF NOT EXISTS diagnoses (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  crop_name VARCHAR(128) NOT NULL,
  health_status VARCHAR(32) NOT NULL,
  disease_name VARCHAR(128),
  confidence_score REAL,
  symptoms TEXT[] DEFAULT '{}',
  possible_causes TEXT[] DEFAULT '{}',
  preventive_measures TEXT[] DEFAULT '{}',
  treatment_plan JSONB DEFAULT '{}'::jsonb,
  urgency_level VARCHAR(16),
  image_url TEXT,
  additional_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diagnoses_user_id ON diagnoses (user_id);
CREATE INDEX IF NOT EXISTS idx_diagnoses_health_status ON diagnoses (health_status);
CREATE INDEX IF NOT EXISTS idx_diagnoses_created_at ON diagnoses (created_at DESC);

-- 3. Chat messages table: maintain chat history for each user.
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(16) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages (user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages (created_at ASC);

-- 4. Farming plans table: store generated crop calendar plans.
CREATE TABLE IF NOT EXISTS farming_plans (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  crop_name VARCHAR(128) NOT NULL,
  variety VARCHAR(128),
  soil_requirements TEXT,
  climate_requirements TEXT,
  total_duration_days INT,
  general_tips TEXT[] DEFAULT '{}',
  calendar JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_farming_plans_user_id ON farming_plans (user_id);
CREATE INDEX IF NOT EXISTS idx_farming_plans_created_at ON farming_plans (created_at DESC);

-- 5. Knowledge vectors table: store text and embeddings for semantic search.
CREATE TABLE IF NOT EXISTS knowledge_vectors (
  id SERIAL PRIMARY KEY,
  topic VARCHAR(128) NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_vectors_topic ON knowledge_vectors (topic);
CREATE INDEX IF NOT EXISTS idx_knowledge_vectors_embedding ON knowledge_vectors USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 6. Audit table for API requests.
CREATE TABLE IF NOT EXISTS api_audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  method VARCHAR(8) NOT NULL,
  status_code INT NOT NULL,
  latency_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_audit_logs_user_id ON api_audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_api_audit_logs_created_at ON api_audit_logs (created_at DESC);

-- 7. Database function to update timestamps automatically.
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER diagnoses_updated_at
BEFORE UPDATE ON diagnoses
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER farming_plans_updated_at
BEFORE UPDATE ON farming_plans
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
