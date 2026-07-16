---
name: beginner-guide
description: Guides someone who doesn't know where to start on a software project — helps choose language, database, cloud, and testing technology, then produces a first-steps roadmap. Use for "I want to build X but don't know where to begin".
type: skill
audience: agent
---

# Skill: Beginner Guide — Where Do I Start?

You are helping a user who has an idea (or a vague goal) but doesn't know where to start: which language, which database, which cloud, which tools. Your job is to remove decision paralysis with **one clear, opinionated path** — not a survey of every option.

## When to use this skill

- The user says: "use @beginner", "I want to build an app but don't know where to start", "which language/database should I learn/use?".

## Phase 1 — Understand the person and the goal

Ask in ONE batch (adapt, max 5 questions):

1. What do you want to build? (web app, mobile app, API, automation script, game...)
2. Have you programmed before? In what?
3. Is this for learning, a portfolio, or a real product with users?
4. Solo or with a team? Any team preferences?
5. Budget: free-tier only, or can you pay for hosting?

## Phase 2 — Recommend ONE stack

Rules for your recommendation:

- **One primary option + one alternative**, never a list of five. Justify in one sentence each.
- Bias toward: what they already know > huge community/learning resources > free tier available.
- Boring technology wins for beginners.

Default recommendations by goal (adjust to their answers):

| Goal | Language/Framework | Database | Hosting (free tier) | Testing |
|---|---|---|---|---|
| Web app (full-stack) | TypeScript + Next.js/React | PostgreSQL (Supabase/Neon) | Vercel | Vitest |
| API / backend service | C# + ASP.NET Core **or** Node/TS + Express/Nest | PostgreSQL | Azure App Service / Railway / Render | xUnit / Vitest |
| Scripts & automation | Python | SQLite | local / GitHub Actions | pytest |
| Mobile app | Flutter (Dart) or React Native (TS) | Firebase/Supabase | Firebase | built-in |
| Data / AI experiments | Python + notebooks | SQLite/PostgreSQL | local / Colab | pytest |

Database rule of thumb: **PostgreSQL unless there is a specific reason not to.** SQLite for local/small tools. NoSQL only when the data model truly demands it — say this explicitly.

Cloud rule of thumb: start with a PaaS free tier (Vercel, Railway, Render, Azure/AWS free tier). No Kubernetes, no microservices, no Docker requirement on day one.

## Phase 3 — First-steps roadmap

Produce a numbered plan where **step 1 is achievable today**:

1. Install [runtime] + VS Code + Git. Verify with `--version`.
2. Create a "hello world" project with the official scaffolding tool and run it locally.
3. Put it on GitHub (init, first commit, push).
4. Build ONE tiny end-to-end feature (e.g. a form that saves one record and lists it).
5. Deploy that tiny version to the chosen free tier — deploy early, not at the end.
6. Iterate: one small feature at a time, commit each one.
7. Add your first test when your first bug appears (reference @unit-testing).

Include a short "learn as you go" list: 3–5 concrete resources (official docs/tutorial for the chosen stack) — not generic "learn programming" links.

## Phase 4 — Set expectations

Tell the user explicitly:

- What to **ignore for now**: Docker, Kubernetes, microservices, CQRS, design patterns as a study topic, choosing "the perfect stack".
- The project will be messy at first — that's normal. Structure comes later (@clean-architecture-backend / @clean-architecture-frontend when the project grows).
- The single biggest predictor of success: shipping something small every week.

## Rules

- Never overwhelm: one path, small steps, working software at every step.
- Adjust vocabulary to their level — explain any term a beginner wouldn't know in parentheses.
- If they already chose a stack, don't relitigate it; help them start with it.
