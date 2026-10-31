# DEC-016: Category catalog (codes, icons, colors, TRANSFER)

- **Status:** Accepted
- **Date:** 2026-10-31

## Context

MVP categories were thin typed lists with English DB names, only Uncategorized locked, and no transfer categories. Users need a richer app-provided catalog that is multi-language and read-only, plus the ability to add their own with icons and colors for grouping (and later charts). Transfers also need categorization.

## Options considered

- Keep editable English seed names; translate only Uncategorized in the UI.
- Global shared catalog table plus per-user custom rows.
- Per-user copies of the app catalog with stable `code` for i18n; icons and a fixed color palette on every row; TRANSFER as a third kind.
- Free-form hex colors and arbitrary icon uploads.

## Decision

- Category kinds: `INCOME` | `EXPENSE` | `TRANSFER`.
- Every movement type requires a matching-kind `categoryId` (transfers included). New transfers default to system TRANSFER Uncategorized.
- App-provided categories are per-user seeded rows with `isSystem: true`, stable `code`, fixed `icon` and `color`. Labels come from Transloco keys `categories.<code>` ([DEC-009](DEC-009-i18n.md)); `name` remains an English fallback for uniqueness/migrations.
- User-created categories have `code: null`, free-text `name`, and must pick `icon` + `color` from shared allowlists (PrimeIcons ids; named palette keys). Full edit/delete; delete reassigns transactions to Uncategorized of the same kind.
- Colors are palette keys (`slate`, `red`, `orange`, `amber`, `lime`, `emerald`, `cyan`, `blue`, `violet`, `pink`), exposed as CSS variables `--cat-*` for UI and future charts—not free hex.
- Catalog growth is additive via `ensureDefaultCategories` matching on `(kind, code)`.

## Consequences

- Schema gains `code`, `icon`, `color`; `CategoryKind` includes `TRANSFER`; existing transfers must be backfilled.
- Settings shows three panels; system rows are read-only; pickers and lists show icon + color.
- Contributors must not hardcode catalog display names in UI when `code` is present, or invent colors/icons outside the allowlists.

## Revisit when

Charts need finer grouping; users need to hide app categories; or a global catalog table becomes necessary for multi-tenant catalog updates without per-user copies.
