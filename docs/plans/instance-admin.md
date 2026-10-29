# Slice: Instance admin and registration control

Product rules: [DEC-010](../decisions/DEC-010-instance-admin.md). Builds on [DEC-007](../decisions/DEC-007-auth.md). Parent scope: [mvp.md](mvp.md).

## Goals

- First registrant is instance `ADMIN`; later users are `USER`
- Public registration open by default; admin can close/reopen
- Admin can list users, change roles, enable/disable, delete users
- Admin can list/CRUD another user’s wallets and accounts via admin routes
- Disabled users cannot log in; last-admin safeguards enforced

## Out of scope

Invite tokens, admin audit log, OAuth, multi-tenant SaaS admin, impersonation cookies, transactions (not built yet).

## Schema

- **User:** `role` (`USER` | `ADMIN`), `disabledAt` (nullable)
- **AppSettings:** singleton row; `registrationOpen` (default `true`)

## API (`/api/v1`)

| Area | Routes |
| --- | --- |
| Registration status | `GET /auth/registration-status` → `{ open, bootstrapAllowed }` |
| Register / login | Existing auth; gate register; reject disabled |
| Settings | `GET/PATCH /admin/settings` |
| Users | `GET /admin/users`, `PATCH /admin/users/:id`, `DELETE /admin/users/:id` |
| User money | `/admin/users/:userId/wallets…`, `/admin/users/:userId/accounts…` |

Admin routes require session + `role === ADMIN`.

## Acceptance

- Empty DB: first register creates `ADMIN` even if registration was closed
- With users present and registration closed, register returns forbidden
- Admin can toggle `registrationOpen`
- Admin can promote/demote, disable/enable, and delete users; last admin cannot be demoted, disabled, or deleted
- Disabled user cannot obtain a session
- Admin can list and mutate another user’s wallets/accounts via admin paths; non-admin receives 403
- Normal wallet/account routes remain scoped to the authenticated user
