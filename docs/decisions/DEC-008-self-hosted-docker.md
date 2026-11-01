# DEC-008: Self-hosted Docker Compose deploy

- **Status:** Accepted
- **Date:** 2026-10-29

## Context

The app is personal / household, self-hosted under `finance.omid.dev`. Local development already uses Docker Compose for Postgres. We need a one-command production path that matches how other `*.omid.dev` apps are hosted (Compose publishes HTTP on a local port; host nginx terminates TLS).

## Options considered

- TLS and certificates inside Compose (Caddy/Traefik in the stack).
- Separate `docker-compose.prod.yml` vs extending the existing Compose file.
- Expose API and web as separate public ports vs same-origin reverse proxy.

## Decision

- **Full stack in one Compose file:** `postgres`, NestJS `api`, and nginx `web` (static Angular + `/api/` proxy to the API).
- **Same-origin API:** production web uses `apiBaseUrl: '/api/v1'`; container nginx proxies `/api/` to the API service so cookie sessions stay first-party.
- **TLS at host nginx:** Compose publishes only the web container on `127.0.0.1:${APP_PORT:-8080}` (HTTP). Host nginx terminates HTTPS for `finance.omid.dev` and proxies to that port (same pattern as `tools.omid.dev`).
- **Local Postgres unchanged:** `pnpm db:up` still starts only the `postgres` service; full `docker compose up --build` is for deploy.
- **Migrations on boot:** the API container runs `prisma migrate deploy` before listening.
- **Node base image:** API and web build stages use `node:24-bookworm-slim` (same major as local `engines`; see [DEC-002](DEC-002-stack.md)).

## Consequences

- Deploy is `cp .env.example .env`, set secrets, `docker compose up -d --build`, then point host nginx at `APP_PORT`.
- Cookie `Secure` + `CORS_ORIGIN=https://finance.omid.dev` must match the public origin.
- Postgres need not be reachable from the public internet; host bind for `5432` stays localhost-only for local tools.

## Revisit when

Multi-host orchestration, managed Postgres, or a shared edge proxy (Traefik) across all `*.omid.dev` apps clearly wins over per-app host nginx.
