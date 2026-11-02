# Spec Delta: Production Readiness and Compliance

## Purpose

Defines requirements for container isolation, AI microservice containerization, OAuth connection route compatibility, automated free plan provisioning, and Indian DPDP Act 2023 / E-Commerce compliance.

## ADDED Requirements

### Requirement: Internal-Only Production Container Isolation
In the production environment, the web container port SHALL be the only port published to the host operating system. All supporting containers (`api`, `ai-service`, `postgres`, `redis`) SHALL communicate exclusively over internal Docker bridge networks without host port exposure.

#### Scenario: Production container port exposure
- **WHEN** `docker-compose.prod.yml` is launched
- **THEN** only port 3000 (web) is published to the host
- **AND** port 4000 (api), port 8000 (ai-service), port 5432 (postgres), and port 6379 (redis) are unreachable directly from the host

#### Scenario: Internal inter-service communication
- **WHEN** the web container proxies an API request or the API communicates with PostgreSQL, Redis, or AI service
- **THEN** communication succeeds using internal container DNS names (`api:4000`, `postgres:5432`, `redis:6379`, `ai-service:8000`)

---

### Requirement: Containerized AI Microservice Integration
The Python FastAPI content generation service SHALL be containerized and included as an active service within `docker-compose.prod.yml`, accepting requests on internal port 8000.

#### Scenario: Production AI text and visual prompt generation
- **WHEN** a user requests post text or image prompt generation from the API
- **THEN** the request reaches `http://ai-service:8000` internally and returns valid model variants without triggering circuit-breaker fallback errors

---

### Requirement: Social Account Connection Route Compatibility
The API backend SHALL accept social account authorization initiation via both `GET /api/social-accounts/:platform/auth-url` and `GET /api/social-accounts/connect/:platform`.

#### Scenario: User clicks Connect in web dashboard
- **WHEN** the frontend invokes `GET /api/social-accounts/connect/:platform`
- **THEN** the API returns a 200 response containing `{ url: string }` with the platform's OAuth authorization redirect URL

---

### Requirement: Automated Free Starter Plan Provisioning
When a new user registers through standard email/password or Google OAuth, the system SHALL automatically create an active subscription entry bound to the `free` tier plan.

#### Scenario: New user signs up
- **WHEN** a new user account is created in `AuthService.register` or `AuthService.googleLogin`
- **THEN** an active record in the `subscriptions` table is generated associating the user with the `free` plan
- **AND** the user's quota counters (`max_posts_per_month: 30`, `max_social_accounts: 3`, `max_ai_generations: 20`) are immediately available without manual administrator intervention

---

### Requirement: Mandatory Legal and Compliance Pages
The web application SHALL publish dedicated, accessible compliance pages:
1. Privacy Policy (`/privacy`) complying with Section 5 of the DPDP Act 2023.
2. Terms & Conditions (`/terms`) detailing automated social dispatch rules, pass-through API billing, and limitation of liability.
3. Refund & Cancellation Policy (`/refund`) clarifying wallet balances and subscription terms.

#### Scenario: User visits legal pages
- **WHEN** a visitor navigates to `/privacy`, `/terms`, or `/refund`
- **THEN** the page renders clear, comprehensive policies with a "Last Updated" date and Grievance Officer contact information
- **AND** links to all three pages are prominently visible in the footer of every page

---

### Requirement: Consent and Age Verification in Onboarding
The user registration page SHALL enforce non-pre-ticked affirmative consent, including an explicit declaration confirming the user is 18 years of age or older (DPDP Act Section 9).

#### Scenario: Minor or non-consenting user registration
- **WHEN** a user attempts to submit the registration form without checking the age confirmation (18+) or terms/privacy agreement
- **THEN** the form prevents submission and displays a clear validation requirement

#### Scenario: Consent metadata logging
- **WHEN** a user completes registration
- **THEN** the system logs user consent with timestamp, terms version, and IP address for audit compliance

---

### Requirement: Cookie Consent Banner and Settings Control
The web application SHALL display a cookie notice on initial visit providing equally prominent options: `Accept All`, `Reject Non-Essential`, and `Cookie Settings`.

#### Scenario: First visit to site
- **WHEN** a new visitor loads any public page
- **THEN** the cookie consent banner is displayed
- **AND** selecting `Reject Non-Essential` or `Accept All` persists the choice and hides the banner

#### Scenario: Revisiting cookie preferences
- **WHEN** a visitor clicks "Cookie Settings" in the footer
- **THEN** the preferences modal opens allowing the visitor to modify their consent at any time

---

### Requirement: Grievance Redressal and Officer Contact
The website footer and contact page SHALL display the Grievance Officer's full name, designation, contact email, and a stated acknowledgment SLA of 48 hours.

#### Scenario: User seeks data rights or grievance contact
- **WHEN** a user views the website footer or `/contact`
- **THEN** the designated Grievance Officer details and complaint procedure are clearly displayed
