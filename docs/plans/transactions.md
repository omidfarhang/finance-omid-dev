# Slice: Transactions and transfers

Manual ledger movements for MVP. Product rules: [DEC-005](../decisions/DEC-005-wallets-and-accounts.md), [DEC-006](../decisions/DEC-006-money-multi-currency.md). Parent scope: [mvp.md](mvp.md). UI slots: [ui-ux.md](ui-ux.md).

## Goals

- Record income and expense on a single account (integer minor units)
- Same-currency transfers between two accounts the user can access; never counted as income or expense
- Optional `shared` mark on personal-account expenses (full amount on payer; no automatic IOU)
- Minimal categories for tagging movements
- Displayed account balance = opening balance ± signed movements
- Session-guarded API; access via account membership (same 404 pattern as wallets/accounts)

## Out of scope

Imports, recurrings, forecast, FX, cross-currency transfers, split/settlement ledger, editing opening balance.

## Schema

- **Category:** `userId` (owner), `name` (unique per user); soft personal list for tagging
- **Transaction:**
  - `type`: `INCOME` | `EXPENSE` | `TRANSFER`
  - `accountId` — primary account (income/expense account; for transfer = source / from)
  - `counterAccountId` — required for `TRANSFER` (destination); null otherwise
  - `amountMinor` — always **positive** `BigInt` (sign comes from type + transfer direction)
  - `occurredAt` — when the movement happened (UTC instant)
  - `description` — optional short text
  - `categoryId` — optional; null for transfers in MVP
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
| Categories | `GET/POST /categories`, `PATCH/DELETE /categories/:id` |
| Transactions | `GET /transactions` (query: `accountId?`, `from?`, `to?`, `type?`), `POST /transactions`, `GET/PATCH/DELETE /transactions/:id` |

### Create body

- Income/expense: `{ type, accountId, amountMinor, occurredAt, description?, categoryId?, shared? }`
- Transfer: `{ type: "TRANSFER", accountId, counterAccountId, amountMinor, occurredAt, description? }` — currencies of both accounts must match; user must be a member of both; `accountId ≠ counterAccountId`

### List

Returns chronological actuals (newest first by default). Time range filters on `occurredAt`. Never includes forecast rows.

Unknown or inaccessible ids return **404**.

## UI (fill existing slots)

- **Activity** (`/activity`): list + time-range filter; dialogs for income/expense and transfer
- **Home quick-add**: income/expense only (not transfer / shared mark)
- **Account detail**: movements list; add movement/transfer

## Acceptance

- Opening balance plus recorded movements reproduces displayed account balance
- Manual income and expense can be entered, listed, and filtered by time range
- Same-currency transfer adjusts both balances and is not counted as income or expense
- Cross-currency transfer is rejected
- `shared` mark allowed only on personal-account expenses; does not change amount
- Amounts are integer minor units; IRR toman is display-only
- Mutating routes require an authenticated session and account membership
