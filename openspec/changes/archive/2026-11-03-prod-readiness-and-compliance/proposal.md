# Proposal: Production Readiness and Compliance

## Why

PostSpritz is preparing for public launch where users can register, connect social accounts, generate AI-assisted content, and dispatch posts under a free starter tier (with admin-assignable upgrades).

However, an audit revealed critical operational and compliance blockers:
1. **Network & Containerization Gaps**: `docker-compose.prod.yml` lacks the `apps/ai-service` container, causing AI generations to fail or revert to circuit-breaker fallbacks. Container network boundaries must be hardened so *only* the web container's port is accessible to the host/reverse proxy, keeping `api`, `ai-service`, `postgres`, and `redis` strictly internal.
2. **Social Connect Route Mismatch**: `apps/web/lib/hooks/useAccounts.ts` requests `GET /api/social-accounts/connect/:platform`, but the backend only provides `/:platform/auth-url`, causing a 404 error that prevents users from linking accounts.
3. **Onboarding Quota Alignment**: Users registering without an existing plan are not auto-enrolled into the active `free` tier plan, leaving subscription status unresolved until an admin manually assigns one.
4. **Legal & Regulatory Non-Compliance**: Under the Indian Digital Personal Data Protection (DPDP) Act 2023, DPDP Rules 2025, and Consumer Protection (E-Commerce) Rules (per the Rinisha Website Compliance Checklist), the website lacks mandatory privacy disclosures, terms of service, refund policy, cookie consent controls, grievance officer identification, and minor (<18) protection safeguards.

## What Changes

1. **Production Docker Compose & Containerization**:
   - Containerize `apps/ai-service` with a lean Python Dockerfile.
   - Update `docker-compose.prod.yml` to run `web`, `api`, `ai-service`, `postgres`, and `redis` on a dedicated internal network.
   - Publish **only** the `web` port (`3000:3000`) to the host. Services communicate internally via Docker DNS (`http://api:4000`, `http://ai-service:8000`, `redis:6379`, `postgres:5432`).
2. **Social Account Routing Fix**:
   - Add alias routes (`GET /connect/:platform` and `GET /:platform/connect`) in `apps/api/src/modules/social-accounts/social-accounts.routes.ts` to seamlessly handle frontend connect calls.
3. **Automated Free Tier Assignment**:
   - Update `AuthService.register` and `AuthService.googleLogin` to immediately create a `free` subscription in PostgreSQL for newly registered users.
4. **Rinisha Compliance & DPDP Implementation**:
   - **Privacy Policy (`/privacy`)**: Disclose collected personal data, OAuth token handling, retention rules, third-party processors, and DPDP s.11–14 user rights.
   - **Terms & Conditions (`/terms`)**: Define acceptable usage, automated posting rules, liability limitations, pass-through API billing disclaimers, and Indian governing law.
   - **Refund & Cancellation Policy (`/refund`)**: Detail wallet credit usage and subscription refund boundaries.
   - **Grievance Officer Information**: Display officer name, email, and 48-hour SLA in footer and `/contact`.
   - **Consent-First Registration (`/register`)**: Introduce non-pre-ticked agreement, explicit age verification (18+ declaration under DPDP s.9), and separate optional marketing consent.
   - **Cookie Consent Banner (`CookieBanner.tsx`)**: Implement banner with Accept, Reject Non-Essential, and Cookie Settings options, persisting choice in localStorage and providing a footer re-trigger.
   - **Right to Erasure Self-Service**: Wire user settings UI to trigger existing `DataRetentionService.softDeleteUser`.

## Capabilities

### New Capabilities
- `prod-infrastructure`: Internal container networking exposing solely the web tier, with containerized Python AI microservice.
- `legal-compliance`: DPDP Act 2023 and Consumer Protection compliance including policy pages, grievance redressal, age gating, cookie preferences, and consent logging.
- `frictionless-onboarding`: Automated free plan provisioning and working social connection handshakes.

### Modified Capabilities
- `social-accounts`: OAuth initiation endpoint aliases.
- `auth`: Registration and OAuth signup subscription provisioning.

## Impact

- **Docker Config**: `docker-compose.prod.yml`, `apps/ai-service/Dockerfile`
- **Backend API**: `apps/api/src/modules/social-accounts/social-accounts.routes.ts`, `apps/api/src/modules/auth/auth.service.ts`
- **Frontend Web**: `apps/web/app/privacy/page.tsx`, `apps/web/app/terms/page.tsx`, `apps/web/app/refund/page.tsx`, `apps/web/app/register/page.tsx`, `apps/web/components/SiteChrome.tsx`, `apps/web/components/CookieBanner.tsx`, `apps/web/app/dashboard/settings/page.tsx`
