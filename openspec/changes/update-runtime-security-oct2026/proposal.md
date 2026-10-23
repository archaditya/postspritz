# Proposal

## Why

On October 21–22, 2026, critical security advisories were published affecting Node.js and the Python trust ecosystem:
- Node.js disclosed 10 vulnerabilities including High-severity CVE-2026-111497 (Brotli decoder out-of-bounds write / Remote Code Execution "Node2Shell") and TLS verification bypasses (CVE-2026-105483, CVE-2026-106069). Node.js 20 reached End-of-Life (EOL) and received no upstream patch.
- Python security updates addressed a Certificate Authority compromise (eMudhra / emSign) by bundling `pip>=26.2.2` with `certifi>=2026.10.19` to prevent Man-in-the-Middle (MitM) TLS interception. Python 3.10 reached EOL.

Updating PostSpritz container runtimes and dependencies to patched versions eliminates these critical vulnerabilities.

## What Changes

- **Update Docker base images**: Upgrade `apps/api/Dockerfile` and `apps/web/Dockerfile` from `node:20-alpine` to `node:22-alpine` (providing patched Node.js >= 22.23.4).
- **Update TypeScript Node definitions**: Update `@types/node` in `apps/api/package.json` and `apps/web/package.json` from `^20.14.9` to `^22.x.x`.
- **Enforce secure CA certificates in Python AI service**: Pin `certifi>=2026.10.19` in `apps/ai-service/requirements.txt` to safeguard external HTTPS model API calls against compromised CA certificates.
- **Verify build and service health**: Ensure container builds succeed and services start cleanly under Node.js 22 LTS.

## Capabilities

### New Capabilities
- `runtime-security`: Defines requirements for secure container runtime baselines, supported active LTS runtime versions, and CA certificate validation across microservices.

### Modified Capabilities
None (the project currently has no previous specs declared).

## Impact

- **Affected Dockerfiles**: `apps/api/Dockerfile`, `apps/web/Dockerfile`
- **Affected Packages**: `apps/api/package.json`, `apps/web/package.json`, `apps/ai-service/requirements.txt`
- **Compatibility**: Node.js 22 LTS maintains full backwards compatibility with Express 4.x and Next.js 14.x. No breaking changes to existing application logic or APIs.
