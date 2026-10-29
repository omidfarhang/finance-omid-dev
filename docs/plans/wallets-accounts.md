# Slice: Wallets and accounts

First ledger foundation for MVP. Product rules: [DEC-005](../decisions/DEC-005-wallets-and-accounts.md), [DEC-006](../decisions/DEC-006-money-multi-currency.md). Parent scope: [mvp.md](mvp.md).

## Goals

- Personal wallets owned by the authenticated user
- Accounts under a wallet: name, ISO currency, opening balance (integer minor units), personal or shared
- Displayed balance for this slice equals opening balance (transactions come next)
- Session-guarded API; access via account membership

## Out of scope

Transactions, transfers, imports, recurrings, FX, cross-currency totals, rich household invite UX beyond adding an existing user by email to a shared account.

## Schema

- **Wallet:** `ownerUserId`, `name` (default `"Personal"`)
- **Account:** `walletId` (creator’s home wallet), `name`, `currency` (ISO 4217), `openingBalanceMinor` (`BigInt`), `isShared`
- **AccountMember:** unique `(accountId, userId)`; role `OWNER` | `MEMBER`; creator always `OWNER`; always written on create so authz is membership-only
- Currency and opening balance immutable after create in this slice

## Money on the wire

JSON money fields are **digit strings** (integer minor units). Prisma stores `BigInt`. No silent rial/toman inference; IRR toman is UI presentation only (`÷ 10`).

## API (`/api/v1`)

| Area | Routes |
| --- | --- |
| Wallets | `GET/POST /wallets`, `GET/PATCH /wallets/:id`, `DELETE /wallets/:id` (empty only) |
| Accounts | `GET /accounts`, `POST /accounts`, `GET/PATCH/DELETE /accounts/:id` (PATCH name only) |
| Members | `POST /accounts/:id/members` (shared; by email), `DELETE /accounts/:id/members/:userId` (not last owner) |

Unknown or inaccessible ids return **404** (no existence leak).

## Balance meaning

Until transactions exist: `balanceMinor === openingBalanceMinor`.

## Acceptance

- User can create a wallet and accounts with explicit currency and opening balance
- Listed balance equals opening balance
- Shared account can include another registered user; they can list it; outsiders cannot
- Amounts are integer minor units; IRR toman is display-only
- No cross-currency aggregated total in UI or API
