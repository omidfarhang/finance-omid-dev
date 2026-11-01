# Slice: Balance checkpoints

Dated known balances for detecting missing income, expense, and transfers. Product rules: [DEC-017](../decisions/DEC-017-balance-checkpoints.md), [DEC-005](../decisions/DEC-005-wallets-and-accounts.md), [DEC-006](../decisions/DEC-006-money-multi-currency.md). Parent scope: [mvp.md](mvp.md). UI slots: [ui-ux.md](ui-ux.md). Replaces opening-balance semantics from [wallets-accounts.md](wallets-accounts.md).

## Goals

- Record an exact account balance at an exact UTC instant whenever the user wants
- Derive displayed current balance from the earliest checkpoint plus later movements
- Show a **gap** between consecutive checkpoints vs movements in that window (detection only)
- Surface checkpoints on account detail and in the Activity timeline
- Session-guarded API; access via account membership (same 404 pattern as accounts)

## Out of scope

- Auto-creating balancing income/expense to close a gap
- Import “closing balance” / statement-total comparison
- Rolling current balance only from the *latest* checkpoint (would hide fixes to earlier gaps)
- FX, cross-currency totals, forecast mixing into checkpoints

## Schema

- **BalanceCheckpoint:**
  - `accountId`
  - `asOf` — UTC instant; known balance **after** all movements with `occurredAt ≤ asOf`
  - `balanceMinor` — signed `BigInt` (integer minor units of the account currency)
  - `note` — optional short text
  - `createdByUserId`
  - `createdAt` / `updatedAt`
  - Unique `(accountId, asOf)`
- **Account:** no `openingBalanceMinor`; every account has ≥1 checkpoint
- Migration: each existing `openingBalanceMinor` becomes one checkpoint with `asOf = Account.createdAt`

### Anchor and current balance

Earliest checkpoint by `asOf` (tie-break: `createdAt`, then `id`) is the ledger **anchor**.

```text
balanceMinor(A) =
  earliestCheckpoint(A).balanceMinor
  + signedSum(movements on A with occurredAt > earliest.asOf)
```

Sign rules match [transactions.md](transactions.md): income +, expense −, transfer out − / in +.

### Gap between consecutive checkpoints

For checkpoint `C` with previous checkpoint `P` (by `asOf`):

```text
computed = P.balanceMinor + signedSum(movements with P.asOf < occurredAt ≤ C.asOf)
gapMinor = C.balanceMinor − computed
```

Earliest checkpoint has `gapMinor = null` (defines the start). Non-zero gap means missing or extra movements in that window; the user fixes by adding or editing transactions.

## Money on the wire

JSON money fields are **digit strings** (integer minor units). Prisma stores `BigInt`. No silent rial/toman inference.

## API (`/api/v1`)

| Area | Routes |
| --- | --- |
| Accounts create | `POST /accounts` body: `initialBalanceMinor`, `initialBalanceAsOf` (replaces `openingBalanceMinor`) |
| Checkpoints | `GET/POST /accounts/:accountId/checkpoints`, `GET /checkpoints` (optional `accountId` / `from` / `to` for Activity), `PATCH/DELETE /checkpoints/:id` |

### Create account

`{ walletId, name, currency, initialBalanceMinor, initialBalanceAsOf, isShared? }` — creates the account and its first checkpoint in one transaction.

### Checkpoint create

`{ asOf, balanceMinor, note? }` — unique `(accountId, asOf)`; membership required.

### Checkpoint update (`PATCH`)

`{ asOf?, balanceMinor?, note? }` — cannot leave the account with zero checkpoints; uniqueness still enforced.

### Checkpoint delete

Rejected if it is the account’s only checkpoint.

### List checkpoints

Newest `asOf` first. Each row includes `computedBalanceMinor` and `gapMinor` (`null` for the earliest). Unknown or inaccessible ids return **404**.

`PublicAccount` exposes `balanceMinor` only (no `openingBalanceMinor`). Optional summary fields for the anchor may be added for UI convenience; derivation stays transparent in the Balance panel.

## UI

- **Create account:** amount + datetime for the initial checkpoint (not an immutable “opening” field).
- **Account detail — Balance panel:** large current balance; copy that balance is the anchor checkpoint plus later movements; checkpoint history with gap badges; add / edit / delete checkpoint dialogs.
- **Activity:** checkpoint markers in the day-grouped timeline (account name when viewing all accounts). Distinct non-transaction rows; click → edit; gap chip when non-zero. Not counted in period income/expense/net summary.
- Money: `app-amount-input`, locale formatters, IRR toman presentation unchanged ([ui-ux.md](ui-ux.md)).

## Acceptance

- Account create requires initial balance + as-of; no `openingBalanceMinor` on the wire
- Displayed balance equals earliest checkpoint ± signed movements after its `asOf`
- User can add further checkpoints; list shows gap vs previous window
- Earliest checkpoint has null gap; deleting the last checkpoint is rejected
- Gaps never auto-create transactions
- Checkpoints appear on account detail and Activity; Activity period totals exclude them
- Amounts are integer minor units; IRR toman is display-only
- Mutating routes require session + account membership
