import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  CreateTransactionDto,
  ListTransactionsQuery,
  UpdateTransactionDto,
} from '@finance/shared';
import {
  CategoryKind,
  Prisma,
  TransactionType,
} from '../generated/prisma/client';
import { AccountsService } from '../accounts/accounts.service';
import { parseMinorUnits } from '../accounts/accounts.mapper';
import { PrismaService } from '../prisma/prisma.service';
import { toPublicTransaction } from './transactions.mapper';

const txInclude = {
  category: true,
} satisfies Prisma.TransactionInclude;

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountsService: AccountsService,
  ) {}

  async listForUser(userId: string, query: ListTransactionsQuery) {
    const memberAccountIds = await this.memberAccountIds(userId);
    if (memberAccountIds.length === 0) {
      return [];
    }

    if (query.accountId && !memberAccountIds.includes(query.accountId)) {
      throw new NotFoundException('Account not found');
    }

    if (query.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: query.categoryId, userId },
        select: { id: true },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    const accountFilter = query.accountId
      ? {
          OR: [
            { accountId: query.accountId },
            { counterAccountId: query.accountId },
          ],
        }
      : {
          OR: [
            { accountId: { in: memberAccountIds } },
            { counterAccountId: { in: memberAccountIds } },
          ],
        };

    const where: Prisma.TransactionWhereInput = {
      AND: [
        accountFilter,
        query.type ? { type: query.type } : {},
        query.categoryId ? { categoryId: query.categoryId } : {},
        query.from || query.to
          ? {
              occurredAt: {
                ...(query.from ? { gte: new Date(query.from) } : {}),
                ...(query.to ? { lte: new Date(query.to) } : {}),
              },
            }
          : {},
      ],
    };

    const rows = await this.prisma.transaction.findMany({
      where,
      include: txInclude,
      orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map(toPublicTransaction);
  }

  async getForUser(userId: string, transactionId: string) {
    const tx = await this.requireAccessibleTransaction(userId, transactionId);
    return toPublicTransaction(tx);
  }

  async create(userId: string, dto: CreateTransactionDto) {
    const amountMinor = parseMinorUnits(dto.amountMinor);
    const occurredAt = new Date(dto.occurredAt);

    if (dto.type === 'TRANSFER') {
      return this.createTransfer(userId, {
        accountId: dto.accountId,
        counterAccountId: dto.counterAccountId,
        amountMinor,
        occurredAt,
        description: dto.description ?? null,
        categoryId: dto.categoryId,
      });
    }

    const account = await this.accountsService.requireMemberAccount(
      userId,
      dto.accountId,
    );

    let shared = dto.shared ?? false;
    if (shared) {
      if (dto.type !== 'EXPENSE') {
        throw new BadRequestException('Only expenses can be marked shared');
      }
      if (account.isShared) {
        throw new BadRequestException(
          'Shared mark applies only to personal-account expenses',
        );
      }
    } else {
      shared = false;
    }

    const categoryId = await this.resolveCategoryId(
      userId,
      dto.categoryId,
      dto.type,
      true,
    );

    const row = await this.prisma.transaction.create({
      data: {
        type: dto.type as TransactionType,
        accountId: dto.accountId,
        amountMinor,
        occurredAt,
        description: dto.description ?? null,
        categoryId,
        shared,
        createdByUserId: userId,
      },
      include: txInclude,
    });
    return toPublicTransaction(row);
  }

  async update(
    userId: string,
    transactionId: string,
    dto: UpdateTransactionDto,
  ) {
    const existing = await this.requireAccessibleTransaction(
      userId,
      transactionId,
    );

    if (dto.categoryId === null) {
      throw new BadRequestException('categoryId cannot be cleared');
    }

    if (
      existing.type === TransactionType.TRANSFER &&
      dto.shared !== undefined
    ) {
      throw new BadRequestException('Transfers cannot have a shared mark');
    }

    let shared = existing.shared;
    if (dto.shared !== undefined) {
      if (dto.shared) {
        if (existing.type !== TransactionType.EXPENSE) {
          throw new BadRequestException('Only expenses can be marked shared');
        }
        const account = await this.prisma.account.findUniqueOrThrow({
          where: { id: existing.accountId },
        });
        if (account.isShared) {
          throw new BadRequestException(
            'Shared mark applies only to personal-account expenses',
          );
        }
      }
      shared = dto.shared;
    }

    let categoryId = existing.categoryId;
    if (dto.categoryId !== undefined) {
      categoryId = await this.resolveCategoryId(
        userId,
        dto.categoryId,
        existing.type,
        true,
      );
    }

    const amountMinor =
      dto.amountMinor !== undefined
        ? parseMinorUnits(dto.amountMinor)
        : undefined;

    const row = await this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        amountMinor,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
        description:
          dto.description === undefined ? undefined : dto.description,
        categoryId: dto.categoryId === undefined ? undefined : categoryId,
        shared,
      },
      include: txInclude,
    });
    return toPublicTransaction(row);
  }

  async remove(userId: string, transactionId: string) {
    await this.requireAccessibleTransaction(userId, transactionId);
    await this.prisma.transaction.delete({ where: { id: transactionId } });
  }

  private async createTransfer(
    userId: string,
    input: {
      accountId: string;
      counterAccountId: string;
      amountMinor: bigint;
      occurredAt: Date;
      description: string | null;
      categoryId: string;
    },
  ) {
    if (input.accountId === input.counterAccountId) {
      throw new BadRequestException('Transfer accounts must differ');
    }

    const from = await this.accountsService.requireMemberAccount(
      userId,
      input.accountId,
    );
    const to = await this.accountsService.requireMemberAccount(
      userId,
      input.counterAccountId,
    );

    if (from.currency !== to.currency) {
      throw new BadRequestException('Transfer accounts must share a currency');
    }

    const categoryId = await this.resolveCategoryId(
      userId,
      input.categoryId,
      'TRANSFER',
      true,
    );

    const row = await this.prisma.transaction.create({
      data: {
        type: TransactionType.TRANSFER,
        accountId: input.accountId,
        counterAccountId: input.counterAccountId,
        amountMinor: input.amountMinor,
        occurredAt: input.occurredAt,
        description: input.description,
        categoryId,
        shared: false,
        transferGroupId: randomUUID(),
        createdByUserId: userId,
      },
      include: txInclude,
    });
    return toPublicTransaction(row);
  }

  private async resolveCategoryId(
    userId: string,
    categoryId: string | null | undefined,
    type: string,
    required: boolean,
  ): Promise<string | null> {
    if (!categoryId) {
      if (required) {
        throw new BadRequestException('categoryId is required');
      }
      return null;
    }

    const expectedKind =
      type === 'INCOME'
        ? CategoryKind.INCOME
        : type === 'EXPENSE'
          ? CategoryKind.EXPENSE
          : CategoryKind.TRANSFER;
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, userId },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    if (category.kind !== expectedKind) {
      throw new BadRequestException(
        `Category kind must be ${expectedKind} for ${type} transactions`,
      );
    }
    return category.id;
  }

  private async memberAccountIds(userId: string): Promise<string[]> {
    const members = await this.prisma.accountMember.findMany({
      where: { userId },
      select: { accountId: true },
    });
    return members.map((m) => m.accountId);
  }

  private async requireAccessibleTransaction(
    userId: string,
    transactionId: string,
  ) {
    const memberAccountIds = await this.memberAccountIds(userId);
    const tx = await this.prisma.transaction.findFirst({
      where: {
        id: transactionId,
        OR: [
          { accountId: { in: memberAccountIds } },
          { counterAccountId: { in: memberAccountIds } },
        ],
      },
      include: txInclude,
    });
    if (!tx) {
      throw new NotFoundException('Transaction not found');
    }
    return tx;
  }
}
