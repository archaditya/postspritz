# Design: Production Readiness and Compliance

## Context

PostSpritz is deployed via Docker Compose on a single-node Linux VPS where a host-level reverse proxy (e.g., Nginx, Caddy, or Traefik) handles TLS termination for the domain and passes traffic to the application stack.

To satisfy production operational requirements and comply with the Digital Personal Data Protection (DPDP) Act 2023, IT Rules, and Consumer Protection (E-Commerce) Rules:
1. All inter-service communications must be contained within Docker's private bridge network, exposing strictly the Next.js web application on port 3000.
2. The AI content generation microservice (`apps/ai-service`) must be containerized and wired into the internal network.
3. OAuth initiation routing and default free-tier provisioning must operate seamlessly.
4. Compliance pages, consent-first forms, cookie controls, and grievance disclosures must be integrated into the web client.

## Goals / Non-Goals

**Goals:**
- Zero host port leaks: Only port 3000 is published to the host operating system.
- Containerize `apps/ai-service` and integrate it with `docker-compose.prod.yml`.
- Fix social account connection route incompatibility between frontend and backend.
- Automatically provision an active `free` tier subscription for newly registered users.
- Deliver full compliance under the Rinisha Checklist (Privacy Policy, Terms, Refund Policy, Grievance Officer, Cookie Consent, Age Verification, DPDP user rights).

**Non-Goals:**
- Building multi-region orchestration or Kubernetes manifests (single VPS compose setup is sufficient).
- Redesigning payment gateway integrations (Cashfree/Razorpay remains available for subsequent phase).
- Altering existing BullMQ queue architectures or provider publishing logic.

## Architecture & Decisions

### 1. Hardened Docker Compose Networking

```
+-------------------------------------------------------------+
| HOST (VPS)                                                  |
|   Host Reverse Proxy (Nginx/Caddy) --> localhost:3000       |
+-------------------------------------------------------------+
                               |
                               v (Only Port 3000 Published)
+-------------------------------------------------------------+
| DOCKER BRIDGE NETWORK (postspritz_internal)                 |
|                                                             |
|   [web:3000] (Next.js 14)                                   |
|       |                                                     |
|       +--> internal HTTP proxy: http://api:4000             |
|                                                             |
|   [api:4000] (Express Node.js)                              |
|       +--> http://ai-service:8000                           |
|       +--> postgres:5432                                    |
|       +--> redis:6379                                       |
|                                                             |
|   [ai-service:8000] (FastAPI Python 3.11)                   |
|   [postgres:5432]   (PostgreSQL 16)                         |
|   [redis:6379]      (Redis 7)                               |
+-------------------------------------------------------------+
```

- **Choice**: In `docker-compose.prod.yml`, remove all host port mappings except `3000:3000` on the `web` container. Use `expose: ["4000"]` for API, `expose: ["8000"]` for AI service, and internal-only bindings for Postgres and Redis.
- **Rationale**: Completely isolates database, cache, internal APIs, and AI models from public internet scanning or external port exhaustion.

### 2. AI Service Containerization (`apps/ai-service/Dockerfile`)

- **Choice**: Multi-stage Python 3.11-slim container.
  - Install dependencies from `requirements.txt` with cache clean-up.
  - Run as non-root user (`appuser`).
  - Command: `uvicorn main:app --host 0.0.0.0 --port 8000`.
- **Environment**: Set `AI_SERVICE_URL=http://ai-service:8000` in `docker-compose.prod.yml` for the `api` container.

### 3. Social Connect Routing Resolution

- **Choice**: Add `router.get('/connect/:platform', authenticate, controller.getAuthUrl)` and `router.get('/:platform/connect', authenticate, controller.getAuthUrl)` to `apps/api/src/modules/social-accounts/social-accounts.routes.ts`.
- **Rationale**: Maintains backwards compatibility with both `useAccounts.ts` (`apiClient.get('/social-accounts/connect/${platform}')`) and any direct callers of `/:platform/auth-url`.

### 4. Automatic Free Tier Provisioning

- **Choice**: In `AuthService.register` and `AuthService.googleLogin`:
  - Query `SELECT id FROM plans WHERE name = 'free' LIMIT 1`.
  - Insert a record into `subscriptions`:
    `INSERT INTO subscriptions (user_id, plan_id, payment_gateway, gateway_subscription_id, status, billing_cycle, current_period_start, current_period_end) VALUES ($1, $2, 'free', 'sub_free_' || $1, 'active', 'monthly', NOW(), NOW() + INTERVAL '100 years') ON CONFLICT DO NOTHING`.
- **Rationale**: Ensures `LEFT JOIN subscriptions` in queries always returns plan quotas (`max_posts_per_month`, `max_social_accounts`, etc.), eliminating fallback ambiguity.

### 5. Legal & Regulatory Compliance Architecture (DPDP & Rinisha Checklist)

1. **Policy Pages**:
   - `/privacy`: Follows Section 5 of DPDP Act 2023. Explicitly details types of data collected (OAuth tokens, names, emails, IPs, prompts, post text), retention period (active account + 30-day soft-delete grace), third-party data processors (Meta, LinkedIn, X, Brevo, Firebase, Cloudflare R2), AES-256 encryption practices, and Data Protection Board escalation.
   - `/terms`: Includes automated posting compliance, pass-through API costs disclaimer, acceptable use, user-generated content responsibility, and Indian jurisdiction (Bengaluru courts).
   - `/refund`: Transparent rules on prepaid wallet credits and plan cancellations.
2. **Consent-First Onboarding**:
   - `/register` includes two non-pre-ticked checkboxes:
     - Checkbox 1 (Mandatory): "I confirm I am 18 years of age or older and agree to the Terms of Service and Privacy Policy."
     - Checkbox 2 (Optional): "I agree to receive product updates and release notes via email."
3. **Cookie Banner & Consent Management (`CookieBanner.tsx`)**:
   - Banner displays on first visit with three options: `Accept All`, `Reject Non-Essential`, `Cookie Settings`.
   - Choice stored in `localStorage` under `postspritz_cookie_consent`.
   - Footer contains a "Cookie Settings" button to let users update preferences at any time.
4. **Grievance Officer Transparency**:
   - Prominently displays:
     - Name: Grievance Officer, PostSpritz Inc.
     - Email: `grievance@postspritz.com`
     - Response SLA: Acknowledgment within 48 hours, resolution within 30 days (DPDP s.8(9)).
   - Displayed in footer (`SiteChrome.tsx`) and `/contact`.
5. **Right to Erasure (DPDP s.8(7) & s.11–14)**:
   - Add a "Delete Account & Purge Data" action in `/dashboard/settings` that confirms and invokes `DELETE /api/users/me`, triggering `DataRetentionService.softDeleteUser`.

## Risks / Trade-offs

- **[Risk] Docker build failure if Python dependencies are slow to install** → **Mitigation**: Pin lightweight dependencies in `requirements.txt` and leverage Docker layer caching.
- **[Risk] Cookie banner blocking UI on mobile** → **Mitigation**: Fixed bottom-sheet drawer with subtle semi-transparent backdrop and one-click dismissal.
