# Contributing

Thanks for your interest in this personal finance project. Docs are the source of truth—read before proposing or coding changes.

## Before you start

1. Read [README.md](README.md), [docs/vision.md](docs/vision.md), and [docs/design.md](docs/design.md).
2. Check related plans under [docs/plans/](docs/plans/) and decisions under [docs/decisions/](docs/decisions/).
3. Skim [tasks/todo.md](tasks/todo.md) and [tasks/backlog.md](tasks/backlog.md).
4. Follow [AGENTS.md](AGENTS.md) for engineering, privacy, and docs-first rules (required for AI coding agents and useful for humans).

Brainstorm items in [docs/brainstorm/](docs/brainstorm/) are not approved requirements.

## Idea workflow

1. Capture in the inbox
2. Triage (clarify, dedupe, reject, or park)
3. Backlog if worth considering
4. Plan or specification when scope and behavior matter
5. Todo when ready to implement
6. Done when verified

For feature ideas, prefer an issue that states the **problem** and **expected outcome**, or a short note that can move into the backlog—not an implementation PR with undocumented behavior.

## Local development

See [README.md](README.md) for prerequisites, env setup, and `pnpm` / Docker commands.

## Making changes

1. Confirm the work matches documented intent. If docs conflict or product questions are open, discuss first.
2. Update the relevant docs (plan, spec, MVP, design, DEC, task lists) **before** or in the same change as the implementation.
3. Prefer the simplest approach that satisfies the docs.
4. Keep domain money calculations integer/decimal-safe; never use binary floating point for financial amounts.
5. Never silently infer whether imported amounts are rial or toman.
6. Keep actual transactions, scheduled events, and forecasts separate.
7. Add or update tests for transfers, balances, imports, currency presentation, and forecasting when those paths change.

## Privacy

Never commit credentials, private bank statements, account numbers, or real financial records. Use synthetic fixtures only. See `.gitignore` and [SECURITY.md](SECURITY.md).

## Pull requests

- Open a PR against `main` with a clear summary and test plan (template provided).
- Link related docs/DECs/issues.
- Confirm docs were updated when behavior or architecture changed.
- Human maintainers review and merge; AI agents must not create commits ([AGENTS.md](AGENTS.md)).

## Conduct and security

- Everyone interacting in this repo must follow the [Code of Conduct](CODE_OF_CONDUCT.md).
- Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md)—do not open public issues with secrets or real financial data.
