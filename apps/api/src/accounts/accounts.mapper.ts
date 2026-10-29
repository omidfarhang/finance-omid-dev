import type { PublicAccount, PublicAccountMember } from '@finance/shared';
import type { Account, AccountMember, User } from '@prisma/client';

type MemberWithUser = AccountMember & { user: User };
type AccountWithMembers = Account & { members: MemberWithUser[] };

export function minorUnitsToString(value: bigint): string {
  return value.toString();
}

export function parseMinorUnits(value: string): bigint {
  return BigInt(value);
}

/** Balance for this milestone equals opening balance (no transactions yet). */
export function balanceMinorFromOpening(openingBalanceMinor: bigint): bigint {
  return openingBalanceMinor;
}

export function toPublicAccountMember(member: MemberWithUser): PublicAccountMember {
  return {
    userId: member.userId,
    email: member.user.email,
    displayName: member.user.displayName,
    role: member.role,
  };
}

export function toPublicAccount(account: AccountWithMembers): PublicAccount {
  const opening = minorUnitsToString(account.openingBalanceMinor);
  const balance = minorUnitsToString(
    balanceMinorFromOpening(account.openingBalanceMinor),
  );
  return {
    id: account.id,
    walletId: account.walletId,
    name: account.name,
    currency: account.currency,
    openingBalanceMinor: opening,
    balanceMinor: balance,
    isShared: account.isShared,
    members: account.members.map(toPublicAccountMember),
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
  };
}
