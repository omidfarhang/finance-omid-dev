# DEC-005: Wallets and shared accounts

- **Status:** Accepted
- **Date:** 2026-10-29

## Context

The product will serve the creator first and a partner later. A single shared household ledger vs separate personal money with optional joint accounts changes schema, authorization, and day-to-day recording of transfers and shared expenses.

## Options considered

- **Single household ledger** — Everyone sees one set of accounts and transactions.
- **Separate personal wallets + optional shared accounts** — Each person owns a wallet; some accounts can be shared.
- **Full IOU / settlement ledger from day one** — Track who owes whom for every shared purchase.

## Decision

- Use **separate personal wallets** plus **optional shared accounts**.
- **Same-currency transfers** between accounts adjust both balances and are **never** counted as income or expense.
- Expense or income on a **shared/joint account** is a normal movement on that account (visible to partners with access).
- When one person pays a shared cost from a **personal** account: record the **full** expense on the payer’s account; optionally mark it **shared**. Do **not** invent a second half-expense or automatic IOU in MVP. Settlement later is a normal transfer or reimbursement when the partner pays back.
- A richer shared-expense / reimbursement model is **deferred** until household sharing UX is designed further.

## Consequences

- Authorization and ownership hang off wallets and account membership, not a single global ledger.
- Statement imports stay aligned with the paying account’s bank balance.
- Partner settlement UX remains backlog work; MVP marking is enough to note intent without false precision.

## Revisit when

Household sharing needs settlement tracking, split ratios that affect reports, or multi-party ownership rules beyond optional shared accounts.
