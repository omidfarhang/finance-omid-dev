import { TransactionType } from '../generated/prisma/client';
import { buildBalanceMap, computeBalanceMinor } from './balance';

describe('balance helpers', () => {
  const accountA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const accountB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  it('reproduces balance from opening plus income and expense', () => {
    const balance = computeBalanceMinor(1000n, accountA, [
      {
        type: TransactionType.INCOME,
        accountId: accountA,
        counterAccountId: null,
        amountMinor: 500n,
      },
      {
        type: TransactionType.EXPENSE,
        accountId: accountA,
        counterAccountId: null,
        amountMinor: 200n,
      },
    ]);
    expect(balance).toBe(1300n);
  });

  it('applies same-currency transfer to both accounts without income/expense', () => {
    const balances = buildBalanceMap(
      [
        { id: accountA, openingBalanceMinor: 1000n },
        { id: accountB, openingBalanceMinor: 100n },
      ],
      [
        {
          type: TransactionType.TRANSFER,
          accountId: accountA,
          counterAccountId: accountB,
          amountMinor: 250n,
        },
      ],
    );
    expect(balances.get(accountA)).toBe(750n);
    expect(balances.get(accountB)).toBe(350n);
  });
});
