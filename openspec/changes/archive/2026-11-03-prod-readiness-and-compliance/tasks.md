# Tasks: Production Readiness and Compliance

## 1. Docker Compose & Containerization

- [x] 1.1 Create `apps/ai-service/Dockerfile` based on `python:3.11-slim` with non-root user and Uvicorn entrypoint
- [x] 1.2 Update `docker-compose.prod.yml` to include the `ai-service` container on internal port 8000
- [x] 1.3 Configure network port bindings in `docker-compose.prod.yml` so that ONLY the `web` container publishes port `3000:3000` to the host, while `api`, `ai-service`, `postgres`, and `redis` remain internal
- [x] 1.4 Wire `AI_SERVICE_URL=http://ai-service:8000` into `docker-compose.prod.yml` for the API service

## 2. API Routing & Free Tier Auto-Enrollment

- [x] 2.1 Add route aliases `GET /connect/:platform` and `GET /:platform/connect` in `apps/api/src/modules/social-accounts/social-accounts.routes.ts`
- [x] 2.2 Update `AuthService.register` and `AuthService.googleLogin` in `apps/api/src/modules/auth/auth.service.ts` to automatically provision an active `free` tier subscription for new accounts

## 3. Mandatory Compliance Pages

- [x] 3.1 Create DPDP Act 2023 compliant Privacy Policy at `apps/web/app/privacy/page.tsx` detailing data collected, retention schedule, third-party processors, and DPDP rights
- [x] 3.2 Create Terms & Conditions at `apps/web/app/terms/page.tsx` covering automated posting guidelines, pass-through API billing, liability limits, and Indian jurisdiction
- [x] 3.3 Create Refund & Cancellation Policy at `apps/web/app/refund/page.tsx` detailing wallet balances and subscription cancellations

## 4. Consent-First Registration & Age Gating

- [x] 4.1 Update `apps/web/app/register/page.tsx` to include mandatory 18+ age declaration checkbox (DPDP Section 9)
- [x] 4.2 Add mandatory non-pre-ticked Terms & Privacy Policy consent checkbox and separate optional marketing consent opt-in on `apps/web/app/register/page.tsx`

## 5. Cookie Consent & Footer Transparency

- [x] 5.1 Create `apps/web/components/CookieBanner.tsx` with Accept All, Reject Non-Essential, and Cookie Settings controls persisting to `localStorage`
- [x] 5.2 Mount `CookieBanner` into `apps/web/components/providers.tsx` or `PublicChrome.tsx`
- [x] 5.3 Update `apps/web/components/SiteChrome.tsx` footer to include links to Privacy, Terms, Refund, Cookie Settings trigger, and Grievance Officer details (with 48h SLA)
- [x] 5.4 Update `apps/web/app/contact/page.tsx` with Grievance Officer information and complaint procedure

## 6. DPDP Right to Erasure Self-Service

- [x] 6.1 Add Account Deletion / Data Erasure section with confirmation modal in `apps/web/app/dashboard/settings/page.tsx` triggering `DELETE /api/users/me`

## 7. Verification

- [x] 7.1 Verify shared types, API, and Web builds (`npm run build:types`, `npm run --workspace=apps/api build`, `npm run --workspace=apps/web build`)
- [x] 7.2 Validate Docker compose file syntax with `docker compose -f docker-compose.prod.yml config`
