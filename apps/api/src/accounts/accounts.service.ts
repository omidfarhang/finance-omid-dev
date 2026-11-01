import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AddAccountMemberDto,
  CreateAccountDto,
  UpdateAccountDto,
} from '@finance/shared';
import { AccountMemberRole, Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WalletsService } from '../wallets/wallets.service';
import { buildBalanceMap, compareCheckpointsAsc } from './balance';
import {
  parseMinorUnits,
  toPublicAccount,
} from './accounts.mapper';

const accountInclude = {
  members: { include: { user: true }, orderBy: { createdAt: 'asc' as const } },
} satisfies Prisma.AccountInclude;

@Injectable()
export class AccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletsService: WalletsService,
  ) {}

  async listForUser(userId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { members: { some: { userId } } },
      include: accountInclude,
      orderBy: { createdAt: 'asc' },
    });
    const balances = await this.balancesForAccounts(accounts.map((a) => a.id));
    return accounts.map((account) =>
      toPublicAccount(account, balances.get(account.id) ?? 0n),
    );
  }

  async getForUser(userId: string, accountId: string) {
    const account = await this.requireMemberAccount(userId, accountId);
    const balances = await this.balancesForAccounts([account.id]);
    return toPublicAccount(account, balances.get(account.id) ?? 0n);
  }

  async create(userId: string, dto: CreateAccountDto) {
    await this.walletsService.requireOwnedWallet(userId, dto.walletId);
    const initialBalanceMinor = parseMinorUnits(dto.initialBalanceMinor);
    const initialBalanceAsOf = new Date(dto.initialBalanceAsOf);

    const account = await this.prisma.$transaction(async (tx) => {
      const created = await tx.account.create({
        data: {
          walletId: dto.walletId,
          name: dto.name,
          currency: dto.currency,
          isShared: dto.isShared,
          members: {
            create: {
              userId,
              role: AccountMemberRole.OWNER,
            },
          },
          checkpoints: {
            create: {
              asOf: initialBalanceAsOf,
              balanceMinor: initialBalanceMinor,
              createdByUserId: userId,
            },
          },
        },
        include: accountInclude,
      });
      return created;
    });

    return toPublicAccount(account, initialBalanceMinor);
  }

  async update(userId: string, accountId: string, dto: UpdateAccountDto) {
    await this.requireOwnerAccount(userId, accountId);
    const account = await this.prisma.account.update({
      where: { id: accountId },
      data: { name: dto.name },
      include: accountInclude,
    });
    const balances = await this.balancesForAccounts([account.id]);
    return toPublicAccount(account, balances.get(account.id) ?? 0n);
  }

  async remove(userId: string, accountId: string) {
    await this.requireOwnerAccount(userId, accountId);
    const movementCount = await this.prisma.transaction.count({
      where: {
        OR: [{ accountId }, { counterAccountId: accountId }],
      },
    });
    if (movementCount > 0) {
      throw new BadRequestException(
        'Cannot delete an account that has transactions',
      );
    }
    await this.prisma.account.delete({ where: { id: accountId } });
  }

  async addMember(
    userId: string,
    accountId: string,
    dto: AddAccountMemberDto,
  ) {
    const account = await this.requireOwnerAccount(userId, accountId);
    if (!account.isShared) {
      throw new BadRequestException('Only shared accounts can add members');
    }

    const memberUser = await this.prisma.user.findFirst({
      where: {
        email: { equals: dto.email.trim(), mode: 'insensitive' },
      },
    });
    if (!memberUser) {
      throw new NotFoundException('User not found');
    }
    if (memberUser.id === userId) {
      throw new BadRequestException('Owner is already a member');
    }

    const existing = await this.prisma.accountMember.findUnique({
      where: {
        accountId_userId: { accountId, userId: memberUser.id },
      },
    });
    if (existing) {
      throw new BadRequestException('User is already a member');
    }

    await this.prisma.accountMember.create({
      data: {
        accountId,
        userId: memberUser.id,
        role: AccountMemberRole.MEMBER,
      },
    });

    const updated = await this.prisma.account.findUniqueOrThrow({
      where: { id: accountId },
      include: accountInclude,
    });
    const balances = await this.balancesForAccounts([updated.id]);
    return toPublicAccount(updated, balances.get(updated.id) ?? 0n);
  }

  async removeMember(
    actorUserId: string,
    accountId: string,
    memberUserId: string,
  ) {
    await this.requireOwnerAccount(actorUserId, accountId);

    const member = await this.prisma.accountMember.findUnique({
      where: {
        accountId_userId: { accountId, userId: memberUserId },
      },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.role === AccountMemberRole.OWNER) {
      const ownerCount = await this.prisma.accountMember.count({
        where: { accountId, role: AccountMemberRole.OWNER },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException('Cannot remove the last owner');
      }
    }

    await this.prisma.accountMember.delete({
      where: { id: member.id },
    });

    const updated = await this.prisma.account.findUniqueOrThrow({
      where: { id: accountId },
      include: accountInclude,
    });
    const balances = await this.balancesForAccounts([updated.id]);
    return toPublicAccount(updated, balances.get(updated.id) ?? 0n);
  }

  /** Public for transactions module membership checks. */
  async requireMemberAccount(userId: string, accountId: string) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, members: { some: { userId } } },
      include: accountInclude,
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    return account;
  }

  private async requireOwnerAccount(userId: string, accountId: string) {
    const account = await this.prisma.account.findFirst({
      where: {
        id: accountId,
        members: { some: { userId, role: AccountMemberRole.OWNER } },
      },
      include: accountInclude,
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    return account;
  }

  private async balancesForAccounts(accountIds: string[]) {
    if (accountIds.length === 0) {
      return new Map<string, bigint>();
    }

    const checkpoints = await this.prisma.balanceCheckpoint.findMany({
      where: { accountId: { in: accountIds } },
      select: {
        id: true,
        accountId: true,
        asOf: true,
        balanceMinor: true,
        createdAt: true,
      },
    });

    const byAccount = new Map<
      string,
      Array<{
        id: string;
        asOf: Date;
        balanceMinor: bigint;
        createdAt: Date;
      }>
    >();
    for (const cp of checkpoints) {
      const list = byAccount.get(cp.accountId) ?? [];
      list.push(cp);
      byAccount.set(cp.accountId, list);
    }

    const anchors = accountIds.map((id) => {
      const list = byAccount.get(id) ?? [];
      if (list.length === 0) {
        throw new BadRequestException(
          `Account ${id} has no balance checkpoint`,
        );
      }
      const sorted = [...list].sort(compareCheckpointsAsc);
      const earliest = sorted[0]!;
      return {
        id,
        balanceMinor: earliest.balanceMinor,
        asOf: earliest.asOf,
      };
    });

    const movements = await this.prisma.transaction.findMany({
      where: {
        OR: [
          { accountId: { in: accountIds } },
          { counterAccountId: { in: accountIds } },
        ],
      },
      select: {
        type: true,
        accountId: true,
        counterAccountId: true,
        amountMinor: true,
        occurredAt: true,
      },
    });
    return buildBalanceMap(anchors, movements);
  }
}
