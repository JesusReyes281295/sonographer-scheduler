# Authentication & Authorization

Implements auth correctly using framework-native mechanisms: JWT or session auth, argon2/bcrypt password handling, refresh token rotation, deny-by-default authorization with roles/policies, and server-side ownership checks (the #1 API hole). Recommends managed identity providers when viable instead of building your own.

## Files
- `auth-implementation.md` — the auth skill.

## Use it when
- Adding login/registration to an app or API.
- Protecting endpoints with roles or permissions.
- Your current auth is hand-rolled and you suspect it's wrong.

## Invoke
```
Use @skills/auth-implementation/auth-implementation.md to add JWT auth with roles to my API
```
