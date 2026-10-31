# Architecture and Product Decisions

This directory contains decisions whose rationale should remain discoverable.

Create a separate decision record for choices that affect multiple modules, data integrity, security, or future compatibility. Avoid records for trivial implementation choices.

Keep the living overview in [`../design.md`](../design.md) aligned when accepting or superseding architecture decisions.

## Decision index

| ID | Decision | Status |
| --- | --- | --- |
| [DEC-001](DEC-001-client-server-split.md) | Client/server split (REST API + Angular PWA) | Accepted |
| [DEC-002](DEC-002-stack.md) | Stack (NestJS, PostgreSQL, Prisma, Zod, Angular, PrimeNG) | Accepted |
| [DEC-003](DEC-003-pwa-scope.md) | PWA scope (installable, online-only money data) | Accepted |
| [DEC-004](DEC-004-money-storage-display.md) | IRR storage vs toman presentation | Superseded by DEC-006 |
| [DEC-005](DEC-005-wallets-and-accounts.md) | Separate wallets + optional shared accounts; transfer/shared-expense MVP rules | Accepted |
| [DEC-006](DEC-006-money-multi-currency.md) | Per-account currency; minor units; no FX / no cross-currency net worth | Accepted |
| [DEC-007](DEC-007-auth.md) | Register/login; httpOnly cookie sessions; optional TOTP 2FA; profile | Accepted |
| [DEC-008](DEC-008-self-hosted-docker.md) | Self-hosted Docker Compose; host nginx TLS for finance.omid.dev | Accepted |
| [DEC-009](DEC-009-i18n.md) | Runtime UI i18n (Transloco); `fa` + `en`; RTL via `html[dir]` | Accepted |
| [DEC-010](DEC-010-instance-admin.md) | First user is instance admin; registration toggle; admin user/money control | Accepted |
| [DEC-011](DEC-011-ui-ia.md) | Hybrid home; App vs Admin shells; list-first IA | Accepted |
| [DEC-012](DEC-012-import-adapters.md) | Pluggable import adapters; generic CSV first; dedupe keys | Accepted |
| [DEC-013](DEC-013-calendar-preference.md) | Profile calendar Gregorian/Jalali; ISO storage; month semantics | Accepted |
| [DEC-014](DEC-014-mit-license.md) | MIT license for the monorepo; standard community docs | Accepted |

Likely early candidates (create when deciding, not before):

- Shared-expense settlement / reimbursement ledger

## Decision record template

Copy into `DEC-NNN-short-title.md` and add a row to the index above.

```markdown
# DEC-NNN: Decision title

- **Status:** Proposed / Accepted / Superseded
- **Date:** YYYY-MM-DD

## Context

What problem are we solving?

## Options considered

What realistic alternatives exist?

## Decision

What did we choose?

## Consequences

What becomes easier, harder, or constrained?

## Revisit when

What new evidence would justify reconsidering this decision?
```
