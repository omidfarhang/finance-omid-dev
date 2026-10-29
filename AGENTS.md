# Project Instructions

Rules for humans and AI coding agents working in this repository.

## Before implementation

- Read `README.md`, `docs/vision.md`, and the relevant plan or specification.
- Check `tasks/todo.md` and `tasks/backlog.md` before proposing new work.
- Discuss significant unresolved product or architectural questions before committing to an approach.
- Do not treat brainstorm items as approved requirements.

## Engineering principles

- Prefer the simplest implementation that satisfies documented requirements.
- Keep domain calculations independent of UI and database details where practical.
- Use integer or decimal-safe monetary arithmetic; never use binary floating point for financial calculations.
- Never silently infer whether imported amounts are rial or toman.
- Keep actual transactions, scheduled events, and hypothetical scenarios separate.
- Preserve auditability and prevent accidental duplicate imports.
- Validate inputs and enforce authorization on the server when a server exists.
- Write tests for transfers, balances, imports, currency presentation, and forecasting.

## Documentation

- Update specifications or the MVP when behavior changes.
- Record significant architectural decisions in `docs/decisions/` (`DEC-NNN`).
- Move ideas to the backlog only after clarifying their purpose.
- Keep task lists actionable and current.
- Do not invent requirements that are absent from the documentation.

## Security and privacy

- Never commit credentials, private bank statements, or real financial records.
- Use synthetic fixtures for tests and examples.
- Review database migrations and backup implications before changing persistent data.

## Git

- Never commit changes. Commits are done by the human maintainer only.

Keep this file concise. Detailed feature requirements belong in plans and specifications, not here.
