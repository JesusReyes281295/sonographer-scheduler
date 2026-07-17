# Manual Acceptance Checklist

A step-by-step verification script mapping every requirement (and bonus) of the original brief to a concrete, observable test — plus quick spot-checks for everything the app grew beyond it.

**Setup:** run `npm run dev` and open http://localhost:5173.

**Seed data reference.** The sample data covers **7 sonographers and 10 clinics** with a full day of appointments **anchored to "today"** (it re-anchors every time the app opens, and also seeds a few appointments on the next two days). Your own changes **persist across reloads** — to start fresh, clear the site's data (DevTools → Application → Clear site data). The rows the tests below rely on:

| Appointment | Sonographer | Clinic | Time |
|---|---|---|---|
| Maria Lopez | Alice Chen | Downtown Imaging | 09:00–10:00 |
| James Field | Brian Osei | Northside Clinic | 10:30–11:30 |
| Priya Patel | Alice Chen | Downtown Imaging | 13:00–14:00 |

Clinic hours: **Downtown Imaging 08:00–17:00** · **Northside Clinic 09:00–15:00** (hover any clinic chip for its hours).

---

## 1. Daily schedule display

- [ ] On load, the grid shows one column per sonographer (avatar + ARDMS credentials in the header), hours 07:00–19:00, and today's seeded appointments colored by clinic.
- [ ] On today, a red **now line** marks the current time, the grid opens scrolled to it, and appointments that already ended appear faded.
- [ ] The **Clinics** legend shows every clinic as a colour-tinted chip; hovering shows its hours, and clicking one filters the schedule to it.
- [ ] **← Previous / Today / Next →** change the day; the date picker next to the date jumps straight to any day.
- [ ] Navigating a week ahead shows an empty grid plus the empty-state message ("No appointments for this day yet…"). **Today** returns to the seeded view.

## 2. Create, edit, delete, move

- [ ] **Create via slot**: click an empty slot (e.g. Carla Reyes at 11:00) → dialog opens with that sonographer and time pre-filled; type a patient name (existing names autocomplete and pull up their phone; new names are registered on the fly), Save → the appointment appears in the grid.
- [ ] **Create via button**: "New appointment" opens the dialog with defaults.
- [ ] **Edit**: click "Maria Lopez" → dialog opens pre-filled; change the patient name → the grid reflects it.
- [ ] **Move (drag)**: drag a card up or down to another time, or sideways to another sonographer — it snaps into the slot and persists.
- [ ] **Move (dialog)**: editing the time, sonographer or date in the dialog still moves it too (the keyboard-accessible path).
- [ ] **Move (day)**: in the Week view, drag a card to another day's column; dropping it on a date before today asks for confirmation first.
- [ ] **Book again**: open a saved appointment → "Book again" starts a new booking pre-filled with the same patient, study and clinic.
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
- [ ] **Local-first persistence**: create an appointment, refresh (F5) → it's still there. The mock server stores its data in `localStorage` behind the same `/api/*` boundary — no database to install, yet nothing is lost on reload. (Clear site data to return to the seed.)

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
npm test        # 64 passing: domain rules, holiday calendar, persistence, week layout + UI flows
npm run lint    # oxlint with jsx-a11y plugin — no warnings
npm run build   # strict TypeScript type-check + production bundle
```

## 10. Bonus — Documentation

- [ ] `README.md` covers: how to run, architecture and dependency rule, a decisions-and-tradeoffs table, testing philosophy, and accessibility notes.
- [ ] The root `README.md` adds a 30-second demo video, the full tech stack, and a demo-to-production infrastructure guide; the Word **User Manual** at the repo root walks every feature with screenshots.

## 11. Beyond the brief — quick spot-checks

The app kept growing after the six requirements were met. One observable check for each addition:

- [ ] **Week view**: the Day/Week toggle shows the whole week; overlapping appointments sit side by side and expand on hover.
- [ ] **Filters**: the Filters panel (or clicking a clinic chip) narrows both views; the selection survives a reload.
- [ ] **Holiday-aware**: set an appointment's date to July 4 at Northside Clinic (observes US holidays) → blocked, with open clinics suggested; Downtown (open on holidays) accepts it.
- [ ] **Manage**: add a clinic/sonographer/patient/study type, edit its colour or credentials → the schedule updates immediately; deleting anything still used by an appointment is refused.
- [ ] **Reports**: Reports → This week → live preview with totals; grouping and column toggles change it; "Print report" prints exactly the preview.
- [ ] **Printing**: any saved appointment prints a clean one-page summary (patient, phone, study, clinic, time).
- [ ] **Tutorial**: the Tutorial button walks 11 spotlight steps over the real UI; Escape leaves at any time.
- [ ] **Learn more**: the landing page describes what the app does today and the roadmap.

---

**Pass criteria:** every box checked = all 6 requirements and all 4 bonus items verified (sections 1–10), plus every beyond-the-brief feature behaving as described (section 11).
