# Slice: Transactions and transfers

Manual ledger movements for MVP. Product rules: [DEC-005](../decisions/DEC-005-wallets-and-accounts.md), [DEC-006](../decisions/DEC-006-money-multi-currency.md). Parent scope: [mvp.md](mvp.md). UI slots: [ui-ux.md](ui-ux.md).

## Goals

- Record income and expense on a single account (integer minor units)
- Same-currency transfers between two accounts the user can access; never counted as income or expense
- Optional `shared` mark on personal-account expenses (full amount on payer; no automatic IOU)
- Required typed categories for income and expense (separate lists; app defaults + user CRUD)
- Edit amount and metadata, or delete, a wrong movement after add (account and type are fixed — delete + re-add to change those)
- Displayed account balance = opening balance ± signed movements
- Session-guarded API; access via account membership (same 404 pattern as wallets/accounts)

## Out of scope

Imports, recurrings, forecast, FX, cross-currency transfers, split/settlement ledger, editing opening balance, changing account or type via edit.

## Schema

- **Category:**
  - `userId` (owner)
  - `kind`: `INCOME` | `EXPENSE`
  - `name` — unique per `(userId, kind, name)` (allows the same label on both kinds)
  - `isSystem` — true for locked defaults (at least **Uncategorized** per kind); not deletable; rename blocked
  - Defaults seeded on register (and backfilled for existing users):  
    - INCOME: Uncategorized (`isSystem`), Salary, Other  
    - EXPENSE: Uncategorized (`isSystem`), Food, Transport, Housing, Utilities, Health, Shopping, Other
- **Transaction:**
  - `type`: `INCOME` | `EXPENSE` | `TRANSFER`
  - `accountId` — primary account (income/expense account; for transfer = source / from)
  - `counterAccountId` — required for `TRANSFER` (destination); null otherwise
  - `amountMinor` — always **positive** `BigInt` (sign comes from type + transfer direction)
  - `occurredAt` — when the movement happened (UTC instant)
  - `description` — optional short text
  - `categoryId` — **required** for `INCOME` / `EXPENSE` (must match category `kind`); **null** for `TRANSFER`
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
- Transfer: `{ type: "TRANSFER", accountId, counterAccountId, amountMinor, occurredAt, description? }` — currencies of both accounts must match; user must be a member of both; `accountId ≠ counterAccountId`; no category

### Update body (`PATCH`)

- Income/expense: `{ amountMinor?, occurredAt?, description?, categoryId?, shared? }` — cannot clear `categoryId`; cannot change `accountId` or `type`
- Transfer: `{ amountMinor?, occurredAt?, description? }` — no category; cannot change accounts

### Categories

- Create: `{ name, kind }`
- Update: `{ name }` — rejected for `isSystem` rows
- Delete: rejected for `isSystem`; otherwise reassign that category’s transactions to Uncategorized of the same kind, then delete

### List

Returns chronological actuals (newest first by default). Time range filters on `occurredAt`. Never includes forecast rows.

Unknown or inaccessible ids return **404**.

## UI (fill existing slots)

- **Activity** (`/activity`): list + time-range filter; add/edit dialogs; delete with confirm; required category on income/expense
- **Home quick-add**: income/expense with required category (not transfer / shared mark)
- **Account detail**: movements list with edit/delete; add movement/transfer with required category on income/expense
- **Settings**: manage income and expense category lists (add / rename / delete non-system)

## Acceptance

- Opening balance plus recorded movements reproduces displayed account balance
- Manual income and expense can be entered, listed, filtered by time range, edited (amount + metadata), and deleted
- Edit cannot change account or type; those require delete + re-add
- Same-currency transfer adjusts both balances and is not counted as income or expense
- Cross-currency transfer is rejected
- `shared` mark allowed only on personal-account expenses; does not change amount
- Every income/expense has a category of the matching kind; transfers have none
- New users get default categories; Uncategorized cannot be removed or renamed
- User can add/remove/rename non-system categories in Settings
- Amounts are integer minor units; IRR toman is display-only
- Mutating routes require an authenticated session and account membership
