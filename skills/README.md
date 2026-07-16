# Agent Skills Library

A collection of reusable, project-agnostic skills for AI coding agents (Claude Code and compatible tools). Each skill is a Markdown file with step-by-step instructions the agent follows when you invoke it. Every folder has its own small `README.md` describing the skill inside.

## How to use a skill

Reference the skill file in your prompt so the agent reads and follows it:

```
Use the skill @skills/clean-architecture-implementation/clean-architecture-backend.md to implement clean architecture in my current project
```

In Claude Code, typing `@` opens a file picker — start typing the skill name (e.g. `cleanarchitecturebackend`) and select the file. You can also just describe what you want ("apply clean architecture to my backend") — the `CLAUDE.md` in this repo tells the agent to look up the matching skill automatically.

You can combine skills in one request:

```
Plan this task with @skills/task-planning-and-decisions/task-planning.md and then add tests following @skills/unit-testing-and-coverage/unit-testing.md
```

## Available skills

| Skill | File | What it does |
|---|---|---|
| Project Analysis | `project-analysis/project-analysis.md` | Read-only health check of any codebase: stack, architecture, quality scorecard, and which skill to apply next — the entry point to the library |
| Clean Architecture — Backend | `clean-architecture-implementation/clean-architecture-backend.md` | Migrates your backend to a 4-layer clean architecture, step by step |
| Clean Architecture — Frontend | `clean-architecture-implementation/clean-architecture-frontend.md` | Restructures a UI project into a feature-based, layered architecture |
| Task Planning | `task-planning-and-decisions/task-planning.md` | Turns a defined task into a plan: technologies, naming, folders, ordered steps |
| Model Selection | `ai-model-selection/model-selection.md` | Picks the cheapest Claude model + effort + thinking that still gets the job done. Flowchart: `ai-model-selection/model-selection-diagram.svg` |
| Unit Testing | `unit-testing-and-coverage/unit-testing.md` | Recommends a test stack, finds untested code, writes tests, raises coverage |
| Performance | `performance-optimization/performance.md` | Finds bottlenecks (missing pagination, sync I/O, N+1...) and applies prioritized fixes |
| Code Documentation | `code-documentation/code-documentation.md` | Adds XML docs/JSDoc/docstrings to public APIs and endpoint comments to controllers |
| Beginner Guide | `beginner-getting-started/beginner-guide.md` | For "I don't know where to start": ONE stack (language, DB, cloud, testing) + day-one roadmap |
| API Design | `rest-api-design/api-design.md` | Designs or reviews REST APIs: naming, status codes, pagination, versioning, error contract |
| Database Design | `database-schema-design/database-design.md` | Designs or reviews relational schemas: keys, relationships, indexes, migrations |
| Security Review | `security-review/security-checklist.md` | Defensive review of your own code: secrets, injection, auth, headers, dependencies |
| Git Workflow | `git-workflow-and-commits/git-workflow.md` | Branch naming, conventional commits, PR structure, recovery recipes |
| Refactoring | `safe-refactoring/refactoring.md` | Safe, incremental refactoring: safety net first, one small verified step at a time |
| Systematic Debugging | `debugging-and-troubleshooting/systematic-debugging.md` | Root-cause analysis: reproduce → isolate → hypothesize → verify → fix + regression test |
| Error Handling & Logging | `error-handling-and-logging/error-handling-logging.md` | Global exception handler, catch policy, structured logging, correlation IDs |
| Code Review | `code-review-checklist/code-review-checklist.md` | Reviews a diff/branch/PR: correctness → security → tests → design, findings ranked by severity |
| CI/CD Pipeline | `ci-cd-pipelines/ci-cd-pipeline.md` | Build+test on every push, deployment stages with secrets, approvals and rollback |
| Docker | `docker-containerization/docker-containerization.md` | Multi-stage Dockerfiles, small secure images, docker-compose for local dev |
| Legacy Migration | `legacy-code-migration/legacy-migration.md` | Framework/runtime upgrades and library replacements, one green step at a time |
| Auth | `auth-implementation/auth-implementation.md` | JWT/session auth, password handling, roles/policies, ownership checks |

## Which skill do I need?

- **"Analyze/audit this project", "I just inherited this repo"** → Project Analysis (start here when in doubt — it tells you which skill to apply next)
- **"I have an idea but no clue where to start"** → Beginner Guide
- **"I have a task, help me plan it"** → Task Planning
- **"Build/design an API"** → API Design (+ Database Design for the data model, + Auth for login/permissions)
- **"My code is a mess"** → Clean Architecture (project-wide) or Refactoring (files/classes)
- **"Something is broken and I don't know why"** → Systematic Debugging
- **"Make it faster"** → Performance
- **"Is it safe?"** → Security Review (+ Auth if the problem is login/permissions)
- **"Test it / document it / review it"** → Unit Testing / Code Documentation / Code Review
- **"Errors are invisible or swallowed"** → Error Handling & Logging
- **"Automate builds and deploys"** → CI/CD Pipeline (+ Docker if containerizing)
- **"Upgrade an old project"** → Legacy Migration
- **"Which model should the agent use? / save tokens"** → Model Selection
- **"Commits and branches"** → Git Workflow

## Suggested combos

- New API from scratch: Task Planning → API Design → Database Design → Auth → Unit Testing → CI/CD.
- Inherited legacy project: **Project Analysis** → Security Review → Error Handling & Logging → Unit Testing (characterization) → Legacy Migration → Refactoring.
- Pre-merge quality gate: Code Review → Unit Testing → Performance (if the change touches hot paths).

## Using these skills in other projects

The skills are project-agnostic. To use them elsewhere, either:

1. **Copy the `skills/` folder** into the other project (and copy `CLAUDE.md` or merge its "Skills" section into the project's existing `CLAUDE.md`), or
2. **Reference them by absolute path** from any project: `@C:/Users/.../Migraction Creation/skills/...`, or
3. **Register them as native Claude Code skills**: copy each `<name>.md` to `~/.claude/skills/<name>/SKILL.md` to make them available in every project via the skill system.

## Conventions used by every skill

- **Analyze before changing** — each skill starts with a read-only analysis phase and asks for confirmation before modifying files.
- **Incremental steps** — changes are applied in small, verifiable increments (build/tests green after each step).
- **Report at the end** — each skill defines the output format: what changed, what's left, suggested next steps.
- **Skills reference each other** — e.g. Clean Architecture suggests Unit Testing as follow-up; CI/CD points to Docker.

## Adding your own skills

1. Create `skills/<descriptive-topic-name>/<skill-name>.md`.
2. Start with the YAML frontmatter (`name`, `description`, `type: skill`).
3. Structure it as: When to use → Analysis phase → Rules/conventions → Execution steps → Output format.
4. Add a small `README.md` in the folder (what it is, when to use it, how to invoke it).
5. Add a row to the table above and to the trigger table in `CLAUDE.md`.
