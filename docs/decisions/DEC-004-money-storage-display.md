# DEC-004: IRR storage and toman presentation

- **Status:** Superseded by [DEC-006](DEC-006-money-multi-currency.md)
- **Date:** 2026-10-29
- **Superseded:** 2026-10-29

## Context

Iranian users often think in toman while banks and legal units use rial (1 toman = 10 rials). Silently guessing which unit an imported or entered amount uses causes wrong balances. Binary floating point is unsafe for money.

## Options considered

- Store toman as the canonical unit.
- Store IRR (rials) as integers; present toman in the UI by explicit conversion.
- Store decimal amounts with a unit flag per row without a single canonical unit.

## Decision

- **Store** amounts as integer **IRR (rials)** in PostgreSQL (and in API contracts unless a field is explicitly documented otherwise).
- **Never** use binary floating point for monetary arithmetic.
- The UI **may** present toman via explicit conversion (`÷ 10`) with clear labeling.
- Imports and entry flows must never silently infer rial vs toman; the unit must be explicit in product rules and adapters.

## Consequences

- One canonical storage unit simplifies balances, transfers, and forecasts.
- Presentation and import adapters must document unit handling.
- Shared Zod DTOs should treat money as integer IRR (or an equally explicit contract).

## Revisit when

Multi-currency beyond IRR becomes in scope, or regulatory/display conventions require a different canonical unit.

## Supersession note

Accounts may use currencies other than IRR (e.g. USD). Canonical storage is integer minor units of each account’s currency. IRR toman display remains valid for IRR accounts only. See [DEC-006](DEC-006-money-multi-currency.md).
