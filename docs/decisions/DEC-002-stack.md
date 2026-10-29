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

## Consequences

- TypeScript can span API, shared contracts, and web client.
- NestJS modules map cleanly to MVP nouns (auth, wallets, accounts, transactions, imports, etc.).
- Local dev depends on pnpm and Compose for Postgres.

## Revisit when

A better package manager or local DB workflow clearly wins; or a product need forces React or a different API style.
