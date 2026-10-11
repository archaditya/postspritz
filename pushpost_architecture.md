# PostSpritz — Production Architecture Document (HLD + LLD)

> **Tagline:** *"Create once. Spritz everywhere."*  
> Supported Channels: **LinkedIn, Facebook, Instagram, Threads, X (Twitter), Reddit**

---

## 1. System Overview

```mermaid
graph TB
    subgraph Client["Frontend — Next.js 14"]
        WEB["Web App<br/>next.js + tailwind + shadcn"]
    end
    
    subgraph API["Backend — Node.js Express"]
        GW["API Gateway<br/>Rate Limit · Auth · Logging"]
        AUTH["Auth Service"]
        POST_SVC["Post Service"]
        SOCIAL_SVC["Social Account Service"]
        SCHED["Scheduler Service"]
        AI_SVC_CLIENT["AI Service Client"]
        NOTIF["Notification Service"]
        MEDIA_SVC["Media Service"]
        ADMIN_SVC["Admin Service"]
        ANALYTICS_SVC["Analytics Service"]
    end
    
    subgraph Workers["Background Workers"]
        PUB_WORKER["Publisher Worker<br/>BullMQ"]
        NOTIF_WORKER["Notification Worker"]
        ANALYTICS_WORKER["Analytics Worker"]
        CLEANUP_WORKER["Cleanup Worker"]
    end
    
    subgraph AI["AI Service — Python FastAPI"]
        AI_ENGINE["Content Engine"]
        PROMPT_MGR["Prompt Manager"]
        PROVIDER_SWITCH["Provider Switch<br/>Gemini · OpenAI · BYOK"]
    end
    
    subgraph External["External APIs"]
        LI["LinkedIn API"]
        FB["Facebook Graph API"]
        IG["Instagram Graph API"]
        TH["Threads API"]
        X["X API v2"]
        RD["Reddit API"]
    end
    
    subgraph Infra["Infrastructure"]
        PG["PostgreSQL 16"]
        REDIS["Redis 7<br/>Sessions · Cache · Pub/Sub"]
        BULL["BullMQ<br/>Job Queues"]
        S3["Object Storage<br/>Media Files"]
        BREVO["Brevo<br/>Email"]
    end
    
    WEB --> GW
    GW --> AUTH
    GW --> POST_SVC
    GW --> SOCIAL_SVC
    GW --> SCHED
    GW --> AI_SVC_CLIENT
    GW --> NOTIF
    GW --> MEDIA_SVC
    GW --> ADMIN_SVC
    GW --> ANALYTICS_SVC
    
    AI_SVC_CLIENT --> AI_ENGINE
    AI_ENGINE --> PROMPT_MGR
    AI_ENGINE --> PROVIDER_SWITCH
    
    POST_SVC --> BULL
    SCHED --> BULL
    BULL --> PUB_WORKER
    BULL --> NOTIF_WORKER
    BULL --> ANALYTICS_WORKER
    BULL --> CLEANUP_WORKER
    
    PUB_WORKER --> LI
    PUB_WORKER --> FB
    PUB_WORKER --> IG
    PUB_WORKER --> TH
    PUB_WORKER --> X
    PUB_WORKER --> RD
    
    AUTH --> PG
    AUTH --> REDIS
    POST_SVC --> PG
    SOCIAL_SVC --> PG
    NOTIF --> BREVO
    MEDIA_SVC --> S3
```

---

## 2. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | Next.js 14, TailwindCSS, Shadcn UI, Aceternity UI, Zustand, TanStack Query, Redux (global auth state) | User's explicit choice. SSR + client hydration. |
| **API Server** | Node.js 18+, Express.js, TypeScript | Production-proven, async I/O for API proxying |
| **AI Service** | Python 3.11+, FastAPI | Best AI/ML ecosystem, prompt engineering |
| **Database** | PostgreSQL 16 | ACID, JSONB, row-level security, mature |
| **Cache/Sessions** | Redis 7 | Session store, BullMQ backing, pub/sub |
| **Job Queue** | BullMQ | Redis-backed, retries, priorities, cron, dashboard |
| **Object Storage** | S3-compatible (MinIO local / AWS S3 prod) | Media uploads before social posting |
| **Email** | Brevo (Sendinblue) | Transactional + marketing emails |
| **Push Notifications** | Web Push API (service worker) | Browser push |
| **Containerization** | Docker + Docker Compose | Dev parity, deployment |
| **Migrations** | node-pg-migrate | SQL-first, version controlled |

---

## 3. Project Structure (Monorepo)

```
b:\Personal-Projects\GenAI\PR-Review_Bot\PushPost\
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── apps/
│   ├── api/                           # Express.js API Server
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── config/
│   │       │   ├── index.ts           # env loader + validation
│   │       │   ├── database.ts        # pg pool config
│   │       │   ├── redis.ts           # redis client config
│   │       │   ├── session.ts         # express-session + redis store
│   │       │   ├── bullmq.ts          # queue connections
│   │       │   ├── storage.ts         # S3/MinIO config
│   │       │   ├── brevo.ts           # Brevo email config
│   │       │   ├── cors.ts
│   │       │   └── logger.ts          # pino logger
│   │       ├── db/
│   │       │   ├── pool.ts            # pg Pool singleton
│   │       │   ├── migrations/        # SQL migration files
│   │       │   │   ├── 001_create_users.sql
│   │       │   │   ├── 002_create_social_accounts.sql
│   │       │   │   ├── 003_create_posts.sql
│   │       │   │   ├── 004_create_post_targets.sql
│   │       │   │   ├── 005_create_media.sql
│   │       │   │   ├── 006_create_schedules.sql
│   │       │   │   ├── 007_create_notifications.sql
│   │       │   │   ├── 008_create_api_keys.sql
│   │       │   │   ├── 009_create_audit_logs.sql
│   │       │   │   ├── 010_create_plans_subscriptions.sql
│   │       │   │   └── 011_create_analytics.sql
│   │       │   └── seeders/
│   │       │       ├── 001_seed_plans.ts
│   │       │       └── 002_seed_admin.ts
│   │       ├── middlewares/
│   │       │   ├── auth.middleware.ts          # JWT + Session validation
│   │       │   ├── rbac.middleware.ts          # Role-based access
│   │       │   ├── rateLimiter.middleware.ts   # express-rate-limit + redis
│   │       │   ├── validate.middleware.ts      # Zod schema validation
│   │       │   ├── upload.middleware.ts        # Multer + S3
│   │       │   ├── requestId.middleware.ts     # correlation ID
│   │       │   └── errorHandler.middleware.ts  # global error handler
│   │       ├── modules/
│   │       │   ├── auth/
│   │       │   │   ├── auth.routes.ts
│   │       │   │   ├── auth.controller.ts
│   │       │   │   ├── auth.service.ts
│   │       │   │   ├── auth.repository.ts
│   │       │   │   ├── auth.schemas.ts        # Zod schemas
│   │       │   │   └── strategies/
│   │       │   │       ├── local.strategy.ts
│   │       │   │       └── jwt.strategy.ts
│   │       │   ├── users/
│   │       │   │   ├── users.routes.ts
│   │       │   │   ├── users.controller.ts
│   │       │   │   ├── users.service.ts
│   │       │   │   ├── users.repository.ts
│   │       │   │   └── users.schemas.ts
│   │       │   ├── social-accounts/
│   │       │   │   ├── social-accounts.routes.ts
│   │       │   │   ├── social-accounts.controller.ts
│   │       │   │   ├── social-accounts.service.ts
│   │       │   │   ├── social-accounts.repository.ts
│   │       │   │   ├── social-accounts.schemas.ts
│   │       │   │   └── providers/
│   │       │   │       ├── provider.interface.ts
│   │       │   │       ├── linkedin.provider.ts
│   │       │   │       ├── facebook.provider.ts
│   │       │   │       ├── instagram.provider.ts
│   │       │   │       ├── threads.provider.ts
│   │       │   │       ├── x.provider.ts
│   │       │   │       └── reddit.provider.ts
│   │       │   ├── posts/
│   │       │   │   ├── posts.routes.ts
│   │       │   │   ├── posts.controller.ts
│   │       │   │   ├── posts.service.ts
│   │       │   │   ├── posts.repository.ts
│   │       │   │   └── posts.schemas.ts
│   │       │   ├── media/
│   │       │   │   ├── media.routes.ts
│   │       │   │   ├── media.controller.ts
│   │       │   │   ├── media.service.ts
│   │       │   │   └── media.repository.ts
│   │       │   ├── scheduler/
│   │       │   │   ├── scheduler.routes.ts
│   │       │   │   ├── scheduler.controller.ts
│   │       │   │   ├── scheduler.service.ts
│   │       │   │   └── scheduler.repository.ts
│   │       │   ├── ai-content/
│   │       │   │   ├── ai-content.routes.ts
│   │       │   │   ├── ai-content.controller.ts
│   │       │   │   ├── ai-content.service.ts
│   │       │   │   └── ai-content.schemas.ts
│   │       │   ├── notifications/
│   │       │   │   ├── notifications.routes.ts
│   │       │   │   ├── notifications.controller.ts
│   │       │   │   ├── notifications.service.ts
│   │       │   │   ├── notifications.repository.ts
│   │       │   │   └── channels/
│   │       │   │       ├── email.channel.ts       # Brevo
│   │       │   │       ├── push.channel.ts        # Web Push
│   │       │   │       └── inapp.channel.ts       # DB-backed
│   │       │   ├── analytics/
│   │       │   │   ├── analytics.routes.ts
│   │       │   │   ├── analytics.controller.ts
│   │       │   │   ├── analytics.service.ts
│   │       │   │   └── analytics.repository.ts
│   │       │   ├── admin/
│   │       │   │   ├── admin.routes.ts
│   │       │   │   ├── admin.controller.ts
│   │       │   │   ├── admin.service.ts
│   │       │   │   └── admin.repository.ts
│   │       │   └── billing/
│   │       │       ├── billing.routes.ts
│   │       │       ├── billing.controller.ts
│   │       │       ├── billing.service.ts
│   │       │       └── billing.repository.ts
│   │       ├── workers/
│   │       │   ├── publisher.worker.ts        # Publishes to social platforms
│   │       │   ├── notification.worker.ts     # Sends emails/push/in-app
│   │       │   ├── analytics.worker.ts        # Aggregates post metrics
│   │       │   ├── tokenRefresh.worker.ts     # Refreshes expiring OAuth tokens
│   │       │   └── cleanup.worker.ts          # Purges old data
│   │       ├── queues/
│   │       │   ├── publish.queue.ts
│   │       │   ├── notification.queue.ts
│   │       │   ├── analytics.queue.ts
│   │       │   └── tokenRefresh.queue.ts
│   │       ├── utils/
│   │       │   ├── crypto.ts                  # AES-256-GCM token encryption
│   │       │   ├── jwt.ts                     # JWT sign/verify
│   │       │   ├── pagination.ts
│   │       │   ├── apiResponse.ts             # Standardized responses
│   │       │   └── constants.ts
│   │       ├── types/
│   │       │   ├── express.d.ts               # req.user augmentation
│   │       │   └── index.ts
│   │       ├── emails/
│   │       │   ├── templates/
│   │       │   │   ├── welcome.html
│   │       │   │   ├── verify-email.html
│   │       │   │   ├── reset-password.html
│   │       │   │   ├── post-published.html
│   │       │   │   ├── post-failed.html
│   │       │   │   └── account-deactivated.html
│   │       │   └── sender.ts                  # Brevo template renderer
│   │       ├── app.ts                         # Express app setup
│   │       └── server.ts                      # HTTP server entry
│   │
│   ├── ai-service/                    # Python FastAPI
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── pyproject.toml
│   │   └── app/
│   │       ├── main.py
│   │       ├── api/
│   │       │   ├── routes.py
│   │       │   └── schemas.py
│   │       ├── core/
│   │       │   ├── config.py
│   │       │   ├── security.py
│   │       │   └── logging.py
│   │       ├── services/
│   │       │   ├── content_generator.py
│   │       │   ├── prompt_builder.py
│   │       │   └── provider_manager.py
│   │       ├── providers/
│   │       │   ├── base.py                # Abstract provider
│   │       │   ├── gemini.py              # Google Gemini
│   │       │   ├── openai.py              # OpenAI GPT-4o
│   │       │   └── byok.py               # Bring Your Own Key
│   │       └── prompts/
│   │           ├── linkedin.py
│   │           ├── twitter.py
│   │           ├── facebook.py
│   │           ├── instagram.py
│   │           ├── threads.py
│   │           └── reddit.py
│   │
│   └── web/                           # Next.js 14 Frontend
│       ├── Dockerfile
│       ├── package.json
│       ├── tsconfig.json
│       ├── tailwind.config.ts
│       ├── next.config.mjs
│       ├── public/
│       └── src/
│           ├── app/
│           │   ├── layout.tsx
│           │   ├── page.tsx                   # Landing page
│           │   ├── (auth)/
│           │   │   ├── login/page.tsx
│           │   │   ├── signup/page.tsx
│           │   │   ├── forgot-password/page.tsx
│           │   │   └── verify-email/page.tsx
│           │   ├── (dashboard)/
│           │   │   ├── layout.tsx              # Sidebar + topbar
│           │   │   ├── page.tsx                # Dashboard home
│           │   │   ├── compose/page.tsx        # Create post (AI-assisted)
│           │   │   ├── posts/
│           │   │   │   ├── page.tsx             # All posts list
│           │   │   │   └── [id]/page.tsx        # Post detail + analytics
│           │   │   ├── calendar/page.tsx        # Scheduling calendar
│           │   │   ├── accounts/page.tsx        # Connected social accounts
│           │   │   ├── analytics/page.tsx       # Engagement analytics
│           │   │   ├── notifications/page.tsx   # Notification center
│           │   │   ├── settings/
│           │   │   │   ├── page.tsx              # Profile settings
│           │   │   │   ├── billing/page.tsx
│           │   │   │   ├── api-keys/page.tsx
│           │   │   │   └── ai-config/page.tsx   # BYOK settings
│           │   │   └── admin/                   # Admin panel
│           │   │       ├── page.tsx              # Overview
│           │   │       ├── users/page.tsx
│           │   │       ├── monitoring/page.tsx
│           │   │       └── system/page.tsx
│           │   └── (marketing)/
│           │       ├── pricing/page.tsx
│           │       ├── features/page.tsx
│           │       └── docs/page.tsx
│           ├── components/
│           │   ├── ui/                     # Shadcn components
│           │   ├── layout/
│           │   │   ├── Sidebar.tsx
│           │   │   ├── Topbar.tsx
│           │   │   └── MobileDrawer.tsx
│           │   ├── compose/
│           │   │   ├── PostEditor.tsx
│           │   │   ├── PlatformSelector.tsx
│           │   │   ├── MediaUploader.tsx
│           │   │   ├── AIAssistant.tsx
│           │   │   ├── PreviewCard.tsx
│           │   │   └── SchedulePicker.tsx
│           │   ├── posts/
│           │   │   ├── PostCard.tsx
│           │   │   ├── PostList.tsx
│           │   │   └── PostStatusBadge.tsx
│           │   ├── accounts/
│           │   │   ├── AccountCard.tsx
│           │   │   └── ConnectButton.tsx
│           │   ├── analytics/
│           │   │   ├── EngagementChart.tsx
│           │   │   ├── PlatformBreakdown.tsx
│           │   │   └── MetricCard.tsx
│           │   └── shared/
│           │       ├── DataTable.tsx
│           │       ├── EmptyState.tsx
│           │       └── LoadingSpinner.tsx
│           ├── lib/
│           │   ├── api.ts               # Axios instance
│           │   ├── auth.ts              # Auth helpers
│           │   └── utils.ts
│           ├── hooks/
│           │   ├── useAuth.ts
│           │   ├── usePosts.ts
│           │   ├── useAccounts.ts
│           │   └── useNotifications.ts
│           ├── store/
│           │   ├── authStore.ts         # Zustand - auth state
│           │   ├── composeStore.ts      # Zustand - compose state
│           │   └── notificationStore.ts
│           └── types/
│               └── index.ts
│
├── packages/                          # Shared packages
│   └── shared-types/
│       ├── package.json
│       └── src/
│           ├── api.ts                 # API response types
│           ├── models.ts              # Shared model types
│           └── enums.ts               # Platform, Status enums
│
├── infra/
│   └── docker/
│       ├── nginx/
│       │   └── nginx.conf
│       └── postgres/
│           └── init.sql
│
├── docker-compose.local.yml
├── docker-compose.prod.yml
├── Makefile
├── .env.example
├── .gitignore
├── tsconfig.base.json
├── package.json                       # Workspace root
└── README.md
```

---

## 4. Database Schema (Complete)

### 4.1 `users`

```sql
CREATE TABLE users (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email                   VARCHAR(255) NOT NULL UNIQUE,
    name                    VARCHAR(255),
    avatar_url              TEXT,
    password_hash           TEXT NOT NULL,
    
    -- Email verification
    email_verified          BOOLEAN DEFAULT FALSE,
    email_verified_at       TIMESTAMPTZ,
    email_verify_token      VARCHAR(255),
    email_verify_expires    TIMESTAMPTZ,
    
    -- Password reset
    password_reset_token    VARCHAR(255),
    password_reset_expires  TIMESTAMPTZ,
    
    -- Role & status
    role                    VARCHAR(20) DEFAULT 'user' CHECK (role IN ('superadmin', 'admin', 'user')),
    status                  VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended', 'deactivated')),
    
    -- Preferences
    preferences             JSONB DEFAULT '{}',
    notification_settings   JSONB DEFAULT '{"email_on_publish": true, "email_on_failure": true, "push_enabled": false}',
    
    -- AI settings (BYOK)
    ai_config               JSONB DEFAULT '{"provider": "platform", "api_key_enc": null}',
    
    -- Usage & limits
    usage                   JSONB DEFAULT '{"posts_this_month": 0, "ai_generations_this_month": 0, "reset_at": null}',
    
    -- Metadata
    timezone                VARCHAR(50) DEFAULT 'Asia/Kolkata',
    locale                  VARCHAR(10) DEFAULT 'en',
    last_active_at          TIMESTAMPTZ,
    login_count             INTEGER DEFAULT 0,
    last_login_at           TIMESTAMPTZ,
    last_login_ip           INET,
    
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
```

### 4.2 `sessions` (Redis-backed, schema for reference)

```
Redis Key Pattern: sess:{sessionId}
TTL: 24 hours (configurable)
Value: JSON {
    userId: UUID,
    email: string,
    role: string,
    createdAt: timestamp,
    ip: string,
    userAgent: string
}
```

### 4.3 `social_accounts`

```sql
CREATE TABLE social_accounts (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Platform identification
    platform                VARCHAR(20) NOT NULL CHECK (platform IN ('linkedin', 'facebook', 'instagram', 'threads', 'x', 'reddit')),
    platform_user_id        VARCHAR(255) NOT NULL,
    platform_username       VARCHAR(255),
    platform_display_name   VARCHAR(255),
    platform_avatar_url     TEXT,
    platform_profile_url    TEXT,
    
    -- For Facebook Pages / LinkedIn Orgs
    platform_page_id        VARCHAR(255),          -- Facebook Page ID or LinkedIn Org ID
    platform_page_name      VARCHAR(255),
    account_type            VARCHAR(20) DEFAULT 'personal' CHECK (account_type IN ('personal', 'page', 'business', 'creator')),
    
    -- OAuth tokens (AES-256-GCM encrypted)
    access_token_enc        TEXT NOT NULL,
    refresh_token_enc       TEXT,
    token_expires_at        TIMESTAMPTZ,
    token_scopes            TEXT[],                 -- Granted OAuth scopes
    
    -- Status
    status                  VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'error')),
    last_error              TEXT,
    last_used_at            TIMESTAMPTZ,
    last_token_refresh_at   TIMESTAMPTZ,
    
    -- Platform-specific metadata
    metadata                JSONB DEFAULT '{}',
    
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, platform, platform_user_id)
);

CREATE INDEX idx_social_accounts_user ON social_accounts(user_id);
CREATE INDEX idx_social_accounts_platform ON social_accounts(platform);
CREATE INDEX idx_social_accounts_token_expiry ON social_accounts(token_expires_at) WHERE status = 'active';
```

### 4.4 `posts`

```sql
CREATE TABLE posts (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Content
    content                 JSONB NOT NULL,
    -- Structure: {
    --   "text": "Main post content...",
    --   "platform_variants": {
    --     "linkedin": { "text": "...", "hashtags": [...] },
    --     "x": { "text": "...", "thread": [...] },
    --     "reddit": { "title": "...", "text": "...", "subreddit": "..." },
    --     ...
    --   }
    -- }
    
    -- AI generation metadata
    ai_generated            BOOLEAN DEFAULT FALSE,
    ai_prompt               TEXT,
    ai_provider             VARCHAR(20),           -- gemini | openai | byok
    ai_model                VARCHAR(100),
    ai_tokens_used          INTEGER,
    
    -- Scheduling
    status                  VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'partially_published', 'failed')),
    scheduled_at            TIMESTAMPTZ,
    published_at            TIMESTAMPTZ,
    
    -- Metadata
    tags                    TEXT[] DEFAULT '{}',
    is_deleted              BOOLEAN DEFAULT FALSE,
    deleted_at              TIMESTAMPTZ,
    
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_user ON posts(user_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_scheduled ON posts(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at DESC);
```

### 4.5 `post_targets`

```sql
-- Each post can target multiple social accounts (cross-posting)
CREATE TABLE post_targets (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id                 UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    social_account_id       UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
    
    -- Platform-specific content override (from content.platform_variants)
    platform                VARCHAR(20) NOT NULL,
    platform_content        JSONB,                 -- Override content for this specific target
    
    -- Publishing result
    status                  VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'publishing', 'published', 'failed', 'retrying')),
    platform_post_id        VARCHAR(255),          -- ID returned by the platform
    platform_post_url       TEXT,                  -- URL of published post
    
    -- Error handling
    error                   TEXT,
    retry_count             INTEGER DEFAULT 0,
    max_retries             INTEGER DEFAULT 3,
    last_attempt_at         TIMESTAMPTZ,
    
    -- Engagement metrics (populated by analytics worker)
    metrics                 JSONB DEFAULT '{"likes": 0, "comments": 0, "shares": 0, "impressions": 0, "clicks": 0}',
    metrics_updated_at      TIMESTAMPTZ,
    
    published_at            TIMESTAMPTZ,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(post_id, social_account_id)
);

CREATE INDEX idx_post_targets_post ON post_targets(post_id);
CREATE INDEX idx_post_targets_status ON post_targets(status);
CREATE INDEX idx_post_targets_account ON post_targets(social_account_id);
```

### 4.6 `media`

```sql
CREATE TABLE media (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id                 UUID REFERENCES posts(id) ON DELETE SET NULL,
    
    -- File info
    original_filename       VARCHAR(500),
    mime_type               VARCHAR(100) NOT NULL,
    file_size_bytes         BIGINT NOT NULL,
    storage_key             TEXT NOT NULL,          -- S3 key
    storage_url             TEXT NOT NULL,          -- Public/signed URL
    
    -- Image/Video metadata
    width                   INTEGER,
    height                  INTEGER,
    duration_seconds        FLOAT,                  -- For video
    
    -- Thumbnails
    thumbnail_url           TEXT,
    
    -- Status
    status                  VARCHAR(20) DEFAULT 'uploaded' CHECK (status IN ('uploading', 'uploaded', 'processing', 'ready', 'failed')),
    
    -- Ordering within a post
    sort_order              INTEGER DEFAULT 0,
    
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_media_user ON media(user_id);
CREATE INDEX idx_media_post ON media(post_id);
```

### 4.7 `notifications`

```sql
CREATE TABLE notifications (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Content
    type                    VARCHAR(50) NOT NULL,
    -- Types: post_published, post_failed, account_expired, account_connected,
    --        usage_limit_warning, billing_reminder, system_announcement
    title                   VARCHAR(500) NOT NULL,
    body                    TEXT,
    
    -- Action link
    action_url              TEXT,
    action_label            VARCHAR(100),
    
    -- Channels delivered through
    channels                TEXT[] DEFAULT '{inapp}',   -- inapp, email, push
    
    -- Status
    read                    BOOLEAN DEFAULT FALSE,
    read_at                 TIMESTAMPTZ,
    
    -- Related entity
    resource_type           VARCHAR(50),
    resource_id             UUID,
    
    -- Metadata
    metadata                JSONB DEFAULT '{}',
    
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE read = FALSE;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
```

### 4.8 `plans`

```sql
CREATE TABLE plans (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                    VARCHAR(50) NOT NULL UNIQUE,
    display_name            VARCHAR(100) NOT NULL,
    description             TEXT,
    
    -- Pricing
    price_monthly_paise     INTEGER DEFAULT 0,
    price_yearly_paise      INTEGER DEFAULT 0,
    currency                VARCHAR(3) DEFAULT 'INR',
    
    -- Limits
    max_social_accounts     INTEGER DEFAULT 3,
    max_posts_per_month     INTEGER DEFAULT 30,
    max_scheduled_posts     INTEGER DEFAULT 10,
    max_ai_generations      INTEGER DEFAULT 20,
    max_media_storage_mb    INTEGER DEFAULT 500,
    
    -- Features
    features                JSONB DEFAULT '{}',
    -- Structure: {
    --   "ai_content_generation": true,
    --   "analytics": false,
    --   "team_collaboration": false,
    --   "custom_ai_provider": false,
    --   "priority_support": false,
    --   "api_access": false,
    --   "bulk_scheduling": false,
    --   "content_calendar": true
    -- }
    
    -- Payment gateway
    gateway_plan_id         VARCHAR(255),
    
    is_active               BOOLEAN DEFAULT TRUE,
    sort_order              INTEGER DEFAULT 0,
    
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.9 `subscriptions`

```sql
CREATE TABLE subscriptions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id                 UUID NOT NULL REFERENCES plans(id),
    
    -- Payment
    payment_gateway         VARCHAR(20),
    gateway_subscription_id VARCHAR(255),
    gateway_customer_id     VARCHAR(255),
    
    -- Status
    status                  VARCHAR(20) DEFAULT 'active' CHECK (status IN ('trialing', 'active', 'past_due', 'cancelled', 'expired')),
    
    -- Billing cycle
    billing_cycle           VARCHAR(10) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    current_period_start    TIMESTAMPTZ,
    current_period_end      TIMESTAMPTZ,
    trial_start             TIMESTAMPTZ,
    trial_end               TIMESTAMPTZ,
    
    -- Cancellation
    cancelled_at            TIMESTAMPTZ,
    cancel_reason           TEXT,
    cancel_at_period_end    BOOLEAN DEFAULT FALSE,
    
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

### 4.10 `invoices`

```sql
CREATE TABLE invoices (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id),
    subscription_id         UUID REFERENCES subscriptions(id),
    
    -- Payment
    gateway_payment_id      VARCHAR(255),
    gateway_invoice_id      VARCHAR(255),
    amount_paise            INTEGER NOT NULL,
    tax_paise               INTEGER DEFAULT 0,
    total_paise             INTEGER NOT NULL,
    currency                VARCHAR(3) DEFAULT 'INR',
    
    -- Status
    status                  VARCHAR(20) CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
    paid_at                 TIMESTAMPTZ,
    
    -- Invoice details
    invoice_number          VARCHAR(50) UNIQUE,
    invoice_pdf_url         TEXT,
    
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.11 `api_keys`

```sql
CREATE TABLE api_keys (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    name                    VARCHAR(255) NOT NULL,
    key_hash                VARCHAR(255) NOT NULL UNIQUE,
    key_prefix              VARCHAR(20) NOT NULL,
    
    scopes                  JSONB DEFAULT '["read"]',
    last_used_at            TIMESTAMPTZ,
    expires_at              TIMESTAMPTZ,
    
    status                  VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
    revoked_at              TIMESTAMPTZ,
    
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.12 `audit_logs`

```sql
CREATE TABLE audit_logs (
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

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
```

---

## 5. Social Platform Integration Details

### 5.1 Provider Interface

```typescript
interface SocialProvider {
    platform: Platform;
    
    // OAuth
    getAuthUrl(state: string): string;
    exchangeCode(code: string): Promise<TokenSet>;
    refreshToken(refreshToken: string): Promise<TokenSet>;
    
    // User/Page info
    getUserProfile(accessToken: string): Promise<SocialProfile>;
    getPages?(accessToken: string): Promise<SocialPage[]>;  // FB, LinkedIn
    
    // Publishing
    publishPost(account: SocialAccount, content: PostContent): Promise<PublishResult>;
    deletePost(account: SocialAccount, platformPostId: string): Promise<void>;
    
    // Metrics (optional)
    getPostMetrics?(account: SocialAccount, platformPostId: string): Promise<PostMetrics>;
}
```

### 5.2 Platform Matrix

| Platform | OAuth | Token Lifetime | Refresh | Posting Endpoint | Media | Rate Limit | Base Cost | URL Surcharge |
|----------|-------|----------------|---------|-----------------|-------|------------|-----------|---------------|
| **LinkedIn** | OAuth 2.0 | 60 days | 365-day refresh token | `POST /rest/posts` | Images via `/rest/images` | 100 req/day | Free | Free |
| **Facebook** | OAuth 2.0 | ~60 days | Long-lived via endpoint | `POST /{page-id}/feed` | Direct upload | 200 calls/hr | Free | Free |
| **Instagram** | FB Login for Business | ~60 days | Same as FB | Container model: `POST /{ig-user}/media` → `POST /{ig-user}/media_publish` | Public URL required | 25 publishes/day | Free | Free |
| **Threads** | OAuth 2.0 (Meta) | 60 days | Refresh endpoint | Container: `POST /{user}/threads` → `POST /{user}/threads_publish` | Public URL required | ~250 req/day | Free | Free |
| **X (Twitter)** | OAuth 2.0 PKCE | 2 hours | Refresh token | `POST /2/tweets` | Upload via `/1.1/media/upload` | 100 tweets/15min | **$0.015 / tweet** | **$0.20 / tweet with URLs** |
| **Reddit** | OAuth 2.0 | 1 hour | Refresh token | `POST /api/submit` | Inline or URL | 100 req/min | Free | Free |

> [!WARNING]
> **X (Twitter) Pricing Model & Direct Pass-Through**:
> - Basic text tweet: **$0.015 / tweet**
> - Tweet with URLs / links: **$0.20 / tweet** (X charges 13x more when external URLs are included)
> - **Zero Markup Pass-Through**: PushPost does not subsidize third-party API costs; costs are passed directly to users via a metered credit balance or plan add-on.
> - **User Choice & Flagging**: Every platform is selectable by the user in Settings. If a service is paid (like X), it is prominently flagged with a `PAID SERVICE` badge, showing real-time unit costs.

---

### 5.3a Paid Platform Flag & User Opt-In System (X/Twitter Pass-Through)

To ensure full transparency and prevent surprise charges, PushPost treats paid third-party platforms as opt-in services:

1. **Platform Configuration Schema (`platform_registry`)**:
   ```typescript
   interface PlatformConfig {
     id: 'linkedin' | 'facebook' | 'instagram' | 'threads' | 'x' | 'reddit';
     name: string;
     is_paid: boolean;
     pricing?: {
       currency: 'USD';
       cost_per_post: number;          // e.g. 0.015 for X
       cost_per_post_with_url: number; // e.g. 0.20 for X
     };
     required_tier: 'free' | 'starter' | 'pro' | 'enterprise';
   }
   ```

2. **User Platform Preference & Opt-In (`users.preferences.platform_settings`)**:
   - Users must explicitly toggle ON paid platforms in **Settings → Connected Platforms**.
   - Enabling a paid platform opens a **Cost Acknowledgment Dialog**:
     - Explains exact charges ($0.015/tweet, $0.20/tweet with URLs).
     - Prompts user to link a billing method or maintain a prepaid credit balance.
     - Sets `user.preferences.paid_platforms_consent.x = true`.

3. **Dynamic Pre-Flight Cost Calculation in Compose UI**:
   - As the user types in the Compose editor, a real-time URL detector checks for hyperlinks (`http://`, `https://`, domain links).
   - If X is selected as a target:
     - No URLs detected: Displays badge `X (Twitter): $0.015 est.`
     - URLs detected: Displays badge `X (Twitter) with Link: $0.20 est.`
   - If the user's available balance is lower than the required amount, publishing is blocked with a prompt to recharge credits.

4. **Publish Execution & Metered Accounting**:
   - In `PublishWorker`, prior to calling the X API:
     1. Verifies user has active consent for X.
     2. Checks and reserves credits.
     3. Calls X API to publish.
     4. On success: Logs exact charge in `post_targets.cost_incurred` and commits credit deduction.
     5. On failure: Releases reserved credits immediately.

---

### 5.3b In-App Step-by-Step Connection Guides (Interactive Setup Wizard)

Connecting professional social accounts involves strict vendor prerequisites. PushPost embeds an **Interactive Step-by-Step Wizard** for each service:

#### 1. Instagram Setup Guide (Meta Graph API)
> Instagram requires an Instagram Professional account linked to an active Facebook Page.

- **Step 1: Convert to Professional Account**
  - Open Instagram app → Settings → Account type and tools → **Switch to Professional Account** (Select Creator or Business).
- **Step 2: Link Instagram to a Facebook Page**
  - Open Facebook → Pages → Go to Page Settings → **Linked Accounts** → **Instagram** → Click **Connect Account** and log in.
- **Step 3: Register in Meta Developer Portal**
  - Go to [developers.facebook.com](https://developers.facebook.com) → Log in with Facebook → **My Apps** → **Create App** (type: Business).
- **Step 4: Add Instagram Graph API & Request Permissions**
  - Add **Instagram Graph API** product to app.
  - Required permissions: `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`.
- **Step 5: Complete Page Publishing Authorization (PPA)**
  - Ensure the user is an **Admin** of the Facebook Page and two-factor authentication (2FA) is turned on.
- **Step 6: Authorize in PushPost**
  - Click **Connect Instagram** in PushPost → OAuth popup opens → Select Facebook Page → Confirm permissions. PushPost validates token and fetches account handle.

#### 2. X (Twitter) Setup Guide (OAuth 2.0 PKCE + Paid Usage)
- **Step 1: Review Cost Terms**
  - Accept $0.015/tweet (standard) and $0.20/tweet (with URLs) pass-through terms.
- **Step 2: Developer App & OAuth 2.0 PKCE Authorization**
  - Click **Connect X** → Redirects to `twitter.com/i/oauth2/authorize`.
  - Scopes requested: `tweet.read`, `tweet.write`, `users.read`, `offline.access`.
- **Step 3: Verify & Confirm**
  - PushPost exchanges PKCE authorization code for access and refresh tokens, stores encrypted credentials in `social_accounts`.

#### 3. Facebook Pages Setup Guide
- **Step 1: Confirm Page Admin Role**
  - Ensure you have **Admin or Editor** role on the Facebook Page you want to publish to.
- **Step 2: OAuth Consent & Page Selector**
  - Click **Connect Facebook** → Log in to Facebook → Grant `pages_manage_posts`, `pages_read_engagement`.
  - PushPost presents a dropdown of all Facebook Pages managed by the user; user selects the target Page(s).

#### 4. LinkedIn Setup Guide (Personal Profile & Company Pages)
- **Step 1: Choose Account Type**
  - Choose between **Personal Profile** (default) or **Company Page (Organization)**.
- **Step 2: Organization Admin Verification**
  - For Company Pages: Ensure you are a designated Page Administrator on LinkedIn.
- **Step 3: Authorization Flow**
  - Click **Connect LinkedIn** → Scopes `openid`, `profile`, `w_member_social`, `w_organization_social`.
  - Select Company Page from retrieved list or confirm Personal Profile.

#### 5. Threads Setup Guide
- **Step 1: Meta Threads App Access**
  - Scopes: `threads_basic`, `threads_content_publish`.
  - Connect via Meta OAuth handshake.

#### 6. Reddit Setup Guide
- **Step 1: Reddit App Authorization**
  - Scopes: `identity`, `submit`, `read`.
  - Connect via OAuth 2.0 flow; user specifies default target Subreddit(s).

### 5.3 Token Security

All OAuth tokens stored in `social_accounts` are encrypted at rest using **AES-256-GCM**:

```typescript
// utils/crypto.ts
const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY, 'hex'); // 32 bytes

function encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(ciphertext: string): string {
    const [ivHex, authTagHex, encHex] = ciphertext.split(':');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    return decipher.update(Buffer.from(encHex, 'hex')) + decipher.final('utf8');
}
```

---

## 6. Authentication System

### 6.1 Dual Auth Strategy (Session + JWT)

```mermaid
sequenceDiagram
    participant C as Client
    participant A as API Server
    participant R as Redis
    participant D as PostgreSQL
    
    Note over C,D: Registration Flow
    C->>A: POST /api/auth/register (email, password, name)
    A->>D: INSERT INTO users
    A->>R: SET sess:id (session data)
    A-->>C: Set-Cookie: sid=session_id
    A-->>C: Return user and 15min JWT accessToken
    
    Note over C,D: Login Flow
    C->>A: POST /api/auth/login (email, password)
    A->>D: SELECT * FROM users WHERE email = email
    A->>A: bcrypt.compare(password, hash)
    A->>R: SET sess:id
    A-->>C: Set-Cookie + user and accessToken
    
    Note over C,D: Authenticated Request
    C->>A: GET /api/posts (Cookie + Bearer token)
    A->>R: GET sess:id (session validation)
    A->>A: JWT verify (access token)
    A->>D: Execute query
    A-->>C: Response data
    
    Note over C,D: Token Refresh
    C->>A: POST /api/auth/refresh (Cookie only)
    A->>R: GET sess:id
    A->>A: Issue new JWT
    A-->>C: Return new accessToken
```

**Why dual?**
- **Session (Cookie)**: Primary auth for web app. `httpOnly`, `secure`, `sameSite=strict`. Stored in Redis with TTL.
- **JWT**: Short-lived (15 min) access token for API calls. Stateless validation. Used by API keys and mobile clients.
- **Refresh**: Session cookie acts as refresh token. No separate refresh JWT needed for web.

### 6.2 RBAC Middleware

```typescript
type Role = 'superadmin' | 'admin' | 'user';

const ROLE_HIERARCHY: Record<Role, number> = {
    superadmin: 100,
    admin: 50,
    user: 10,
};

function requireRole(...allowedRoles: Role[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        const userRole = req.user?.role as Role;
        const minRequired = Math.min(...allowedRoles.map(r => ROLE_HIERARCHY[r]));
        
        if (ROLE_HIERARCHY[userRole] >= minRequired) {
            return next();
        }
        throw new ForbiddenError('Insufficient permissions');
    };
}
```

---

## 7. Notification System

### 7.1 Architecture

```mermaid
graph LR
    EVENT["Event Emitter"] --> QUEUE["BullMQ<br/>notification queue"]
    QUEUE --> WORKER["Notification Worker"]
    WORKER --> EMAIL["Brevo Email"]
    WORKER --> PUSH["Web Push"]
    WORKER --> INAPP["In-App<br/>(DB Write)"]
    WORKER --> PUBSUB["Redis Pub/Sub<br/>(Real-time)"]
    PUBSUB --> SSE["SSE Endpoint"]
    SSE --> CLIENT["Browser"]
```

### 7.2 Notification Types

| Type | Email | Push | In-App |
|------|-------|------|--------|
| `post_published` | ✓ (if enabled) | ✓ | ✓ |
| `post_failed` | ✓ (always) | ✓ | ✓ |
| `account_expired` | ✓ (always) | ✓ | ✓ |
| `account_connected` | ✗ | ✗ | ✓ |
| `usage_limit_warning` | ✓ | ✗ | ✓ |
| `billing_reminder` | ✓ | ✗ | ✓ |
| `system_announcement` | ✓ | ✓ | ✓ |

### 7.3 Email Templates (Brevo)

HTML templates stored in `apps/api/src/emails/templates/`. Rendered with Handlebars-style variables:
- `welcome.html` → On registration
- `verify-email.html` → Email verification link
- `reset-password.html` → Password reset link
- `post-published.html` → Post successfully published
- `post-failed.html` → Post publishing failed (with error details)
- `account-deactivated.html` → Account deactivation notice

### 7.4 Real-Time Delivery (SSE)

```typescript
// SSE endpoint: GET /api/notifications/stream
app.get('/api/notifications/stream', authMiddleware, (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    const channel = `notifications:${req.user.id}`;
    const subscriber = redis.duplicate();
    
    subscriber.subscribe(channel, (message) => {
        res.write(`data: ${message}\n\n`);
    });
    
    req.on('close', () => {
        subscriber.unsubscribe(channel);
        subscriber.quit();
    });
});
```

---

## 8. Publishing Pipeline

### 8.1 Post Lifecycle

```mermaid
stateDiagram-v2
    [*] --> draft: User creates post
    draft --> scheduled: User schedules
    draft --> publishing: User publishes now
    scheduled --> publishing: Scheduler triggers at scheduled_at
    publishing --> published: All targets succeeded
    publishing --> partially_published: Some targets failed
    publishing --> failed: All targets failed
    partially_published --> publishing: User retries failed
    failed --> publishing: User retries
    
    draft --> [*]: User deletes
    published --> [*]: User deletes
```

### 8.2 Publisher Worker Flow

```mermaid
graph TD
    A["Job received from queue"] --> B{Job type?}
    B -->|publish| C["Load post + targets"]
    B -->|retry| D["Load failed targets only"]
    
    C --> E["For each target (parallel)"]
    D --> E
    
    E --> F["Decrypt OAuth token"]
    F --> G{Token expired?}
    G -->|Yes| H["Refresh token"]
    H -->|Success| I["Call provider.publishPost()"]
    H -->|Fail| J["Mark target FAILED<br/>Notify user: account_expired"]
    G -->|No| I
    
    I -->|Success| K["Update target:<br/>status=published<br/>platform_post_id<br/>platform_post_url"]
    I -->|Fail| L{Retries < max?}
    L -->|Yes| M["Increment retry_count<br/>Re-queue with backoff"]
    L -->|No| J2["Mark target FAILED"]
    
    K --> N["All targets done?"]
    J --> N
    J2 --> N
    M --> N
    
    N --> O["Update post status"]
    O --> P["Emit notification"]
```

---

## 9. AI Content Generation Service

### 9.1 Provider Abstraction

```python
class AIProvider(ABC):
    @abstractmethod
    async def generate(self, prompt: str, config: dict) -> str:
        pass

class GeminiProvider(AIProvider):
    async def generate(self, prompt: str, config: dict) -> str:
        # Uses google.generativeai SDK
        ...

class OpenAIProvider(AIProvider):
    async def generate(self, prompt: str, config: dict) -> str:
        # Uses openai SDK
        ...

class BYOKProvider(AIProvider):
    """Bring Your Own Key — uses user's API key"""
    async def generate(self, prompt: str, config: dict) -> str:
        provider = config.get('provider')  # 'openai' or 'gemini'
        api_key = config.get('api_key')    # Decrypted from user's ai_config
        ...
```

### 9.2 Platform-Specific Prompt Engineering

Each platform has tailored prompts accounting for:
- **Character limits**: X (280), LinkedIn (3000), Reddit (40K), etc.
- **Tone**: Professional (LinkedIn), Casual (X/Threads), Community (Reddit)
- **Format**: Hashtags (LinkedIn/Insta), Threads (X), Subreddit rules (Reddit)
- **Media suggestions**: When to recommend images, carousels, videos

### 9.3 Content Generation API

```
POST /api/ai-content/generate
{
    "topic": "Launch of our new feature",
    "platforms": ["linkedin", "x", "instagram"],
    "tone": "professional",       // professional | casual | humorous | educational
    "context": "Optional additional context...",
    "generate_hashtags": true,
    "language": "en"
}

Response:
{
    "variants": {
        "linkedin": { "text": "...", "hashtags": [...] },
        "x": { "text": "...", "thread": null },
        "instagram": { "text": "...", "hashtags": [...] }
    },
    "tokens_used": 1250,
    "provider": "gemini",
    "model": "gemini-2.0-flash"
}
```

---

### 9.4 AI Image Generation Guardrails (Cost Control & Hard 5-Image Limit)

AI image generation (Gemini Imagen 3, OpenAI DALL-E 3) carries significant per-generation cost ($0.04–$0.08/image). If unconstrained, models generating 10–20 image variants will create runaway developer bills. The platform enforces multi-layered guardrails:

```
                  ┌────────────────────────────────────────────────────────┐
                  │                 User Image Request                     │
                  └───────────────────────────┬────────────────────────────┘
                                              │
                                              ▼
                  ┌────────────────────────────────────────────────────────┐
                  │      Subscription Check (users.usage vs plan limit)    │
                  │   - Free: 0 images   - Starter: 20   - Pro: 100/mo     │
                  └───────────────────────────┬────────────────────────────┘
                                              │ Allowed
                                              ▼
                  ┌────────────────────────────────────────────────────────┐
                  │     API Clamping: count = min(max(1, requested), 5)    │
                  └───────────────────────────┬────────────────────────────┘
                                              │
                                              ▼
                  ┌────────────────────────────────────────────────────────┐
                  │ System Prompt: "Under no circumstances generate or     │
                  │ return more than 5 images. Hard cap is 5 images."      │
                  └───────────────────────────┬────────────────────────────┘
                                              │
                                              ▼
                  ┌────────────────────────────────────────────────────────┐
                  │  FastAPI Worker: Imagen 3 / DALL-E 3 Execution         │
                  │  Upload to S3 -> Track in DB -> Decrement User Quota   │
                  └────────────────────────────────────────────────────────┘
```

1. **System Prompt Hard Constraint**:
   ```
   "SYSTEM INSTRUCTION: You are an expert social media visual designer.
   CRITICAL CONSTRAINT: You must generate and return at most 5 images per request.
   Under no circumstances generate more than 5 images, even if explicitly requested by the user prompt.
   If the user requests more than 5, produce the top 5 highest quality visual concepts only."
   ```

2. **Server-Side Clamp & Validation**:
   - In FastAPI:
     ```python
     @router.post("/generate-images")
     async def generate_images(req: ImageGenRequest, user: AuthUser = Depends(get_current_user)):
         # Enforce hard upper boundary of 5 images
         safe_count = min(max(1, req.count), 5)
         
         # Check subscription quota
         if user.images_generated_this_month + safe_count > user.monthly_image_limit:
             raise HTTPException(
                 status_code=402, 
                 detail="Monthly AI image generation limit exceeded. Upgrade your plan to generate more."
             )
         
         # Proceed with provider call passing clamped count
         images = await ai_engine.generate_images(prompt=req.prompt, count=safe_count)
         return { "images": images, "count": len(images) }
     ```

3. **Subscription-Tier Gating**:
   - **Free Plan**: 0 images/month (AI image generation button locked with upgrade prompt).
   - **Starter Plan**: 20 images/month.
   - **Pro Plan**: 100 images/month.
   - **Enterprise Plan**: Custom contract quota.
   - All usage is audited in `users.usage.ai_images_this_month` and reset on billing cycle anniversary.

---

### 9.5 Multi-Provider Subscription Architecture (Cashfree Primary + Razorpay Plug-in)

#### 1. Why Cashfree as Primary?
- **Razorpay Merchant KYC Requirement**: Razorpay requires verified Indian business merchant documents for live subscription autopay mandates, which blocks immediate live onboarding.
- **Cashfree Subscriptions API**: Allows faster onboarding, supports eMandate, UPI Autopay, and Card Recurring mandates across India with webhooks.
- **Pluggable Architecture**: Both gateways implement the unified `PaymentGatewayProvider` interface so PushPost can toggle between them seamlessly or support both simultaneously.

#### 2. Provider Abstraction Interface
```typescript
// modules/billing/providers/payment-gateway.interface.ts
export interface CreateSubParams {
    userId: string;
    customerEmail: string;
    customerPhone?: string;
    planId: string;
    gatewayPlanId: string;
    billingCycle: 'monthly' | 'yearly';
    returnUrl: string;
}

export interface PaymentGatewayProvider {
    readonly providerName: 'cashfree' | 'razorpay';
    
    // Mandate & Subscription Setup
    createSubscription(params: CreateSubParams): Promise<{
        subscriptionId: string;
        paymentLink?: string;
        sessionToken?: string;
    }>;
    
    // Webhook Processing
    verifyWebhookSignature(headers: Record<string, string>, rawBody: string | Buffer): boolean;
    processWebhookEvent(payload: any): Promise<{
        event: 'payment.success' | 'payment.failed' | 'subscription.active' | 'subscription.cancelled';
        subscriptionId: string;
        amountPaise: number;
        invoiceId?: string;
        rawData: any;
    }>;
    
    // Lifecycle Management
    cancelSubscription(gatewaySubId: string, cancelAtPeriodEnd: boolean): Promise<void>;
    changePlan(gatewaySubId: string, newGatewayPlanId: string): Promise<void>;
    getSubscriptionStatus(gatewaySubId: string): Promise<string>;
}
```

#### 3. Subscription Edge Cases & Resilient Handling

| Edge Case | Failure Scenario | Architectural Solution |
|-----------|------------------|------------------------|
| **Duplicate Webhooks** | Gateway delivers the same `PAYMENT_SUCCESS` webhook 2–3 times during network retries. | **Redis Idempotency Lock**: Check `idempotency:webhook:{gateway}:{event_id}` with 48h TTL. If exists, immediately return HTTP 200 without duplicate credit/renewal. |
| **Recurring Payment Failure** | User card expired or UPI bank down on billing cycle date. | **Grace Period & Dunning Management**: Status moved to `past_due`. App access remains active for 5 days grace period. BullMQ schedules 3 retry attempts (day 1, 3, 5). Brevo email triggers instant payment update link. After 5 days, downgraded to Free tier. |
| **Plan Upgrade / Downgrade** | User upgrades from Starter ($19) to Pro ($49) midway through month. | **Prorated Credits**: System calculates remaining days on current cycle: `prorated_refund = (days_left / total_days) * current_price`. Credits applied towards new invoice. |
| **User Initiates Cancellation** | User clicks cancel but has paid for 20 more days. | **Period-End Grace**: Sets `subscriptions.cancel_at_period_end = true`. Account remains active until `current_period_end`. No recurring charge is fired at period end. |
| **Mandate State Sync** | Bank confirms mandate 2 hours after checkout via webhook. | **Asynchronous Mandate Polling + Webhook**: Redis pub/sub notifies frontend on `subscription.active` webhook to update UI live. |
| **Gateway Switching** | Switching from Cashfree to Razorpay when merchant KYC completes. | **Zero-Downtime Multi-Gateway DB**: Subscriptions table stores `payment_gateway` column ('cashfree' \| 'razorpay'). Each subscription routes to its origin provider. |

---

---

## 10. API Route Structure

```
/api
├── /auth
│   ├── POST /register                    → Email/password registration
│   ├── POST /login                       → Email/password login
│   ├── POST /logout                      → Destroy session
│   ├── POST /refresh                     → Refresh JWT
│   ├── GET  /me                          → Current user
│   ├── POST /forgot-password             → Send reset email
│   ├── POST /reset-password              → Reset password
│   └── POST /verify-email                → Verify email token
│
├── /users
│   ├── GET  /me                          → Get profile
│   ├── PATCH /me                         → Update profile
│   ├── PATCH /me/password                → Change password
│   ├── PATCH /me/notifications           → Update notification prefs
│   ├── PATCH /me/ai-config               → Update AI/BYOK settings
│   └── DELETE /me                        → Deactivate account
│
├── /social-accounts
│   ├── GET  /                            → List connected accounts
│   ├── GET  /:platform/auth-url          → Get OAuth redirect URL
│   ├── GET  /:platform/callback          → OAuth callback handler
│   ├── GET  /:id                         → Account details
│   ├── DELETE /:id                       → Disconnect account
│   └── POST /:id/refresh                 → Force token refresh
│
├── /posts
│   ├── POST /                            → Create post (draft/scheduled/immediate)
│   ├── GET  /                            → List posts (paginated, filtered)
│   ├── GET  /:id                         → Post detail + targets + metrics
│   ├── PATCH /:id                        → Update draft/scheduled post
│   ├── DELETE /:id                       → Delete post
│   ├── POST /:id/publish                 → Publish now
│   ├── POST /:id/retry                   → Retry failed targets
│   └── GET  /:id/targets                 → List target results
│
├── /media
│   ├── POST /upload                      → Upload media file
│   ├── GET  /                            → List user's media
│   ├── GET  /:id                         → Media details
│   └── DELETE /:id                       → Delete media
│
├── /ai-content
│   ├── POST /generate                    → Generate content for platforms
│   ├── POST /rewrite                     → Rewrite/improve existing content
│   └── POST /hashtags                    → Generate hashtags
│
├── /analytics
│   ├── GET  /overview                    → Dashboard metrics
│   ├── GET  /posts                       → Post performance metrics
│   ├── GET  /platforms                   → Per-platform breakdown
│   └── GET  /engagement                  → Engagement trends
│
├── /notifications
│   ├── GET  /                            → List notifications (paginated)
│   ├── PATCH /:id/read                   → Mark as read
│   ├── POST /read-all                    → Mark all as read
│   ├── GET  /unread-count                → Unread count
│   └── GET  /stream                      → SSE real-time stream
│
├── /billing
│   ├── GET  /plans                       → List available plans
│   ├── GET  /subscription                → Current subscription
│   ├── POST /checkout                    → Create subscription
│   ├── POST /change-plan                 → Upgrade/downgrade
│   ├── POST /cancel                      → Cancel subscription
│   ├── GET  /invoices                    → Invoice history
│   └── POST /webhook                     → Payment gateway webhook
│
├── /api-keys
│   ├── POST /                            → Create API key
│   ├── GET  /                            → List API keys
│   └── DELETE /:id                       → Revoke API key
│
├── /admin (superadmin/admin only)
│   ├── GET  /dashboard                   → Platform stats
│   ├── GET  /users                       → List all users
│   ├── GET  /users/:id                   → User detail
│   ├── PATCH /users/:id                  → Update user (role, status)
│   ├── GET  /posts                       → All posts (platform-wide)
│   ├── GET  /social-accounts             → All connected accounts
│   ├── GET  /system/health               → System health
│   ├── GET  /system/queues               → BullMQ queue stats
│   ├── GET  /audit-logs                  → Audit trail
│   └── POST /system/announcements        → Send system notification
│
└── /health                               → Health check
```

---

## 11. Redis Usage Breakdown

| Purpose | Key Pattern | TTL | Data |
|---------|------------|-----|------|
| **Sessions** | `sess:{sid}` | 24h | User session JSON |
| **Rate Limiting** | `rl:{ip}:{route}` | 15min | Request counter |
| **OAuth State** | `oauth:{state}` | 10min | `{ platform, userId, returnUrl }` |
| **Email Verify** | `verify:{token}` | 24h | `{ userId }` |
| **Password Reset** | `reset:{token}` | 1h | `{ userId }` |
| **Pub/Sub Notifications** | `notifications:{userId}` | — | Real-time events |
| **BullMQ Queues** | `bull:{queueName}:*` | — | Job data |
| **Cache: User Profile** | `cache:user:{id}` | 5min | User JSON |
| **Cache: Plans** | `cache:plans` | 1h | Plans list |

---

## 12. Security Measures

| Concern | Implementation |
|---------|---------------|
| **Password hashing** | bcrypt, cost factor 12 |
| **Token encryption** | AES-256-GCM for OAuth tokens at rest |
| **Session security** | httpOnly, secure, sameSite=strict cookies |
| **JWT** | RS256 or HS256, 15-minute expiry |
| **Rate limiting** | express-rate-limit + Redis sliding window |
| **Input validation** | Zod schemas on all endpoints |
| **SQL injection** | Parameterized queries (pg library) |
| **XSS** | Content-Security-Policy headers, input sanitization |
| **CORS** | Strict origin allowlist |
| **CSRF** | Double-submit cookie pattern |
| **Helmet** | Security headers via helmet.js |
| **Request IDs** | UUID correlation ID on every request |
| **Audit logging** | All mutations logged with user, IP, action |

---

## 13. Environment Variables

```env
# App
NODE_ENV=development
PORT=4000
API_BASE_URL=http://localhost:4000
WEB_BASE_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000

# Database
DATABASE_URL=postgresql://pushpost:password@localhost:5432/pushpost
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=20

# Redis
REDIS_URL=redis://localhost:6379

# Session
SESSION_SECRET=<random-64-chars>
SESSION_MAX_AGE=86400000

# JWT
JWT_SECRET=<random-64-chars>
JWT_EXPIRES_IN=15m

# Token Encryption (32 bytes hex)
TOKEN_ENCRYPTION_KEY=<64-hex-chars>

# OAuth — LinkedIn
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_REDIRECT_URI=http://localhost:4000/api/social-accounts/linkedin/callback

# OAuth — Facebook
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_REDIRECT_URI=http://localhost:4000/api/social-accounts/facebook/callback

# OAuth — Instagram (uses Facebook app)
INSTAGRAM_REDIRECT_URI=http://localhost:4000/api/social-accounts/instagram/callback

# OAuth — Threads (uses Meta app)
THREADS_APP_ID=
THREADS_APP_SECRET=
THREADS_REDIRECT_URI=http://localhost:4000/api/social-accounts/threads/callback

# OAuth — X (Twitter)
X_CLIENT_ID=
X_CLIENT_SECRET=
X_REDIRECT_URI=http://localhost:4000/api/social-accounts/x/callback

# OAuth — Reddit
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_REDIRECT_URI=http://localhost:4000/api/social-accounts/reddit/callback

# AI Service
AI_SERVICE_URL=http://localhost:8000
AI_DEFAULT_PROVIDER=gemini

# Gemini
GEMINI_API_KEY=

# OpenAI
OPENAI_API_KEY=

# S3 / MinIO
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_BUCKET=pushpost-media
S3_REGION=us-east-1

# Brevo
BREVO_API_KEY=
BREVO_SENDER_EMAIL=noreply@pushpost.dev
BREVO_SENDER_NAME=PushPost

# Web Push
WEB_PUSH_VAPID_PUBLIC_KEY=
WEB_PUSH_VAPID_PRIVATE_KEY=
WEB_PUSH_CONTACT=mailto:admin@pushpost.dev
```

---

## 14. Docker Compose (Local Development)

```yaml
version: '3.8'

services:
  api:
    build: ./apps/api
    ports:
      - "4000:4000"
    env_file: .env
    depends_on:
      - postgres
      - redis
    volumes:
      - ./apps/api/src:/app/src

  ai-service:
    build: ./apps/ai-service
    ports:
      - "8000:8000"
    env_file: .env
    depends_on:
      - redis

  web:
    build: ./apps/web
    ports:
      - "3000:3000"
    env_file: .env
    depends_on:
      - api

  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: pushpost
      POSTGRES_PASSWORD: password
      POSTGRES_DB: pushpost
    volumes:
      - pg_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  minio:
    image: minio/minio:latest
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data

volumes:
  pg_data:
  redis_data:
  minio_data:
```

---

## 15. Implementation Phases

### Phase 1: Foundation (Week 1–2)
> **Engineering Priority**: Follow modular architecture and production-ready conventions.
- [ ] Monorepo scaffolding (`apps/api`, `apps/ai-service`, `apps/web`, `packages/shared-types`)
- [ ] Docker Compose orchestration (PostgreSQL 16, Redis 7, MinIO, API, Web, AI)
- [ ] PostgreSQL database schema & `node-pg-migrate` migrations (all 12 tables)
- [ ] Database seeders (plans, subscriptions, admin user)
- [ ] Express.js application core (Zod validation, Pino logger, error handling, correlation IDs)
- [ ] Redis session store (`express-session` + `connect-redis`)
- [ ] Dual Authentication System (HTTP-only session cookies + 15-minute JWT tokens)
- [ ] RBAC middleware (`superadmin`, `admin`, `user`)
- [ ] Brevo email integration (transactional HTML templates: welcome, verify, reset password)
- [ ] Health check and liveness/readiness probes

### Phase 2: Social Account Integration & Connection Wizards (Week 3–4)
- [ ] In-App Step-by-Step Connection Guides & Wizards for all 6 platforms
- [ ] Instagram setup wizard (Professional account, FB Page linking, Meta App review guidance)
- [ ] OAuth 2.0 PKCE flow for X (Twitter) with cost disclosure acknowledgment
- [ ] OAuth 2.0 flows for LinkedIn, Facebook, Threads, Reddit
- [ ] AES-256-GCM token encryption & decryption at rest
- [ ] Social account CRUD endpoints & management UI
- [ ] BullMQ background cron job for automatic token refresh

### Phase 3: Posting & Publishing Engine (Week 5–6)
- [ ] Post CRUD with multi-platform targets
- [ ] Media upload pipeline (Multer + MinIO/S3 with signed URLs and thumbnailing)
- [ ] BullMQ publisher worker with exponential backoff retries
- [ ] Platform publishers (LinkedIn, Facebook, Instagram Container, Threads Container, X v2, Reddit)
- [ ] Post scheduling via delayed BullMQ jobs
- [ ] Real-time post status updates via Redis Pub/Sub + SSE

### Phase 4: AI Content & Image Generation (Week 7)
> **Cost Protection Priority**: Strict model prompt instructions and API-level clamping to **MAX 5 images**.
- [ ] Python FastAPI AI service setup
- [ ] Gemini & OpenAI provider abstraction (`AIProvider`)
- [ ] Platform-specific text prompt templates (tone, character limits, hashtags)
- [ ] **AI Image Generation Engine (Gemini Imagen 3 / OpenAI DALL-E 3)**:
  - [ ] Strict system prompt instruction: *"You must NEVER generate or output more than 5 images under any circumstances."*
  - [ ] API-level hard clamp: `count = min(max(1, requested), 5)` to strictly block runaway requests
  - [ ] Subscription gating: 0 images for Free, 20/mo for Starter, 100/mo for Pro
  - [ ] Monthly quota tracking in `users.usage.ai_images_this_month` with automatic cycle resets
  - [ ] Token and compute unit cost accounting logged per request
- [ ] BYOK (Bring Your Own Key) support for power users

### Phase 5: Frontend — Core & UI Design System (Week 8–10)
> **Design Excellence**: Built using **ChaiUI (`ui.chaicode.com` shadcn registry)** + TailwindCSS + Aceternity UI.
- [ ] Next.js 14 App Router scaffolding with ChaiUI component registry and design tokens
- [ ] Dark-mode-first aesthetic: clean cards, typography (Manrope/Inter), refined borders, fluid micro-interactions
- [ ] Responsive dashboard shell (collapsible sidebar, command menu, breadcrumbs, mobile drawer)
- [ ] In-App Interactive Setup Wizard modal for social account connections (especially Instagram & X)
- [ ] Rich Compose Studio:
  - [ ] Live preview cards for all 6 social platforms
  - [ ] Real-time URL detector with dynamic **X Paid Platform Cost Badge** ($0.015 base / $0.20 with links)
  - [ ] AI Content generation panel & Image generator (with max 5 image selector)
  - [ ] Media uploader with drag-and-drop & aspect ratio preview
  - [ ] Visual calendar scheduling picker
- [ ] Posts management list (filterable by status, platform, date, search)
- [ ] Real-time notification drawer via SSE connection

### Phase 6: Subscriptions, Billing & Advanced Integrations (Week 11–13)
> **Payment Reliability**: Cashfree primary recurring subscription engine with pluggable Razorpay fallback.
- [ ] Unified `PaymentGatewayProvider` abstraction
- [ ] **Cashfree Subscriptions Integration (Primary)**:
  - [ ] Plan creation & subscription hosted checkout
  - [ ] Mandate activation (eMandate, UPI Autopay, Card Tokenization)
  - [ ] Webhook signature verification and Redis-based idempotency handling (replay protection)
  - [ ] Dunning management & payment failure recovery (5-day grace period, 3 BullMQ retries, Brevo notification)
  - [ ] Prorated plan upgrades and downgrades
  - [ ] Period-end cancellation vs immediate cancellation
- [ ] **Razorpay Plug-in (Secondary)**: Ready for activation once merchant KYC is approved
- [ ] In-App Paid Platform Settings (user toggle to opt-in/out of X and paid services)
- [ ] Credit wallet & metered usage billing for pass-through costs
- [ ] Analytics dashboard (impressions, clicks, engagement breakdown by platform)
- [ ] Superadmin management portal (user controls, plan management, queue health, audit logs)

### Phase 7: Polish, Observability & Production Deployment (Week 14–15)
- [ ] Production Docker Compose + Nginx reverse proxy (SSL, Brotli, security headers)
- [ ] GitHub Actions CI/CD pipeline
- [ ] Comprehensive E2E tests for auth, post publishing, and webhook reconciliation
- [ ] Redis rate-limiting fine-tuning & DDoS protection
- [ ] Production deployment & verification

---

## 16. Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Module-based structure** | `src/modules/{name}/` with co-located routes, controller, service, repo | Better cohesion than flat folders. Each module is self-contained. |
| **BullMQ over Redis Pub/Sub** for jobs | BullMQ | Persistence, retries, priorities, cron scheduling, dead letter queues. Redis Pub/Sub is fire-and-forget — not suitable for publishing jobs that MUST succeed. |
| **Redis Pub/Sub** for real-time | SSE via Redis Pub/Sub | Lightweight, no WebSocket overhead. Notifications don't need bidirectional communication. |
| **Zod** for validation | Zod | TypeScript-first, composable, great error messages. Works on both client and server. |
| **node-pg-migrate** over Sequelize | Raw SQL migrations | Full control over DDL. No ORM overhead. Queries use raw pg. |
| **AES-256-GCM** for token encryption | Industry standard | Authenticated encryption. Prevents tampering. IV per encryption for uniqueness. |
| **Container model** for Insta/Threads | Required by Meta API | Create container → poll status → publish. Must handle async processing. |
| **BYOK as optional** | User provides their own API key | Allows power users to use their own AI quota. Decrypted only at generation time. |

---

> [!IMPORTANT]
> **Ready to start implementation.** Phase 1 (Foundation) is the immediate next step. Should I begin scaffolding the project?
