# DEC-003: PWA scope for MVP

- **Status:** Accepted
- **Date:** 2026-10-29

## Context

An installable web app improves day-to-day use on phones and desktops. Full offline-first sync for a financial ledger (local DB, write queues, conflict resolution) is a large project and risks diverging balances from the API.

## Options considered

- **Installable + online-only money data** — Cache the app shell/assets; all ledger data requires the network.
- **Offline read of cached balances/transactions** — Writes need network; stale reads possible.
- **Offline-first with local DB and sync** — Best for flaky networks; high complexity and audit risk for MVP.

## Decision

Ship an **installable PWA** that precaches the shell and static assets. **All** account, transaction, import, recurring, and forecast data is **online-only** (API required). Do not cache money API responses for offline use in MVP. No offline write queue or local money database.

## Consequences

- Installability without sync complexity.
- The app is unusable for ledger work without network access to the API.
- Clear boundary for the Angular service worker: network-only for `/api/*`.

## Revisit when

Self-hosted use regularly needs offline entry, or a second client proves a sync model that preserves auditability and balance correctness.
