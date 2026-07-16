---
name: error-handling-logging
description: Designs and implements a consistent error-handling and logging strategy — exception policy, global handlers, structured logging, log levels, and correlation IDs. Use when errors are swallowed, inconsistent, or invisible in production.
type: skill
audience: agent
---

# Skill: Error Handling & Logging

You are helping the user make failures **visible, consistent, and diagnosable**: a single error-handling policy and structured, useful logs.

## When to use this skill

- The user says: "use @errorhandling", "add logging to my project", "errors are being swallowed", "standardize error handling".

## Phase 1 — Audit the current state

Scan for these anti-patterns and report them with file:line:

- **Swallowed exceptions**: empty `catch {}`, `catch (Exception) { return null; }`, `.catch(() => {})`.
- **Catch-and-rethrow-wrong**: `throw ex;` (C# — loses stack) instead of `throw;`; rethrowing as `new Exception(e.Message)` losing the inner exception.
- **Control flow by exception**: exceptions for expected outcomes (not-found, validation).
- **Console logging in production paths**: `Console.WriteLine` / `print` / `console.log` instead of a logger.
- **String-interpolated logs**: `log.Info($"user {id}")` instead of structured templates.
- **Sensitive data in logs**: passwords, tokens, full card numbers, PII.
- **Duplicate handling**: same exception logged at every layer (log noise, 5 stack traces per failure).

## Phase 2 — Define the policy (adapt to the stack)

### Exception policy
- **Expected failures** (not found, validation, business rule) → result types or specific domain exceptions; mapped to 4xx at the edge. Never generic `Exception`.
- **Unexpected failures** → let them bubble to ONE global handler (middleware/filter/error boundary). Catch locally only when you can add context or recover.
- **Catch rule**: catch it only if you can (a) handle it meaningfully, (b) enrich and rethrow, or (c) translate it at a boundary. Otherwise don't.
- Custom exception types: few and meaningful (`OrderNotFoundException : DomainException`), carrying the data needed to handle them.

### Global handler (one per app)
- Maps exception type → HTTP status + safe response body (RFC 7807 recommended — align with @api-design).
- Logs ONCE, at the handler, with full detail. Inner layers add context via exception data/wrapping, not duplicate logs.
- Never leaks stack traces or internals to clients in production.

### Logging strategy
- **Structured logging** with the stack's standard: Serilog / `ILogger<T>` (.NET), pino/winston (Node), `logging` + structlog (Python), SLF4J/Logback (Java).
- **Message templates, not interpolation**: `log.Information("Order {OrderId} shipped to {Country}", id, country)` — queryable properties.
- **Levels**: `Trace/Debug` diagnostics (off in prod) · `Information` business events ("order created") · `Warning` unusual-but-handled (retry, fallback) · `Error` failed operation needing attention · `Critical` app can't continue.
- **Correlation ID** per request: generated at the edge (or taken from `X-Correlation-Id`), included in every log line and error response, propagated to downstream calls.
- **What to log at boundaries**: incoming request (route, no bodies with PII), outgoing calls (target, duration, status), and every failure with its correlation ID.
- **Never log**: credentials, tokens, secrets, full PII. Mask where needed.

## Phase 3 — Implement

1. Add/configure the logger (structured, JSON output in prod, human-readable in dev).
2. Implement the global exception handler + error contract.
3. Add correlation-ID middleware.
4. Replace console logging in production paths; convert interpolated logs to templates.
5. Fix swallowed exceptions one by one: handle, enrich, or remove the catch.
6. Verify: trigger a test failure end-to-end and show the resulting log line(s) + client response.

## Report format

- Anti-patterns found → fixed (table).
- The policy in 5 bullets (so the team can follow it).
- Example log output and error response after the change.
