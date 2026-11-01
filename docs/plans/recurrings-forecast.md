# Slice: Recurrings and next-month forecast

Forecast-only recurring rules for MVP. Parent: [mvp.md](mvp.md). UI: [ui-ux.md](ui-ux.md). Depends on accounts (+ categories optional). Does not write to the ledger.

## Goals

- Store recurring income/expense rules per user (amount, currency, cadence, next occurrence)
- Next-calendar-month outlook: expected income, expected expenses, surplus/shortfall **per currency**, labeled as projections
- Manage recurrings under `/outlook` (list + create/edit dialog) — not Settings
- Home outlook strip shows the same summary (or empty state)

## Out of scope

Writing recurrings into actual transactions, mid-month “remaining this month” forecasts, FX, transfers as recurrings, auto-matching bank imports to rules.

## Schema

- **RecurringRule:**
  - `userId`
  - `type`: `INCOME` | `EXPENSE` (no TRANSFER)
  - `amountMinor` positive `BigInt`
  - `currency` ISO 4217 (rules are currency-scoped; not tied to one account in MVP)
  - `description` optional
  - `interval`: `MONTHLY` only in MVP
  - `anchorDay` 1–28 (day-of-month for monthly occurrence; avoids month-end edge cases)
  - `active` boolean (default true)
  - `createdAt` / `updatedAt`

## Forecast window

- **Next calendar month** in the user’s profile **calendar** (`GREGORIAN` | `JALALI`) and **timezone** ([DEC-013](../decisions/DEC-013-calendar-preference.md)). Unset timezone → UTC.
- Response includes `calendar` plus `year` / `month` **in that calendar** (for Outlook labels).
- Include every active rule whose `interval` produces an occurrence in that month (monthly → one occurrence on `anchorDay` as day-of-month in the user’s calendar; `anchorDay` stays 1–28).
- Aggregate sums by `currency`:
  - `expectedIncomeMinor`
  - `expectedExpenseMinor`
  - `surplusMinor` = income − expense

## API (`/api/v1`)

| Area | Routes |
| --- | --- |
| Recurrings | `GET/POST /recurrings`, `PATCH/DELETE /recurrings/:id` |
| Forecast | `GET /forecast/next-month` → `{ currencies: [{ currency, expectedIncomeMinor, expectedExpenseMinor, surplusMinor }], projection: true }` |

## UI

- **`/outlook`:** surface panels (same visual language as home/activity). Forecast panel: projection banner, month label from payload calendar, per-currency summary blocks (expected income, expected expenses, labeled surplus/shortfall). Rules panel: list of row cards with add/edit dialog (SelectButton Income/Expense), ConfirmDialog on delete, skeletons and empty CTAs that prompt to add a rule. Full detail in [ui-ux.md](ui-ux.md).
- **Home strip:** same summary from `GET /forecast/next-month` (short per-currency rows + link to `/outlook`), or stub empty copy if no rules / zero currencies

## Acceptance

- Forecast figures are labeled projections and do not alter historical balances or Activity
- Per-currency totals; no cross-currency net worth
- Creating/updating/deleting rules updates the next-month outlook
- Amounts are integer minor units on the wire
