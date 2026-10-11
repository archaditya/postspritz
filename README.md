# PostSpritz 🚀
> **Create once. Spritz everywhere.**  
> Autonomous multi-channel social media scheduler, AI visual director, and real-time observability platform.

---

## 🌟 Key Features

- **Multi-Platform Publishing**: Simultaneously orchestrate and publish posts to Instagram, Facebook Pages, Threads, LinkedIn, X (Twitter), and Reddit.
- **AI Content Director**: Generate high-converting captions, viral hooks, and auto-curated hashtags using Gemini / OpenAI models or personal BYOK API keys.
- **Platform Governance & Observability**: Real-time admin console featuring BullMQ worker queue telemetry, live circuit breaker monitors, security audit trail, and user management.
- **Promotional & FCM Broadcast Center**: Dual-channel notification dispatch system supporting WebPush (Firebase Cloud Messaging) and realtime In-App SSE alerts.
- **Token Auto-Refresh Pipeline**: Background BullMQ cron workers running every 6 hours to automatically exchange expiring OAuth tokens (Facebook 60-day user tokens, Threads, LinkedIn).
- **Creator Fuel Wallet**: Flexible micropayment wallet for AI generations and platform gas fees.
- **Security & Dual Auth**: Multi-device JWT authentication, secure session cookies, AES-256-GCM encrypted API key storage, and full password recovery/change flows.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend Web** | Next.js 14 (App Router), React 18, Tailwind CSS, Lucide Icons, TanStack Query |
| **API Backend** | Node.js, Express, TypeScript, Zod, BullMQ, Redis, PostgreSQL 16 |
| **Cloud & Media** | Firebase Cloud Messaging (WebPush), Cloudflare R2 / S3 Object Storage |
| **Containerization**| Docker, Docker Compose |

---

## 🚀 Getting Started

### 1. Prerequisites
- Docker & Docker Desktop
- Node.js 20+

### 2. Environment Configuration
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

### 3. Spin Up With Docker Compose
```bash
docker compose -f docker-compose.local.yml up -d --build
```

- **Web Dashboard**: [http://localhost:3000](http://localhost:3000)
- **API Health Check**: [http://localhost:4000/health](http://localhost:4000/health)
- **Admin Governance Hub**: [http://localhost:3000/dashboard/admin](http://localhost:3000/dashboard/admin)
