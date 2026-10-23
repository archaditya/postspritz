# Tasks

## 1. Container Base Image Updates

- [x] 1.1 Update `apps/api/Dockerfile` base and prod stages from `node:20-alpine` to `node:22-alpine` and verify file changes
- [x] 1.2 Update `apps/web/Dockerfile` base and prod stages from `node:20-alpine` to `node:22-alpine` and verify file changes

## 2. Dependency & Trust Store Updates

- [x] 2.1 Update `@types/node` in `apps/api/package.json` to `^22.13.0` and verify JSON syntax
- [x] 2.2 Update `@types/node` in `apps/web/package.json` to `^22.13.0` and verify JSON syntax
- [x] 2.3 Pin `certifi>=2026.10.19` in `apps/ai-service/requirements.txt` to enforce safe TLS trust stores

## 3. Build & Runtime Verification

- [x] 3.1 Run TypeScript compilation for shared types (`npm run build:types`) and API (`npm run --workspace=apps/api build`) to verify compilation on Node 22 types
- [x] 3.2 Run Web frontend build (`npm run --workspace=apps/web build`) to verify Next.js build clean execution
- [x] 3.3 Validate the OpenSpec change status using `openspec validate update-runtime-security-oct2026`
