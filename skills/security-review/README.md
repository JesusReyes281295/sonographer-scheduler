# Security Review

Defensive checklist review of your own codebase: hardcoded secrets, injection, missing auth/ownership checks (IDOR), weak password storage, information leakage, vulnerable dependencies, and missing security headers — every finding backed by file:line evidence and ranked by severity.

## Files
- `security-checklist.md` — the security review skill.

## Use it when
- Before going to production or exposing an API publicly.
- After inheriting a codebase you don't fully trust.
- Periodically, as a hardening pass.

## Invoke
```
Use @skills/security-review/security-checklist.md to review my API before launch
```
