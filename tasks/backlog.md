# Backlog

Potential future work. Nothing here is a commitment.

## Now / High relevance

- Multi-bank statement import adapters
  - **Problem:** Each bank uses a different CSV/Excel layout.
  - **Expected outcome:** Pluggable parsers or mappings per bank; safe re-import.
  - **Dependencies:** First MVP import path; anonymized format research.

- Next-month cash-flow forecast from recurrings
  - **Problem:** Hard to know if next month will be tight before it happens.
  - **Expected outcome:** Outlook from expected income and recurring expenses, separate from actuals.
  - **Dependencies:** Recurring rules; accounts and transactions.

## Later

- Recipe / ingredient unit costing (partial usage, e.g. sandwich from shared groceries)
  - **Problem:** Package prices do not equal the cost of what was actually used.
  - **Expected outcome:** Deterministic cost from unit prices, quantities, and yields.
  - **Dependencies:** Expense or price history model; dedicated specification.

- Household sharing with a partner
  - **Problem:** Shared life, shared money visibility.
  - **Expected outcome:** Useful household ledger without a complex distributed system.
  - **Dependencies:** Wallets + optional shared accounts ([DEC-005](../docs/decisions/DEC-005-wallets-and-accounts.md)); auth.

- Shared-expense settlement / reimbursement ledger
  - **Problem:** “I paid, we share” needs clearer partner settlement than an optional mark + manual transfer.
  - **Expected outcome:** Deterministic split/reimbursement model that does not break bank-aligned balances.
  - **Dependencies:** More product thought; MVP shared mark is enough for now ([DEC-005](../docs/decisions/DEC-005-wallets-and-accounts.md)).

- Public release readiness
  - **Problem:** Personal tool may become a product.
  - **Expected outcome:** Multi-user, security, and onboarding polish after core workflows work.
  - **Dependencies:** Stable MVP; privacy/hosting decisions.

## Parked

- Smart money advice and bank loan suggestions matching budget / forecast
  - Parked until balances, imports, and forecasts are trustworthy; must not invent financial numbers.

## Rejected

- (none yet)

<!-- Template:

## Item title

- **Problem:**
- **Expected outcome:**
- **Dependencies:**

Rejected entry:

- **Idea:**
- **Reason:**
-->
