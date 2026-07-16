---
name: clean-architecture-backend
description: Step-by-step guide for implementing Clean Architecture in a backend project. Use when the user asks to restructure, organize, or apply Clean Architecture to a backend/API codebase.
type: skill
audience: agent
---

# Skill: Clean Architecture — Backend

You are helping the user implement Clean Architecture in their **backend** project.
Follow this skill step by step. Do NOT skip the analysis phase.

## When to use this skill

- The user says: "use @cleanarchitecturebackend", "apply clean architecture to my API", "restructure my backend".
- The project is an API, worker service, or any server-side application.

## Phase 1 — Analyze the current project (ALWAYS FIRST)

1. Detect the language and framework (e.g. `.csproj` → .NET, `package.json` + express/nest → Node, `pom.xml` → Java/Spring, `requirements.txt`/`pyproject.toml` → Python).
2. Map the current structure: controllers/routes, business logic, data access, models/DTOs, external integrations.
3. Identify violations: business logic inside controllers, direct DB access from endpoints, domain models coupled to ORM/framework, missing interfaces.
4. Present a short summary to the user: current state → target state, and the list of violations found. **Ask for confirmation before moving files.**

## Phase 2 — Target structure

Adapt the naming to the detected stack, but keep these four layers:

```
src/
├── Domain/               # Core — no dependencies on anything else
│   ├── Entities/         # Business entities (pure classes, no ORM attributes if possible)
│   ├── ValueObjects/
│   ├── Enums/
│   ├── Exceptions/       # Domain-specific exceptions
│   └── Interfaces/       # Repository/domain-service contracts (IRepository, IUnitOfWork)
├── Application/          # Use cases — depends ONLY on Domain
│   ├── UseCases/         # or Services/ — one class per use case (CreateOrderHandler)
│   ├── DTOs/             # Input/output models for use cases
│   ├── Interfaces/       # Contracts for infrastructure (IEmailSender, IClock)
│   ├── Validators/
│   └── Mappings/
├── Infrastructure/       # Implementations — depends on Application + Domain
│   ├── Persistence/      # DbContext / ORM config, migrations
│   ├── Repositories/     # Implement Domain interfaces
│   ├── ExternalServices/ # HTTP clients, message brokers, email, storage
│   └── DependencyInjection/  # Infrastructure service registration
└── Presentation/         # (Web/API) — depends on Application
    ├── Controllers/      # Thin: receive request → call use case → return response
    ├── Middlewares/
    ├── Filters/
    └── Program/Startup   # Composition root (DI wiring)
```

**The dependency rule:** dependencies always point inward.
`Presentation → Application → Domain` and `Infrastructure → Application → Domain`. Domain depends on nothing.

## Phase 3 — Migration plan (incremental, never big-bang)

Execute in this order, verifying the project compiles/tests pass after each step:

1. **Create the Domain layer.** Move entities in; strip framework/ORM dependencies from them (or document why they stay).
2. **Extract interfaces.** For every repository or external dependency used by business logic, define an interface in Domain (repositories) or Application (infrastructure services).
3. **Create the Application layer.** Move business logic out of controllers into use-case classes. One use case = one class with a single public method (`Execute`/`Handle`).
4. **Create Infrastructure.** Move DB access, ORM configuration, and external clients here. Make repositories implement the Domain interfaces.
5. **Thin the controllers.** A controller method should be ≤ ~15 lines: validate input → call use case → map result to HTTP response.
6. **Wire dependency injection** in the composition root only (Presentation). Nothing else should call `new` on infrastructure classes.
7. **Run the test suite** (or build) and fix regressions before declaring done.

## Rules to enforce while migrating

- No `using`/`import` from Infrastructure inside Domain or Application.
- Controllers never touch the DbContext/ORM directly.
- DTOs at the boundaries; domain entities never serialized directly to HTTP responses.
- Cross-cutting concerns (logging, auth, validation) go in middleware/pipeline behaviors, not in use cases.
- If the project is small, offer the lighter variant: 3 layers (Domain, Application, Infrastructure+Presentation merged) and say so explicitly.

## Output format

After finishing, give the user:
1. A tree of the new structure.
2. A table: file moved → new location.
3. Remaining violations you did not fix (with reasons).
4. Suggested next steps (e.g. add unit tests with @unit-testing skill).
