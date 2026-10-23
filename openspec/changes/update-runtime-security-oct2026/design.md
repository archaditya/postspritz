# Design

## Context

See `proposal.md` for background and vulnerability analysis.
PostSpritz runs microservices in Docker:
- `apps/api`: Express.js backend with TypeScript, BullMQ, Redis, PostgreSQL, Firebase Admin.
- `apps/web`: Next.js 14 App Router frontend with React 18, TailwindCSS.
- `apps/ai-service`: FastAPI Python service invoking Gemini/OpenAI models using `requests` and client SDKs.

Both the API and Web Dockerfiles are currently pinned to `node:20-alpine`, which is End-of-Life and unpatched against critical October 2026 advisories.

## Goals / Non-Goals

**Goals:**
- Eliminate exposure to CVE-2026-111497 ("Node2Shell" Brotli RCE) and TLS hostname bypasses by upgrading base container images to patched Node.js 22 LTS (`node:22-alpine`).
- Keep TypeScript compile-time environment aligned with the runtime by upgrading `@types/node` to `^22.x.x`.
- Safeguard Python outbound HTTPS requests against the October 2026 CA trust compromise by pinning `certifi>=2026.10.19`.
- Maintain zero breaking changes to existing application code, database migrations, or Docker compose configs.

**Non-Goals:**
- Upgrading major framework versions (e.g. Next.js 14 to Next.js 15 or Express 4 to 5) — existing frameworks are already compatible with Node 22.
- Refactoring `apps/ai-service` architecture or models.

## Decisions

### 1. Upgrade base images to Node.js 22 LTS (`node:22-alpine`)
- **Choice**: Upgrade both base and prod stages in `apps/api/Dockerfile` and `apps/web/Dockerfile` from `node:20-alpine` to `node:22-alpine`.
- **Rationale**: Node.js 22 (Jod) is an active Long Term Support (LTS) release receiving regular security maintenance, with official patch version `v22.23.4+` resolving all October 2026 advisories. It offers identical musl Alpine package characteristics while guaranteeing compatibility with Next.js 14.2 and Express 4.19.
- **Alternatives Considered**:
  - *Node 24 LTS*: Also safe (`v24.22.1+`), but Node 22 has significantly more runtime maturity and wider library ecosystem testing with Next 14.
  - *Node 26 Current*: Not LTS; short lifecycle and potential breaking changes in native dependencies.

### 2. Update `@types/node` to `^22.13.0`
- **Choice**: Update devDependency in both `apps/api/package.json` and `apps/web/package.json`.
- **Rationale**: Aligns static TypeScript type checking with available Node 22 runtime globals and standard library APIs.

### 3. Pin `certifi>=2026.10.19` in `apps/ai-service/requirements.txt`
- **Choice**: Add `certifi>=2026.10.19` to `requirements.txt`.
- **Rationale**: Python's `requests` library uses `certifi`'s CA trust store by default. This ensures untrusted/compromised CAs (eMudhra / emSign) are excluded from TLS validation for outbound model API calls.

## Risks / Trade-offs

- **[Risk] Docker build cache using stale base image layers** → **Mitigation**: Run builds with `--no-cache` or `docker compose build --pull` during verification to ensure the newest `node:22-alpine` image is pulled.
- **[Risk] Next.js 14 compilation warning or incompatibility with Node 22** → **Mitigation**: Next.js 14 officially supports Node.js 18.17+ through Node 22. Local build verification ensures no regressions.

## Migration Plan

1. Update `apps/api/Dockerfile` and `apps/web/Dockerfile`.
2. Update `@types/node` in `apps/api/package.json` and `apps/web/package.json`.
3. Add `certifi>=2026.10.19` in `apps/ai-service/requirements.txt`.
4. Rebuild images and run container smoke tests (`npm run build`, `npm run dev:api`, `npm run dev:web`).
