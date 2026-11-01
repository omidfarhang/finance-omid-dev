# Todo

Work that is ready to be done.

## In progress

- (none)

## Next

- (none — capture further ideas in inbox; promote via backlog → plan when ready)

## Done recently

- Home polish: panels size to content (Outlook no longer stretches with Recent), richer outlook strip (month label, surplus headline, income/expense bars, active-rule count, distinct empty states), recent row dividers + description clamp ([docs/plans/ui-ux.md](../docs/plans/ui-ux.md), [docs/plans/recurrings-forecast.md](../docs/plans/recurrings-forecast.md))
- CI-built Docker images on GHCR; server deploy is pull + up (no `--build`) ([DEC-018](../docs/decisions/DEC-018-ci-container-images.md), [DEC-008](../docs/decisions/DEC-008-self-hosted-docker.md))
- Upgrade package manager to pnpm 12.16.1 (`packageManager` + Docker pins; [DEC-002](../docs/decisions/DEC-002-stack.md))
- Pin runtime to Node 24 (engines, Docker API/web images, `@types/node`; [DEC-002](../docs/decisions/DEC-002-stack.md), [DEC-008](../docs/decisions/DEC-008-self-hosted-docker.md))
- BluBank Excel import adapter (`blubank_xlsx`): rial-labeled debit/credit, Jalali datetimes → UTC, IRR-only account ([docs/plans/imports.md](../docs/plans/imports.md), [docs/brainstorm/bank-formats.md](../docs/brainstorm/bank-formats.md), [DEC-012](../docs/decisions/DEC-012-import-adapters.md))
- Import as dialog (not primary nav): Activity + Account detail entry; account fixed when opened from account ([docs/plans/ui-ux.md](../docs/plans/ui-ux.md), [docs/plans/imports.md](../docs/plans/imports.md), [DEC-011](../docs/decisions/DEC-011-ui-ia.md))
- Outlook recurrings UX + schedule model: intervals, first/last/day, category, transfer, single Add, quick-add from Add dialog ([docs/plans/recurrings-forecast.md](../docs/plans/recurrings-forecast.md), [docs/plans/ui-ux.md](../docs/plans/ui-ux.md))
- Outlook UI / UX full pass: surface panels, summary-block forecast, rule cards + ConfirmDialog, skeletons, empty CTAs ([docs/plans/ui-ux.md](../docs/plans/ui-ux.md), [docs/plans/recurrings-forecast.md](../docs/plans/recurrings-forecast.md))
- Balance checkpoints replace opening balance (detection-only gaps; account detail + Activity) ([docs/plans/balance-checkpoints.md](../docs/plans/balance-checkpoints.md), [DEC-017](../docs/decisions/DEC-017-balance-checkpoints.md))
- Activity category filter (`categoryId` on list API + Activity select) ([docs/plans/ui-ux.md](../docs/plans/ui-ux.md), [docs/plans/transactions.md](../docs/plans/transactions.md))
- Activity custom date range filter (from/to via shared date-time field) ([docs/plans/ui-ux.md](../docs/plans/ui-ux.md), [docs/plans/transactions.md](../docs/plans/transactions.md))
- Accounts UI / UX full pass: surface panels, skeletons, ledger parity with Activity, rename + remove member, admin-as-user list chrome ([docs/plans/ui-ux.md](../docs/plans/ui-ux.md), [docs/plans/wallets-accounts.md](../docs/plans/wallets-accounts.md))
- Activity ledger UX pass: surface panels, live filters (range/account/type) + search, period summary, day groups, clickable rows / delete in edit dialog ([docs/plans/ui-ux.md](../docs/plans/ui-ux.md), [docs/plans/transactions.md](../docs/plans/transactions.md))
- Iranian-first currency UI allowlist + searchable pickers; `Intl.DisplayNames` labels as `Name (CODE)`; API stays any ISO 4217 ([docs/plans/ui-ux.md](../docs/plans/ui-ux.md) Money display, [docs/plans/wallets-accounts.md](../docs/plans/wallets-accounts.md), [DEC-006](../docs/decisions/DEC-006-money-multi-currency.md))
- Localized currency labels in UI chrome (account boxes, detail, lists, outlook, selects) via Transloco; ISO codes stay on the wire ([docs/plans/ui-ux.md](../docs/plans/ui-ux.md) Money display, [DEC-006](../docs/decisions/DEC-006-money-multi-currency.md))
- Money display: locale thousand separators + RTL-safe minus (LTR isolate) on amounts/opening balances ([docs/plans/ui-ux.md](../docs/plans/ui-ux.md) Money display)
- Amount inputs: locale thousand separators via shared `app-amount-input` ([docs/plans/ui-ux.md](../docs/plans/ui-ux.md) Money display)
- Fix Select overlays clipped inside Dialogs (Add dialog categories/accounts): global `overlayAppendTo: 'body'` ([docs/plans/ui-ux.md](../docs/plans/ui-ux.md) Forms)
- Extend datepicker: unified Jalali/Gregorian field, weekday headers, ±1 day strip + relative labels, optional minUnix/maxUnix ([docs/plans/ui-ux.md](../docs/plans/ui-ux.md) Dates, [DEC-013](../docs/decisions/DEC-013-calendar-preference.md))
- Category catalog upgrade: system codes + i18n, icons, palette colors, TRANSFER kind required, expanded defaults ([docs/plans/transactions.md](../docs/plans/transactions.md), [DEC-016](../docs/decisions/DEC-016-category-catalog.md), [docs/plans/ui-ux.md](../docs/plans/ui-ux.md))

- Settings polish: surface panels (home language), PrimeNG selects, category skeletons, shell nav ([docs/plans/ui-ux.md](../docs/plans/ui-ux.md))
- Move API status link from Settings profile to Support ([docs/plans/ui-ux.md](../docs/plans/ui-ux.md))
- Settings nested routes: shell + Profile / Categories / Security sections ([docs/plans/ui-ux.md](../docs/plans/ui-ux.md))
- Theme preference (Light / Dark / System): profile field, Settings icon control, PrimeNG + CSS tokens ([DEC-015](../docs/decisions/DEC-015-theme-preference.md), [docs/plans/ui-ux.md](../docs/plans/ui-ux.md))
- Home dashboard polish: surface panels (no leading separators), wide Recent|Outlook grid, richer outlook strip, skeleton loading ([docs/plans/ui-ux.md](../docs/plans/ui-ux.md))
- MIT license and standard repo meta (LICENSE, CONTRIBUTING, CoC, SECURITY, GitHub templates) ([DEC-014](../docs/decisions/DEC-014-mit-license.md))
- Unify Add: shared SelectButton dialog (Income / Expense / Transfer) on Home, Activity, Account detail; remove older create dialogs ([docs/plans/ui-ux.md](../docs/plans/ui-ux.md), [docs/plans/transactions.md](../docs/plans/transactions.md))
- Home layout refresh: balance boxes, recent log + Add dialog, drop title ([docs/plans/ui-ux.md](../docs/plans/ui-ux.md))
- App shell: remove top bar; place user menu in rail foot (desktop) / bottom-bar trailing end (mobile) ([docs/plans/ui-ux.md](../docs/plans/ui-ux.md))
- App shell nav chrome: desktop start-side vertical rail + improved mobile bottom bar with SVG icons ([docs/plans/ui-ux.md](../docs/plans/ui-ux.md), [DEC-011](../docs/decisions/DEC-011-ui-ia.md))
- Improve in-house Jalali datepicker UX: typeable input, body overlay, year jump, typeable time ([docs/plans/ui-ux.md](../docs/plans/ui-ux.md) Dates, [DEC-013](../docs/decisions/DEC-013-calendar-preference.md))
- Fix UI language not hydrating from profile on login/session (guest localStorage no longer overrides settings locale) ([DEC-009](../docs/decisions/DEC-009-i18n.md))
- Calendar preference (Gregorian / Jalali): profile field, Settings, shared helpers, date pipe/picker, Activity month filters, Outlook next-month bounds ([DEC-013](../docs/decisions/DEC-013-calendar-preference.md))
- Edit/delete movements + typed required categories ([docs/plans/transactions.md](../docs/plans/transactions.md), [docs/plans/ui-ux.md](../docs/plans/ui-ux.md), [docs/plans/imports.md](../docs/plans/imports.md)) — Activity/home/account edit-delete; Settings category CRUD; Uncategorized defaults
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
