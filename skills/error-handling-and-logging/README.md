# Error Handling & Logging

Designs and implements a consistent failure strategy: one global exception handler, a clear catch policy (handle, enrich, or don't catch), structured logging with proper levels, correlation IDs per request, and zero secrets in logs.

## Files
- `error-handling-logging.md` — the error handling & logging skill.

## Use it when
- Errors are swallowed silently (`catch {}`) or logged five times each.
- Production issues are impossible to diagnose from the logs.
- You want structured, queryable logs instead of console prints.

## Invoke
```
Use @skills/error-handling-and-logging/error-handling-logging.md to standardize error handling and logging in my API
```
