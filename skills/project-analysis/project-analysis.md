---
name: project-analysis
description: Read-only analysis of any codebase — detects the stack, maps the architecture, evaluates quality signals (tests, docs, error handling, dependencies), and produces a health report that recommends which skills to apply next. Never modifies anything.
type: skill
audience: agent
---

# Skill: Project Analysis

You are analyzing a project to give the user a clear, honest picture of what it is, how healthy it is, and what to do next. **This skill is strictly read-only** — you inspect and report; you never modify, create, or delete files.

## When to use this skill

- The user says: "use @projectanalysis and analyze this project", "what do you think of this codebase?", "I just inherited this repo, help me understand it", "audit my project".
- As the FIRST step before applying any other skill to an unfamiliar codebase.

## Scope discipline

Adjust depth to project size — do not read every file:

- Small (< ~50 source files): read broadly.
- Medium: read all config/entry points + a representative sample per layer (2–3 files each).
- Large: rely on structure, configs, and targeted searches; sample hot spots only. Say explicitly that findings are sample-based.

## Phase 1 — Identity: what is this and how does it run?

1. **Stack detection**: manifests (`package.json`, `*.csproj`, `pyproject.toml`, `pom.xml`, `go.mod`...), framework, language version, package manager.
2. **Entry points**: where execution starts; available scripts/commands (build, run, test).
3. **Runability**: can you build it right now? Run the build/compile (read-only operation) and report the result. Missing env vars, undocumented setup steps, or broken builds are findings.
4. **Purpose**: infer what the app does from README, routes/endpoints, and domain names. State your inference and confidence.

## Phase 2 — Structure & architecture

1. Map the folder structure and identify the organizational pattern (by layer, by feature, flat, chaotic).
2. Trace the dependency direction: does UI/presentation reach directly into data access? Does business logic live in controllers/components? Where are the business rules actually located?
3. Detect the boundaries: how are external systems (DB, HTTP APIs, files, queues) accessed, and is that access isolated or scattered?
4. Note size hot spots: unusually large files/classes (top 5 by lines).

## Phase 3 — Quality signals

Check each and record evidence (file:line or command output):

| Signal | What to check |
|---|---|
| Tests | Do they exist? Framework? Roughly what do they cover (business logic vs trivia)? Do they pass right now? |
| Linting/formatting | Config present? Does it pass? |
| Type safety | TS `strict`? Nullable enabled (C#)? Type hints (Python)? |
| Error handling | Global handler present? Swallowed exceptions? Consistent error contract? |
| Logging | Structured logger or console prints? |
| Documentation | README with run instructions? Doc comments on public API? Stale docs? |
| Security quick pass | Hardcoded secrets, missing auth on endpoints, obvious injection (flag for the deep skill — don't do the full audit here) |
| Git hygiene | Meaningful commit messages? `.gitignore` correct? Committed artifacts that shouldn't be? |

## Phase 4 — Dependencies

1. Run the ecosystem's audit (`npm audit`, `dotnet list package --vulnerable`, `pip-audit`...) and count vulnerabilities by severity.
2. Identify severely outdated majors (framework/runtime especially).
3. Spot suspicious dependencies: duplicated purposes (two HTTP clients), abandoned packages, huge deps for tiny uses.

## Phase 5 — The report

Deliver in exactly this structure:

### 1. Summary
Three sentences max: what the project is, its overall state, and the single most important thing to address.

### 2. Scorecard

| Area | Rating | Evidence |
|---|---|---|
| Architecture & organization | 🟢/🟡/🔴 | one line |
| Tests | 🟢/🟡/🔴 | one line |
| Error handling & logging | 🟢/🟡/🔴 | one line |
| Documentation | 🟢/🟡/🔴 | one line |
| Dependencies | 🟢/🟡/🔴 | one line |
| Security (quick pass) | 🟢/🟡/🔴 | one line |

🟢 solid · 🟡 works but has debt · 🔴 needs attention

### 3. Strengths
2–4 genuine things done well (not filler — if there are none, say so).

### 4. Risks & findings
Ranked list, each with evidence and impact. Facts, not taste.

### 5. Recommended next steps → skill routing
Map each top finding to the skill that fixes it, in suggested order:

| Finding | Skill to apply |
|---|---|
| No tests on business logic | `unit-testing-and-coverage` |
| Logic inside controllers/components | `clean-architecture-implementation` |
| Swallowed errors, console logging | `error-handling-and-logging` |
| Unbounded endpoints, N+1 suspicion | `performance-optimization` |
| Secrets/auth concerns | `security-review` |
| Runtime several majors behind | `legacy-code-migration` |
| No CI | `ci-cd-pipelines` |
| Undocumented public API | `code-documentation` |

## Rules

- **Read-only. No exceptions.** If the user asks to fix something mid-analysis, finish the report first, then apply the matching skill.
- Every claim needs evidence (file, line, or command output). No vibes.
- Honest but fair: rate against what the project needs to be (a prototype isn't judged as a bank), and say which context you assumed.
- If the build or tests fail during analysis, that IS a finding — report it, don't fix it.
