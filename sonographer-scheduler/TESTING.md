# Manual Acceptance Checklist

A step-by-step verification script mapping every requirement (and bonus) of the technical evaluation to a concrete, observable test.

**Setup:** run `npm run dev` and open http://localhost:5173.

**Seed data reference** (regenerated for "today" on every load):

| Appointment | Sonographer | Clinic | Time |
|---|---|---|---|
| Maria Lopez | Alice Chen | Downtown Imaging | 09:00–10:00 |
| James Field | Brian Osei | Northside Clinic | 10:30–11:30 |
| Priya Patel | Alice Chen | Downtown Imaging | 13:00–14:00 |

Clinic hours: **Downtown Imaging 08:00–17:00** · **Northside Clinic 09:00–15:00**.

---

## 1. Daily schedule display

- [ ] On load, the grid shows 3 columns (Alice Chen, Brian Osei, Carla Reyes), hours 07:00–19:00, and the 3 seeded appointments colored by clinic.
- [ ] The legend at the top lists each clinic with its color and operating hours.
- [ ] **← Previous / Today / Next →** change the day and the date heading.
- [ ] Navigating to tomorrow shows an empty grid plus the empty-state message ("No appointments for this day yet…"). **Today** returns to the seeded view.

## 2. Create, edit, delete, move

- [ ] **Create via slot**: click an empty slot (e.g. Carla Reyes at 11:00) → dialog opens with that sonographer and time pre-filled; enter a patient name, Save → the appointment appears in the grid.
- [ ] **Create via button**: "New appointment" opens the dialog with defaults.
- [ ] **Edit**: click "Maria Lopez" → dialog opens pre-filled; change the patient name → the grid reflects it.
- [ ] **Move (time)**: edit Priya Patel and change 13:00 → 15:00 → the card moves down the column.
- [ ] **Move (sonographer)**: edit an appointment and switch the sonographer → the card moves to the other column.
- [ ] **Move (day)**: edit an appointment and change the date → it disappears from today and appears on that day.
- [ ] **Delete**: edit an appointment → Delete → confirmation prompt → the card disappears.

## 3. Double-booking prevention

- [ ] Create **Alice Chen 09:30–10:30** → rejected with *"This sonographer is already booked from 09:00 to 10:00."* and the appointment does NOT appear.
- [ ] Same slot (09:30–10:30) with **Carla Reyes** → allowed (conflicts are per sonographer, not global).
- [ ] Edge case: **Alice Chen 10:00–11:00** (back-to-back with 09:00–10:00) → allowed; touching edges are not a conflict.
- [ ] **Moving onto a conflict**: edit Priya Patel to 09:30 (Alice already busy 09:00–10:00) → rejected.
- [ ] **Moving within itself**: edit Maria Lopez from 09:00 to 09:15 → allowed (an appointment doesn't conflict with itself).

## 4. Clinic operating hours

- [ ] Downtown Imaging (08:00–17:00): create 07:30–08:30 → rejected with *"Downtown Imaging operates from 08:00 to 17:00."* Same for 16:30–17:30.
- [ ] Northside Clinic: create 08:00–09:00 → rejected (Northside opens at 09:00), even though that time is valid at Downtown — hours depend on the selected clinic.
- [ ] Edge case: exactly 08:00–09:00 at Downtown → allowed (exact boundaries are valid).
- [ ] End before start (10:00–09:00) → *"End time must be after start time."*

## 5. Mocked REST API (no database)

- [ ] DevTools → **Network** tab → reload: real HTTP requests appear — `GET /api/sonographers`, `GET /api/clinics`, `GET /api/appointments?date=...`.
- [ ] Creating/editing/deleting fires `POST` / `PUT` / `DELETE` with proper status codes (201, 200, 204).
- [ ] Force a conflict (test 3) and check the Network tab: the server responds **409** — validation is enforced server-side too, not just in the form.
- [ ] Expected behavior, not a bug: refreshing the page (F5) resets data to the seed — data lives in memory (MSW), by design ("no database required").

## 6. Loading states, error handling, retry

- [ ] **Loading**: reload → the "Loading schedule…" spinner is visible (~250 ms simulated latency). To see it longer: DevTools → Network → throttling "Slow 3G".
- [ ] **Error + retry**: DevTools → Network → **Offline** → navigate to another day → red error banner with a **Retry** button appears. Switch back to **No throttling**, click Retry → the schedule loads.

## 7. Bonus — Optimistic UI

- [ ] With "Slow 3G" throttling, create a valid appointment: the card appears in the grid **immediately**, while the POST request is still pending in the Network tab.
- [ ] (Rollback path is exercised automatically in the test suite; in the UI it only triggers if the server rejects something the form allowed, e.g. a concurrent edit.)

## 8. Bonus — Accessibility (keyboard-only pass)

- [ ] **Tab** reaches everything: day navigation, every empty slot (announced as "Create appointment for X at HH:MM"), and every appointment card.
- [ ] **Enter** on a slot opens the dialog; focus is trapped inside (Tab cycles within); **Escape** closes it.
- [ ] Trigger a validation error → the message renders inside a `role="alert"` region (announced by screen readers).
- [ ] Visible focus outlines on every interactive element while tabbing.

## 9. Bonus — Automated checks (terminal)

```bash
npm test        # 18/18 passing: 15 domain rules + 3 page integration tests
npm run lint    # oxlint with jsx-a11y plugin — no warnings
npm run build   # strict TypeScript type-check + production bundle
```

## 10. Bonus — Documentation

- [ ] `README.md` covers: how to run, architecture and dependency rule, a 9-row decisions-and-tradeoffs table, testing philosophy, and accessibility notes.

---

**Pass criteria:** every box checked = all 6 requirements and all 4 bonus items verified.
