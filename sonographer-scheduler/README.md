# Sonographer Scheduler

A small daily-scheduling application for sonographers and clinics, built with **React 19 + TypeScript** against a **mocked REST API** (no database).

## Features

- Daily schedule grid: sonographers as columns, hours as rows, with day navigation.
- Create, edit, delete and **move** appointments (moving = changing time/sonographer in the edit dialog).
- **Patients and consultation types as real entities** — book a *patient* for a *type of ultrasound study*. The patient field autocompletes over registered patients and registers a new one on the fly if the name is unknown; each study type carries an icon shown on the schedule.
- **Double-booking prevention** per sonographer and **clinic operating-hours enforcement** — validated on both the client (instant feedback) and the mock server (source of truth).
- **Holiday-aware scheduling** — clinics that observe **US federal holidays** are closed those days; booking one is blocked (client + server) and the form recommends a clinic that's open, with one tap to switch.
- **Quick note shortcuts** — one-tap chips ("Urgent", "Possibly cancelled", …) to annotate appointments without retyping.
- Loading, error (with retry) and empty states on every data fetch.
- **Optimistic UI updates** with automatic rollback when the server rejects a change.
- **Set it up for your own hospital** — a **Manage** panel to add, edit and delete clinics (hours, colour, icon, holiday policy), sonographers, patients and study types, without touching code. Anything still used by an appointment can't be deleted, and changes show up in the schedule immediately.
- **Local-first persistence** — the schedule *and your setup* are saved in the browser (`localStorage`) and survive reloads, with no database to install.
- **The sample day always follows you** — the demo schedule re-anchors to the current day every time the app opens, so whoever tries it sees a full day for *their* today, whether that's now or weeks from now. Your own edits shift along with it.
- Unit tests for the domain rules and integration tests for the critical UI flows.

## Getting started

```bash
npm install
npm run dev        # start the app (mock API runs in the browser via MSW)
npm test           # run the test suite once
npm run test:watch # run tests in watch mode
npm run lint       # oxlint with the jsx-a11y plugin enabled
npm run build      # type-check + production build
```

No backend or environment variables required — MSW (Mock Service Worker) intercepts `fetch` calls and serves the REST API in the browser, seeded with a realistic day for "today" across 10 clinics and 7 sonographers. Your changes are **persisted locally** (browser `localStorage`), so they survive a page reload.

## Architecture

```
src/
├── app-level files (App.tsx, main.tsx)   # Providers + MSW bootstrap
├── core/                                 # Framework-agnostic core
│   ├── api/http.ts                       # fetch wrapper: JSON + error normalization (ApiError)
│   └── domain/                           # ⭐ Business rules as pure functions + types
│       ├── types.ts                      #   Appointment, Patient, ConsultationType, Clinic…
│       ├── scheduling.ts                 #   overlaps(), validateAppointment(), holiday closures
│       ├── holidays.ts                   #   US federal holiday calendar (pure date math)
│       └── time.ts                       #   time math helpers
├── features/schedule/                    # The scheduling feature
│   ├── components/                       # SchedulePage, ScheduleGrid, AppointmentFormDialog
│   ├── hooks/                            # TanStack Query hooks (queries + optimistic mutations)
│   └── services/                         # Typed REST calls (appointmentsApi, clinicsApi, ...)
├── shared/components/                    # Reusable UI (Spinner, ErrorBanner)
└── mocks/                                # MSW handlers + local-first "database" (localStorage) + seed data
```

**Dependency rule:** `features → core/shared`; `core` depends on nothing above it. Components never call `fetch` directly and never contain business rules.

### Why the business rules live in `core/domain`

Double-booking and operating-hours checks are the heart of this app. They are implemented as **pure functions** with no React, HTTP, or date-library dependencies, which makes them:

1. trivially unit-testable (see `scheduling.test.ts` — the most exhaustive suite in the repo),
2. reusable on both "client" and "server": the MSW handlers import the same `validateAppointment` the form uses, mirroring a real system where the backend re-validates.

## Key decisions & tradeoffs

| Decision | Rationale | Tradeoff |
|---|---|---|
| **TanStack Query** for server state | Loading/error states, caching and optimistic updates are built in; hand-rolling them with `useEffect` is error-prone boilerplate | One extra dependency; team must know its cache model |
| **MSW** for the mock API | The app consumes a *real* HTTP boundary (visible in DevTools' Network tab) and the exact same handlers power the tests. Swapping to a real backend means changing a base URL, not app code | Slightly more setup than a hardcoded in-memory service |
| **Validation duplicated client + mock-server** | Client-side gives instant feedback before any request; server-side is the source of truth (as in production). Sharing one implementation keeps them in sync | In a real system the server would be another codebase — the duplication would be real and need contract tests |
| **Optimistic updates on all mutations** | The UI feels instant despite the simulated 250 ms latency; rollback + re-sync (`onError` / `onSettled`) keeps the cache honest | Since the form validates before mutating, rollbacks are rare; a conflicting concurrent edit still exercises the path |
| **Move = edit dialog**, not drag & drop | Covers the requirement with far less complexity and is keyboard-accessible by default. DnD is an enhancement, not a replacement (it would still need the dialog for a11y) | Less "flashy"; DnD via `dnd-kit` is the natural next step |
| **Native `<dialog>`** | Focus trap, `Escape` handling and backdrop for free — less code than a modal library and accessible by default | Needs very recent browsers (fine for this scope) |
| **Local ISO datetimes, no timezone handling** | A clinic scheduler is inherently local-time; storing UTC would add conversion complexity with no user benefit at this scope | Multi-timezone support would require storing zone info per clinic |
| **Plain CSS + CSS Modules** | Zero styling dependencies; component styles are scoped where it matters (grid, dialog) | No design system; a larger app would want tokens/theming |
| **30-minute slot buttons in the grid** | Every empty slot is a real `<button>` ("Create appointment for Alice at 09:30"), so creating at a specific time works with keyboard and screen readers — not just mouse clicks | ~72 buttons per day rendered; negligible at this scale |

## Testing philosophy

- **Domain rules get the deepest coverage** (`scheduling.test.ts`): boundaries (touching edges, exact opening/closing times), conflicts, the edit-exclusion rule. These are the tests that prevent real scheduling bugs.
- **UI tests target behavior, not implementation** (`SchedulePage.test.tsx`): they render the page, talk through the real HTTP layer to the MSW server, and assert what a user sees — loading state, seeded data, a rejected double-booking, a successful creation.
- Deliberately not tested: styling, trivial rendering, and the mock server internals (it's test infrastructure).
- A full **manual acceptance checklist** mapping every requirement to an observable test lives in [TESTING.md](./TESTING.md).

## Accessibility considerations

- Native `<dialog>` (focus trap, `Escape`, backdrop) with `aria-labelledby`.
- Every form field has a real `<label>`; validation errors render in a `role="alert"` region announced by screen readers.
- Loading state uses `<output>` (implicit `status` role); page landmarks (`main`, `nav`, `section`) with `aria-label`s.
- Full keyboard support: empty slots and appointments are buttons with descriptive `aria-label`s; visible `:focus-visible` outlines everywhere.
- Linted with oxlint's `jsx-a11y` plugin.

## Possible next steps

- Drag & drop moving (`dnd-kit`) on top of the existing validation.
- Week view and a sonographer/clinic filter.
- Toast notifications for background rollback errors.
- End-to-end tests (Playwright) reusing the MSW seed.
