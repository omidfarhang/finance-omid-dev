# System Design

Living architecture overview for this project. Product purpose and scope live in [vision.md](vision.md) and [plans/mvp.md](plans/mvp.md). Rationale for expensive choices lives in [decisions/](decisions/).

**Status:** monorepo scaffolded (`pnpm`, Docker Compose); auth (register/login/optional TOTP/profile) implemented as first coding milestone; self-hosted deploy via Compose under `finance.omid.dev` ([DEC-008](decisions/DEC-008-self-hosted-docker.md)).

When architecture or stack choices change, update this file in the same change set as the related `DEC-NNN` record.

## Shape

- **System of record:** NestJS REST API over PostgreSQL (Prisma).
- **First client:** Angular PWA with PrimeNG; installable shell; money data online-only.
- **Contracts:** Zod schemas in a shared package for HTTP DTOs; do not expose Prisma models to the web app.
- **Money:** integer minor units of each account’s ISO currency; IRR toman only as explicit UI presentation; no FX and no cross-currency net worth ([DEC-006](decisions/DEC-006-money-multi-currency.md)).
- **Identity:** httpOnly cookie sessions; optional TOTP 2FA; profile ([DEC-007](decisions/DEC-007-auth.md)).
- **Household:** personal wallets + optional shared accounts ([DEC-005](decisions/DEC-005-wallets-and-accounts.md)).
- **Deploy:** Docker Compose (`postgres` + `api` + `web`); same-origin `/api` proxy; TLS at host nginx ([DEC-008](decisions/DEC-008-self-hosted-docker.md)).

Decisions: [DEC-001](decisions/DEC-001-client-server-split.md), [DEC-002](decisions/DEC-002-stack.md), [DEC-003](decisions/DEC-003-pwa-scope.md), [DEC-004](decisions/DEC-004-money-storage-display.md) (superseded), [DEC-005](decisions/DEC-005-wallets-and-accounts.md), [DEC-006](decisions/DEC-006-money-multi-currency.md), [DEC-007](decisions/DEC-007-auth.md), [DEC-008](decisions/DEC-008-self-hosted-docker.md).

## Repository layout

```text
/
  apps/
    api/          # NestJS + Prisma
    web/          # Angular + PrimeNG PWA
  packages/
    shared/       # Zod schemas + shared TypeScript types
  docs/
  tasks/
```

- Package manager: **pnpm** workspaces.
- Postgres and production stack: **Docker Compose** ([DEC-008](decisions/DEC-008-self-hosted-docker.md)).

## Runtime

```mermaid
flowchart LR
  browser[Angular_PWA]
  hostNginx[Host_nginx_TLS]
  web[web_nginx]
  api[NestJS_API]
  db[(PostgreSQL)]
  browser -->|HTTPS_finance.omid.dev| hostNginx
  hostNginx -->|HTTP_APP_PORT| web
  web -->|static_SPA| web
  web -->|/api/| api
  api -->|Prisma| db
```

- REST under `/api/v1/...` (JSON; multipart for statement uploads).
- Production web serves the SPA and proxies `/api/` to the API (same-origin cookies).
- Host nginx terminates TLS for `finance.omid.dev` and forwards to Compose `APP_PORT` ([DEC-008](decisions/DEC-008-self-hosted-docker.md)).
- Domain rules (balances, transfers, import deduplication, forecast vs actuals) live in the API and are tested without the UI.
- Authorize mutating API routes ([DEC-007](decisions/DEC-007-auth.md)).

## API module map (MVP)

Aligned with [plans/mvp.md](plans/mvp.md):

| Area | Responsibility |
| --- | --- |
| `auth` | Register, login, logout, session cookies, optional TOTP enroll/verify |
| `users` / profile | Display name, locale/timezone hooks |
| `wallets` | Personal wallets; ownership |
| `accounts` | Accounts (personal or shared), opening balances, per-account currency |
| `transactions` | Manual income/expense; same-currency transfers; optional shared mark on personal expenses |
| `categories` | Categories or tags as needed for daily use |
| `imports` | Pluggable adapters; generic/synthetic CSV first; deduplicated re-import |
| `recurrings` | Recurring rules used for forecast only |
| `forecast` | Next-month outlook from expected income and recurrings; labeled projections; per currency |

## Frontend rules

- Thin client over the API (`apiBaseUrl`); no direct database access; credentials via httpOnly cookies (`withCredentials`).
- PrimeNG is the sole UI component kit (one theme when scaffolded).
- PWA service worker: precache shell/assets; **network-only** for `/api/*` (no offline money cache in MVP).
- RTL-ready hooks for Persian later; Gregorian and Persian dates as product requires.
- Prefer Angular over React unless a future need forces a revisit ([DEC-002](decisions/DEC-002-stack.md)).

## Related docs

| Doc | Role |
| --- | --- |
| [vision.md](vision.md) | Why and principles |
| [plans/mvp.md](plans/mvp.md) | First release scope |
| [decisions/](decisions/) | Decision records |
| [../AGENTS.md](../AGENTS.md) | Contributor / agent rules |
