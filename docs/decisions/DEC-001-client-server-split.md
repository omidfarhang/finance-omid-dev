# DEC-001: Client/server split

- **Status:** Accepted
- **Date:** 2026-10-29

## Context

The product needs a durable ledger for balances, imports, and forecasts, and should later support mobile apps or other system integrations without rewriting core financial logic into each client. Domain rules must stay testable and independent of UI details.

## Options considered

- **SPA-only / local storage** — Fast to start; poor multi-device story; hard to share a household later; money logic tends to live in the UI.
- **BFF tightly coupled to one frontend** — Works for a single web app; weak for mobile or third-party clients.
- **REST API as system of record + thin clients** — One authoritative backend; multiple clients over time.

## Decision

Use a NestJS **REST API** as the system of record for accounts, transactions, imports, recurrings, and forecasts. The first client is an Angular PWA. No money correctness logic may live only in the UI; the API validates inputs and enforces authorization when implemented.

## Consequences

- Mobile apps and integrations can reuse the same `/api/v1` contract later.
- Scaffolding and deployment are heavier than a single SPA, but product principles (server validation, separable domain logic) are met.
- Frontend stays a thin client over HTTP.

## Revisit when

A single-process desktop or fully offline-first product becomes the primary target and a shared REST boundary adds more cost than value.
