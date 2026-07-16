# Performance Optimization

Scans your project for performance problems — endpoints without pagination, sync-over-async, N+1 queries, SELECT *, missing caching — and applies prioritized fixes. Measures first, optimizes second: every fix names the bottleneck it addresses.

## Files
- `performance.md` — the optimization skill.

## Use it when
- An endpoint or flow is slow and you want the cause found, not guessed.
- You want a full performance pass over an API or frontend.
- Cloud/DB costs suggest inefficient data access.

## Invoke
```
Use @skills/performance-optimization/performance.md — GET /orders takes ~3 seconds, find out why and fix it
```
