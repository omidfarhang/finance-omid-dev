# Security Policy

## Supported versions

This is a self-hosted personal finance application. Security fixes target the latest `main` branch. Older commits or forks are not supported.

## Reporting a vulnerability

Please report security issues **privately** via [GitHub Security Advisories](https://github.com/omidfarhang/finance-omid-dev/security/advisories/new) for this repository.

Do **not**:

- Open a public issue that includes credentials, session cookies, TOTP secrets, or real financial data
- Attach real bank statements, account numbers, or personal records
- Expect a same-day SLA—this is a personal project; reports are reviewed as soon as practical

Include enough detail to reproduce the issue with **synthetic** data (steps, affected component `api` / `web`, approximate versions or commit).

## Safe contribution hygiene

- Never commit `.env` files, private keys, or production secrets
- Use synthetic fixtures for tests and examples (see `.gitignore` and [CONTRIBUTING.md](CONTRIBUTING.md))
- Prefer disclosing soft secrets (example passwords in docs) only as clearly fake placeholders
