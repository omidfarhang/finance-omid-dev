# Brainstorm Inbox

Unprocessed ideas, questions, observations, and possible improvements.

Capture first. Classify later. Brainstorm items are not approved requirements.

## Ideas

### (none open)

Triaged 2026-10-30: recipe costing → [backlog](../../tasks/backlog.md); smart advice → parked in backlog.

---

## Questions

- (Settled → MVP / DEC-005–007) wallets vs single ledger; money/currency; auth.
- (Settled → DEC-012 + generic CSV) first import path; real banks tracked in [bank-formats.md](bank-formats.md).

## Observations

- Existing finance apps often ship many unused features and still miss multi-format Iranian bank imports, partial recipe costing, and simple recurring-based outlook.
- Bank CSV/Excel layouts differ per bank; import adapters need to be first-class, not an afterthought ([DEC-012](../decisions/DEC-012-import-adapters.md)).
- **Day-to-day (2026-10-30):** Quick-add on home for income/expense is enough for small entries; transfers and shared mark belong on Activity/account detail. Import must force explicit `unit=minor` — silent rial/toman inference remains a hard no. Forecast must stay clearly labeled so Activity never mixes projections.

## Recently triaged

| Item | Disposition | Date |
| --- | --- | --- |
| Recipe / sandwich unit costing | Backlog (Later) | 2026-10-30 |
| Smart loan and money advice | Parked (until balances/imports/forecasts trustworthy) | 2026-10-30 |
| Which banks after generic CSV? | Research file [bank-formats.md](bank-formats.md); backlog multi-bank adapters | 2026-10-30 |

<!-- Template for new entries:

### [Idea title]

- **Date:** YYYY-MM-DD
- **Context:** What prompted this idea?
- **Thought:** What could be useful?
- **Open questions:** What is unclear?

-->
