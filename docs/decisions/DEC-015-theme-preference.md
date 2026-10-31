# DEC-015: Theme preference (Light / Dark / System)

- **Status:** Accepted
- **Date:** 2026-10-31

## Context

Users expect Light, Dark, and System appearance controls. The UI plan previously deferred dark mode. Profile already syncs locale and calendar with a `localStorage` cache ([DEC-009](DEC-009-i18n.md), [DEC-013](DEC-013-calendar-preference.md)). PrimeNG Aura supports class-based dark mode; app chrome uses CSS variables that need a dark token set.

## Options considered

- Client-only `localStorage` preference (like IRR toman presentation).
- Light / Dark only (no System).
- Profile-synced preference with `localStorage` cache; default System; class-based PrimeNG dark mode + app CSS tokens.
- Separate custom PrimeNG presets per mode.

## Decision

- Persist **`theme`** on the user profile: `LIGHT` | `DARK` | `SYSTEM`. Default **`SYSTEM`** (follow OS `prefers-color-scheme`) for new users, migrations, shared `DEFAULT_THEME`, and cold start when nothing is stored.
- Cache in `localStorage` (`finance.theme`); hydrate from profile when authenticated (same dual-write pattern as UI language and calendar).
- **Resolved** appearance drives the UI: System tracks the OS media query; Light/Dark force.
- Control lives **only in Settings** as an **icon-based segmented control** (PrimeNG `SelectButton` with sun / moon / desktop icons)—not a dropdown. Changing the choice applies immediately locally; profile Save persists to the server.
- Guests / pre-auth: localStorage if set, otherwise System.
- PrimeNG Aura uses `darkModeSelector: '.app-dark'` on `html`; app tokens define a dark set under `html.app-dark`.
- Apply the dark class as early as practical (inline boot script + Angular service) to avoid FOUC.

## Consequences

- Profile API and Prisma schema gain a `theme` field; existing users default to System.
- Shell and page SCSS that hardcode light surfaces must use shared CSS variables so dark mode remains usable.
- Contributors must not leave `darkModeSelector: false` or invent a second theme toggle outside Settings.

## Revisit when

Per-brand custom PrimeNG presets, forced high-contrast modes, or OS-level preference APIs beyond `prefers-color-scheme` become product requirements.
