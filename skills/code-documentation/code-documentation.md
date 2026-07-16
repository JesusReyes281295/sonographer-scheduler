---
name: code-documentation
description: Adds concise, useful documentation to code — XML docs/JSDoc/docstrings on public APIs, controller endpoint comments, and README updates. Use when the user asks to document code or a codebase lacks documentation.
type: skill
audience: agent
---

# Skill: Code Documentation

You are helping the user document their code so the next developer (or their future self) understands it quickly — without drowning the code in noise.

## When to use this skill

- The user says: "use @documentation", "document my controllers", "add comments to this code", "this project has no docs".

## Phase 1 — Scope

1. Detect the language → pick the native doc format:

| Language | Format |
|---|---|
| C# | XML doc comments (`/// <summary>`) |
| TypeScript/JavaScript | JSDoc (`/** ... */`) |
| Python | Docstrings (Google or NumPy style — match existing) |
| Java | Javadoc |
| Go | Doc comments (`// FunctionName ...`) |

2. Ask (if unclear): document everything public, or a specific area (e.g. controllers only)?
3. Check for existing doc conventions and match them exactly.

## Phase 2 — What to document (priority order)

1. **Public API surface**: controllers/endpoints, exported functions, public classes and interfaces.
2. **Non-obvious business rules**: why a calculation works that way, domain constraints, magic values.
3. **Contracts and gotchas**: what a method throws, nullability, thread-safety, side effects, units (ms vs s, cents vs dollars).
4. **README**: how to run, configure, and test the project (only if missing or stale).

## Documentation rules

- **Document the WHY and the CONTRACT, not the HOW.** Never write comments that restate the code (`// increments i`).
- Keep summaries to 1–2 sentences. If a method needs a paragraph to explain, flag it as a refactor candidate instead.
- Include `param`/`returns`/`throws` (or equivalents) only when they add information beyond the signature — always for exceptions and units.
- For endpoints, document: purpose, success response, error responses, auth requirement. Example (C#):

```csharp
/// <summary>
/// Returns the paginated list of orders for the authenticated customer.
/// </summary>
/// <param name="page">1-based page number. Defaults to 1.</param>
/// <param name="pageSize">Items per page (max 100). Defaults to 20.</param>
/// <response code="200">The page of orders.</response>
/// <response code="401">Missing or invalid token.</response>
[HttpGet]
public async Task<ActionResult<PagedResult<OrderDto>>> GetOrders(int page = 1, int pageSize = 20)
```

- If the project uses OpenAPI/Swagger, wire doc comments into it (e.g. enable XML docs in Swashbuckle) rather than duplicating.
- Do not change any code behavior while documenting. Documentation-only diffs.

## Phase 3 — Execute

1. Work file by file in the agreed scope.
2. For each file: add docs to public members, add inline comments ONLY where the logic is genuinely non-obvious.
3. Delete or fix comments that are wrong or outdated (a wrong comment is worse than none) — list these changes explicitly.
4. Build/lint at the end to confirm nothing broke (doc comments can break builds with doc-warnings-as-errors).

## Phase 4 — Report

- Files documented and count of members covered.
- Outdated/wrong comments corrected.
- Refactor candidates found (methods too complex to summarize).
- README changes, if any.
