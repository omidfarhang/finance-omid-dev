import { TransactionType } from '../generated/prisma/client';
import {
  buildBalanceMap,
  computeBalanceMinor,
  gapsForCheckpoints,
} from './balance';

describe('balance helpers', () => {
  const accountA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const accountB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const t0 = new Date('2026-01-01T00:00:00.000Z');
  const t1 = new Date('2026-01-15T12:00:00.000Z');
  const t2 = new Date('2026-02-01T00:00:00.000Z');

  it('reproduces balance from latest checkpoint plus later movements', () => {
    const balance = computeBalanceMinor(
      1000n,
      accountA,
      [
        {
          type: TransactionType.INCOME,
          accountId: accountA,
          counterAccountId: null,
          amountMinor: 500n,
          occurredAt: t1,
        },
        {
          type: TransactionType.EXPENSE,
          accountId: accountA,
          counterAccountId: null,
          amountMinor: 200n,
          occurredAt: t2,
        },
      ],
      t0,
    );
    expect(balance).toBe(1300n);
  });

  it('ignores movements at or before the anchor asOf', () => {
    const balance = computeBalanceMinor(
      1000n,
      accountA,
      [
        {
          type: TransactionType.INCOME,
          accountId: accountA,
          counterAccountId: null,
          amountMinor: 500n,
          occurredAt: t0,
        },
        {
          type: TransactionType.EXPENSE,
          accountId: accountA,
          counterAccountId: null,
          amountMinor: 100n,
          occurredAt: t1,
        },
      ],
      t0,
    );
    expect(balance).toBe(900n);
  });

  it('uses the provided latest anchor and ignores earlier movements', () => {
    // Display path anchors on the latest checkpoint (195M at t2), not the earliest.
    const balances = buildBalanceMap(
      [{ id: accountA, balanceMinor: 195_555_555n, asOf: t2 }],
      [
        {
          type: TransactionType.INCOME,
          accountId: accountA,
          counterAccountId: null,
          amountMinor: 5_555_555n,
          occurredAt: t0,
        },
        {
          type: TransactionType.EXPENSE,
          accountId: accountA,
          counterAccountId: null,
          amountMinor: 100n,
          occurredAt: new Date('2026-02-02T00:00:00.000Z'),
        },
      ],
    );
    expect(balances.get(accountA)).toBe(195_555_455n);
  });

  it('applies same-currency transfer to both accounts after their anchors', () => {
    const balances = buildBalanceMap(
      [
        { id: accountA, balanceMinor: 1000n, asOf: t0 },
        { id: accountB, balanceMinor: 100n, asOf: t0 },
      ],
      [
        {
          type: TransactionType.TRANSFER,
          accountId: accountA,
          counterAccountId: accountB,
          amountMinor: 250n,
          occurredAt: t1,
        },
      ],
    );
    expect(balances.get(accountA)).toBe(750n);
    expect(balances.get(accountB)).toBe(350n);
  });

  it('computes null gap for earliest and period gap for later checkpoints', () => {
    const gaps = gapsForCheckpoints(
      accountA,
      [
        {
          id: 'c1',
          asOf: t0,
          balanceMinor: 1000n,
          createdAt: t0,
        },
        {
          id: 'c2',
          asOf: t2,
          balanceMinor: 1500n,
          createdAt: t2,
        },
      ],
      [
        {
          type: TransactionType.INCOME,
          accountId: accountA,
          counterAccountId: null,
          amountMinor: 400n,
          occurredAt: t1,
        },
      ],
    );
    expect(gaps).toEqual([
      { id: 'c1', computedBalanceMinor: null, gapMinor: null },
      { id: 'c2', computedBalanceMinor: 1400n, gapMinor: 100n },
    ]);
  });

  it('treats empty window as zero movement sum', () => {
    const gaps = gapsForCheckpoints(
      accountA,
      [
        {
          id: 'c1',
          asOf: t0,
          balanceMinor: 1000n,
          createdAt: t0,
        },
        {
          id: 'c2',
          asOf: t2,
          balanceMinor: 1000n,
          createdAt: t2,
        },
      ],
      [],
    );
    expect(gaps[1]).toEqual({
      id: 'c2',
      computedBalanceMinor: 1000n,
      gapMinor: 0n,
    });
  });
});
