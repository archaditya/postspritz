-- Enable pgcrypto extension for cryptographic UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email                   VARCHAR(255) NOT NULL UNIQUE,
    name                    VARCHAR(255),
    bio                     TEXT,
    company                 VARCHAR(255),
    phone                   VARCHAR(50),
    avatar_url              TEXT,
    password_hash           TEXT NOT NULL,
    
    -- Verification & Security
    email_verified          BOOLEAN DEFAULT FALSE,
    email_verified_at       TIMESTAMPTZ,
    email_verify_token      VARCHAR(255),
    email_verify_expires    TIMESTAMPTZ,
    password_reset_token    VARCHAR(255),
    password_reset_expires  TIMESTAMPTZ,
    
    -- Role & Access
    role                    VARCHAR(20) DEFAULT 'user' CHECK (role IN ('superadmin', 'admin', 'user')),
    status                  VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended', 'deactivated')),
    
    -- Settings & Preferences
    timezone                VARCHAR(50) DEFAULT 'UTC',
    preferences             JSONB DEFAULT '{"theme": "dark", "enabled_platforms": ["linkedin", "facebook", "instagram", "threads", "reddit"]}',
    notification_settings   JSONB DEFAULT '{"email_on_publish": true, "email_on_failure": true, "push_enabled": false}',
    ai_config               JSONB DEFAULT '{"provider": "platform", "api_key_enc": null}',
    
    -- Ledger & Metered Billing
    wallet_balance_paise    BIGINT DEFAULT 0,
    billing_address         JSONB DEFAULT '{}',
    gst_number              VARCHAR(50),
    
    -- Quotas & Monthly Reset
    usage                   JSONB DEFAULT '{"posts_this_month": 0, "ai_generations_this_month": 0, "ai_images_this_month": 0, "reset_at": null}',
    
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW(),
    deleted_at              TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NOT NULL;

-- 2. SOCIAL ACCOUNTS
CREATE TABLE IF NOT EXISTS social_accounts (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform                VARCHAR(30) NOT NULL CHECK (platform IN ('linkedin', 'facebook', 'instagram', 'threads', 'x', 'reddit')),
    platform_user_id        VARCHAR(255) NOT NULL,
    platform_username       VARCHAR(255),
    account_type            VARCHAR(20) DEFAULT 'profile' CHECK (account_type IN ('profile', 'page', 'group', 'subreddit')),
    account_name            VARCHAR(255) NOT NULL,
    avatar_url              TEXT,
    access_token_enc        TEXT NOT NULL,
    refresh_token_enc       TEXT,
    token_expires_at        TIMESTAMPTZ,
    scopes                  TEXT[] DEFAULT '{}',
    status                  VARCHAR(20) DEFAULT 'connected' CHECK (status IN ('connected', 'expired', 'revoked', 'error')),
    error_message           TEXT,
    metadata                JSONB DEFAULT '{}',
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW(),
    deleted_at              TIMESTAMPTZ DEFAULT NULL,
    UNIQUE(user_id, platform, platform_user_id)
);

CREATE INDEX IF NOT EXISTS idx_social_accounts_user ON social_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_platform ON social_accounts(platform);
CREATE INDEX IF NOT EXISTS idx_social_accounts_deleted ON social_accounts(deleted_at) WHERE deleted_at IS NOT NULL;

-- 3. POSTS
CREATE TABLE IF NOT EXISTS posts (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content                 TEXT NOT NULL,
    status                  VARCHAR(30) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'partially_published', 'failed')),
    scheduled_at            TIMESTAMPTZ,
    published_at            TIMESTAMPTZ,
    media_ids               UUID[] DEFAULT '{}',
    ai_generated            BOOLEAN DEFAULT FALSE,
    ai_metadata             JSONB,
    metadata                JSONB DEFAULT '{}',
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW(),
    deleted_at              TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled ON posts(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_posts_deleted ON posts(deleted_at) WHERE deleted_at IS NOT NULL;

-- 4. POST TARGETS
CREATE TABLE IF NOT EXISTS post_targets (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id                 UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    social_account_id       UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
    platform                VARCHAR(30) NOT NULL,
    status                  VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'publishing', 'published', 'failed', 'skipped')),
    platform_post_id        VARCHAR(255),
    platform_post_url       TEXT,
    error_message           TEXT,
    retry_count             INTEGER DEFAULT 0,
    max_retries             INTEGER DEFAULT 3,
    cost_incurred           NUMERIC(10, 4) DEFAULT 0,
    published_at            TIMESTAMPTZ,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW(),
    deleted_at              TIMESTAMPTZ DEFAULT NULL,
    UNIQUE(post_id, social_account_id)
);

CREATE INDEX IF NOT EXISTS idx_post_targets_post ON post_targets(post_id);
CREATE INDEX IF NOT EXISTS idx_post_targets_status ON post_targets(status);

-- 5. MEDIA ASSETS
CREATE TABLE IF NOT EXISTS media (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id                 UUID REFERENCES posts(id) ON DELETE SET NULL,
    original_filename       VARCHAR(500),
    mime_type               VARCHAR(100) NOT NULL,
    file_size_bytes         BIGINT NOT NULL,
    storage_key             TEXT NOT NULL,
    storage_url             TEXT NOT NULL,
    width                   INTEGER,
    height                  INTEGER,
    duration_seconds        FLOAT,
    thumbnail_url           TEXT,
    status                  VARCHAR(20) DEFAULT 'ready' CHECK (status IN ('uploading', 'uploaded', 'processing', 'ready', 'failed')),
    sort_order              INTEGER DEFAULT 0,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW(),
    deleted_at              TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_media_user ON media(user_id);
CREATE INDEX IF NOT EXISTS idx_media_deleted ON media(deleted_at) WHERE deleted_at IS NOT NULL;

-- 6. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type                    VARCHAR(50) NOT NULL,
    title                   VARCHAR(500) NOT NULL,
    body                    TEXT,
    action_url              TEXT,
    action_label            VARCHAR(100),
    channels                TEXT[] DEFAULT '{inapp}',
    read                    BOOLEAN DEFAULT FALSE,
    read_at                 TIMESTAMPTZ,
    resource_type           VARCHAR(50),
    resource_id             UUID,
    metadata                JSONB DEFAULT '{}',
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE read = FALSE;

-- 7. PLANS
CREATE TABLE IF NOT EXISTS plans (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                    VARCHAR(50) NOT NULL UNIQUE,
    display_name            VARCHAR(100) NOT NULL,
    description             TEXT,
    price_monthly_paise     INTEGER DEFAULT 0,
    price_yearly_paise      INTEGER DEFAULT 0,
    currency                VARCHAR(3) DEFAULT 'INR',
    max_social_accounts     INTEGER DEFAULT 3,
    max_posts_per_month     INTEGER DEFAULT 30,
    max_scheduled_posts     INTEGER DEFAULT 10,
    max_ai_generations      INTEGER DEFAULT 20,
    max_ai_images           INTEGER DEFAULT 0,
    max_media_storage_mb    INTEGER DEFAULT 500,
    features                JSONB DEFAULT '{}',
    gateway_plan_id         VARCHAR(255),
    is_active               BOOLEAN DEFAULT TRUE,
    sort_order              INTEGER DEFAULT 0,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- 8. SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS subscriptions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id                 UUID NOT NULL REFERENCES plans(id),
    payment_gateway         VARCHAR(20) DEFAULT 'cashfree' CHECK (payment_gateway IN ('cashfree', 'razorpay')),
    gateway_subscription_id VARCHAR(255),
    gateway_customer_id     VARCHAR(255),
    status                  VARCHAR(20) DEFAULT 'active' CHECK (status IN ('trialing', 'active', 'past_due', 'cancelled', 'expired')),
    billing_cycle           VARCHAR(10) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    current_period_start    TIMESTAMPTZ,
    current_period_end      TIMESTAMPTZ,
    trial_start             TIMESTAMPTZ,
    trial_end               TIMESTAMPTZ,
    cancelled_at            TIMESTAMPTZ,
    cancel_reason           TEXT,
    cancel_at_period_end    BOOLEAN DEFAULT FALSE,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW(),
    deleted_at              TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_deleted ON subscriptions(deleted_at) WHERE deleted_at IS NOT NULL;

-- 9. INVOICES
CREATE TABLE IF NOT EXISTS invoices (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id),
    subscription_id         UUID REFERENCES subscriptions(id),
    payment_gateway         VARCHAR(20) DEFAULT 'cashfree',
    gateway_payment_id      VARCHAR(255),
    gateway_invoice_id      VARCHAR(255),
    amount_paise            INTEGER NOT NULL,
    tax_paise               INTEGER DEFAULT 0,
    total_paise             INTEGER NOT NULL,
    currency                VARCHAR(3) DEFAULT 'INR',
    status                  VARCHAR(20) CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
    line_items              JSONB DEFAULT '[]',
    paid_at                 TIMESTAMPTZ,
    invoice_number          VARCHAR(50) UNIQUE,
    invoice_pdf_url         TEXT,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TRANSACTIONS LEDGER (Pass-Through Costs & Wallet Balance)
CREATE TABLE IF NOT EXISTS transactions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_paise            BIGINT NOT NULL,
    type                    VARCHAR(50) NOT NULL CHECK (type IN ('credit_deposit', 'debit_x_post', 'subscription_fee', 'refund')),
    balance_after_paise     BIGINT NOT NULL,
    description             TEXT,
    reference_id            TEXT,
    metadata                JSONB DEFAULT '{}',
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);

-- 11. AI GENERATION LOGS & EVALUATIONS
CREATE TABLE IF NOT EXISTS ai_generation_logs (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type                    VARCHAR(20) NOT NULL CHECK (type IN ('text', 'image')),
    prompt                  TEXT NOT NULL,
    expanded_prompt         TEXT,
    tokens_input            INTEGER DEFAULT 0,
    tokens_output           INTEGER DEFAULT 0,
    estimated_cost_usd      NUMERIC(8, 6) DEFAULT 0,
    latency_ms              INTEGER DEFAULT 0,
    eval_score              NUMERIC(4, 2), -- Guardrail conformance score (0.00 to 1.00)
    eval_details            JSONB DEFAULT '{}',
    model                   VARCHAR(100) NOT NULL,
    provider                VARCHAR(50) NOT NULL,
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_logs_user ON ai_generation_logs(user_id);

-- 12. API KEYS
CREATE TABLE IF NOT EXISTS api_keys (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name                    VARCHAR(255) NOT NULL,
    key_hash                VARCHAR(255) NOT NULL UNIQUE,
    key_prefix              VARCHAR(20) NOT NULL,
    scopes                  JSONB DEFAULT '["read", "write"]',
    last_used_at            TIMESTAMPTZ,
    expires_at              TIMESTAMPTZ,
    status                  VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
    revoked_at              TIMESTAMPTZ,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- 13. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID REFERENCES users(id),
    action                  VARCHAR(100) NOT NULL,
    resource_type           VARCHAR(50),
    resource_id             UUID,
    details                 JSONB,
    ip_address              INET,
    user_agent              TEXT,
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
