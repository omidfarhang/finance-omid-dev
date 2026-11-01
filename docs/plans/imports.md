# Slice: Statement import and deduplication

Pluggable statement import. Product rules: [DEC-012](../decisions/DEC-012-import-adapters.md), [DEC-006](../decisions/DEC-006-money-multi-currency.md). Depends on [transactions.md](transactions.md). Parent: [mvp.md](mvp.md). UI: [ui-ux.md](ui-ux.md) import dialog. Bank layout notes: [bank-formats.md](../brainstorm/bank-formats.md).

## Goals

- Upload a statement file against a chosen account and adapter
- Adapters: `generic_csv` (synthetic CSV) and `blubank_xlsx` (BluBank Excel export)
- Create income/expense transactions from rows (no transfers via import in MVP)
- Assign each imported income/expense the user’s system **Uncategorized** category of matching kind ([transactions.md](transactions.md)); no importer category picker in MVP
- Re-importing the same rows skips duplicates; response reports created vs skipped counts
- Never silently infer rial vs toman — unit must be explicit in the adapter contract / file labeling

## Out of scope

Additional bank adapters beyond those listed, transfer detection from statements, editing import batches after commit, FX, category mapping at import time.

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

## BluBank Excel contract (`blubank_xlsx`)

BluBank (بلو) account statement `.xlsx` export. Layout research: [bank-formats.md](../brainstorm/bank-formats.md).

- **Target account currency:** must be `IRR` (amounts are rials labeled by the bank).
- **Header row** (after metadata): columns include `مانده (ریال)`, `برداشت (ریال)`, `واریز (ریال)`, `نوع تراکنش`, `شرح سند`, `شماره سند`, `تاریخ`, `ردیف`. Adapter **requires** debit/credit headers to contain `(ریال)` — never treat unlabeled amounts as rial or toman.
- **Dates:** Jalali wall-clock `YYYY/MM/DD HH:mm:ss` (e.g. `1405/08/10 11:32:22`), interpreted in `Asia/Tehran`, stored as UTC instants.
- **Type / amount:** non-zero `برداشت (ریال)` → `EXPENSE`; non-zero `واریز (ریال)` → `INCOME`. Both non-zero on one row fails. Amounts are integer rials (IRR minor units; no scaling).
- **Description:** `شرح سند` (trimmed); bank `نوع تراکنش` may be prefixed when useful.
- **Dedupe:**

```text
dedupeKey = "blubank_xlsx|" + شماره سند + "|" + type + "|" + amount + "|" + jalali_datetime
  when شماره سند is present and non-empty
  else sha256("blubank_xlsx|" + jalali_datetime + "|" + type + "|" + amount + "|" + normalized_description)
```

`شماره سند` alone is not unique (fee + parent transfer can share it); type + amount + datetime disambiguate.

Fixture: `apps/api/test/fixtures/blubank-statement.xlsx`. UI sample: `apps/web/public/samples/blubank_xlsx.xlsx`.

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
| `GET /imports/adapters` | List adapter ids + labels + `samplePath` (`generic_csv`, `blubank_xlsx`, …) |
| `POST /imports` | `multipart/form-data`: `file`, `accountId`, `adapterId` → `{ batch, created, skippedDuplicate }` |

User must be a member of `accountId`. Created rows are `INCOME`/`EXPENSE` only, each with `categoryId` set to Uncategorized for that kind (seed defaults if missing).

## UI (import dialog)

- Shared dialog opened from **Activity** (header Import next to Add; account picker shown) and **Account detail** (Import next to Add; account fixed to that account — no account picker)
- Choose adapter, upload file; each adapter exposes a **`samplePath`** (synthetic fixture under web `/samples/`) — the dialog shows a single format-agnostic sample download link for the **selected** adapter (not a CSV-specific field label)
- Show created / skipped-duplicate counts after success; parent list refreshes on success; legacy `/import` redirects to Activity

## Acceptance

- Importing a synthetic CSV creates matching ledger rows and updates balances
- Importing a synthetic BluBank `.xlsx` creates matching IRR income/expense rows (Jalali → UTC)
- Imported income/expense rows use Uncategorized of the matching kind
- Importing the same file again creates zero new transactions; skipped count equals row count
- Invalid `unit` (not `minor`) on `generic_csv` fails with a clear error and creates no rows
- BluBank file whose debit/credit headers omit `(ریال)`, or import into a non-`IRR` account, fails clearly
- No real bank statements required in the repository
