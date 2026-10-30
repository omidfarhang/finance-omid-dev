# Bank statement formats (research)

Anonymized column layouts only. **Never** commit real statements, account numbers, or personal rows. Feeds backlog multi-bank adapters after [DEC-012](../decisions/DEC-012-import-adapters.md) generic CSV.

## Known first path

| Adapter | Notes |
| --- | --- |
| `generic_csv` | See [imports.md](../plans/imports.md). Columns: `date`, `amount`, `type`, `unit=minor`, optional `description`, `external_id`. Fixture: `apps/api/test/fixtures/generic-statement.csv`. |

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

### (none filled yet)

Add entries when you export a statement and scrub it offline.
