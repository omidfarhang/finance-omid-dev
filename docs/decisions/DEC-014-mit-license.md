# DEC-014: MIT license for the monorepo

- **Status:** Accepted
- **Date:** 2026-10-31

## Context

The repository had no root license and the API package declared `UNLICENSED`. The project may become a public release later; contributors and redistributors need a clear grant. Workspace packages remain private npm packages (not published).

## Options considered

- MIT (permissive, widely understood).
- Apache-2.0 (permissive plus patent grant).
- Proprietary / all rights reserved (no open-source grant).

## Decision

- License the entire monorepo under **MIT**, copyright **Omid Farhang**, year **2026**.
- Keep packages `private: true`; set `"license": "MIT"` in root and workspace `package.json` files.
- Ship standard community docs: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, and GitHub issue/PR templates.

## Consequences

- Others may use, modify, and redistribute under MIT terms with the copyright notice retained.
- Security reports go through GitHub Security Advisories (no public personal email required).
- Contribution workflow stays docs-first ([AGENTS.md](../../AGENTS.md), [CONTRIBUTING.md](../../CONTRIBUTING.md)).

## Revisit when

A different license is required for corporate contribution, patent concerns favor Apache-2.0, or the product is withdrawn from open source.
