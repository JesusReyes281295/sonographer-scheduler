---
name: docker-containerization
description: Containerizes an application correctly — multi-stage Dockerfile, small secure images, docker-compose for local development, and .dockerignore hygiene. Use when the user wants to dockerize a project.
type: skill
audience: agent
---

# Skill: Docker Containerization

You are helping the user containerize their application with images that are small, secure, and reproducible.

## When to use this skill

- The user says: "use @docker", "dockerize my app", "create a Dockerfile", "set up docker-compose for local dev".

## Phase 1 — Assess

1. Detect the stack, its build output, runtime port, and external dependencies (DB, cache, broker).
2. Check what exists: `Dockerfile`, `compose.yaml`, `.dockerignore` — improve rather than replace.
3. Ask only if unclear: is this for local dev, production deployment, or both?

## Phase 2 — Dockerfile rules

- **Multi-stage always**: build stage with SDK/tooling → runtime stage with only the artifact.
- **Pinned, slim base images**: `mcr.microsoft.com/dotnet/aspnet:8.0-alpine`, `node:22-alpine`, `python:3.12-slim` — never `latest`.
- **Layer ordering for cache**: copy dependency manifests → restore/install → copy source → build. Source changes then don't bust the dependency layer.
- **Non-root user** in the runtime stage.
- **No secrets in images**: no ENV with credentials, no COPY of `.env`. Secrets arrive at runtime.
- `EXPOSE` the port; `HEALTHCHECK` when the platform doesn't provide one externally.

Reference shape (adapt to detected stack):

```dockerfile
# build
FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src
COPY *.sln ./
COPY src/Api/Api.csproj src/Api/
RUN dotnet restore src/Api/Api.csproj
COPY . .
RUN dotnet publish src/Api/Api.csproj -c Release -o /app --no-restore

# runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine
WORKDIR /app
COPY --from=build /app .
RUN adduser -D appuser && chown -R appuser /app
USER appuser
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "Api.dll"]
```

Always create `.dockerignore` (at minimum: `.git`, build outputs, `node_modules`, `.env*`, IDE folders, test artifacts).

## Phase 3 — docker-compose for local dev (if dependencies exist)

- One service per dependency (db, cache...) with pinned image versions, named volumes for data, and healthchecks.
- App config via environment variables; local values in a git-ignored `.env` consumed by compose.
- `depends_on` with `condition: service_healthy` so the app waits for the DB.

```yaml
services:
  api:
    build: .
    ports: ["8080:8080"]
    environment:
      ConnectionStrings__Default: "Host=db;Database=app;Username=app;Password=${DB_PASSWORD}"
    depends_on:
      db: { condition: service_healthy }
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: app
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes: ["dbdata:/var/lib/postgresql/data"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 5s
      retries: 10
volumes:
  dbdata:
```

## Phase 4 — Verify

1. `docker build .` succeeds; note the image size (flag if unexpectedly large and explain why).
2. `docker run` (or `docker compose up`): app starts, port responds, connects to dependencies.
3. Confirm the image runs as non-root (`docker run --rm <img> whoami`).
4. Document in the README: build/run commands and required environment variables.

## Rules

- Local dev experience must stay simple: one command (`docker compose up`) to a working stack.
- Don't add Kubernetes manifests, orchestrators, or registries unless asked — that's a separate task.
- Migrations run as an explicit step/entrypoint decision, documented — never silently on container start without the user agreeing.
