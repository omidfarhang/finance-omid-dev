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

Prerequisites: Node 24 (LTS), [pnpm](https://pnpm.io), Docker.

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

Self-hosted under **https://finance.omid.dev**. Compose runs Postgres, the NestJS API, and nginx (Angular SPA + `/api/` proxy). Host nginx terminates TLS and proxies to the published port ([DEC-008](docs/decisions/DEC-008-self-hosted-docker.md)). App images are built on every push to `master` and published to GHCR; the server only pulls and starts them ([DEC-018](docs/decisions/DEC-018-ci-container-images.md)).

**CI (once):** add repo secret `PRIMENG_LICENSE` (free Community key from https://primeui.dev) so the web image build clears the PrimeUI banner. The `api` and `web` GHCR packages must be **public** so the server can pull anonymously; GitHub has no API for this, so if a package ever shows as private, use Package settings → Change visibility.

**Server — first time:**

```bash
cp .env.example .env
# Set SESSION_SECRET, POSTGRES_PASSWORD, DATABASE_URL, CORS_ORIGIN=https://finance.omid.dev
docker compose pull
docker compose up -d
```

**Server — after each merge to `master` (wait for Actions to finish):**

```bash
git pull && docker compose pull && docker compose up -d
```

App listens on **http://127.0.0.1:8080** by default (`APP_PORT`). If that host port is taken, set e.g. `APP_PORT=9080` in `.env` and point nginx at the same port — see [docs/nginx-reverse-proxy.conf.example](docs/nginx-reverse-proxy.conf.example).

## Documentation map

| Document | Purpose |
| --- | --- |
| [docs/vision.md](docs/vision.md) | Why this exists, principles, non-goals |
| [docs/design.md](docs/design.md) | Living system architecture overview |
| [docs/plans/mvp.md](docs/plans/mvp.md) | First useful release and acceptance criteria |
| [docs/plans/ui-ux.md](docs/plans/ui-ux.md) | UI sitemap, shells, hybrid home, screen patterns |
| [docs/plans/balance-checkpoints.md](docs/plans/balance-checkpoints.md) | Dated known balances; gaps; replaces opening balance |
| [docs/brainstorm/inbox.md](docs/brainstorm/inbox.md) | Unfiltered ideas and questions |
| [docs/decisions/](docs/decisions/) | Expensive-to-reverse product and architecture choices |
| [tasks/todo.md](tasks/todo.md) | Work ready to do |
| [tasks/backlog.md](tasks/backlog.md) | Potential future work (not a commitment) |
| [AGENTS.md](AGENTS.md) | Rules for AI coding agents and contributors |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to propose and submit changes |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Community standards |
| [SECURITY.md](SECURITY.md) | Vulnerability reporting |
| [LICENSE](LICENSE) | MIT license |

## Idea workflow

1. Capture in the inbox
2. Triage (clarify, dedupe, reject, or park)
3. Backlog if worth considering
4. Plan or specification when scope and behavior matter
5. Todo when ready to implement
6. Done when verified

Brainstorm items are not requirements until they land in the MVP, a specification, or the todo list.

## Privacy

Never commit real bank statements, account numbers, credentials, or personal financial records. Use synthetic fixtures for examples and tests. See `.gitignore` and [SECURITY.md](SECURITY.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). By participating, you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE) © 2026 Omid Farhang ([DEC-014](docs/decisions/DEC-014-mit-license.md)).
