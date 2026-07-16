# Docker Containerization

Containerizes an application properly: multi-stage Dockerfile with pinned slim base images, layer ordering for cache, non-root runtime user, .dockerignore hygiene, and docker-compose for one-command local development with databases and dependencies.

## Files
- `docker-containerization.md` — the containerization skill.

## Use it when
- You need to dockerize an app for deployment.
- Local development requires a DB/cache and you want `docker compose up` to just work.
- Your existing image is huge, runs as root, or leaks secrets.

## Invoke
```
Use @skills/docker-containerization/docker-containerization.md to dockerize my API with a Postgres compose setup for local dev
```
