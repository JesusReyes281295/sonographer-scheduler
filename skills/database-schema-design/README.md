# Database Schema Design

Designs new relational schemas or reviews existing ones: tables, keys, relationships, types (money as decimal, dates in UTC), indexes, and migrations — normalized by default, denormalized only with a named reason.

## Files
- `database-design.md` — the schema design/review skill.

## Use it when
- You're modeling data for a new feature or project.
- Queries are slow and you suspect missing indexes or bad modeling.
- You want naming and migration conventions enforced consistently.

## Invoke
```
Use @skills/database-schema-design/database-design.md to design the tables for orders, products and customers
```
