# DEC-010: Instance admin and registration control

- **Status:** Accepted
- **Date:** 2026-10-30

## Context

The app is self-hosted under a single deploy. Open registration is useful for onboarding a partner or household members, but the first registrant (instance owner) needs control: who can register, who may log in, and the ability to manage users and their money data when needed. Account membership roles (`OWNER` / `MEMBER`) are about shared ledgers, not instance control.

## Options considered

- Env-only “registration closed” flag (no in-app control).
- Invite-token only registration (no public register).
- **First registered user is instance `ADMIN`**; public registration stays open until an admin disables it; admins manage users and may operate on any user’s wallets/accounts via dedicated admin routes.
- Full multi-tenant SaaS admin (deferred).

## Decision

- Add instance role `USER` | `ADMIN` on `User` (separate from account membership roles).
- The **first registered user** on an empty database is `ADMIN`. Later registrants are `USER`.
- **Public registration defaults to open** (`AppSettings.registrationOpen = true`). An admin may close or reopen it. An empty database always allows bootstrap registration even if settings were closed.
- Admins may list users; promote/demote admins; enable/disable accounts (block login); delete users; and read/mutate another user’s wallets and accounts through `/admin/users/:userId/...` routes that reuse domain services with the target user id. Normal `/wallets` and `/accounts` routes stay membership/ownership scoped.
- Safeguards: cannot disable, delete, or demote the last remaining admin; disabled users cannot log in; sessions are cleared on disable/delete.

## Consequences

- Auth/register and session loading must respect settings and `disabledAt`.
- Admin UI and `AdminGuard` ship with this slice.
- Existing databases promote the earliest user to `ADMIN` via migration.

## Revisit when

Invite links, admin audit logs, OAuth/OIDC, or multi-tenant product polish require a different control model.
