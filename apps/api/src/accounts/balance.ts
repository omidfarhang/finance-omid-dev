import { TransactionType } from '../generated/prisma/client';

export type MovementForBalance = {
  type: TransactionType;
  accountId: string;
  counterAccountId: string | null;
  amountMinor: bigint;
};

/** Apply one movement's effect on account balances (mutates map). */
export function applyMovementToBalances(
  balances: Map<string, bigint>,
  movement: MovementForBalance,
): void {
  const amount = movement.amountMinor;
  if (movement.type === TransactionType.INCOME) {
    balances.set(
      movement.accountId,
      (balances.get(movement.accountId) ?? 0n) + amount,
    );
    return;
  }
  if (movement.type === TransactionType.EXPENSE) {
    balances.set(
      movement.accountId,
      (balances.get(movement.accountId) ?? 0n) - amount,
    );
    return;
  }
  // TRANSFER: outflow from accountId, inflow to counterAccountId
  balances.set(
    movement.accountId,
    (balances.get(movement.accountId) ?? 0n) - amount,
  );
  if (movement.counterAccountId) {
    balances.set(
      movement.counterAccountId,
      (balances.get(movement.counterAccountId) ?? 0n) + amount,
    );
  }
}

export function computeBalanceMinor(
  openingBalanceMinor: bigint,
  accountId: string,
  movements: MovementForBalance[],
): bigint {
  const balances = new Map<string, bigint>([[accountId, openingBalanceMinor]]);
  for (const movement of movements) {
    applyMovementToBalances(balances, movement);
  }
  return balances.get(accountId) ?? openingBalanceMinor;
}

export function buildBalanceMap(
  openings: Array<{ id: string; openingBalanceMinor: bigint }>,
  movements: MovementForBalance[],
): Map<string, bigint> {
  const balances = new Map<string, bigint>();
  for (const account of openings) {
    balances.set(account.id, account.openingBalanceMinor);
  }
  for (const movement of movements) {
    applyMovementToBalances(balances, movement);
  }
  return balances;
}
