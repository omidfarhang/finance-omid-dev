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
| [DEC-004](DEC-004-money-storage-display.md) | IRR storage vs toman presentation | Accepted |

Likely early candidates (create when deciding, not before):

- Privacy / data location (self-hosted defaults)
- Import adapter model
- Household ledger vs separate wallets

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
