---
name: security-checklist
description: Reviews the project against a practical security checklist (secrets, injection, auth, validation, dependencies, headers) and fixes findings. Defensive review for the user's own codebase.
type: skill
audience: agent
---

# Skill: Security Checklist (Defensive Review)

You are helping the user find and fix common security issues in **their own** project. This is a defensive review of code the user owns.

## When to use this skill

- The user says: "use @security", "review my app's security", "is my API secure?", "check for vulnerabilities".

## Phase 1 — Scan the project

Work through this checklist and record findings with file:line evidence:

### Secrets & configuration
- Hardcoded secrets: API keys, connection strings, passwords in source or config committed to git. Search for patterns like `password=`, `apikey`, `secret`, `Bearer `, connection strings.
- `.env`/secrets files present in the repo or missing from `.gitignore`.
- Secrets in logs.

### Injection
- SQL built by string concatenation/interpolation instead of parameters/ORM.
- OS command execution with user input.
- Path traversal: user input used in file paths without normalization + root check.
- Unsafe deserialization of user-controlled payloads.

### Authentication & authorization
- Endpoints missing auth that should have it (auth should be default-on, opt-out per endpoint).
- Authorization checked only in the UI, not on the server.
- IDOR: `GET /orders/{id}` returning other users' data without ownership checks.
- Passwords: must be hashed with bcrypt/argon2/PBKDF2 — never MD5/SHA1/plaintext.
- JWT: expiration set, signature verified, algorithm pinned (reject `none`), secrets strong.

### Input validation & output encoding
- Request models validated (types, ranges, lengths, formats) at the boundary.
- XSS: raw HTML rendering of user content (`dangerouslySetInnerHTML`, `innerHTML`, unescaped templates).
- File uploads: type/size validated, stored outside webroot, names sanitized.
- Mass assignment: binding request bodies directly to entities (bind to DTOs with explicit fields).

### Transport & headers (web/API)
- HTTPS enforced (redirect + HSTS).
- CORS: no `*` origin with credentials; allowlist specific origins.
- Security headers: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options`/`frame-ancestors`.
- Cookies: `HttpOnly`, `Secure`, `SameSite`.

### Error handling & information leakage
- Stack traces/exception details returned to clients in production.
- Verbose framework error pages enabled in prod config.
- User enumeration via different error messages on login/reset ("wrong password" vs "no such user").

### Dependencies & platform
- Run the ecosystem audit tool: `npm audit`, `dotnet list package --vulnerable`, `pip-audit`, etc.
- Flag severely outdated frameworks/runtimes.

### Rate limiting & abuse
- Login/reset endpoints without rate limiting or lockout.
- Unbounded expensive endpoints (no pagination + no limits).

## Phase 2 — Report

Present findings ordered by severity BEFORE fixing:

```
| # | Severity | Finding | Location | Fix |
|---|---|---|---|---|
| 1 | Critical | SQL concatenation with user input | UserRepo.cs:88 | parameterized query |
| 2 | High | Connection string in appsettings committed | appsettings.json | move to user-secrets/env |
```

Severity guide: Critical = remotely exploitable data breach; High = auth/injection weaknesses; Medium = hardening gaps; Low = best-practice deviations.

## Phase 3 — Fix

- Fix Critical/High with user approval; batch Medium/Low as a hardening pass.
- Secrets found in git history: rotating the secret is mandatory — removing the file is not enough. Say this explicitly.
- Never weaken functionality silently (e.g. tightening CORS may break a consumer — list affected origins).
- Verify: build + tests pass; re-run the dependency audit.

## Rules

- Evidence-based: every finding cites file and line.
- No fear-mongering: if something is acceptable for the project's context (internal tool, no PII), say so and downgrade it.
- This skill is for defending the user's own code — do not produce exploit code beyond a minimal proof-of-concept description needed to understand the fix.
