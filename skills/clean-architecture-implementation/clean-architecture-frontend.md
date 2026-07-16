---
name: clean-architecture-frontend
description: Step-by-step guide for implementing a clean, layered architecture in a frontend project (React, Angular, Vue, etc.). Use when the user asks to organize, scale, or apply clean architecture to a UI codebase.
type: skill
audience: agent
---

# Skill: Clean Architecture — Frontend

You are helping the user implement a clean, scalable architecture in their **frontend** project.
Follow this skill step by step. Analyze before moving anything.

## When to use this skill

- The user says: "use @cleanarchitecturefrontend", "organize my React app", "my components are a mess".
- The project is a SPA/SSR app (React, Angular, Vue, Svelte, Next.js, etc.).

## Phase 1 — Analyze the current project (ALWAYS FIRST)

1. Detect framework and tooling (`package.json`: react/angular/vue, state library, router, styling solution).
2. Map the current structure: where components, API calls, state, and business rules live.
3. Identify violations:
   - Components that call `fetch`/`axios` directly.
   - Business rules (calculations, validations) inside components.
   - Giant components (> ~250 lines) mixing UI + logic + data.
   - No typed models — raw API JSON used everywhere.
4. Summarize findings and the migration plan. **Ask for confirmation before restructuring.**

## Phase 2 — Target structure (feature-based + layers)

```
src/
├── app/                    # App shell: routing, providers, global config
├── features/               # One folder per business feature
│   └── orders/
│       ├── components/     # UI components of this feature (presentation only)
│       ├── hooks/          # Feature logic (useOrders, useCreateOrder)
│       ├── services/       # API calls for this feature (ordersApi.ts)
│       ├── models/         # Types/interfaces for this feature
│       └── index.ts        # Public API of the feature (barrel export)
├── shared/
│   ├── components/         # Reusable dumb components (Button, Modal, Table)
│   ├── hooks/              # Generic hooks (useDebounce, useLocalStorage)
│   ├── utils/              # Pure helper functions
│   └── types/              # Global types
├── core/                   # Framework-agnostic core
│   ├── api/                # HTTP client setup, interceptors, error mapping
│   ├── config/             # Env/config access
│   └── domain/             # Business rules independent of UI (validators, calculators)
└── assets/
```

**Dependency rule:** `features → shared/core`, never `shared → features`, never `core → features/shared`. Features must not import from other features directly — extract to `shared` instead.

## Phase 3 — Migration plan (incremental)

1. **Create the HTTP client layer** in `core/api`: one configured client (base URL, auth header, error handling). Replace scattered `fetch`/`axios` calls with it.
2. **Extract services.** Every component doing data fetching gets a `services/xxxApi.ts` with typed functions. Components never build URLs.
3. **Define models.** Type every API response/request. Map API DTOs → UI models in the service layer if they differ.
4. **Extract logic into hooks** (React/Vue composables/Angular services). Components become presentational: receive data + callbacks, render.
5. **Group by feature.** Move related components/hooks/services into `features/<name>/`. Add barrel `index.ts` exposing only what other parts need.
6. **Split shared UI.** Move duplicated dumb components into `shared/components`.
7. **Verify** the app builds and key flows still work after each step.

## Rules to enforce

- Components: presentation only. No direct HTTP, no business rules.
- State management: server state via query library (TanStack Query/SWR/RTK Query) when available; client/UI state local or in a store — do not mix them.
- One-way imports (enforce with ESLint `import/no-restricted-paths` or dependency-cruiser if the project uses ESLint).
- Prefer composition over prop drilling of more than 2 levels (context/store or component composition).

## Output format

1. Tree of the new structure.
2. Table: file → new location.
3. Violations left unfixed and why.
4. Suggested next steps (tests with @unit-testing, performance pass with @performance).
