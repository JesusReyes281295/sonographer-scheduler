---
name: api-design
description: Designs or reviews REST APIs — resource naming, HTTP methods and status codes, versioning, pagination, error contracts, and consistency. Use when creating new endpoints or auditing an existing API.
type: skill
audience: agent
---

# Skill: REST API Design

You are helping the user design new API endpoints or review existing ones for consistency and correctness.

## When to use this skill

- The user says: "use @apidesign", "design endpoints for X", "review my API", "is this endpoint RESTful?".

## Phase 1 — Inventory

- **New API:** list the resources (nouns) and the operations each needs.
- **Existing API:** enumerate current routes (from controllers/router files) and check them against the conventions below; report violations in a table before proposing changes. Renaming routes is a **breaking change** — always propose additive/versioned migration.

## Conventions to apply

### Resources & URLs
- Plural nouns, no verbs: `GET /orders`, not `GET /getOrders`.
- Nesting max 1 level for ownership: `/customers/{id}/orders`. Deeper → use query filters.
- kebab-case in URLs, no trailing slashes, no file extensions.
- Actions that don't map to CRUD → sub-resource or action endpoint: `POST /orders/{id}/cancel` (document it as an RPC-style exception).

### Methods & status codes
| Operation | Method | Success | Notes |
|---|---|---|---|
| List | GET | 200 | Always paginated |
| Get one | GET | 200 / 404 | |
| Create | POST | 201 + Location header | Return the created resource |
| Full update | PUT | 200 | Idempotent |
| Partial update | PATCH | 200 | |
| Delete | DELETE | 204 / 404 | Idempotent |

Errors: 400 validation, 401 unauthenticated, 403 forbidden, 404 not found, 409 conflict, 422 semantic validation (pick 400 OR 422 and be consistent), 500 never leaks internals.

### Error contract
One consistent envelope everywhere — recommend RFC 7807 (Problem Details):

```json
{
  "type": "https://api.example.com/errors/validation",
  "title": "Validation failed",
  "status": 400,
  "errors": { "email": ["must be a valid email address"] },
  "traceId": "00-abc..."
}
```

### Pagination, filtering, sorting
- `GET /orders?page=1&pageSize=20&sortBy=createdAt&order=desc&status=paid`
- Response includes metadata: `{ "items": [...], "page": 1, "pageSize": 20, "totalItems": 342, "totalPages": 18 }`
- Enforce a max page size. Cursor pagination for very large/append-only sets.

### Versioning
- URL versioning is the pragmatic default: `/api/v1/...`.
- Never break v1 consumers: additive changes are fine; removals/renames require v2.

### Requests/responses
- DTOs only — never expose ORM entities.
- camelCase JSON properties; ISO 8601 UTC dates; IDs as strings if they may outgrow int.
- Validate at the edge; reject unknown enum values explicitly.

### Security baseline
- Auth on everything non-public by default (opt-out, not opt-in).
- Rate limiting on public endpoints, request size limits, no sensitive data in URLs.

## Phase 2 — Deliverable

For a new design, produce an endpoint table:

```
| Endpoint | Method | Auth | Request | Success | Errors | Notes |
|---|---|---|---|---|---|---|
| /api/v1/orders | GET | Bearer | page,pageSize,status | 200 PagedResult<OrderDto> | 401 | |
| /api/v1/orders | POST | Bearer | CreateOrderRequest | 201 OrderDto | 400,401,409 | Location header |
```

Plus: the error envelope definition, DTO shapes for the main resources, and OpenAPI annotations if the stack supports them.

For a review: violations table (route → rule broken → suggested fix → breaking? yes/no), then apply approved fixes.
