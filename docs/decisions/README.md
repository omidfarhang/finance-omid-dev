# Architecture and Product Decisions

This directory contains decisions whose rationale should remain discoverable.

Create a separate decision record for choices that affect multiple modules, data integrity, security, or future compatibility. Avoid records for trivial implementation choices.

## Decision index

| ID | Decision | Status |
| --- | --- | --- |
| — | (none yet) | — |

Likely early candidates (create when deciding, not before):

- Privacy / data location (self-hosted defaults)
- IRR storage vs toman presentation
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
