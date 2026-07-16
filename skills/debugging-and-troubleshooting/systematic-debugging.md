---
name: systematic-debugging
description: A systematic method to find the root cause of bugs — reproduce, isolate, hypothesize, verify — instead of guessing. Use when something fails and the cause is unknown.
type: skill
audience: agent
---

# Skill: Systematic Debugging

You are helping the user find the **root cause** of a bug before touching any code. Fixes without a confirmed root cause are guesses — refuse to guess.

## When to use this skill

- The user says: "use @systematicdebugging", "this is broken and I don't know why", "intermittent error", "it works on my machine".

## Phase 1 — Capture the facts

Gather before theorizing (ask only for what you can't obtain yourself):

1. **Exact symptom**: error message, stack trace, wrong value, or behavior. Verbatim, not paraphrased.
2. **Reproduction**: steps/input that trigger it. If not reproducible, get frequency and conditions (env, user, time, data).
3. **Scope**: always fails vs. sometimes; one environment or all; one user or all.
4. **Timeline**: when did it start? What changed around then? (`git log --since`, deploys, dependency updates, config changes).

If there is a stack trace, read it bottom-up to the first frame in the user's own code — start there.

## Phase 2 — Reproduce

- Reproduce the failure yourself (test, script, or curl) before changing anything. A failing reproduction is your success criterion.
- If you cannot reproduce: add targeted logging/instrumentation at the suspected boundary and ask the user to trigger it again — do not fix blind.

## Phase 3 — Isolate (binary search the problem)

Shrink the search space, one cut at a time:

- **Layers**: is the bad value already wrong at the API boundary? At the service? At the DB? Check the midpoint first.
- **Data**: minimize the failing input to the smallest case that still fails.
- **Time**: `git bisect` when a change introduced it and the commit is unknown.
- **Environment**: same code + same data in another env — config/infra vs. code.

## Phase 4 — Hypothesize and verify

1. State the hypothesis in one falsifiable sentence: "X returns null when Y because Z".
2. Design the cheapest experiment that could DISPROVE it (log, unit test, debugger breakpoint, query).
3. Run it. If disproven, back to Phase 3 with what you learned. Maximum honesty: say "disproven", not "inconclusive, let's try a fix anyway".

## Phase 5 — Fix and protect

1. Fix the root cause, not the symptom (a null-check that hides a bad upstream state is a symptom fix — call that out).
2. Add a regression test that fails without the fix and passes with it.
3. Run the reproduction from Phase 2 — must now pass.
4. Look for siblings: the same bug pattern elsewhere in the codebase.

## Common root-cause categories (checklist when stuck)

- Off-by-one / boundary conditions; null/empty/whitespace input.
- Timezone/UTC and date parsing; culture-dependent formatting (`,` vs `.`).
- Race conditions: shared state, async ordering, missing awaits, non-thread-safe collections.
- Stale state: caches, memoization, connection pools, singletons holding old config.
- Environment drift: env vars, config precedence, different dependency versions.
- Serialization: casing mismatches, enum values, nullability, versioned contracts.
- Floating point comparisons; integer overflow/truncation.

## Report format

```
Symptom: <what failed>
Root cause: <one sentence, with file:line evidence>
Why it happened: <the chain from cause to symptom>
Fix: <what changed>
Regression test: <test name>
Siblings checked: <same pattern elsewhere — found/not found>
```
