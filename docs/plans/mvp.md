# MVP

The first useful release for personal (and soon household) use. Outcomes over implementation details.

## Goals

1. Know how much money is available across accounts (per currency; no cross-currency net worth).
2. Record income and expenses manually.
3. Import statements via a pluggable path (generic/synthetic first; real bank adapters later) without silent double-counting.
4. See a basic next-month outlook from recurring expenses and expected income.
5. Register, log in, optionally enable TOTP 2FA, and manage a basic profile before relying on the ledger.
6. First registrant is instance admin; admin can control registration and users ([DEC-010](../decisions/DEC-010-instance-admin.md)).

## In scope

- Auth: register, login, logout, optional TOTP 2FA, profile ([DEC-007](../decisions/DEC-007-auth.md))
- Instance admin: first user is admin; registration toggle; manage users and any user’s wallets/accounts ([DEC-010](../decisions/DEC-010-instance-admin.md), [instance-admin.md](instance-admin.md))
- Personal **wallets** with accounts that may be personal or **shared**; opening balances ([DEC-005](../decisions/DEC-005-wallets-and-accounts.md))
- Manual income and expense entry (with categories or tags as needed for daily use)
- Same-currency transfers between accounts that do not inflate income/expense totals
- Shared cost paid from a personal account: full expense on payer + optional “shared” mark; settlement via later transfer (richer IOU model deferred)
- Import pipeline with a **pluggable adapter** interface; first path uses a **generic/synthetic CSV** fixture; per-bank CSV/Excel adapters follow
- Deduplication so re-importing the same statement does not silently create duplicate transactions
- Recurring rules (e.g. rent, salary) used only for forecast — not mixed into actual ledger totals
- Next-month cash-flow outlook: expected income, expected recurrings, implied surplus/shortfall (per currency)
- Per-account ISO currency; amounts as integer minor units; IRR toman display switch only ([DEC-006](../decisions/DEC-006-money-multi-currency.md))

## Out of scope for MVP

- Recipe / ingredient unit costing
- Loan suggestions and smart advice
- Automatic bank connectivity
- FX conversion and a single “total wealth” across currencies
- Shared-expense settlement / reimbursement ledger beyond optional “shared” marking
- Public multi-tenant product features
- Full budgeting suite, investments, tax tools

## Acceptance criteria

- Opening balance plus recorded movements reproduces the displayed account balance.
- Manual income and expense can be entered, listed, and filtered by a useful time range.
- A same-currency transfer between two accounts adjusts both balances and is not counted as both income and expense.
- Importing a statement twice does not silently double-count transactions.
- Amounts are never silently inferred as rial vs toman; storage and display rules are explicit per account currency.
- Forecast figures are labeled as projections and do not alter historical balances.
- Balances are not aggregated across currencies into one net-worth number.
- Users can register, log in, log out, update profile, and optionally enroll TOTP 2FA; mutating API routes require an authenticated session.
- First registrant is admin; admin can close/reopen registration, manage users (role, disable, delete), and access another user’s wallets/accounts via admin routes; last-admin safeguards hold.
- No real bank statements or personal financial records are required in the repository; tests use synthetic fixtures.

## Settled product choices

- **Household:** separate personal wallets + optional shared accounts ([DEC-005](../decisions/DEC-005-wallets-and-accounts.md)).
- **Day-to-day recording:** transfers as non-income/expense; joint-account movements as normal; personal shared pay = full expense + optional mark ([DEC-005](../decisions/DEC-005-wallets-and-accounts.md)).
- **First import path:** generic/synthetic CSV adapter; real banks as follow-on adapters (no single bank locked for MVP).
- **Money:** per-account currency, minor units, no FX / no cross-currency net worth ([DEC-006](../decisions/DEC-006-money-multi-currency.md)).
- **UI structure:** hybrid home; App vs Admin shells; dedicated Activity / Accounts / Import / Outlook / Settings routes — follow [ui-ux.md](ui-ux.md) and [DEC-011](../decisions/DEC-011-ui-ia.md). Feature slices fill those slots; do not invent parallel nav or always-on form stacks.

Capture further discoveries in [../brainstorm/inbox.md](../brainstorm/inbox.md); promote settled behavior into this MVP or a future specification.
