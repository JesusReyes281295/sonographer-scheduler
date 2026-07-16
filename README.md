# 🩺 Sonographer Scheduler

> A daily scheduling app for sonographers and clinics — **plus an AI skills library that lets the codebase keep improving itself.**

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-build-646CFF?logo=vite&logoColor=white)
![Vitest](https://img.shields.io/badge/tests-18%20passing-6E9F18?logo=vitest&logoColor=white)
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

It's a daily-scheduling tool for sonographers and clinics: a grid where sonographers are columns and hours are rows, and you book, edit, move and cancel appointments across the day.

**What it does:**

- 📅 **Daily schedule grid** with day-to-day navigation.
- ➕ **Create, edit, move and cancel** appointments (moving = changing time or sonographer).
- 🚫 **Double-booking prevention** per sonographer and **clinic operating-hours enforcement** — checked instantly on the client *and* re-validated on the server, exactly like a production system.
- 🇺🇸 **Holiday-aware** — clinics that observe **US federal holidays** block bookings on those days and the app recommends one that's open instead.
- ⚡ **Optimistic UI** — actions feel instant, with automatic rollback if the server says no.
- 🧭 Clear **loading, error (with retry) and empty** states everywhere.
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
npm test             # run the test suite (18 tests: domain rules + UI flows)
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

## 🗺️ Roadmap

📋 **The detailed, living plan — what's done, what's next, step by step — lives in
[`docs/ROADMAP.md`](./docs/ROADMAP.md).** Work ships as **one pull request per feature.**

On the way:

- [ ] 💾 **Local-first persistence** — your data survives reloads with zero setup (no database to install).
- [ ] 🧑‍⚕️ **Patients & consultation types** as first-class, customizable entities (names + icons).
- [ ] 🏥 **Hospital management UI** — set up the app for a specific clinic in minutes.
- [ ] 🔀 **Drag-and-drop** appointment moving on top of the existing validation.
- [ ] 🗓️ **Week view** and sonographer/clinic filters.
- [ ] 🧪 **End-to-end tests** reusing the seed data.
- [ ] 🎬 **Guided demo tour** to learn every feature (exit anytime with `Escape`).

_Deferred for now:_ a hosted backend (the app is already backend-ready — see the plan) and
wiring the review skills into CI/CD.

---

## 🤝 Conventions

- **Branching:** work happens on feature branches → merged into `development` (the default branch); `qa` and `prod` are promotion targets.
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, …).
- **Skills first:** every skill analyzes before it changes anything and works in small, verifiable steps — the build and tests stay green throughout.

---

## 🙌 Questions or ideas?

This is an evolving project — feedback, questions and suggestions are all welcome. Open an issue and let's talk. 💬
