# Personal Finance

A personal finance application for understanding balances, recording income and expenses, importing bank statements, forecasting cash flow, and calculating the real cost of everyday things.

**Status:** monorepo scaffolded; auth and wallets/accounts milestones implemented. Architecture lives in [docs/design.md](docs/design.md) and [docs/decisions/](docs/decisions/).

## Who it is for

- Personal use by the creator first
- Household use with a partner later
- Possible public release after the core workflows are solid

## Repository layout

```text
apps/api          NestJS + Prisma REST API
apps/web          Angular + PrimeNG PWA
packages/shared   Zod HTTP DTOs / shared types
```

## Local development

Prerequisites: Node 20+, [pnpm](https://pnpm.io), Docker.

```bash
cp .env.example .env
cp .env apps/api/.env
pnpm install
pnpm db:up
pnpm --filter @finance/shared build
pnpm db:migrate
pnpm dev:api    # http://localhost:3000/api/v1
pnpm dev:web    # http://localhost:4200
```

For local API/web, set `DATABASE_URL` / `CORS_ORIGIN` to localhost values (see comments in `.env.example`). `pnpm db:up` starts only Postgres.

## Deploy (Docker Compose)

Self-hosted under **https://finance.omid.dev**. Compose runs Postgres, the NestJS API, and nginx (Angular SPA + `/api/` proxy). Host nginx terminates TLS and proxies to the published port ([DEC-008](docs/decisions/DEC-008-self-hosted-docker.md)).

```bash
cp .env.example .env
# Set SESSION_SECRET, POSTGRES_PASSWORD, DATABASE_URL, CORS_ORIGIN=https://finance.omid.dev
docker compose up -d --build
```

App listens on **http://127.0.0.1:8080** by default (`APP_PORT`). If that host port is taken, set e.g. `APP_PORT=9080` in `.env` and point nginx at the same port — see [docs/nginx-reverse-proxy.conf.example](docs/nginx-reverse-proxy.conf.example).

## Documentation map

| Document | Purpose |
| --- | --- |
| [docs/vision.md](docs/vision.md) | Why this exists, principles, non-goals |
| [docs/design.md](docs/design.md) | Living system architecture overview |
| [docs/plans/mvp.md](docs/plans/mvp.md) | First useful release and acceptance criteria |
| [docs/brainstorm/inbox.md](docs/brainstorm/inbox.md) | Unfiltered ideas and questions |
| [docs/decisions/](docs/decisions/) | Expensive-to-reverse product and architecture choices |
| [tasks/todo.md](tasks/todo.md) | Work ready to do |
| [tasks/backlog.md](tasks/backlog.md) | Potential future work (not a commitment) |
| [AGENTS.md](AGENTS.md) | Rules for AI coding agents and contributors |

## Idea workflow

1. Capture in the inbox
2. Triage (clarify, dedupe, reject, or park)
3. Backlog if worth considering
4. Plan or specification when scope and behavior matter
5. Todo when ready to implement
6. Done when verified

Brainstorm items are not requirements until they land in the MVP, a specification, or the todo list.

## Privacy

Never commit real bank statements, account numbers, credentials, or personal financial records. Use synthetic fixtures for examples and tests. See `.gitignore`.
