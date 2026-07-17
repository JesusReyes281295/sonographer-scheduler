# 🩺 Sonographer Scheduler

> A daily scheduling app for sonographers and clinics — **plus an AI skills library that lets the codebase keep improving itself.**

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-build-646CFF?logo=vite&logoColor=white)
![Vitest](https://img.shields.io/badge/tests-64%20passing-6E9F18?logo=vitest&logoColor=white)
![MSW](https://img.shields.io/badge/API-mocked%20with%20MSW-FF6A33)
![Status](https://img.shields.io/badge/status-active-brightgreen)

Welcome! 👋 This repository is **two things that work together**:

1. **A real, working application** — a clinic scheduler you can run locally today.
2. **An AI skills library** — a set of reusable playbooks that let an AI coding agent (like Claude Code) analyze, test, secure, document and refactor this project over time. Think of it as giving the codebase a built-in engineering team it can call on.

> 📌 **This README is a living document.** The project is under active development, so expect this page to grow and change as we add features, wire up automation, and evolve the architecture.

---

## ✨ What's inside

| Part | Where it lives | What it is |
|---|---|---|
| 🗓️ **The application** | [`sonographer-scheduler/`](./sonographer-scheduler) | The actual product: a React + TypeScript daily scheduler. |
| 🤖 **The AI skills library** | [`skills/`](./skills) | 21 project-agnostic playbooks an AI agent follows to keep the project healthy and improving. |
| 🧭 **Agent routing** | [`CLAUDE.md`](./CLAUDE.md) | Tells an AI agent *which* skill to reach for based on what you ask. |

---

## 🗓️ The application

**👉 The full product lives in [`sonographer-scheduler/`](./sonographer-scheduler)** — open that folder for its own detailed README, architecture notes and testing guide.

It's a scheduling tool for sonographers and clinics: a **day** grid (sonographers as columns, hours as rows) and a **week** calendar, where you book, edit, drag-to-reschedule and cancel appointments.

> 📖 **New here?** Read the **[User Manual (Word)](./Sonographer-Scheduler-User-Manual.docx)** for a step-by-step guide to every screen, or take the in-app **Tutorial** for a guided tour.

**What it does:**

- 📅 **Day & week views** with a one-click toggle and date navigation — the app always opens on today's day view.
- 🧭 **Never lose your place** — a red "now" line marks the current time, the grid opens scrolled to it, the hours column stays visible while you scroll, and a date picker jumps straight to any day.
- ➕ **Create, edit and cancel** appointments, with **printable** summaries for any saved one.
- 🖱️ **Drag to reschedule** — move an appointment to another time, another sonographer, or (in the week view) another day, with a confirmation before moving one into a date that already passed; editing via the dialog still works too.
- 🔎 **Filters** by sonographer and clinic — from the Filters panel, or by clicking a clinic chip in the always-visible colour-tinted legend.
- 🎓 **Clinical staff, visibly** — every sonographer column shows an initials avatar and their professional credentials (RDMS, RDCS, RVT…), editable in Manage.
- 🧑‍⚕️ **Patients & study types** — book a patient for a type of ultrasound study; the patient field autocompletes and registers new patients on the fly, and each study type carries its own icon.
- 📞 **Patient phone collected at booking** — auto-filled from the patient's record, saved back when it changes, and shown on printed summaries; ready for the reminders roadmap below.
- 🏥 **Make it your hospital** — a **Manage** panel to add and edit clinics, sonographers, patients and study types (names, icons, colours, opening hours) with no code changes; entities still used by an appointment are protected from deletion.
- 🚫 **Double-booking prevention** per sonographer and **clinic operating-hours enforcement** — checked instantly on the client *and* re-validated on the server, exactly like a production system.
- 🇺🇸 **Holiday-aware** — clinics that observe **US federal holidays** block bookings on those days and the app recommends one that's open instead.
- ⚡ **Optimistic UI** — actions feel instant, with automatic rollback if the server says no.
- 🎬 **Guided tutorial** and an **in-app “Learn more” page** describing the product and its roadmap.
- ♿ **Accessible by default** — full keyboard support, screen-reader labels, focus management.

**Tech stack:** React 19 · TypeScript · Vite · TanStack Query · MSW (mocked REST API — no backend or database needed) · Vitest.

### ▶️ Run it in 3 steps

```bash
cd sonographer-scheduler
npm install
npm run dev          # opens the app; the mock API runs right in your browser
```

Other handy commands (from inside `sonographer-scheduler/`):

```bash
npm test             # run the test suite (64 tests: domain rules, holidays, persistence + UI flows)
npm run lint         # lint with accessibility checks
npm run build        # type-check + production build
```

---

## 🤖 The AI skills library — a codebase that improves itself

Here's the idea that makes this repo special. 💡

Every good engineering practice — testing, security review, refactoring, documentation, performance tuning, API design — is written down as a **skill**: a step-by-step playbook an AI coding agent reads and executes. Instead of that knowledge living only in someone's head, it lives in the repo, ready to run.

**What this unlocks:**

- 🔁 **Self-improvement on demand.** Ask an agent *"audit this project"* or *"add tests for the untested code"* and it follows the matching skill — analyzing first, then making small, verified changes. The project gets healthier every time you use it.
- 🛡️ **Continuous hardening against vulnerabilities.** The [security-review](./skills/security-review) and [code-review](./skills/code-review-checklist) skills give an agent a repeatable checklist for secrets, injection, auth and dependency risks — so security isn't a one-off, it's something you can run again and again.
- ⚙️ **Ready to plug into CI/CD.** Because each skill is a defined, repeatable procedure, these same playbooks can be wired into a pipeline: run a security and code review on every pull request, generate tests, or flag risky changes automatically — turning "best practices we mean to do" into "checks that always happen." *(This automation is on the roadmap below.)*
- 📈 **Consistency.** Every contributor — human or AI — follows the same conventions: analyze before changing, work in small verifiable steps, and report what changed.

### 🌍 These skills are universal

The skills are **not tied to this project.** They're written to be project-agnostic and can be applied to **any codebase that can be worked on with an AI coding agent** — a different language, a different framework, a legacy system, a brand-new API. This scheduler is simply a real example of what you get when you build *with* them.

Want to use them elsewhere? Copy the [`skills/`](./skills) folder (and `CLAUDE.md`) into another project, reference them by path, or register them as native agent skills. See [`skills/README.md`](./skills/README.md) for the full list of 21 skills and how to invoke them.

**A taste of what's available:**

| When you need to… | Skill |
|---|---|
| Understand a codebase you just inherited | Project Analysis |
| Plan a feature before writing code | Task Planning |
| Add or improve tests | Unit Testing |
| Check it's secure | Security Review |
| Clean up messy or oversized code | Safe Refactoring |
| Make it faster | Performance |
| Automate builds & deploys | CI/CD Pipeline |
| …and 14 more | See [`skills/`](./skills) |

---

## 📁 Repository structure

```
.
├── README.md              ← you are here
├── CLAUDE.md              ← how an AI agent routes a request to the right skill
├── sonographer-scheduler/ ← 🗓️ the application (its own README lives here)
└── skills/                ← 🤖 the AI skills library (21 playbooks)
```

---

## 🚀 Coming soon

Where Sonographer Scheduler is headed next:

- 📧 **Reminders by email, WhatsApp & SMS** — automatic confirmations and reminders before each appointment.
- 🗓️ **Any appointment type** — schedule consultations, lab work and other hospital services, not just ultrasound.
- 🎨 **Your hospital, your brand** — add your own logo and colours to the schedule and printouts.
- 📊 **Weekly reports** — automatic weekly and monthly reports on volume, utilisation and no-shows.
- 📱 **Patient self-scheduling** — let patients book an open slot online, with the same rules protecting your calendar.
- 🔔 **Live notifications & waitlists** — fill cancellations instantly from a smart waitlist.
- 📈 **Analytics dashboard** — spot busy hours, idle rooms and bottlenecks at a glance.
- 🔗 **EMR integration** — sync patients and results with your hospital information system.
- 🌐 **Multi-language** — run the whole experience in your team's language.

---

## 🧱 Technical stack & infrastructure tips

_Coming soon._

---

## 🤝 Conventions

- **Branching:** work happens on feature branches → merged into `development` (the default branch); `qa` and `prod` are promotion targets.
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, …).
- **Skills first:** every skill analyzes before it changes anything and works in small, verifiable steps — the build and tests stay green throughout.
