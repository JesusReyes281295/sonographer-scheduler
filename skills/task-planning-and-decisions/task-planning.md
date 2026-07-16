---
name: task-planning
description: Interactive task-breakdown assistant. Given a defined task (e.g. "build a REST API with several endpoints"), this skill guides the user through technology choices, naming, folder structure, and an ordered execution plan.
type: skill
audience: agent
---

# Skill: Task Planning & Decision Making

You are helping the user turn a **defined task** into a **concrete, ordered plan**: which technologies, which names, which folders, and in which order to build.

## When to use this skill

- The user says: "use @taskplanning", "I have a task: create a REST API with these endpoints", "help me plan this feature".
- There is a goal but no plan yet.

## Phase 1 — Understand the task

Restate the task in one sentence and confirm it. Then gather ONLY the missing information — ask in a single batch (max 4 questions), never one by one. Typical gaps:

| Area | Question (only if unknown) |
|---|---|
| Stack | "Which language/framework? Or should I recommend one based on your repo/experience?" |
| Data | "Which database? Existing or new?" |
| Consumers | "Who consumes this? (web frontend, mobile, another service)" |
| Constraints | "Deadline, hosting, auth requirements, existing conventions?" |

If the user answers "recommend one", pick based on: what already exists in the repo > what the user knows > mainstream default for the task. Always justify in one sentence.

## Phase 2 — Produce the plan

Deliver ALL of the following sections:

### 1. Technology decisions
A table: concern → choice → one-line justification (framework, DB, ORM, validation lib, auth, testing stack).

### 2. Naming recommendations
- Project/solution name, package/namespace names.
- Resource naming for the task (e.g. REST: plural nouns `/api/v1/orders`, kebab-case URLs, PascalCase C# / camelCase JS for code).
- File naming conventions consistent with the chosen stack.

### 3. Folder structure
A concrete tree for THIS task (not generic). If the project should follow Clean Architecture, reference the @clean-architecture-backend or @clean-architecture-frontend skill instead of duplicating it.

### 4. Ordered execution steps
Numbered checklist, each step small enough to verify (compiles/tests/runs). Example for a REST API:

1. Scaffold project + health-check endpoint (verify it runs).
2. Define domain models + DB schema/migration.
3. Wire DB connection + repository for entity #1.
4. Implement endpoint #1 end-to-end (route → validation → logic → persistence → response).
5. Repeat per endpoint.
6. Add auth middleware (if required).
7. Error handling + consistent response envelope.
8. Tests for critical paths (delegate details to @unit-testing skill).
9. README + run instructions.

### 5. Definition of done
3–6 bullet criteria the user can check (e.g. "all endpoints return correct status codes", "tests pass", "README explains how to run").

## Phase 3 — Offer execution

Ask: "Do you want me to start executing step 1?" If yes, execute steps one at a time, confirming each verification point before moving on.

## Rules

- Never produce a plan with steps that can't be individually verified.
- Prefer the simplest architecture that satisfies the task — flag over-engineering.
- If the task is too large (> ~2 weeks of work), split it into milestones first and plan only milestone 1 in detail.
