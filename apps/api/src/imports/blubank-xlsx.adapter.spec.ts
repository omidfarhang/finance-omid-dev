import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { parseBlubankXlsx } from './blubank-xlsx.adapter';

const fixturePath = join(
  __dirname,
  '../../test/fixtures/blubank-statement.xlsx',
);

describe('parseBlubankXlsx', () => {
  it('parses synthetic BluBank rows with Jalali dates and rial amounts', () => {
    const buffer = readFileSync(fixturePath);
    const rows = parseBlubankXlsx(buffer);
    expect(rows).toHaveLength(3);

    expect(rows[0]?.type).toBe('EXPENSE');
    expect(rows[0]?.amountMinor).toBe(10000n);
    expect(rows[0]?.dedupeKey).toBe(
      'blubank_xlsx|SYNDOC001|EXPENSE|10000|1405/08/10 11:32:22',
    );
    expect(rows[0]?.description).toContain('کارمزد');

    expect(rows[1]?.type).toBe('EXPENSE');
    expect(rows[1]?.amountMinor).toBe(200000n);
    expect(rows[1]?.dedupeKey).toBe(
      'blubank_xlsx|SYNDOC001|EXPENSE|200000|1405/08/10 11:32:22',
    );

    expect(rows[2]?.type).toBe('INCOME');
    expect(rows[2]?.amountMinor).toBe(500000n);
    expect(rows[2]?.occurredAt.toISOString()).toBe('2026-10-29T08:34:17.000Z');
  });

  it('rejects workbooks without rial-labeled debit/credit headers', () => {
    const sheet = XLSX.utils.aoa_to_sheet([
      ['برداشت', 'واریز', 'تاریخ'],
      [1000, 0, '1405/01/01 00:00:00'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, 'Bad');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    expect(() => parseBlubankXlsx(buffer)).toThrow(BadRequestException);
  });

  it('builds stable dedupe keys across re-parse', () => {
    const buffer = readFileSync(fixturePath);
    const a = parseBlubankXlsx(buffer);
    const b = parseBlubankXlsx(buffer);
    expect(a.map((r) => r.dedupeKey)).toEqual(b.map((r) => r.dedupeKey));
  });
});
