# DEC-017: Balance checkpoints (replace opening balance)

- **Status:** Accepted
- **Date:** 2026-11-01

## Context

Users need to record the exact bank (or cash) balance at arbitrary times so gaps reveal missing income, expense, or transfers. A single immutable opening balance at account create cannot express mid-history truth checks, and editing opening balance was out of scope. Opening balance is conceptually the same as “known balance at time T.”

## Options considered

- Keep `openingBalanceMinor` and add separate reconciliation snapshots that never affect the ledger formula.
- Replace opening balance with dated **BalanceCheckpoint** rows; earliest is the ledger anchor; later rows are detection-only.
- Allow optional auto-adjustment transactions when a gap is non-zero.
- Compute current balance by rolling forward only from the *latest* checkpoint.

## Decision

- Remove `Account.openingBalanceMinor`. Every account has ≥1 **BalanceCheckpoint** (`asOf`, `balanceMinor`, optional `note`).
- **Displayed balance** = earliest checkpoint (by `asOf`) + signed movements with `occurredAt` after that `asOf`.
- **Gaps** between consecutive checkpoints are detection-only (`recorded − computed` for the window); users fix drift by editing the ledger, not by inventing balancing movements in this slice.
- Account create takes `initialBalanceMinor` + `initialBalanceAsOf` and writes the first checkpoint.
- Existing openings migrate to a checkpoint at `Account.createdAt`.

## Consequences

- Wallets/accounts and transactions plans and APIs drop opening-balance fields and language.
- Activity and account detail must show checkpoints and gaps without mixing them into income/expense totals.
- Contributors must not reintroduce a separate mutable opening balance or silent gap-closing adjustments without a new decision.

## Revisit when

Import adapters expose statement closing balances; household settlement needs sealed periods; or product wants one-click gap adjustments.
