# Slice: Recurrings and next-month forecast

Forecast-only recurring rules. Parent: [mvp.md](mvp.md). UI: [ui-ux.md](ui-ux.md). Depends on accounts + categories. Does not write future rows to the ledger (a one-off movement may optionally create a rule via Add).

## Goals

- Store recurring income/expense/transfer rules per user (amount, currency or accounts, cadence, optional category)
- Next-calendar-month outlook: expected income, expected expenses, surplus/shortfall **per currency**, labeled as projections
- Manage recurrings under `/outlook` (list + create/edit dialog) — not Settings
- Home outlook strip shows the same summary (or empty state)
- Optional “also add as recurring” on the shared Add movement dialog

## Out of scope

Writing recurrings into actual future transactions automatically, mid-month “remaining this month” forecasts, FX, auto-matching bank imports to rules, goals/shopping/budget envelopes (separate future surface — see backlog).

## Schema

- **RecurringRule:**
  - `userId`
  - `type`: `INCOME` | `EXPENSE` | `TRANSFER`
  - `amountMinor` positive `BigInt` (per occurrence)
  - `currency` ISO 4217 (for income/expense; for transfer, derived from from/to accounts)
  - `categoryId` optional (kind must match type)
  - `description` optional
  - `interval`: `DAILY` | `WEEKLY` | `MONTHLY` | `YEARLY`
  - `monthAnchor`: `DAY` | `FIRST` | `LAST` (MONTHLY/YEARLY; ignored otherwise)
  - `anchorDay` 1–28 when `monthAnchor=DAY` (user calendar day-of-month); ignored for FIRST/LAST
  - `anchorMonth` 1–12 in **user calendar** when YEARLY
  - `weekday` 0–6 (Sun–Sat) when WEEKLY
  - `fromAccountId` / `toAccountId` required when TRANSFER (same currency; user must access both)
  - `active` boolean (default true)
  - `createdAt` / `updatedAt`

## Forecast window

- **Next calendar month** in the user’s profile **calendar** (`GREGORIAN` | `JALALI`) and **timezone** ([DEC-013](../decisions/DEC-013-calendar-preference.md)). Unset timezone → UTC.
- Response includes `calendar` plus `year` / `month` **in that calendar** (for Outlook labels).
- Count **occurrences × amount** for each active rule in that month:
  - **DAILY:** days in the month
  - **WEEKLY:** count of matching weekdays in the month
  - **MONTHLY:** one occurrence (day `anchorDay`, or first/last civil day)
  - **YEARLY:** one occurrence only if `anchorMonth` equals the forecast month (same day/first/last rules)
- Aggregate by `currency`:
  - `expectedIncomeMinor` / `expectedExpenseMinor` from INCOME / EXPENSE only
  - `surplusMinor` = income − expense
  - **TRANSFER** rules are listed for planning but **excluded from surplus** (net-zero within currency)

## API (`/api/v1`)

| Area | Routes |
| --- | --- |
| Recurrings | `GET/POST /recurrings`, `PATCH/DELETE /recurrings/:id` |
| Forecast | `GET /forecast/next-month` → `{ currencies: [{ currency, expectedIncomeMinor, expectedExpenseMinor, surplusMinor }], projection: true }` |

## UI

- **`/outlook`:** surface panels. Forecast panel: projection banner, month label, per-currency summary blocks. Rules: one Add (header when list non-empty; empty CTA when empty); click row to edit; ConfirmDialog delete; schedule-aware dialog (interval, first/last/day, category, transfer accounts). Full detail in [ui-ux.md](ui-ux.md).
- **Home strip:** same summary from `GET /forecast/next-month`, or stub empty copy if no rules / zero currencies
- **Shared Add dialog:** optional “Also add as recurring” with schedule fields; creates rule after the movement (recurring failure does not roll back the ledger entry)

## Acceptance

- Forecast figures are labeled projections and do not alter historical balances or Activity
- Per-currency totals; no cross-currency net worth; transfers do not change surplus
- Creating/updating/deleting rules updates the next-month outlook
- Amounts are integer minor units on the wire
- FIRST/LAST month anchors and DAILY/WEEKLY/YEARLY occurrence counts are covered by API tests
