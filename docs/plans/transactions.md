# Slice: Transactions and transfers

Manual ledger movements for MVP. Product rules: [DEC-005](../decisions/DEC-005-wallets-and-accounts.md), [DEC-006](../decisions/DEC-006-money-multi-currency.md), [DEC-016](../decisions/DEC-016-category-catalog.md). Parent scope: [mvp.md](mvp.md). UI slots: [ui-ux.md](ui-ux.md).

## Goals

- Record income and expense on a single account (integer minor units)
- Same-currency transfers between two accounts the user can access; never counted as income or expense
- Optional `shared` mark on personal-account expenses (full amount on payer; no automatic IOU)
- Required typed categories for income, expense, and transfer (separate lists; app catalog + user CRUD; icons + palette colors)
- Edit amount and metadata, or delete, a wrong movement after add (account and type are fixed — delete + re-add to change those)
- Displayed account balance = opening balance ± signed movements
- Session-guarded API; access via account membership (same 404 pattern as wallets/accounts)

## Out of scope

Imports, recurrings, forecast, FX, cross-currency transfers, split/settlement ledger, editing opening balance, changing account or type via edit, chart rendering by category color, import-time category mapping, hiding app-provided categories.

## Schema

- **Category:**
  - `userId` (owner)
  - `kind`: `INCOME` | `EXPENSE` | `TRANSFER`
  - `name` — unique per `(userId, kind, name)` (English fallback for system rows; free text for user rows)
  - `code` — stable slug for app-provided rows (`uncategorized`, `salary`, …); null for user rows; unique per `(userId, kind, code)` when set
  - `icon` — required; PrimeIcons id from shared allowlist
  - `color` — required; palette key from shared allowlist (`slate`, `red`, `orange`, `amber`, `lime`, `emerald`, `cyan`, `blue`, `violet`, `pink`)
  - `isSystem` — true for all app-provided catalog rows; not deletable; name/icon/color edits blocked
  - Defaults seeded on register (and backfilled): all catalog rows `isSystem`; UI labels via Transloco `categories.<code>` ([DEC-016](../decisions/DEC-016-category-catalog.md))
    - **INCOME:** uncategorized, salary, freelance, business, investments, interest, rental, gifts, refunds, bonus, other
    - **EXPENSE:** uncategorized, groceries, dining, transport, fuel, housing, utilities, telecom, health, insurance, shopping, clothing, entertainment, subscriptions, education, travel, personal_care, pets, family, taxes, fees, charity, other
    - **TRANSFER:** uncategorized, savings, investments, debt_payment, cash, between_accounts, other
- **Transaction:**
  - `type`: `INCOME` | `EXPENSE` | `TRANSFER`
  - `accountId` — primary account (income/expense account; for transfer = source / from)
  - `counterAccountId` — required for `TRANSFER` (destination); null otherwise
  - `amountMinor` — always **positive** `BigInt` (sign comes from type + transfer direction)
  - `occurredAt` — when the movement happened (UTC instant)
  - `description` — optional short text
  - `categoryId` — **required** for all types; must match category `kind` to transaction `type`
  - `shared` — boolean; only meaningful for `EXPENSE` on a non-shared (personal) account; ignored/false otherwise
  - `transferGroupId` — UUID linking the logical transfer (same id on the single stored transfer row)
  - `createdByUserId` — who recorded it
  - `createdAt` / `updatedAt`

One row per income, expense, or transfer. A transfer is a single row that adjusts both accounts (debit `accountId`, credit `counterAccountId`).

### Balance formula

For account `A`:

```text
balanceMinor(A) =
  openingBalanceMinor(A)
  + sum(amountMinor of INCOME where accountId = A)
  - sum(amountMinor of EXPENSE where accountId = A)
  - sum(amountMinor of TRANSFER where accountId = A)   // outflow
  + sum(amountMinor of TRANSFER where counterAccountId = A)  // inflow
```

Income/expense totals for reports exclude `TRANSFER` rows.

## Money on the wire

JSON money fields are **digit strings** (integer minor units). Prisma stores `BigInt`. No silent rial/toman inference.

## API (`/api/v1`)

| Area | Routes |
| --- | --- |
| Categories | `GET/POST /categories` (list query: `kind?`), `PATCH/DELETE /categories/:id` |
| Transactions | `GET /transactions` (query: `accountId?`, `from?`, `to?`, `type?`), `POST /transactions`, `GET/PATCH/DELETE /transactions/:id` |

### Create body

- Income/expense: `{ type, accountId, amountMinor, occurredAt, categoryId, description?, shared? }` — `categoryId` required and must belong to the user with matching `kind`
- Transfer: `{ type: "TRANSFER", accountId, counterAccountId, amountMinor, occurredAt, categoryId, description? }` — currencies of both accounts must match; user must be a member of both; `accountId ≠ counterAccountId`; `categoryId` required (`TRANSFER` kind)

### Update body (`PATCH`)

- Income/expense: `{ amountMinor?, occurredAt?, description?, categoryId?, shared? }` — cannot clear `categoryId`; cannot change `accountId` or `type`
- Transfer: `{ amountMinor?, occurredAt?, description?, categoryId? }` — cannot clear `categoryId`; cannot change accounts

### Categories

- Create: `{ name, kind, icon, color }` — user-owned (`isSystem` false, `code` null)
- Update: `{ name?, icon?, color? }` — rejected for `isSystem` rows
- Delete: rejected for `isSystem`; otherwise reassign that category’s transactions to Uncategorized of the same kind, then delete

### List

Returns chronological actuals (newest first by default). Time range filters on `occurredAt`. Never includes forecast rows.

Unknown or inaccessible ids return **404**.

## UI (fill existing slots)

- **Shared Add dialog**: one create entry point on Home, Activity, and Account detail — SelectButton (icon + label) for Income / Expense / Transfer; required category on all types (icon + color + localized label); shared-cost mark on personal-account expense; Account detail preselects the current account
- **Activity** (`/activity`): surface-panel ledger; live filters (time range presets + custom from/to, account, type) + client-side search; per-currency period summary (income/expense/net; transfers separate); day-grouped list; shared Add; row click → type-specific edit; delete from edit dialog with confirm; category chip (icon/color) on rows
- **Home**: recent income/expense log + shared Add (transfers created here show on Activity, not in home recent)
- **Account detail**: movements list with edit/delete; shared Add; type-specific edit dialogs
- **Settings**: three surface panels (Income / Expense / Transfer) — system catalog read-only; user add/edit/delete with icon + color pickers

## Acceptance

- Opening balance plus recorded movements reproduces displayed account balance
- Manual income and expense can be entered, listed, filtered by time range, edited (amount + metadata), and deleted
- Edit cannot change account or type; those require delete + re-add
- Same-currency transfer adjusts both balances and is not counted as income or expense; transfer requires a TRANSFER category
- Cross-currency transfer is rejected
- `shared` mark allowed only on personal-account expenses; does not change amount
- Every movement has a category of the matching kind
- New users get the full app catalog; all system rows (including Uncategorized) cannot be removed or edited
- User can add/edit/delete non-system categories (name, icon, color) in Settings
- System category labels follow UI language via `code`; icons and palette colors display in lists and pickers
- Amounts are integer minor units; IRR toman is display-only
- Mutating routes require an authenticated session and account membership
