# DEC-002: Application stack

- **Status:** Accepted
- **Date:** 2026-10-29

## Context

The repository is documentation-first with no application code yet. We need a stack that supports a REST API, relational persistence, safe validation, and an installable web client—without locking into tools we are not ready to scaffold.

## Options considered

- **Backend:** NestJS (TypeScript), FastAPI (Python), .NET, Go.
- **Frontend:** Angular vs React for the PWA.
- **UI kit:** PrimeNG vs building a custom component layer or another kit.
- **Persistence / validation:** PostgreSQL + Prisma + Zod vs alternatives (e.g. class-validator only, other ORMs).
- **Repo layout:** Monorepo with shared Zod contracts vs separate repos from day one.

## Decision

- **API:** NestJS + **PostgreSQL** + **Prisma** + **Zod** (shared HTTP DTOs; Prisma models stay server-side).
- **Web:** Angular (standalone) PWA with **PrimeNG** as the sole UI component library (single theme when scaffolded).
- **Layout (intended):** monorepo with `apps/api`, `apps/web`, and `packages/shared` for Zod schemas and shared TypeScript types.
- **Deferred:** package manager choice and Docker (or other) local Postgres tooling—document only in this phase; do not scaffold yet.
- Prefer Angular over React unless a future need clearly conflicts with Angular PWA constraints.

## Consequences

- TypeScript can span API, shared contracts, and web client.
- NestJS modules map cleanly to MVP nouns (accounts, transactions, imports, etc.).
- Monorepo and containerized Postgres remain planned, not implemented, until a scaffolding phase.

## Revisit when

Scaffolding reveals a better package manager or local DB workflow; or a product need forces React or a different API style.
