# Backlog

Potential future work. Nothing here is a commitment.

## Now / High relevance

- Further bank statement import adapters
  - **Problem:** Banks beyond BluBank use different CSV/Excel layouts.
  - **Expected outcome:** Additional pluggable parsers per bank; safe re-import.
  - **Dependencies:** Adapter model + `generic_csv` + `blubank_xlsx` done ([DEC-012](../docs/decisions/DEC-012-import-adapters.md)); extend [bank-formats.md](../docs/brainstorm/bank-formats.md) with anonymized column notes.

## Later

- Goals / shopping lists / budget envelopes (plans surface)
  - **Problem:** One-off targets and shopping plans are not recurring cash-flow rules; stuffing them into Outlook confuses projections.
  - **Expected outcome:** A dedicated plans surface for goals and lists that stays separate from ledger actuals and next-month recurring forecast.
  - **Dependencies:** Trustworthy balances + Outlook recurrings ([recurrings-forecast.md](../docs/plans/recurrings-forecast.md)); product shape still open ([inbox](../docs/brainstorm/inbox.md)).

- UI polish beyond IA (PrimeNG theme customization, richer empty-state illustration, bottom-nav motion) — only after shell acceptance in [ui-ux.md](../docs/plans/ui-ux.md)
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
