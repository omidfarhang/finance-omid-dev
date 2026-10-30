# Slice: Statement import and deduplication

Pluggable CSV import for MVP. Product rules: [DEC-012](../decisions/DEC-012-import-adapters.md), [DEC-006](../decisions/DEC-006-money-multi-currency.md). Depends on [transactions.md](transactions.md). Parent: [mvp.md](mvp.md). UI: [ui-ux.md](ui-ux.md) `/import`.

## Goals

- Upload a statement file against a chosen account and adapter
- First adapter: `generic_csv` with a documented synthetic column layout
- Create income/expense transactions from rows (no transfers via import in MVP)
- Re-importing the same rows skips duplicates; response reports created vs skipped counts
- Never silently infer rial vs toman — unit is explicit in the CSV

## Out of scope

Per-bank adapters, Excel, transfer detection from statements, editing import batches after commit, FX.

## Generic CSV contract (`generic_csv`)

UTF-8 CSV with header row:

| Column | Required | Notes |
| --- | --- | --- |
| `date` | yes | ISO date `YYYY-MM-DD` or ISO datetime |
| `amount` | yes | Positive integer string of minor units (no decimals) |
| `type` | yes | `INCOME` or `EXPENSE` |
| `description` | no | Free text |
| `external_id` | no | Stable id from source; used in dedupe when present |
| `unit` | yes | Must equal `minor` (documents that amounts are already minor units of the account currency) |

Rows with any other `unit` value are rejected for that row (or whole file fails validation — prefer fail the file with a clear error).

## Schema

- **ImportBatch:** `id`, `userId`, `accountId`, `adapterId`, `originalFilename`, `createdCount`, `skippedDuplicateCount`, `createdAt`
- **Transaction** extensions:
  - `importBatchId` optional FK
  - `dedupeKey` optional string; unique per `(accountId, dedupeKey)` when not null

### Dedupe identity

```text
dedupeKey = external_id
  if present and non-empty
  else sha256("generic_csv|" + date + "|" + type + "|" + amount + "|" + normalized_description)
```

Normalized description: trim + collapse internal whitespace. Key is scoped by unique `(accountId, dedupeKey)`.

## API (`/api/v1`)

| Route | Behavior |
| --- | --- |
| `GET /imports/adapters` | List adapter ids + labels (at least `generic_csv`) |
| `POST /imports` | `multipart/form-data`: `file`, `accountId`, `adapterId` → `{ batch, created, skippedDuplicate }` |

User must be a member of `accountId`. Created rows are `INCOME`/`EXPENSE` only.

## UI (`/import`)

- Choose account, choose adapter, upload file
- Show result counts; link to Activity / account detail
- Empty state until first successful import

## Acceptance

- Importing a synthetic CSV creates matching ledger rows and updates balances
- Importing the same file again creates zero new transactions; skipped count equals row count
- Invalid `unit` (not `minor`) fails with a clear error and creates no rows
- No real bank statements required in the repository
