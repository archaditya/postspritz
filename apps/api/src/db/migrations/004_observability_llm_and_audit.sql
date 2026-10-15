-- 004_observability_llm_and_audit.sql
-- Production Observability: LLM call tracing with search vectors, unified audit logs, and delivery tracking

-- 1. LLM CALLS OBSERVABILITY TABLE
CREATE TABLE IF NOT EXISTS llm_calls (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID REFERENCES users(id) ON DELETE SET NULL,
    purpose                 VARCHAR(64) NOT NULL, -- 'post_generation', 'visual_prompts', 'guardrail_eval', 'reply_draft'
    model                   VARCHAR(100) NOT NULL, -- 'gemini-2.0-flash', 'gemini-1.5-pro', 'gpt-4o'
    provider                VARCHAR(50) NOT NULL DEFAULT 'google',
    prompt                  TEXT NOT NULL,
    response_preview        TEXT,
    prompt_tokens           INTEGER DEFAULT 0,
    completion_tokens       INTEGER DEFAULT 0,
    total_tokens            INTEGER DEFAULT 0,
    estimated_cost_usd      NUMERIC(10, 6) DEFAULT 0,
    latency_ms              INTEGER DEFAULT 0,
    status                  VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failed', 'timeout', 'guardrail_flagged')),
    last_error              TEXT,
    embedding_model         VARCHAR(100) DEFAULT 'text-embedding-004',
    embeddings              FLOAT8[], -- Vector embeddings for semantic search
    search_vector           TSVECTOR GENERATED ALWAYS AS (
                                to_tsvector('english', prompt || ' ' || COALESCE(response_preview, ''))
                            ) STORED,
    metadata                JSONB DEFAULT '{}',
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_llm_calls_created ON llm_calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_llm_calls_user ON llm_calls(user_id);
CREATE INDEX IF NOT EXISTS idx_llm_calls_purpose ON llm_calls(purpose);
CREATE INDEX IF NOT EXISTS idx_llm_calls_model ON llm_calls(model);
CREATE INDEX IF NOT EXISTS idx_llm_calls_status ON llm_calls(status);
CREATE INDEX IF NOT EXISTS idx_llm_calls_tsv ON llm_calls USING GIN(search_vector);

-- 2. EXPAND AUDIT LOGS FOR COMPLETE SYSTEM MUTATION TRACING
-- If audit_logs table already exists, add missing columns safely
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity VARCHAR(64);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_id VARCHAR(128);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS actor_email VARCHAR(255);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS actor_role VARCHAR(32);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS changes JSONB DEFAULT '{}';
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'success';

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_desc ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_email);

-- 3. EXPAND NOTIFICATIONS FOR RELIABILITY AND DELIVERY METRICS
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(20) DEFAULT 'delivered';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT false;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS fcm_sent BOOLEAN DEFAULT false;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS last_error TEXT;

CREATE INDEX IF NOT EXISTS idx_notifications_delivery ON notifications(delivery_status);
