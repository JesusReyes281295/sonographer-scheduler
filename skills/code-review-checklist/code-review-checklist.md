---
name: code-review-checklist
description: Reviews a diff, branch, or PR like a senior engineer — correctness first, then design, tests, and style — producing actionable findings ordered by severity. Use before merging or when the user asks "review my code".
type: skill
audience: agent
---

# Skill: Code Review

You are reviewing the user's code changes like a thorough senior engineer. Find real problems, rank them, and be specific — file, line, why it's wrong, and how to fix it.

## When to use this skill

- The user says: "use @codereview", "review my changes/PR/branch", "check this before I merge".

## Phase 1 — Scope the review

1. Determine what to review: working diff (`git diff`), branch vs main (`git diff main...HEAD`), a PR, or specific files.
2. Read the change's intent first (commit messages, PR description, or ask). You cannot judge correctness without knowing what it's supposed to do.
3. Read the FULL context of modified functions — not just the changed lines. Bugs live at the seams.

## Phase 2 — Review in priority order

Work top-down; a style nit never outranks a correctness bug.

### 1. Correctness (blockers)
- Does the code do what the intent says? Trace the main path with a concrete input.
- Edge cases: null/empty, zero/negative, boundaries, concurrent access, partial failure halfway through multi-step operations.
- Error paths: what happens when the DB/HTTP call fails? Are resources released (using/finally/defer)?
- Off-by-one, wrong operator (`>` vs `>=`), inverted conditions, missing `await`, swallowed promise/task.
- Breaking changes to public contracts (API shape, DB schema, events) — flag loudly.

### 2. Security (blockers)
- Injection, missing auth/ownership checks, secrets in code, unvalidated input at boundaries. (Deep pass: @security-checklist.)

### 3. Tests
- Do tests cover the new behavior, including at least one edge/error case?
- Do tests assert behavior, or only mirror implementation?
- Were tests modified to pass without a justified behavior change? (red flag)

### 4. Design
- Is the change in the right layer? (business logic in controllers, data access in UI → architecture violation)
- Duplication with existing code the author may not know about — point to the existing helper.
- Unnecessary complexity: abstractions for single cases, config for things that never change.
- Consistency with the codebase's existing patterns (naming, error handling, folder placement).

### 5. Readability & style (nits)
- Misleading names, dead code, commented-out blocks, TODO without owner.
- Only flag formatting if the repo has a defined style being violated — never impose personal taste.

## Phase 3 — Report

Order findings by severity. For each:

```
[BLOCKER|MAJOR|MINOR|NIT] file.ext:line — one-line problem statement
Why: what breaks / degrades, with the concrete failing scenario.
Fix: specific suggestion (code snippet if short).
```

End with:
- **Verdict**: approve / approve-with-comments / needs-changes.
- What the change does **well** (1–2 points, genuine — not filler).
- If zero findings: say so plainly; do not invent nits to look thorough.

## Rules

- Every finding needs a concrete failure scenario — "this could be cleaner" without consequences is a NIT at most.
- Review the code, not the author; phrase findings neutrally.
- If asked to also FIX the findings, apply them in severity order, re-running tests after each.
