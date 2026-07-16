---
name: legacy-migration
description: Plans and executes migrations of legacy code — framework/runtime upgrades (e.g. .NET Framework → .NET 8, Node 14 → 22), library replacements, or moving code between projects — incrementally and without breaking behavior.
type: skill
audience: agent
---

# Skill: Legacy Code Migration & Upgrades

You are helping the user migrate legacy code: runtime/framework upgrades, major library version bumps, or moving functionality to a new codebase. The prime directive: **the system keeps working at every step**.

## When to use this skill

- The user says: "use @legacymigration", "upgrade my project to .NET 8 / Node 22 / Python 3.12", "replace library X with Y", "move this module to the new system".

## Phase 1 — Inventory and scope

1. Identify: current version → target version, and everything in between (some upgrades must hop through intermediate majors).
2. Inventory dependencies: which are compatible with the target, which have upgrades available, which are dead (no target-compatible version) — those need replacements. Produce a table.
3. Read the official migration guide(s) for the jump and list the **breaking changes that apply to this codebase** (search the code for each deprecated API — evidence, not the full changelog).
4. Assess the safety net: test coverage, ability to run the app locally, rollback path (branch/backup). If coverage is near zero on critical paths, recommend characterization tests first (@unit-testing).
5. **Present the plan and get approval before editing.** Include an estimate of risk hotspots.

## Phase 2 — Strategy selection

| Situation | Strategy |
|---|---|
| Runtime/framework upgrade, code stays | **In-place, stepwise**: one major at a time, build+test green at each hop |
| Old and new must coexist a while | **Strangler fig**: new code in new module/service; route traffic piece by piece; retire old parts as replaced |
| Library replacement | **Adapter first**: wrap old lib behind an interface, swap implementation, then remove the adapter if it adds no value |
| Rewrite temptation | Challenge it: rewrites lose embedded bug fixes. Justify per module, not globally |

## Phase 3 — Execute (in-place upgrade loop)

For each hop (e.g. one major version):

1. Branch: `chore/upgrade-<thing>-<version>`.
2. Bump the runtime/framework target; fix build errors **mechanically first** (API renames, signature changes) before touching logic.
3. Upgrade dependencies in compatibility order (framework-coupled ones first).
4. Handle each breaking change from the Phase 1 list; check it off explicitly.
5. Address obsolete/deprecation warnings that will break in the NEXT hop (don't leave them).
6. Build + full test suite + smoke-run the app. Green before the next hop.
7. Commit per hop with a message listing what changed behaviorally (usually: "nothing — mechanical upgrade").

## Phase 4 — Verify and finish

- Run the app's critical flows end to end (list which ones you verified).
- Compare behavior where risk is high: same inputs → same outputs (golden tests/snapshots help).
- Update: README (new version requirements), CI toolchain versions (@ci-cd-pipeline), Dockerfiles base images (@docker-containerization).
- Report: versions before → after, breaking changes handled, replaced libraries, known risks left.

## Rules

- Never mix upgrade commits with feature/refactor commits — upgrades must be reviewable as "mechanical".
- No big-bang: if you can't keep it green between steps, the steps are too big.
- Deprecated ≠ optional: leaving deprecation warnings piles the cost onto the next upgrade — fix or ticket them.
- If a dependency has no compatible version and no replacement, stop and present options (fork, vendor, isolate behind adapter, defer) — don't improvise.
