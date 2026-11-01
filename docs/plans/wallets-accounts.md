# Slice: Wallets and accounts

First ledger foundation for MVP. Product rules: [DEC-005](../decisions/DEC-005-wallets-and-accounts.md), [DEC-006](../decisions/DEC-006-money-multi-currency.md). Parent scope: [mvp.md](mvp.md).

## Goals

- Personal wallets owned by the authenticated user
- Accounts under a wallet: name, ISO currency, initial balance checkpoint (integer minor units + as-of), personal or shared
- Displayed balance for this slice equals the earliest checkpoint (transactions / further checkpoints: [transactions.md](transactions.md), [balance-checkpoints.md](balance-checkpoints.md))
- Session-guarded API; access via account membership

## Out of scope

Transactions, transfers, imports, recurrings, FX, cross-currency totals, rich household invite UX beyond adding an existing user by email to a shared account.

## Schema

- **Wallet:** `ownerUserId`, `name` (default `"Personal"`)
- **Account:** `walletId` (creator’s home wallet), `name`, `currency` (ISO 4217), `isShared` — no `openingBalanceMinor`; initial known balance is a [BalanceCheckpoint](balance-checkpoints.md) ([DEC-017](../decisions/DEC-017-balance-checkpoints.md))
- **AccountMember:** unique `(accountId, userId)`; role `OWNER` | `MEMBER`; creator always `OWNER`; always written on create so authz is membership-only
- Currency immutable after create; initial checkpoint created with the account (`initialBalanceMinor` + `initialBalanceAsOf`); further checkpoints per [balance-checkpoints.md](balance-checkpoints.md)

## Money on the wire

JSON money fields are **digit strings** (integer minor units). Prisma stores `BigInt`. No silent rial/toman inference; IRR toman is UI presentation only (`÷ 10`).

Currency on create is any valid ISO 4217 code at the API/schema layer. The web UI offers a fixed Iranian-first searchable allowlist (`IRR, USD, EUR, GBP, AED, TRY, CAD, AUD, CHF, JPY`) and labels via `Intl.DisplayNames` as `Name (CODE)` — see [ui-ux.md](ui-ux.md) Money display. Expanding the picker does not require API or database changes.

## API (`/api/v1`)

| Area | Routes |
| --- | --- |
| Wallets | `GET/POST /wallets`, `GET/PATCH /wallets/:id`, `DELETE /wallets/:id` (empty only) |
| Accounts | `GET /accounts`, `POST /accounts`, `GET/PATCH/DELETE /accounts/:id` (PATCH name only) |
| Members | `POST /accounts/:id/members` (shared; by email), `DELETE /accounts/:id/members/:userId` (not last owner) |

Unknown or inaccessible ids return **404** (no existence leak).

## Balance meaning

Create writes the first checkpoint; listed `balanceMinor` equals that checkpoint until movements exist. After [transactions.md](transactions.md) and [balance-checkpoints.md](balance-checkpoints.md): earliest checkpoint ± signed movements after its `asOf`.

## Acceptance

- User can create a wallet and accounts with explicit currency and initial balance as-of
- Listed balance equals the earliest checkpoint when there are no later movements
- Shared account can include another registered user; they can list it; outsiders cannot
- Amounts are integer minor units; IRR toman is display-only
- No cross-currency aggregated total in UI or API
