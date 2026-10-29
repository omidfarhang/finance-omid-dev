# Project Instructions

Rules for humans and AI coding agents working in this repository.

## Docs first (mandatory)

Docs are the source of truth. Do not invent requirements absent from documentation.

1. **Read before acting.** Before any task, read `README.md`, `docs/vision.md`, `docs/design.md`, relevant plans/specs under `docs/`, and related `docs/decisions/` entries. Check `tasks/todo.md` and `tasks/backlog.md` before proposing or starting work.
2. **Check against docs.** Confirm the requested work matches documented intent. If docs conflict with the request, or significant product/architecture questions are unresolved, stop and discuss—do not proceed on assumptions. Brainstorm items are not approved requirements.
3. **Update docs first.** Once a task is confirmed, update the relevant docs (plan, spec, MVP, design, DEC, task lists) *before* implementation so the written plan matches what will be built.
4. **Follow docs when acting.** Implement only what the updated docs describe. Prefer the simplest approach that satisfies them. Keep task lists actionable and current as work progresses.

When behavior, architecture, or stack choices change: update specs/MVP/design in the same change set; record significant decisions in `docs/decisions/` (`DEC-NNN`); keep `docs/design.md` in sync with related DECs. Move ideas to the backlog only after clarifying their purpose.

## Engineering principles

- Keep domain calculations independent of UI and database details where practical.
- Use integer or decimal-safe monetary arithmetic; never use binary floating point for financial calculations.
- Never silently infer whether imported amounts are rial or toman.
- Keep actual transactions, scheduled events, and hypothetical scenarios separate.
- Preserve auditability and prevent accidental duplicate imports.
- Validate inputs and enforce authorization on the server when a server exists.
- Write tests for transfers, balances, imports, currency presentation, and forecasting.

## Security and privacy

- Never commit credentials, private bank statements, or real financial records.
- Use synthetic fixtures for tests and examples.
- Review database migrations and backup implications before changing persistent data.

## Git

- Never commit changes. Commits are done by the human maintainer only.

Keep this file concise. Detailed feature requirements belong in plans and specifications, not here.
