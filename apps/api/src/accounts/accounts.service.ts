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
import { AccountMemberRole, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WalletsService } from '../wallets/wallets.service';
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
    return accounts.map(toPublicAccount);
  }

  async getForUser(userId: string, accountId: string) {
    const account = await this.requireMemberAccount(userId, accountId);
    return toPublicAccount(account);
  }

  async create(userId: string, dto: CreateAccountDto) {
    await this.walletsService.requireOwnedWallet(userId, dto.walletId);
    const openingBalanceMinor = parseMinorUnits(dto.openingBalanceMinor);

    const account = await this.prisma.account.create({
      data: {
        walletId: dto.walletId,
        name: dto.name,
        currency: dto.currency,
        openingBalanceMinor,
        isShared: dto.isShared,
        members: {
          create: {
            userId,
            role: AccountMemberRole.OWNER,
          },
        },
      },
      include: accountInclude,
    });
    return toPublicAccount(account);
  }

  async update(userId: string, accountId: string, dto: UpdateAccountDto) {
    await this.requireOwnerAccount(userId, accountId);
    const account = await this.prisma.account.update({
      where: { id: accountId },
      data: { name: dto.name },
      include: accountInclude,
    });
    return toPublicAccount(account);
  }

  async remove(userId: string, accountId: string) {
    await this.requireOwnerAccount(userId, accountId);
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
    return toPublicAccount(updated);
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
    return toPublicAccount(updated);
  }

  private async requireMemberAccount(userId: string, accountId: string) {
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
}
