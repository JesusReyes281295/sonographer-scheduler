---
name: model-selection
description: Helps the user pick the right Claude model, effort level, and thinking mode for a task, optimizing for the lowest token cost that still gets the job done. Includes a decision diagram (model-selection-diagram.svg).
type: skill
audience: agent
---

# Skill: Model, Effort & Thinking Selection

You are helping the user choose **which Claude model**, **which effort level**, and **whether thinking is needed** for a given task — spending as few tokens as possible without hurting quality.

A visual decision flowchart lives next to this file: `model-selection-diagram.svg`.

## When to use this skill

- The user says: "use @modelselection", "which model should I use for X?", "how do I save tokens?", "should I enable thinking?".

## Step 1 — Classify the task

Ask (or infer from context) these three things:

1. **Complexity** — trivial / standard / complex / frontier.
2. **Volume** — one-off, or thousands of calls (batch/production)?
3. **Cost of a mistake** — is a wrong answer cheap to catch (tests, review) or expensive?

## Step 2 — Pick the model

| Model | ID | Price in/out per 1M tokens | Use for |
|---|---|---|---|
| Haiku 4.5 | `claude-haiku-4-5` | $1 / $5 | Trivial + high volume: classification, extraction, formatting, simple Q&A, subagents doing scoped searches |
| Sonnet 4.6 | `claude-sonnet-4-6` | $3 / $15 | Standard dev work on a budget (previous-gen Sonnet) |
| Sonnet 5 | `claude-sonnet-5` | $3 / $15 (intro $2 / $10 until 2026-08-31) | **Default for most coding**: features, tests, docs, refactors — near-Opus quality at Sonnet cost |
| Opus 4.8 | `claude-opus-4-8` | $5 / $25 | Complex: multi-file refactors, architecture, hard debugging, long agentic runs |
| Fable 5 | `claude-fable-5` | $10 / $50 | Frontier: hardest long-horizon problems only; thinking always on |

Decision heuristics:

- **Start one tier lower than your instinct.** If output quality fails, move up one tier — that costs less than defaulting high everywhere.
- **Mistake cheap to catch → cheaper model.** Tests and code review are your safety net.
- **High-volume pipeline → Haiku first**, and evaluate on a sample of ~50 before committing. Consider the Batch API (50% discount) if latency doesn't matter.
- **Mixed workloads → split them.** Orchestrate with Sonnet/Opus, delegate scoped subtasks (search, summarize, classify) to Haiku subagents.

## Step 3 — Pick the effort level

`effort` is set via `output_config: {effort: "..."}` (API) or the model settings in Claude Code. Default is `high`.

| Effort | When | Token impact |
|---|---|---|
| `low` | Trivial/scoped tasks, latency-sensitive, subagents | Fewest tokens: consolidated tool calls, terse output |
| `medium` | Cost-sensitive routine work | Good balance for simple CRUD, docs, small fixes |
| `high` | Default for real dev work | Balanced quality vs. spend |
| `xhigh` | Hard coding/agentic tasks (Opus 4.7+, Sonnet 5, Fable 5) | Best results for complex work; more tokens |
| `max` | Correctness matters more than cost | Most expensive; can overthink — test before adopting |

Rule of thumb: **lower the effort before lowering the model** for routine work on a capable model, and **raise effort before switching model up** when results are shallow.

## Step 4 — Decide on thinking

- Modern models (4.6+) use **adaptive thinking** — the model decides when to think. Recommended default: leave it on (`thinking: {type: "adaptive"}`); control depth with `effort`, not with thinking toggles.
- **Fable 5**: thinking is always on and cannot be disabled — omit the parameter.
- Disable thinking (`{type: "disabled"}`, where supported) only for: high-volume trivial calls, strict latency budgets, or pure formatting/extraction. Pair with `effort: low`.
- Old-style `budget_tokens` is deprecated/removed on current models — never recommend it.

## Step 5 — Token-saving checklist (independent of model)

1. **Prompt caching** — put stable content (system prompt, tool defs, big docs) first and cache it; cached reads cost ~10% of input price.
2. **Batch API** — 50% off for non-urgent bulk work.
3. **Trim context** — send only relevant files/sections, not whole repos.
4. **Structured outputs** — schema-constrained JSON avoids retries on malformed output.
5. **Cap `max_tokens`** sensibly for short-output tasks (e.g. 256 for classification).
6. **Subagents at low effort** for fan-out work; keep the expensive model for synthesis.

## Output format

Give the user a single recommendation block:

```
Task: <restated>
Model: <id> — <why in one line>
Effort: <level> — <why>
Thinking: adaptive | disabled — <why>
Extra savings: <the 1–3 checklist items that apply>
Estimated relative cost vs. defaulting to Opus/high: ~<X>%
```

If the user is unsure, recommend running a 5–10 sample eval on the cheaper option before committing.
