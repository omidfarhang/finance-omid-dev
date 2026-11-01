# Product Vision

## Purpose

Build a personal finance application that helps individuals and households understand their financial position, record money movements, calculate the real cost of everyday things, and make better decisions about future spending.

The application prioritizes usefulness, transparency, and user control over feature quantity. Existing apps often ship hundreds of features that do not fit this workflow; this project aims to cover the creator's real needs without that noise.

## Initial users

- Personal use by the creator
- Household use with a partner
- Potential future public users (after core workflows are reliable)

## Initial environment

- Self-hosted deployment
- Iranian bank statement imports (CSV / Excel; formats differ per bank)
- Per-account ISO currency as integer minor units (IRR with optional toman presentation; other currencies such as USD allowed; no FX / no cross-currency net worth in MVP)
- Persian and Gregorian date handling
- Manual transaction entry and recurring cash-flow forecasting
- Recipe and ingredient unit costing (post-MVP unless explicitly pulled forward)

## Product principles

1. Financial numbers must be deterministic and testable.
2. Actual transactions must remain distinct from forecasts.
3. Importing the same statement repeatedly must not silently duplicate transactions.
4. Users must understand how balances and cost calculations are derived.
5. Personal financial data must remain under the user's control.
6. Features should solve demonstrated problems rather than add complexity for its own sake.
7. The architecture should support household sharing without requiring a complicated distributed system.

## Initial non-goals

- Automatic bank connectivity / open banking APIs
- Payment initiation
- Full inventory management
- Investment portfolio management
- Automated lending decisions or loan matching as a core feature
- AI-generated financial calculations (advice may appear later; it must not invent balances or costs)
- Tax filing suites and social features

## Definition of success

The application can reliably reproduce account balances from the latest balance checkpoint and recorded movements after it, let the user record known balances at exact times to detect gaps, import statements from the banks the creator uses without silent duplicates, forecast upcoming cash flow from known recurrings and expected income, and (when specified) calculate recipe costs from ingredient prices and partial usage.

## Out of MVP by default

- Recipe / sandwich cost calculation (valuable; promote via backlog → spec when ready)
- Smart money advice and bank loan suggestions
- Public multi-tenant product polish

Treat this as a draft. It should evolve as real workflows are discovered.
