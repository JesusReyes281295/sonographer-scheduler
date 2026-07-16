---
name: ci-cd-pipeline
description: Sets up or improves CI/CD pipelines (GitHub Actions, Azure DevOps, GitLab CI) — build, test, quality gates, and deployment stages with sensible caching and secrets handling.
type: skill
audience: agent
---

# Skill: CI/CD Pipeline Setup

You are helping the user create or improve a CI/CD pipeline: every push builds and tests automatically; releases deploy through a repeatable path.

## When to use this skill

- The user says: "use @cicd", "add GitHub Actions to my repo", "automate my deploys", "my pipeline is slow/flaky".

## Phase 1 — Assess

1. Detect: repo host (GitHub/Azure DevOps/GitLab) → pick the native CI (Actions / Azure Pipelines / GitLab CI). Existing pipeline files? Improve, don't replace, unless asked.
2. Detect the stack and its build/test commands (from project files, not assumptions).
3. Ask only what's missing: deploy target (Azure/AWS/Vercel/Railway/none yet), environments (just prod? staging?), and whether deploys should be automatic or approved.

## Phase 2 — CI (always applicable)

A minimal, correct CI runs on every PR and push to main:

1. **Checkout + toolchain setup** (pinned versions — match local dev).
2. **Dependency restore with caching** (lockfile-keyed cache: `actions/cache` or `setup-*` built-in caching).
3. **Build** (fail on warnings only if repo already does).
4. **Tests** with results published; coverage collected if the repo measures it.
5. **Static checks** if configured in repo: linter, formatter check, `npm audit`/`dotnet list package --vulnerable` (report, don't block, unless the team decides).

Rules:
- CI must be **deterministic**: pinned action versions (`@v4`, not `@main`), locked dependencies, no `latest` docker tags.
- **Fast feedback**: fail fast, parallelize independent jobs (lint ∥ test), target < 10 min.
- PR-triggered runs never touch secrets/deploys.

Example skeleton (GitHub Actions, adapt to detected stack):

```yaml
name: ci
on:
  push: { branches: [main] }
  pull_request:
jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4   # or setup-node / setup-python
        with: { dotnet-version: '8.0.x' }
      - run: dotnet restore
      - run: dotnet build --no-restore -c Release
      - run: dotnet test --no-build -c Release --logger trx
```

## Phase 3 — CD (only if there's a deploy target)

- **Trigger**: merge to main → deploy to staging automatically; production behind a manual approval (environment protection rules) unless the user wants full continuous deployment.
- **Build once, deploy many**: produce one artifact/image in CI, promote the SAME artifact through environments — never rebuild per environment.
- **Secrets**: platform secret store (Actions secrets/environments, Azure Key Vault, GitLab variables). Never in YAML, never echoed in logs. Prefer OIDC/workload identity over long-lived cloud keys when the platform supports it.
- **Config per environment**: environment variables/app settings, not code branches.
- **Rollback story**: state it explicitly (redeploy previous artifact / slot swap / revert commit). A pipeline without a rollback path is incomplete.
- Health check after deploy; fail the run if the app doesn't come up.

## Phase 4 — Verify

1. Push a trivial change / open a draft PR and confirm the pipeline runs green.
2. Confirm cache hits on the second run (compare durations).
3. Walk the user through where to see results and how approvals work.

## Rules

- Start minimal (build+test) and add stages only with a reason — pipelines rot when over-engineered.
- Flaky tests are pipeline poison: quarantine + ticket, never `retry: 3` as a permanent fix.
- Any script > ~5 lines goes in a versioned script file called by the pipeline, not inline YAML.
