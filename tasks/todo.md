# Todo

Work that is ready to be done.

## In progress

- (none)

## Next

- (none — capture further ideas in inbox; promote via backlog → plan when ready)

## Done recently

- Inbox triage + bank-format research stub ([docs/brainstorm/inbox.md](../docs/brainstorm/inbox.md), [docs/brainstorm/bank-formats.md](../docs/brainstorm/bank-formats.md))
- Recurrings and next-month forecast ([docs/plans/recurrings-forecast.md](../docs/plans/recurrings-forecast.md)) — Outlook + home strip
- Generic/synthetic CSV import + deduplication ([docs/plans/imports.md](../docs/plans/imports.md), [DEC-012](../docs/decisions/DEC-012-import-adapters.md))
- Manual transactions, same-currency transfers, categories ([docs/plans/transactions.md](../docs/plans/transactions.md)) — Activity, home quick-add, account movements
- Transactions slice plan ([docs/plans/transactions.md](../docs/plans/transactions.md))
- App/Admin toolbar: language switcher removed when signed in; user menu (name, Settings, Support, Admin, Sign out); Guest shell keeps language ([docs/plans/ui-ux.md](../docs/plans/ui-ux.md))
- IRR/toman presentation preference moved to Settings (localStorage); removed from home / accounts headers ([docs/plans/ui-ux.md](../docs/plans/ui-ux.md))
- API tests: Jest → Vitest ([DEC-002](../docs/decisions/DEC-002-stack.md))
- API stack bump: NestJS 12, Prisma 7 (`prisma-client` + adapter-pg), Zod 4 (shared + api); compatible TypeScript 6 / tooling ([DEC-002](../docs/decisions/DEC-002-stack.md))
- UI shell and IA ([docs/plans/ui-ux.md](../docs/plans/ui-ux.md), [DEC-011](../docs/decisions/DEC-011-ui-ia.md)): App/Guest/Admin shells, primary nav, hybrid home, Accounts IA + dialogs, Settings, Admin acting-as
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
