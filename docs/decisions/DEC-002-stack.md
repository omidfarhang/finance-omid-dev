# DEC-002: Application stack

- **Status:** Accepted
- **Date:** 2026-10-29

## Context

We needed a stack for a REST API, relational persistence, safe validation, and an installable web client. The monorepo scaffold (`apps/api`, `apps/web`, `packages/shared`) is now in place with pnpm and Docker Compose Postgres; this record keeps the chosen stack discoverable.

## Options considered

- **Backend:** NestJS (TypeScript), FastAPI (Python), .NET, Go.
- **Frontend:** Angular vs React for the PWA.
- **UI kit:** PrimeNG vs building a custom component layer or another kit.
- **Persistence / validation:** PostgreSQL + Prisma + Zod vs alternatives (e.g. class-validator only, other ORMs).
- **Repo layout:** Monorepo with shared Zod contracts vs separate repos from day one.

## Decision

- **API:** NestJS + **PostgreSQL** + **Prisma** + **Zod** (shared HTTP DTOs; Prisma models stay server-side).
- **Web:** Angular (standalone) PWA with **PrimeNG** as the sole UI component library (single theme when scaffolded).
- **Layout:** monorepo with `apps/api`, `apps/web`, and `packages/shared` for Zod schemas and shared TypeScript types.
- **Package manager:** **pnpm** workspaces.
- **Local Postgres:** **Docker Compose**.
- Prefer Angular over React unless a future need clearly conflicts with Angular PWA constraints.

### Current major versions (as of 2026-11-01)

- **Node.js** 24 (LTS) for local `engines` and Docker API/web build images; Prisma 7’s install allowlist is 20 / 22 / 24 only.
- **NestJS** 12 (TypeScript 6 for `@nestjs/schematics` peer).
- **Prisma** 7 (`prisma-client` generator + `@prisma/adapter-pg`; `DATABASE_URL` in `prisma.config.ts`).
- **Zod** 4 in `packages/shared` and `apps/api` (keep in lockstep).
- **Web** stays on Angular 22 / TypeScript ~6 separately from the API toolchain.
- **API tests:** Vitest (aligned with Nest 12 defaults and `apps/web`).

## Consequences

- TypeScript can span API, shared contracts, and web client.
- NestJS modules map cleanly to MVP nouns (auth, wallets, accounts, transactions, imports, etc.).
- Local dev depends on pnpm and Compose for Postgres; runtime is Node 24 everywhere (host + Compose images).
- Prisma Client is generated under `apps/api/src/generated/prisma` (not `@prisma/client` in `node_modules`); Docker build must run `prisma generate` before `nest build`.
- API unit/e2e tests run under Vitest; Nest DI still uses `@nestjs/testing`.

## Revisit when

A better package manager or local DB workflow clearly wins; or a product need forces React or a different API style; or Prisma adds Node 26+ to its supported allowlist and we want to move up.
