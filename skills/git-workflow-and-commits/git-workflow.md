---
name: git-workflow
description: Sets up and enforces a clean Git workflow — branch naming, conventional commits, PR structure, and .gitignore hygiene. Use when starting a repo, cleaning up history habits, or standardizing a team's flow.
type: skill
audience: agent
---

# Skill: Git Workflow

You are helping the user work with Git in a clean, consistent way: branches, commits, and pull requests.

## When to use this skill

- The user says: "use @gitworkflow", "help me write this commit", "set up branching for my repo", "review my git habits".

## Branching model

Recommend by team size:

- **Solo / small team → GitHub Flow**: `main` always deployable; short-lived branches per change; merge via PR.
- **Release-train / multiple environments → Git Flow lite**: `main` (prod) + `develop` + feature branches. Only if they truly need it — flag the extra complexity.

Branch naming:

```
feature/<ticket-or-short-description>   feature/orders-pagination
fix/<short-description>                 fix/null-ref-on-checkout
chore/<short-description>               chore/upgrade-dotnet-8
hotfix/<short-description>              hotfix/payment-timeout
```

Rules: lowercase, kebab-case, no spaces, delete after merge.

## Commits — Conventional Commits

Format: `type(scope): imperative summary` (≤ 72 chars), blank line, optional body explaining WHY.

```
feat(orders): add cursor pagination to GET /orders

The endpoint returned unbounded lists and timed out for large
customers. Cursor-based to keep results stable under inserts.
```

Types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`, `build`, `ci`.

Rules:
- One logical change per commit — split unrelated changes.
- Never commit: secrets, build output, `node_modules`, IDE folders. Verify `.gitignore` covers the stack (generate from gitignore.io templates if missing).
- `BREAKING CHANGE:` footer when the public contract changes.
- When the user asks you to commit: stage explicitly (`git add <paths>`, avoid blanket `git add .` when unrelated changes exist), show the message before committing if the change is ambiguous.

## Pull requests

Structure every PR description as:

```
## What
One-paragraph summary of the change.

## Why
Link to ticket / motivation.

## How to test
Steps or commands a reviewer can run.

## Notes
Breaking changes, follow-ups, screenshots (UI).
```

Rules:
- Small PRs (< ~400 changed lines) — split big work into stacked/sequential PRs.
- PR title follows the same conventional format as commits.
- Never merge red CI. Prefer squash-merge for messy branches, merge commit for curated history — match repo convention.

## Useful recovery recipes (share when relevant)

| Situation | Command |
|---|---|
| Undo last commit, keep changes | `git reset --soft HEAD~1` |
| Discard uncommitted changes to a file | `git checkout -- <file>` (destructive — confirm first) |
| Amend last commit message | `git commit --amend` (only if not pushed) |
| Move a commit to the right branch | `git cherry-pick <sha>` then remove from wrong branch |
| See what changed | `git log --oneline --graph -15`, `git diff main...HEAD` |

## Rules for the agent

- Never run destructive git commands (`reset --hard`, `push --force`, `checkout --`) without explicit confirmation, and always name a safer alternative if one exists.
- Never skip hooks (`--no-verify`) unless the user explicitly asks.
- Commit only when asked; on the default branch, create a branch first.
