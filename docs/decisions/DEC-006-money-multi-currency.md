# DEC-006: Per-account currency and presentation

- **Status:** Accepted
- **Date:** 2026-10-29
- **Supersedes:** [DEC-004](DEC-004-money-storage-display.md)

## Context

Users may hold Iranian accounts (IRR) and foreign-currency accounts (e.g. USD). Iranian users often prefer toman for display (1 toman = 10 rials). Silently guessing rial vs toman, or aggregating wealth across currencies without explicit FX, produces wrong or misleading numbers.

## Options considered

- Store everything as IRR with FX conversion into a single net worth.
- Store toman as the global canonical unit.
- Store integer **minor units of each account’s ISO currency**; no cross-currency aggregation in MVP.
- Keep DEC-004 (IRR-only storage) and defer other currencies.

## Decision

- Each **account** has an official ISO currency (e.g. `IRR`, `USD`).
- Store amounts as **integer minor units** of that currency (rials for IRR, cents for USD). Never use binary floating point for monetary arithmetic.
- API money fields are integers in the account’s currency unless a field is explicitly documented otherwise.
- **No FX conversion** and **no single “total wealth” across currencies** in MVP. Balances and forecasts stay per currency (and per account).
- **Same-currency transfers only** in MVP.
- UI defaults to showing the account’s currency. For **IRR** accounts only, the user may switch presentation to **toman** via explicit `÷ 10` with clear labeling. Toman is not a stored currency.
- Imports and entry must never silently infer rial vs toman (or other unit ambiguity); adapters and product rules make the unit explicit.

## Consequences

- Multi-currency wallets are first-class without inventing exchange rates.
- UI and reports must avoid implying a merged net worth.
- Shared Zod DTOs should carry currency with money amounts where ambiguity is possible.
- DEC-004’s IRR + toman display rules remain valid for IRR accounts under this decision.

## Revisit when

Explicit FX rates, cross-currency transfers, or a labeled multi-currency net worth become product requirements.
