---
name: performance
description: Scans the project for performance problems (endpoints without pagination, missing async, N+1 queries, inefficient data access) and applies prioritized fixes. Use when the user wants something faster or cheaper to run.
type: skill
audience: agent
---

# Skill: Performance Review & Optimization

You are helping the user find and fix performance problems in their project — measuring first, optimizing second.

## When to use this skill

- The user says: "use @performance", "this endpoint is slow", "optimize my API", "review performance".

## Phase 1 — Scope and baseline

1. Ask (only if unclear): whole project, one endpoint/flow, or a specific symptom?
2. Look for existing evidence: logs with timings, APM data, slow-query logs. If the user can reproduce the slowness, get a number ("~3s for GET /orders").
3. **Never optimize without a suspect.** Every fix you propose must name the bottleneck it addresses.

## Phase 2 — Scan for the usual suspects

Work through this checklist against the code:

### Database / data access
- **N+1 queries**: loops that query per item; lazy-loading in serialization paths. Fix: eager loading (`Include`/`join`), batched queries, or projection.
- **SELECT ***: fetching entire entities to use 2 fields. Fix: project to DTO (`Select(x => new {...})`).
- **Missing pagination**: endpoints returning unbounded lists. Fix: page/cursor parameters with a sane default and max page size.
- **Missing indexes**: filters/sorts on non-indexed columns (check migrations/schema).
- **Tracking overhead** (ORMs): read-only queries without `AsNoTracking()`/equivalent.
- **Chatty transactions**: many round trips where one query or a bulk operation would do.

### Application code
- **Sync-over-async / blocking I/O**: `.Result`/`.Wait()` in C#, sync HTTP or file calls in request paths. Fix: async end to end.
- **Sequential independent I/O**: awaiting calls one by one when they could run concurrently (`Task.WhenAll`, `Promise.all`, `asyncio.gather`).
- **Work inside loops** that could be hoisted (compiled regex, repeated parsing, per-item DB calls).
- **Large in-memory materialization**: `.ToList()` before filtering; loading a whole file when streaming would do.
- **Missing caching** for hot, rarely-changing data (config, catalogs, lookups) — in-memory or distributed cache with an explicit TTL and invalidation note.

### HTTP / API layer
- Oversized payloads (no field filtering, no compression).
- Missing response caching / ETags for public read-heavy endpoints.
- Serializer misconfiguration (reflection-heavy settings on hot paths).

### Frontend (if applicable)
- Bundle size (no code splitting/lazy routes), unnecessary re-renders, missing memoization on expensive lists, images without sizing/lazy loading, waterfalls of sequential fetches.

## Phase 3 — Report and prioritize

Present findings BEFORE changing code:

```
| # | Finding | Location | Expected impact | Effort |
|---|---|---|---|---|
| 1 | N+1 loading order items | OrderService.cs:45 | high (xN queries → 1) | low |
| 2 | GET /orders unpaginated | OrdersController.cs:22 | high | medium |
```

Order by impact/effort ratio. Ask which to apply (default: all high-impact/low-effort).

## Phase 4 — Fix and verify

- Apply fixes one at a time; keep each change reviewable.
- Preserve behavior: same results, same contracts (pagination is an API change — flag it as such and version if needed).
- Verify: re-run the reproduction, tests, or at minimum show the before/after query count or complexity reasoning.
- Report each fix as: problem → change → measured/expected gain.

## Rules

- Measure > guess. If no measurement is possible, say the gain is an estimate.
- Do not micro-optimize readable code for negligible gains — call it out and skip.
- Caching always comes with: key, TTL, and invalidation strategy — otherwise don't add it.
