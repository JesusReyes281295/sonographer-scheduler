# CLAUDE.md

This repository contains two things:

1. A **skills library** for AI coding agents under `skills/`.
2. A **sample application** under `sonographer-scheduler/` — a React + TypeScript scheduling app built by applying those skills (task-planning → clean-architecture-frontend → unit-testing). See its own `README.md` for architecture and commands (`npm run dev` / `npm test` / `npm run build` from inside that folder).

Read this section before helping the user with any development task.

## Skills library

Each skill is a Markdown playbook with step-by-step instructions, and each skill folder has a small `README.md` describing it. **When the user invokes a skill (with `@`, by name, or by describing a matching task), read the skill file completely and follow its phases in order** — especially the analysis/confirmation phase before modifying anything.

| Trigger (examples) | Skill file |
|---|---|
| "analyze/audit this project", "inherited this repo", "what state is this codebase in" | `skills/project-analysis/project-analysis.md` |
| "clean architecture", "restructure my backend/API" | `skills/clean-architecture-implementation/clean-architecture-backend.md` |
| "organize my React/Angular/Vue app" | `skills/clean-architecture-implementation/clean-architecture-frontend.md` |
| "plan this task", "help me decide how to build X" | `skills/task-planning-and-decisions/task-planning.md` |
| "which model/effort/thinking should I use", "save tokens" | `skills/ai-model-selection/model-selection.md` |
| "add tests", "what's not tested", "coverage" | `skills/unit-testing-and-coverage/unit-testing.md` |
| "slow", "optimize", "performance" | `skills/performance-optimization/performance.md` |
| "document my code/controllers", "add comments" | `skills/code-documentation/code-documentation.md` |
| "I don't know where to start", "which language/DB/cloud" | `skills/beginner-getting-started/beginner-guide.md` |
| "design endpoints", "review my API", "RESTful" | `skills/rest-api-design/api-design.md` |
| "design tables/schema", "model this data" | `skills/database-schema-design/database-design.md` |
| "security review", "is this secure", "vulnerabilities" | `skills/security-review/security-checklist.md` |
| "commits", "branches", "PR", "git workflow" | `skills/git-workflow-and-commits/git-workflow.md` |
| "clean up this code", "refactor", "too big/duplicated" | `skills/safe-refactoring/refactoring.md` |
| "it's broken and I don't know why", "intermittent bug" | `skills/debugging-and-troubleshooting/systematic-debugging.md` |
| "errors are swallowed", "add logging", "can't diagnose prod" | `skills/error-handling-and-logging/error-handling-logging.md` |
| "review my changes/PR/branch before merge" | `skills/code-review-checklist/code-review-checklist.md` |
| "CI", "GitHub Actions", "automate deploys", "pipeline" | `skills/ci-cd-pipelines/ci-cd-pipeline.md` |
| "dockerize", "Dockerfile", "docker-compose" | `skills/docker-containerization/docker-containerization.md` |
| "upgrade .NET/Node/Python version", "replace library X" | `skills/legacy-code-migration/legacy-migration.md` |
| "add login", "JWT", "roles/permissions", "protect endpoints" | `skills/auth-implementation/auth-implementation.md` |

If more than one skill matches, name the candidates and ask the user which to apply (or combine them, e.g. task-planning → rest-api-design → unit-testing).

## Rules when executing skills

1. **Read the whole skill file first** — do not act on the title alone.
2. **Analysis before modification** — every skill has a read-only phase and a confirmation checkpoint; respect them.
3. **Incremental changes** — keep the build/tests green after each step, as each skill specifies.
4. **End with the skill's report format** — summary of changes, remaining gaps, suggested next skill.
5. Skills are project-agnostic: adapt naming and tooling to the stack you detect in the target project, not the examples' stack.

## Repository layout

```
CLAUDE.md              ← this file
sonographer-scheduler/ ← sample app (React+TS): daily scheduling with mocked REST API
skills/
├── README.md          ← user-facing guide to the whole library
├── ai-model-selection/            ← includes model-selection-diagram.svg
├── auth-implementation/
├── beginner-getting-started/
├── ci-cd-pipelines/
├── clean-architecture-implementation/   ← backend + frontend skills
├── code-documentation/
├── code-review-checklist/
├── database-schema-design/
├── debugging-and-troubleshooting/
├── docker-containerization/
├── error-handling-and-logging/
├── git-workflow-and-commits/
├── legacy-code-migration/
├── performance-optimization/
├── project-analysis/      ← read-only audit; entry point that routes to other skills
├── rest-api-design/
├── safe-refactoring/
├── security-review/
├── task-planning-and-decisions/
└── unit-testing-and-coverage/
```

Each skill folder contains the skill `.md` file(s) plus a small `README.md` explaining what it is, when to use it, and an invocation example.

When the user asks to apply a skill "to my current project", they usually mean `sonographer-scheduler/` (the only application code in this repo) or an external project they reference — the `skills/` folder itself has nothing to build or test.
