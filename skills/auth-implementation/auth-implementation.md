---
name: auth-implementation
description: Implements authentication and authorization correctly — JWT/session auth, password handling, roles/policies, and token lifecycle — using the framework's built-in mechanisms. Use when adding login/permissions to an app or API.
type: skill
audience: agent
---

# Skill: Authentication & Authorization

You are helping the user add or fix authentication (who are you) and authorization (what may you do) in their application — using standard, framework-native mechanisms, never hand-rolled crypto.

## When to use this skill

- The user says: "use @auth", "add login to my API", "protect these endpoints", "add roles/permissions", "implement JWT".

## Phase 1 — Choose the approach

Ask only what's missing, then recommend ONE:

| Situation | Recommendation |
|---|---|
| SPA/mobile + API | JWT access token (short-lived, 5–15 min) + refresh token (rotating, stored httpOnly-cookie or secure storage) |
| Server-rendered web app | Cookie-based session auth (framework default) |
| Enterprise / existing identity | Delegate: OpenID Connect against Entra ID/Auth0/Keycloak/Cognito — don't build user management |
| B2B API-to-API | Client credentials (OAuth2) or API keys with hashing + scoping |

**Strong default: don't build identity if a managed provider is viable.** Building it yourself is justified mainly for learning projects or hard constraints — say this explicitly.

## Phase 2 — Non-negotiable rules

### Passwords (only if storing them yourself)
- Hash with **argon2id or bcrypt** (framework's `PasswordHasher`/equivalent). Never MD5/SHA*/plaintext/reversible encryption.
- Verify with constant-time comparison (the library does this — don't compare strings).
- Same error message for wrong-user and wrong-password (no user enumeration); rate-limit login and reset endpoints.
- Password reset: single-use, expiring, random token; never email a password.

### Tokens (JWT)
- Sign with a strong secret/key from configuration (never in code); pin the algorithm and reject `none`.
- Validate on EVERY request: signature, expiry, issuer, audience — the framework middleware does this; configure all four.
- Access tokens short-lived; refresh tokens rotated on use and revocable (stored server-side or versioned per user).
- Claims: subject id, roles/permissions — no PII beyond what authorization needs.
- Web storage: refresh token in httpOnly+Secure+SameSite cookie; never tokens in localStorage if XSS is a realistic risk — state the tradeoff.

### Authorization
- **Deny by default**: global auth requirement, opt-out per public endpoint (`[AllowAnonymous]`/equivalent) — not the reverse.
- Roles for coarse access; policies/permissions for anything conditional ("owner or admin").
- **Resource ownership checked server-side** on every read/write of user-owned data (IDOR is the #1 API hole): `WHERE id = @id AND owner_id = @currentUser`.
- Authorization lives in the API/application layer — UI hiding is UX, not security.

## Phase 3 — Implement (typical API order)

1. Wire the framework's auth middleware (JWT bearer / cookie / OIDC) with full validation config.
2. Identity storage: framework identity system or minimal `users` table (id, email unique, password_hash, created_at) — align schema with @database-design.
3. Endpoints: `POST /auth/register` (if self-service), `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` (revoke refresh).
4. Apply the global auth policy; mark public endpoints explicitly.
5. Add roles/policies and ownership checks where the domain needs them.
6. Error semantics: 401 unauthenticated, 403 forbidden — consistent with the app's error contract.

## Phase 4 — Verify

Test (automated or scripted curl) and show results:
- Login with valid/invalid credentials.
- Protected endpoint: no token → 401; valid token → 200; expired/tampered token → 401.
- Role-restricted endpoint with the wrong role → 403.
- Ownership: user A requesting user B's resource → 403/404.
- Refresh flow: old refresh token unusable after rotation.

## Rules

- Never invent crypto or session formats — framework/library primitives only.
- Secrets via configuration/secret manager from day one (@security-checklist covers the audit).
- Log auth events (login success/failure, lockout, refresh reuse) without logging credentials — align with @error-handling-logging.
