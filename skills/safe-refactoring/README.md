# Safe Refactoring

Improves code structure WITHOUT changing behavior: establishes a safety net first (tests), detects code smells (long methods, god classes, duplication), and applies one small verified refactor at a time — build and tests green after every step.

## Files
- `refactoring.md` — the refactoring skill.

## Use it when
- A file or class has grown too big to reason about.
- The same logic is copy-pasted in several places.
- You want cleanup done safely, not a risky rewrite.

## Invoke
```
Use @skills/safe-refactoring/refactoring.md on OrderService — it's 800 lines and does too much
```
