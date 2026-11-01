import type { PublicAccount, PublicAccountMember } from '@finance/shared';
import type { Account, AccountMember, User } from '../generated/prisma/client';

type MemberWithUser = AccountMember & { user: User };
type AccountWithMembers = Account & { members: MemberWithUser[] };

export function minorUnitsToString(value: bigint): string {
  return value.toString();
}

export function parseMinorUnits(value: string): bigint {
  return BigInt(value);
}

export function toPublicAccountMember(member: MemberWithUser): PublicAccountMember {
  return {
    userId: member.userId,
    email: member.user.email,
    displayName: member.user.displayName,
    role: member.role,
  };
}

export function toPublicAccount(
  account: AccountWithMembers,
  balanceMinor: bigint,
): PublicAccount {
  return {
    id: account.id,
    walletId: account.walletId,
    name: account.name,
    currency: account.currency,
    balanceMinor: minorUnitsToString(balanceMinor),
    isShared: account.isShared,
    members: account.members.map(toPublicAccountMember),
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
  };
}
