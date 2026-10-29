# DEC-007: Authentication and sessions

- **Status:** Accepted
- **Date:** 2026-10-29

## Context

The API is the system of record for personal financial data. Even for self-hosted personal use, register/login, optional 2FA, and profile are first implementation steps so mutating routes are authorized before ledger features ship. Household sharing will need identity later.

## Options considered

- Open local API with no auth until household sharing.
- JWT access + refresh tokens in local storage.
- **httpOnly cookie sessions** + optional TOTP 2FA.
- Mandatory 2FA at registration.

## Decision

- Implement **register**, **login**, **logout**, and **profile** (display name; locale/timezone hooks for Persian later) as an early milestone.
- Authenticate browser clients with **httpOnly cookie sessions** (secure, same-site appropriate for the deploy).
- Support **optional TOTP 2FA**: enroll and verify after login; not mandatory at register in MVP (may be enforced later).
- Protect mutating API routes; the Angular client uses thin auth guards and does not hold long-lived secrets in JS-accessible storage.
- Password hashes and TOTP secrets stay server-side only; never commit credentials.

## Consequences

- Auth modules ship before wallets/ledger features.
- Cookie + CORS configuration must match the Angular origin in local and self-hosted deploys.
- Optional 2FA keeps onboarding light while allowing stronger protection when enabled.

## Revisit when

Mandatory 2FA, OAuth/OIDC, multi-device session management, or partner invite flows require a different identity model.
