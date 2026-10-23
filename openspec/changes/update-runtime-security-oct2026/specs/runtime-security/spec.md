# Spec Delta

## Purpose

Defines security baseline requirements for application container runtimes and TLS certificate trust verification across microservices.

## ADDED Requirements

### Requirement: Supported Node.js Runtime Baseline
All Node.js application containers SHALL run on active, patched Long Term Support (LTS) versions (minimum Node.js v22.23.4 / Node 22 LTS) to prevent Brotli decompression and TLS verification vulnerabilities.

#### Scenario: Production and development container builds
- **WHEN** the API or Web container images are built
- **THEN** the base image utilizes an active Node.js 22 LTS Alpine distribution

#### Scenario: Application startup and health checks
- **WHEN** the containers start in development or production
- **THEN** the server initializes successfully without runtime deprecation or compatibility failures

### Requirement: Validated TLS Trust Store for Python Services
Python services making outbound HTTPS requests to external APIs SHALL enforce an up-to-date certificate authority bundle that rejects compromised root certificates.

#### Scenario: External API communication from AI service
- **WHEN** the AI microservice performs outbound HTTPS requests to AI model providers
- **THEN** the HTTP client utilizes a certifi certificate bundle dated 2026.10.19 or later to validate server identities
