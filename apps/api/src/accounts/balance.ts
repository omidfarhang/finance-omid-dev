import { TransactionType } from '../generated/prisma/client';

export type MovementForBalance = {
  type: TransactionType;
  accountId: string;
  counterAccountId: string | null;
  amountMinor: bigint;
  occurredAt: Date;
};

export type AccountAnchor = {
  id: string;
  balanceMinor: bigint;
  asOf: Date;
};

export type CheckpointForGap = {
  id: string;
  asOf: Date;
  balanceMinor: bigint;
  createdAt: Date;
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

/** Signed effect of a movement on a single account (0 if unrelated). */
export function movementDeltaForAccount(
  movement: MovementForBalance,
  accountId: string,
): bigint {
  const amount = movement.amountMinor;
  if (movement.type === TransactionType.INCOME) {
    return movement.accountId === accountId ? amount : 0n;
  }
  if (movement.type === TransactionType.EXPENSE) {
    return movement.accountId === accountId ? -amount : 0n;
  }
  if (movement.accountId === accountId) {
    return -amount;
  }
  if (movement.counterAccountId === accountId) {
    return amount;
  }
  return 0n;
}

export function computeBalanceMinor(
  anchorBalanceMinor: bigint,
  accountId: string,
  movements: MovementForBalance[],
  anchorAsOf: Date,
): bigint {
  let balance = anchorBalanceMinor;
  for (const movement of movements) {
    if (movement.occurredAt <= anchorAsOf) {
      continue;
    }
    balance += movementDeltaForAccount(movement, accountId);
  }
  return balance;
}

export function buildBalanceMap(
  anchors: AccountAnchor[],
  movements: MovementForBalance[],
): Map<string, bigint> {
  const balances = new Map<string, bigint>();
  const asOfByAccount = new Map<string, Date>();
  for (const account of anchors) {
    balances.set(account.id, account.balanceMinor);
    asOfByAccount.set(account.id, account.asOf);
  }
  for (const movement of movements) {
    // Apply only when the movement is after that account's anchor.
    // A transfer may affect two accounts with different anchors.
    const fromAsOf = asOfByAccount.get(movement.accountId);
    if (fromAsOf && movement.occurredAt > fromAsOf) {
      const amount = movement.amountMinor;
      if (movement.type === TransactionType.INCOME) {
        balances.set(
          movement.accountId,
          (balances.get(movement.accountId) ?? 0n) + amount,
        );
      } else if (movement.type === TransactionType.EXPENSE) {
        balances.set(
          movement.accountId,
          (balances.get(movement.accountId) ?? 0n) - amount,
        );
      } else {
        balances.set(
          movement.accountId,
          (balances.get(movement.accountId) ?? 0n) - amount,
        );
      }
    }
    if (
      movement.type === TransactionType.TRANSFER &&
      movement.counterAccountId
    ) {
      const toAsOf = asOfByAccount.get(movement.counterAccountId);
      if (toAsOf && movement.occurredAt > toAsOf) {
        balances.set(
          movement.counterAccountId,
          (balances.get(movement.counterAccountId) ?? 0n) +
            movement.amountMinor,
        );
      }
    }
  }
  return balances;
}

export function compareCheckpointsAsc(
  a: CheckpointForGap,
  b: CheckpointForGap,
): number {
  const asOfDiff = a.asOf.getTime() - b.asOf.getTime();
  if (asOfDiff !== 0) {
    return asOfDiff;
  }
  const createdDiff = a.createdAt.getTime() - b.createdAt.getTime();
  if (createdDiff !== 0) {
    return createdDiff;
  }
  return a.id.localeCompare(b.id);
}

/**
 * For each checkpoint (sorted ascending), compute gap vs previous window.
 * Earliest has computedBalanceMinor and gapMinor null.
 */
export function gapsForCheckpoints(
  accountId: string,
  checkpoints: CheckpointForGap[],
  movements: MovementForBalance[],
): Array<{
  id: string;
  computedBalanceMinor: bigint | null;
  gapMinor: bigint | null;
}> {
  const sorted = [...checkpoints].sort(compareCheckpointsAsc);
  const result: Array<{
    id: string;
    computedBalanceMinor: bigint | null;
    gapMinor: bigint | null;
  }> = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i]!;
    if (i === 0) {
      result.push({
        id: current.id,
        computedBalanceMinor: null,
        gapMinor: null,
      });
      continue;
    }
    const previous = sorted[i - 1]!;
    let computed = previous.balanceMinor;
    for (const movement of movements) {
      if (
        movement.occurredAt > previous.asOf &&
        movement.occurredAt <= current.asOf
      ) {
        computed += movementDeltaForAccount(movement, accountId);
      }
    }
    result.push({
      id: current.id,
      computedBalanceMinor: computed,
      gapMinor: current.balanceMinor - computed,
    });
  }

  return result;
}
