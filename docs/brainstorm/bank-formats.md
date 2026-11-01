# Bank statement formats (research)

Anonymized column layouts only. **Never** commit real statements, account numbers, or personal rows. Feeds backlog multi-bank adapters after [DEC-012](../decisions/DEC-012-import-adapters.md) generic CSV.

## Known adapters

| Adapter | Notes |
| --- | --- |
| `generic_csv` | See [imports.md](../plans/imports.md). Columns: `date`, `amount`, `type`, `unit=minor`, optional `description`, `external_id`. Fixture: `apps/api/test/fixtures/generic-statement.csv`. UI sample: `apps/web/public/samples/generic_csv.csv`. |
| `blubank_xlsx` | BluBank Excel; see below and [imports.md](../plans/imports.md). Fixture: `apps/api/test/fixtures/blubank-statement.xlsx`. UI sample: `apps/web/public/samples/blubank_xlsx.xlsx`. |

## Banks to document (fill in)

For each bank you actually use, add a subsection with **header names only** (or renamed placeholders), encoding (UTF-8 / Windows-1256), date format, and whether amounts are signed vs debit/credit columns. Mark whether amounts appear to be rials or toman **from the bank’s own labeling** — never guess in the adapter.

### Template

```markdown
### Bank name

- **Export type:** CSV / Excel
- **Encoding:**
- **Date column / format:**
- **Amount columns:**
- **Description / memo:**
- **External id / reference (if any):**
- **Unit labeling on export:** (rial / toman / none — quote bank wording)
- **Sample header row (anonymized):**
```

### BluBank (بلو)

- **Export type:** Excel (`.xlsx`)
- **Encoding:** OOXML / UTF-8 shared strings
- **Date column / format:** `تاریخ` — Jalali `YYYY/MM/DD HH:mm:ss` (e.g. `1405/08/10 11:32:22`)
- **Amount columns:** separate `برداشت (ریال)` (debit / expense) and `واریز (ریال)` (credit / income); also `مانده (ریال)` running balance (not imported)
- **Description / memo:** `شرح سند`; transaction kind label in `نوع تراکنش`
- **External id / reference (if any):** `شماره سند` (may repeat for fee + parent movement); `ردیف` is export-local row index
- **Unit labeling on export:** explicit `(ریال)` on balance / debit / credit headers; summary lines also say `(ریال)` / `نوع ارز: ریال ایران`
- **Sample header row (anonymized):** `مانده (ریال) | برداشت (ریال) | واریز (ریال) | نوع تراکنش | شرح سند | شماره سند | تاریخ | ردیف`
- **Metadata (not imported):** opening/closing summaries above the header (prior balance, totals, IBAN, statement range, etc.)
