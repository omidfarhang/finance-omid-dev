# MVP

The first useful release for personal (and soon household) use. Outcomes over implementation details.

## Goals

1. Know how much money is available across accounts.
2. Record income and expenses manually.
3. Import at least one real bank statement format without silent double-counting.
4. See a basic next-month outlook from recurring expenses and expected income.

## In scope

- Accounts with opening balances
- Manual income and expense entry (with categories or tags as needed for daily use)
- Transfers between accounts that do not inflate income/expense totals
- Import pipeline for one bank CSV/Excel format, with a clear path to add more adapters later
- Deduplication so re-importing the same statement does not silently create duplicate transactions
- Recurring rules (e.g. rent, salary) used only for forecast — not mixed into actual ledger totals
- Next-month cash-flow outlook: expected income, expected recurrings, implied surplus/shortfall

## Out of scope for MVP

- Recipe / ingredient unit costing
- Loan suggestions and smart advice
- Automatic bank connectivity
- Multi-currency beyond IRR storage with toman presentation
- Public multi-tenant product features
- Full budgeting suite, investments, tax tools

## Acceptance criteria

- Opening balance plus recorded movements reproduces the displayed account balance.
- Manual income and expense can be entered, listed, and filtered by a useful time range.
- A transfer between two accounts adjusts both balances and is not counted as both income and expense.
- Importing a statement twice does not silently double-count transactions.
- Amounts are never silently inferred as rial vs toman; storage and display rules are explicit.
- Forecast figures are labeled as projections and do not alter historical balances.
- No real bank statements or personal financial records are required in the repository; tests use synthetic fixtures.

## Open questions (resolve before or during implementation)

- Single household ledger vs separate wallets for partners
- How transfers and shared expenses are recorded day to day
- Exact banks and file formats for the first import adapter

Capture discoveries in [../brainstorm/inbox.md](../brainstorm/inbox.md); promote settled behavior into this MVP or a future specification.
