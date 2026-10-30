# Todo

Work that is ready to be done.

## In progress

- (none)

## Next

- UI shell and IA per [docs/plans/ui-ux.md](../docs/plans/ui-ux.md) / [DEC-011](../docs/decisions/DEC-011-ui-ia.md) (do before stacking more form pages):
  1. App shell + primary nav + route map (stubs OK for Activity / Import / Outlook)
  2. Refactor `/wallets` → Accounts IA; create wallet/account via dialog or sub-route; redirect legacy `/wallets`
  3. Hybrid home `/` (balances from current APIs; quick-add and outlook stubs until APIs exist); post-login → `/`
  4. Settings consolidation (profile / TOTP / sign-out); demote Status out of primary nav; redirect `/profile`
  5. Admin shell separation + acting-as banner on `/admin/users/:userId`
- Manual transactions and same-currency transfers (fill Activity / home quick-add / account detail per ui-ux.md)
- Generic/synthetic CSV import adapter + deduplication (fill `/import` per ui-ux.md)
- Recurrings and next-month forecast (per currency) (fill Outlook + home strip per ui-ux.md)
- Capture real day-to-day money workflows and annoyances in [docs/brainstorm/inbox.md](../docs/brainstorm/inbox.md)
- List banks you use and note anonymized statement column layouts (no real statements in git)
- Triage inbox items into backlog, parked, or rejected

## Done recently

- UI/UX plan and IA decision ([docs/plans/ui-ux.md](../docs/plans/ui-ux.md), [DEC-011](../docs/decisions/DEC-011-ui-ia.md))
- Instance admin and registration control ([DEC-010](../docs/decisions/DEC-010-instance-admin.md), [docs/plans/instance-admin.md](../docs/plans/instance-admin.md))
- Upgrade Angular web app 19 → 22 and PrimeNG 19 → 22; Karma/Jasmine → Vitest (`@angular/build:unit-test`)
- Wallets and accounts (personal + optional shared; per-account currency) — [DEC-005](../docs/decisions/DEC-005-wallets-and-accounts.md), [DEC-006](../docs/decisions/DEC-006-money-multi-currency.md), [docs/plans/wallets-accounts.md](../docs/plans/wallets-accounts.md)
- UI i18n: English + Farsi (Transloco, RTL, language switcher, profile locale) — [DEC-009](../docs/decisions/DEC-009-i18n.md)
- Self-hosted Docker Compose deploy (postgres + api + web) for finance.omid.dev ([DEC-008](../docs/decisions/DEC-008-self-hosted-docker.md))
- Scaffold pnpm monorepo (`apps/api`, `apps/web`, `packages/shared`) + Docker Compose Postgres
- Auth milestone: register, login, logout, optional TOTP 2FA, profile ([DEC-007](../docs/decisions/DEC-007-auth.md))
- Resolve MVP open questions: wallets ([DEC-005](../docs/decisions/DEC-005-wallets-and-accounts.md)), money ([DEC-006](../docs/decisions/DEC-006-money-multi-currency.md)), auth ([DEC-007](../docs/decisions/DEC-007-auth.md))
- Record architecture decisions DEC-001–004 and living [docs/design.md](../docs/design.md)
- Establish documentation workspace (vision, MVP, inbox, backlog, decisions, AGENTS)

## Rules

- Keep tasks small enough to understand and verify.
- Link to a specification or MVP section when a task requires one.
- Move speculative work to the backlog.
- Define completion criteria for tasks that affect financial correctness.
