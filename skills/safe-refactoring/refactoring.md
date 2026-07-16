---
name: refactoring
description: Safe, incremental refactoring guide — detects code smells, proposes prioritized refactors, and applies them in small verified steps without changing behavior. Use for "clean up this code" requests.
type: skill
audience: agent
---

# Skill: Safe Refactoring

You are helping the user improve code structure **without changing behavior**. Refactoring is only safe when it's incremental and verified.

## When to use this skill

- The user says: "use @refactoring", "clean up this file", "this class is too big", "reduce duplication".

## Phase 1 — Establish a safety net

1. Check test coverage of the code to refactor. **If it has no tests, write characterization tests first** (tests that pin current behavior, even if that behavior looks wrong) — or get the user's explicit acceptance of the risk.
2. Confirm the build passes and note any existing failing tests (so you don't get blamed for them).
3. Recommend committing current state before starting.

## Phase 2 — Detect smells

Scan the target scope and report findings:

| Smell | Signal | Typical refactor |
|---|---|---|
| Long method | > ~40 lines or > 3 nesting levels | Extract method; early returns/guard clauses |
| God class | Many unrelated responsibilities, huge file | Split by responsibility; extract collaborators |
| Duplicated code | Same logic ≥ 3 places | Extract shared function/class (rule of three) |
| Long parameter list | > 3–4 params | Introduce parameter object |
| Primitive obsession | Raw strings/ints for domain concepts (email, money) | Value objects |
| Feature envy | Method mostly uses another class's data | Move method |
| Shotgun surgery | One change touches many files | Consolidate the concept |
| Boolean flags | `DoThing(bool special)` | Split methods / strategy |
| Dead code | Unused members, commented-out blocks | Delete (git remembers) |
| Deep conditionals | Nested if/else chains | Guard clauses, polymorphism, lookup tables |

Present findings as a prioritized table (impact on readability/change-safety vs. effort) and agree on scope with the user.

## Phase 3 — Refactor in small steps

The loop for EVERY step:

1. One refactor at a time (one extract, one rename, one move).
2. Build + run tests after each step. Green before the next step.
3. Keep behavior identical — if you find a bug, **stop and report it**; fixing bugs and refactoring never mix in one change.
4. Commit (or offer to) at each stable point with a `refactor:` message.

Order of operations that minimizes risk:
1. Delete dead code.
2. Rename for clarity (safe, high value).
3. Extract methods/guard clauses inside a class.
4. Extract classes/interfaces (structure changes).
5. Move code across modules (highest risk — last).

## Rules

- **No behavior changes.** Same inputs → same outputs, same side effects, same public contracts. API/DB contract changes are redesign, not refactoring — flag them separately.
- **No new abstractions for single cases.** Don't introduce interfaces, patterns, or generics for hypothetical futures.
- Respect the codebase's existing style and idioms — refactoring is not restyling to your preference.
- Scope discipline: touch only the agreed files. Adjacent mess goes in a "future candidates" list.

## Phase 4 — Report

- Before/after summary per refactor (what changed, why it's better).
- Metrics if cheap to obtain (lines, methods per class, complexity).
- Bugs discovered but NOT fixed (explicitly listed).
- Remaining candidates for a future pass.
