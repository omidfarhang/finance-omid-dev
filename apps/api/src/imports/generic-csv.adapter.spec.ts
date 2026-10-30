import { BadRequestException } from '@nestjs/common';
import { parseGenericCsv } from './generic-csv.adapter';

const header =
  'date,amount,type,description,external_id,unit';

describe('parseGenericCsv', () => {
  it('parses valid synthetic rows', () => {
    const csv = `${header}
2026-01-15,15000,EXPENSE,Coffee,ext-1,minor
2026-01-16,500000,INCOME,Salary,ext-2,minor
`;
    const rows = parseGenericCsv(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.amountMinor).toBe(15000n);
    expect(rows[0]?.type).toBe('EXPENSE');
    expect(rows[0]?.dedupeKey).toBe('ext-1');
    expect(rows[1]?.type).toBe('INCOME');
  });

  it('rejects non-minor unit', () => {
    const csv = `${header}
2026-01-15,1500,EXPENSE,Coffee,ext-1,toman
`;
    expect(() => parseGenericCsv(csv)).toThrow(BadRequestException);
  });

  it('builds stable hash dedupe keys without external_id', () => {
    const csv = `${header}
2026-01-15,15000,EXPENSE,Coffee shop,,minor
2026-01-15,15000,EXPENSE,Coffee shop,,minor
`;
    const rows = parseGenericCsv(csv);
    expect(rows[0]?.dedupeKey).toBe(rows[1]?.dedupeKey);
    expect(rows[0]?.dedupeKey).toMatch(/^[a-f0-9]{64}$/);
  });
});
