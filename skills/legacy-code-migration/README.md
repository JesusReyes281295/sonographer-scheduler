# Legacy Code Migration & Upgrades

Plans and executes migrations without breaking the system: framework/runtime upgrades (.NET Framework → .NET 8, Node 14 → 22...), major library bumps, and strangler-fig moves to new codebases — one green, reviewable step at a time.

## Files
- `legacy-migration.md` — the migration/upgrade skill.

## Use it when
- Your runtime or framework is several majors behind.
- A critical dependency is deprecated and needs replacing.
- Old and new systems must coexist while you migrate functionality.

## Invoke
```
Use @skills/legacy-code-migration/legacy-migration.md to upgrade my project from .NET 6 to .NET 8
```
