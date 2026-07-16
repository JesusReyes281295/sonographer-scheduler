# 🗺️ Project Roadmap & Living Plan

> **This is the single source of truth for what is done and what is left.**
> Any contributor — human or AI agent — should read this file first, work on
> **one feature per branch/PR**, and update this document (status table +
> checkboxes + changelog) **inside the same PR** that delivers the work.

The application being planned here lives in [`../sonographer-scheduler/`](../sonographer-scheduler).
The reusable skills that guide the work live in [`../skills/`](../skills).

---

## 📖 How to use this document (read me first, agent)

1. **Before starting**, find the feature below. If its status is `⬜ Not started`,
   flip it to `🟡 In progress` in the dashboard and start on its branch.
2. **Work in small, verifiable steps** — the checklist inside each feature is
   ordered so the build and tests stay green after every step.
3. **One PR per feature.** Branch off `development`, open the PR into `development`.
4. **When done**, in the SAME PR: tick the feature's checkboxes, set its status to
   `✅ Done (PR #N)`, add a line to the [Changelog](#-changelog), and update the
   root `README.md` if the feature is user-visible.
5. **Never regress the baseline**: `npm test`, `npm run lint`, `npm run build`
   must all pass before a PR is ready.

**Status legend:** ⬜ Not started · 🟡 In progress · ✅ Done · ⏸️ Deferred

---

## 📊 Dashboard

| # | Feature | Branch | PR | Status |
|---|---|---|---|---|
| — | Baseline app (grid, create/edit/move/delete, validation, optimistic UI, 18 tests) | `feature/skills-library-and-scheduler-app` | #1 | ✅ Done |
| — | Root README (front door) | `docs/root-readme` | — | 🟡 In progress |
| — | This planning document | `docs/root-readme` | — | 🟡 In progress |
| 1 | Local-first persistence (survives reload, zero setup) | `feat/local-first-persistence` | — | ⬜ Not started |
| 2 | Patients & consultation types as first-class entities | `feat/patients-and-consultation-types` | — | ⬜ Not started |
| 3 | Richer seed data (a realistic hospital day) | `feat/richer-seed-data` | — | ⬜ Not started |
| 4 | Hospital management UI (personalization) | `feat/hospital-management-ui` | — | ⬜ Not started |
| 5 | Drag-and-drop appointment moving | `feat/drag-and-drop-move` | — | ⬜ Not started |
| 6 | Week view + sonographer/clinic filters | `feat/week-view-and-filters` | — | ⬜ Not started |
| 7 | End-to-end tests (Playwright) | `test/e2e-playwright` | — | ⬜ Not started |
| 8 | Guided demo / product tour | `feat/guided-demo-tour` | — | ⬜ Not started |

**Deferred (documented, not built now):** hosted real backend · CI/CD auto-review. See [Deferred](#-deferred--future-milestones).

---

## ✅ Current state (baseline — already done)

Delivered in PR #1. Do **not** re-plan these; build on top of them.

- Daily schedule grid (sonographers as columns, hours as rows) with day navigation.
- Create, edit, **move** (= re-time / re-assign in the edit dialog) and delete appointments.
- Double-booking prevention + clinic operating-hours enforcement, validated on **both**
  client (`src/core/domain/scheduling.ts`) and mock server (`src/mocks/handlers.ts`).
- Optimistic UI updates with rollback (TanStack Query).
- Loading / error (with retry) / empty states everywhere.
- Accessibility: native `<dialog>`, labelled fields, keyboard support, `jsx-a11y` lint.
- Tests: 18 passing (domain unit tests + page integration tests against MSW).

**Key files to know:**
- Domain: `src/core/domain/{types,scheduling,time}.ts`
- Mock API: `src/mocks/{data,db,handlers}.ts`
- Feature: `src/features/schedule/{components,hooks,services}/`

---

## 🔒 Locked decisions

These were confirmed with the product owner — do not silently change them.

| Decision | Choice | Rationale |
|---|---|---|
| **Personalization** | In-app management UI | Most demo-able and product-like; lets you configure a hospital without editing code. |
| **Persistence / "backend"** | **Local-first** (localStorage/IndexedDB behind the existing `/api/*` boundary) | Runs on download with **zero DB install**; data survives reload/close and can be reset. The app stays *backend-ready* (swap to a hosted server = base-URL change). |
| **Hosted backend** | ⏸️ Deferred | Kept as a documented future milestone so the "download & run" story stays intact. |
| **Patient** | First-class entity (not just a name string) | Required so patients can be managed and reused across appointments. |
| **CI/CD auto-review** | ⏸️ Deferred | Explicitly postponed by the product owner. |

---

## 🧩 Features

Ordering reflects dependencies: **1 → 2 → 3** build the data foundation, **4** is the
personalization UI on top of it, **5 → 6** are UX differentiators, and **7 → 8**
(tests + demo) come last so they cover finished features.

---

### 1. Local-first persistence 💾
**Branch:** `feat/local-first-persistence` · **Status:** ⬜ Not started

**Goal:** Make the mock data survive page reloads/closes with zero setup, so the app
behaves like it has a real backend while requiring no database install.

**Why it differentiates:** "Download, `npm run dev`, and your data is still there
tomorrow." Modern local-first UX; keeps the backend-ready architecture.

**Depends on:** nothing (do this first).

**Steps:**
- [ ] Introduce a small storage adapter (e.g. `src/mocks/storage.ts`) wrapping
      `localStorage` (or IndexedDB) with JSON (de)serialization and a schema version key.
- [ ] Make the in-memory `db` (`src/mocks/db.ts`) load its collections from storage on
      init and persist after every mutating operation (create/update/delete).
- [ ] Seed only when storage is empty (first run); otherwise hydrate from storage.
- [ ] Add a "Reset to sample data" action (clears storage → re-seeds) reachable from the UI.
- [ ] Guard against corrupt/old-schema data (version mismatch → reset with a console warning).
- [ ] Tests: reset the store between test runs so integration tests stay deterministic
      (persistence must not leak state across tests).

**Definition of done:**
- Creating an appointment, reloading the page, and seeing it still there works.
- "Reset to sample data" restores the original seed.
- All existing tests still pass (no cross-test state leakage).

---

### 2. Patients & consultation types as first-class entities 🧑‍⚕️
**Branch:** `feat/patients-and-consultation-types` · **Status:** ⬜ Not started

**Goal:** Turn the free-text `patientName` into a real `Patient` entity, and add a
`ConsultationType` entity (name + icon + default duration + color) referenced by appointments.

**Why it differentiates:** Real scheduling systems book *a patient* for *a type of study*.
Icons + types make the grid readable at a glance and set up personalization.

**Depends on:** #1 (so new collections persist).

**Steps:**
- [ ] Extend `src/core/domain/types.ts`: add `Patient { id, name, mrn?, dob?, notes? }`
      and `ConsultationType { id, name, icon, defaultDurationMinutes, color? }`.
- [ ] Change `Appointment` to reference `patientId` and `consultationTypeId`
      (keep a resolved display name for the grid; plan a migration for existing data).
- [ ] Add collections + CRUD to `src/mocks/db.ts` and GET/POST/PUT/DELETE handlers in
      `src/mocks/handlers.ts` for `/api/patients` and `/api/consultation-types`.
- [ ] Add typed service calls in `src/features/schedule/services/` and query hooks.
- [ ] Update `AppointmentFormDialog`: pick an existing patient (or quick-add) and a
      consultation type; auto-fill duration from the type; show the type icon.
- [ ] Render the consultation-type icon on appointment cards in `ScheduleGrid`.
- [ ] Tests: domain/type updates + a handler test for the new endpoints + form flow test.

**Definition of done:**
- An appointment stores `patientId` + `consultationTypeId`; the grid shows patient name + type icon.
- New patients/types created in the form persist (via #1) and are reusable.
- Tests green.

---

### 3. Richer seed data 🌱
**Branch:** `feat/richer-seed-data` · **Status:** ⬜ Not started

**Goal:** Ship a believable "hospital day" so the app looks alive on first run.

**Why it differentiates:** Empty apps feel like demos; a full, realistic schedule sells it.

**Depends on:** #2 (so the seed can include patients + consultation types).

**Steps:**
- [ ] Expand `src/mocks/data.ts`: ~5–6 sonographers, ~3 clinics, ~10–15 patients,
      ~6–8 consultation types (OB, abdominal, doppler, thyroid, MSK, vascular…).
- [ ] Generate a fuller day of appointments spread across sonographers/clinics/times
      (and optionally a couple of neighbouring days) with varied notes.
- [ ] Ensure seed data respects the domain rules (no overlaps, within opening hours)
      so the app never opens in an invalid state.
- [ ] Keep seed generation deterministic enough that tests relying on it stay stable
      (or isolate test seed from demo seed).

**Definition of done:**
- Fresh run shows a busy, valid, realistic schedule.
- Tests unaffected (or updated intentionally).

---

### 4. Hospital management UI (personalization) 🏥
**Branch:** `feat/hospital-management-ui` · **Status:** ⬜ Not started

**Goal:** A Settings/Admin area to configure the app for a specific hospital: add/edit/delete
clinics (name, hours, color, icon), sonographers (name, color/avatar), patients, and
consultation types (name, icon) — no code editing required.

**Why it differentiates:** "Set it up for *your* clinic in minutes." This is the headline
personalization feature the product owner asked for.

**Depends on:** #1 (persistence), #2 (entities + CRUD endpoints).

**Steps:**
- [ ] Add a "Manage / Settings" entry point (route or panel) reachable from the header.
- [ ] Build management lists with add/edit/delete for: Clinics, Sonographers, Patients,
      Consultation types — reusing the CRUD endpoints and query hooks.
- [ ] Icon + color pickers (a curated icon set in `public/icons.svg`; simple color swatches).
- [ ] Validation + guard rails: block deleting an entity referenced by existing appointments
      (or offer reassignment); clear inline errors.
- [ ] Reflect changes live in the schedule (query invalidation) and persist them (via #1).
- [ ] Tests: management CRUD flows + the "cannot delete a referenced entity" rule.

**Definition of done:**
- A user can create a new clinic + sonographers + patients + consultation types and
  immediately schedule with them, all persisted across reloads.
- Deleting referenced entities is safely prevented/handled.
- Tests green; README updated with a short "Customize for your hospital" section.

---

### 5. Drag-and-drop appointment moving 🔀
**Branch:** `feat/drag-and-drop-move` · **Status:** ⬜ Not started

**Goal:** Let users drag an appointment to a new time/sonographer, on top of the existing
validation — the edit dialog stays as the accessible fallback.

**Why it differentiates:** The expected "wow" interaction for a scheduler, done without
losing keyboard accessibility.

**Depends on:** existing validation (present); nice-to-have after #3 for a fuller board.

**Steps:**
- [ ] Add `@dnd-kit/core` and make appointment cards draggable, slots droppable.
- [ ] On drop, build the updated draft and run the **same** `validateAppointment` before
      committing; reject invalid drops with the existing error UI (no silent failure).
- [ ] Reuse the existing optimistic update mutation so a rejected move rolls back.
- [ ] Keep the edit-dialog move path intact as the keyboard-accessible equivalent.
- [ ] Accessibility: dnd-kit keyboard sensor + `aria-live` announcements for moves.
- [ ] Tests: a valid drag updates the appointment; an invalid drag (overlap / off-hours)
      is rejected and rolled back.

**Definition of done:**
- Dragging works with mouse and keyboard; invalid moves are blocked with feedback.
- Tests green.

---

### 6. Week view + filters 🗓️
**Branch:** `feat/week-view-and-filters` · **Status:** ⬜ Not started

**Goal:** A weekly overview and filters by sonographer and/or clinic.

**Why it differentiates:** Planning at a glance across the week; filtering scales the UI
to a real hospital's volume.

**Depends on:** #3 (richer data makes it meaningful); independent of #4/#5.

**Steps:**
- [ ] Add a Day/Week view toggle; build a week grid (7 day columns) reusing slot/card components.
- [ ] Extend the appointments query to fetch a date range for the week.
- [ ] Add filter controls (multi-select sonographers, clinics); apply to both views.
- [ ] Persist the chosen view + filters (via #1) so they survive reloads.
- [ ] Keep empty/loading/error states correct in both views.
- [ ] Tests: week view renders the right days; filters narrow the visible appointments.

**Definition of done:**
- Switching Day/Week works; filters correctly scope both views; state persists.
- Tests green.

---

### 7. End-to-end tests (Playwright) 🧪
**Branch:** `test/e2e-playwright` · **Status:** ⬜ Not started

**Goal:** Browser E2E tests covering the critical journeys, reusing the MSW seed.

**Why it differentiates:** Proves the whole stack works in a real browser, not just units.

**Depends on:** the features it covers being stable (do after #4–#6).

**Steps:**
- [ ] Add Playwright + config; run against the dev server (or a preview build) with MSW.
- [ ] E2E: create an appointment; edit/move it; get blocked by a double-booking; delete it.
- [ ] E2E: personalize (add a clinic/sonographer) and schedule with it.
- [ ] E2E: complete the guided demo (once #8 exists) — or leave a placeholder.
- [ ] Wire `npm run test:e2e`; document it in `TESTING.md`.

**Definition of done:**
- `npm run test:e2e` passes locally covering the journeys above.
- `TESTING.md` updated.

---

### 8. Guided demo / product tour 🎬
**Branch:** `feat/guided-demo-tour` · **Status:** ⬜ Not started

**Goal:** A "Demo" button that launches a step-by-step guided tour teaching every feature,
with examples, that the user can exit at any time via a "Finish demo" button **or `Escape`**.

**Why it differentiates:** Onboarding that lets anyone learn the app in two minutes — a
strong "sellable" touch for an evaluation. **Left for last (per product owner).**

**Depends on:** the features it showcases (#1–#6) being in place.

**Steps:**
- [ ] Add a "Demo" button in the header that starts the tour.
- [ ] Build a lightweight guided-tour overlay (spotlight on a target element + tooltip with
      Back / Next / step counter). Prefer a tiny custom component or a small library
      evaluated via the model/dependency conventions — keep it accessible.
- [ ] Script steps: navigate the day, create an appointment, trigger a double-booking to
      show validation, move an appointment, open management to personalize, switch to week view.
- [ ] Optionally seed a temporary "demo dataset" and restore the user's data on exit
      (so the tour doesn't pollute real data).
- [ ] Exit paths: "Finish demo" button **and** `Escape` both end the tour immediately and
      restore normal state; focus returns to the trigger.
- [ ] Accessibility: focus management, `aria` on the tooltip, no keyboard trap, respects
      `prefers-reduced-motion`.
- [ ] Tests: starting the tour, stepping Next/Back, and exiting via button and via `Escape`.

**Definition of done:**
- The tour walks through every major feature with examples.
- It can be finished anytime via the button or `Escape`, leaving the app in a clean state.
- Tests green; README mentions the demo.

---

## ⏸️ Deferred / future milestones

Documented so they're not forgotten — **not** in scope right now.

- **Hosted real backend.** The app is already backend-ready (talks HTTP to `/api/*`).
  A future milestone can add a real server + database and repoint the base URL, without
  rewriting the UI. Local-first persistence (#1) covers the "works on download" need until then.
- **CI/CD auto-review.** Wire the `security-review` and `code-review` skills into the
  pipeline as automated PR checks. Postponed by the product owner.

---

## 📝 Changelog

Append one line per merged PR (newest first). Keep the dashboard in sync.

- _(pending)_ PR #— · docs: root README + this planning document — `docs/root-readme`.
- PR #1 · Baseline app + skills library + CLAUDE.md — `feature/skills-library-and-scheduler-app`.
