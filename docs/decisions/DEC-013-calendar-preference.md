# DEC-013: Calendar preference (Gregorian / Jalali)

- **Status:** Accepted
- **Date:** 2026-10-30

## Context

The product needs Persian (Jalali) and Gregorian calendars for display, form inputs, Activity month filters, and next-month Outlook. UI language already supports `fa` / `en` ([DEC-009](DEC-009-i18n.md)) but must not imply a calendar system. Profile already stores optional `timeZone` ([DEC-007](DEC-007-auth.md)). Ledger storage must remain unambiguous ISO instants.

## Options considered

- Infer calendar from UI language (`fa` → Jalali).
- Client-only `localStorage` preference (like IRR toman presentation).
- Profile-synced preference with `localStorage` cache; ISO storage; month semantics follow calendar + timezone.
- Display/input formatting only; keep UTC Gregorian month bounds for filters and forecast.

## Decision

- Persist **`calendar`** on the user profile: `GREGORIAN` | `JALALI`. Default **`JALALI`** (Iranian-first). Cache in `localStorage` for immediate UI; hydrate from profile when authenticated (same dual-write pattern as UI language).
- Calendar is **independent of UI language**: Farsi UI may use Gregorian; English UI may use Jalali.
- Store and exchange all event times as **ISO-8601 instants** (`DateTime` / `z.iso.datetime()`). Never store Jalali strings in the database.
- **Full month semantics:** Activity “this month” and Outlook “next month” use the user’s calendar in their profile timezone. Unset timezone → **`UTC`** for month bounds (deterministic server forecast).
- Shared pure helpers (`jalaali-js`) compute civil dates and month ISO bounds for API and web.
- Form pickers and list formatting follow the preference; Gregorian uses PrimeNG DatePicker; Jalali uses a custom month grid (no fragile third-party PrimeNG forks).
- Recurring `anchorDay` (1–28) means day-of-month **in the user’s calendar** for the forecast month window.

## Consequences

- Forecast responses include `calendar` plus `year` / `month` **in that calendar**.
- Contributors must not treat `locale === 'fa'` as Jalali.
- Profile API and Prisma schema gain a `calendar` field; migrations default existing users to Jalali.

## Revisit when

Date-only (no time) product modes are needed; or Temporal / platform calendars replace `jalaali-js` across Node and browsers.
