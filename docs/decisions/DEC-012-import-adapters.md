# DEC-012: Import adapter model

- **Status:** Accepted
- **Date:** 2026-10-30

## Context

Bank and broker exports use different CSV/Excel layouts. MVP needs a safe first import path without locking to one bank, and re-import must not silently duplicate ledger rows. Amount unit ambiguity (e.g. rial vs toman) must never be inferred silently ([DEC-006](DEC-006-money-multi-currency.md)).

## Options considered

- Hard-code one bank’s CSV parser in the transactions module.
- Single generic CSV with fixed columns for MVP; pluggable adapters registered by id for later banks.
- User-defined column mapping UI in MVP.

## Decision

- Imports go through a **pluggable adapter** identified by a stable string id (e.g. `generic_csv`).
- Each adapter parses upload bytes into normalized create-transaction inputs (account chosen by the user at import time; amounts already in that account’s minor units per adapter contract).
- **First adapter:** `generic_csv` — synthetic/fixture-friendly CSV with an explicit unit column or header contract so rial/toman is never guessed.
- **Bank adapters:** register additional adapters by id as layouts are documented (e.g. `blubank_xlsx` for BluBank Excel). Each adapter owns its unit contract (explicit bank labeling or synthetic `unit` column); never silent rial/toman inference.
- **Deduplication:** each imported row gets a deterministic `dedupeKey` scoped to the target account; unique constraint prevents silent duplicates; re-import reports `created` and `skippedDuplicate` counts.

## Consequences

- Transaction creation from import shares the same balance rules as manual entry.
- Adapter registry lives in the API; UI picks adapter id + account + file.
- Tests use only synthetic fixtures (no real statements in git).
- Excel and CSV both go through the same import pipeline; binary uploads are passed to adapters that need them.

## Revisit when

Further bank layouts need adapters, or user column-mapping becomes necessary for unsupported banks.
