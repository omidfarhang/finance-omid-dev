# DEC-018: CI-built container images (GHCR)

- **Status:** Accepted
- **Date:** 2026-11-01

## Context

Self-hosted deploy under `finance.omid.dev` previously built `api` and `web` images on the server (`docker compose up -d --build` after `git pull`). That couples deploy time to compile cost, needs build tooling on the host, and duplicates work already done in CI-capable environments. We want the server to pull pre-built images and start them.

## Options considered

- Keep on-server Compose builds.
- Build and push from GitHub Actions to Docker Hub.
- Build and push from GitHub Actions to GitHub Container Registry (GHCR).
- Auto-deploy over SSH from Actions vs manual pull/up on the server.

## Decision

- **CI builds images** on every push to `master` via GitHub Actions (`.github/workflows/docker-images.yml`).
- **Registry:** GHCR — `ghcr.io/omidfarhang/finance-omid-dev/api` and `.../web`.
- **Tag:** `:latest` only for now (no semver / release tags yet); Compose may use `IMAGE_TAG` (default `latest`).
- **Packages are public** so the server can pull without a registry token. Visibility is a package setting (no REST API to change it), not a workflow step.
- **Server deploy:** `git pull && docker compose pull && docker compose up -d` — no `--build`. Compose still defines postgres + api + web; TLS remains at host nginx ([DEC-008](DEC-008-self-hosted-docker.md)).
- **PrimeNG license:** `PRIMENG_LICENSE` is a GitHub Actions secret (web image build-arg); not required in server `.env` when using GHCR images.
- **Local Postgres:** `pnpm db:up` unchanged (Compose `postgres` only). Local rebuild of app images is optional (`docker build`); not the production path.
- **Migrations on boot:** unchanged — API entrypoint still runs `prisma migrate deploy`.

## Consequences

- Deploy no longer compiles on the server; first successful Actions run must complete before a new commit is pullable.
- Contributors must set repo secret `PRIMENG_LICENSE` for production web images without the PrimeUI banner.
- Versioned tags / auto-SSH deploy remain future options when revisiting.

## Revisit when

We want immutable version tags, multi-arch builds, staging vs production channels, or push-to-deploy over SSH.
