# DEC-011: App information architecture (hybrid home + dual shells)

- **Status:** Accepted
- **Date:** 2026-10-30

## Context

Early UI grew as API-slice forms (top bar + always-visible create fields). There was no sitemap, and instance admin shared the same CRUD mental model as personal money. MVP still needs ledger, import, and outlook surfaces. Without locked IA, each slice will keep stacking forms and the product will not feel like a finance app.

## Options considered

- Keep route-per-API-slice pages with inline forms (status quo).
- Dashboard-only home with deep links invented ad hoc per feature.
- **Hybrid home** as daily landing (balances + quick-add + short outlook), **App vs Admin shells**, dedicated routes for Activity / Accounts / Import / Outlook / Settings; create/edit in dialogs or dedicated routes — not always-on form stacks. Full detail in [ui-ux.md](../plans/ui-ux.md).

## Decision

- Authenticated daily landing is **`/` hybrid home** (per-currency balances, quick income/expense add, labeled outlook strip). Post-login goes to `/`, not profile.
- **App shell** primary nav: Home · Activity · Accounts · Outlook. Settings, Support, Sign out, and Admin (if role) live in a **user menu** (signed-in name). Language control is Guest-shell / Settings only — not in the authenticated toolbar. Status/health is not primary nav. Statement import is a **dialog** opened from Activity and Account detail (not a primary-nav peer).
- **Admin shell** is separate; managing another user’s money requires an acting-as context banner and dedicated `/admin/...` routes ([DEC-010](DEC-010-instance-admin.md)).
- List pages prioritize data and actions; create/edit use dialog, drawer, or sub-route.
- Visual direction stays current (Aura, blue accent / neutral gray grounds, existing fonts); IA is the corrective change, not a rebrand.
- Money, i18n, PWA, and household rules remain as in DEC-003, DEC-005, DEC-006, DEC-009.

## Consequences

- Frontend work follows [ui-ux.md](../plans/ui-ux.md); later MVP slices fill reserved routes instead of inventing nav.
- Existing `/wallets` and `/profile` should redirect into Accounts and Settings when the shell is implemented.
- Slightly more routing/layout code up front; less duplicated CRUD pages later.

## Revisit when

Evidence that hybrid home is the wrong daily default (e.g. users only ever open Activity), or that Admin must be fully embedded in App chrome for a multi-tenant product. Import returned to a dedicated primary destination if dialog entry from Activity / Account detail proves too hidden.
