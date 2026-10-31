import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CategoryKind, TransactionType } from '../generated/prisma/client';
import { AccountsService } from '../accounts/accounts.service';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from './transactions.service';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prisma: {
    transaction: {
      findMany: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    account: { findUniqueOrThrow: ReturnType<typeof vi.fn> };
    accountMember: { findMany: ReturnType<typeof vi.fn> };
    category: { findFirst: ReturnType<typeof vi.fn> };
  };
  let accountsService: {
    requireMemberAccount: ReturnType<typeof vi.fn>;
  };

  const userId = '11111111-1111-1111-1111-111111111111';
  const accountA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const accountB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const accountUsd = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  const expenseCategoryId = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
  const incomeCategoryId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
  const transferCategoryId = 'abababab-abab-abab-abab-abababababab';

  const baseTx = {
    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    type: TransactionType.EXPENSE,
    accountId: accountA,
    counterAccountId: null,
    amountMinor: 100n,
    occurredAt: new Date('2026-03-01T12:00:00.000Z'),
    description: 'Coffee',
    categoryId: expenseCategoryId,
    shared: false,
    transferGroupId: null,
    createdByUserId: userId,
    createdAt: new Date('2026-03-01T12:00:00.000Z'),
    updatedAt: new Date('2026-03-01T12:00:00.000Z'),
    category: {
      id: expenseCategoryId,
      name: 'Groceries',
      code: 'groceries',
      kind: CategoryKind.EXPENSE,
      icon: 'pi-shopping-cart',
      color: 'lime',
      isSystem: true,
    },
  };

  beforeEach(async () => {
    prisma = {
      transaction: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      account: { findUniqueOrThrow: vi.fn() },
      accountMember: { findMany: vi.fn() },
      category: { findFirst: vi.fn() },
    };
    accountsService = {
      requireMemberAccount: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AccountsService, useValue: accountsService },
      ],
    }).compile();

    service = module.get(TransactionsService);
  });

  it('creates an expense on a personal account with required category and shared mark', async () => {
    accountsService.requireMemberAccount.mockResolvedValue({
      id: accountA,
      isShared: false,
      currency: 'IRR',
    });
    prisma.category.findFirst.mockResolvedValue({
      id: expenseCategoryId,
      kind: CategoryKind.EXPENSE,
      userId,
    });
    prisma.transaction.create.mockResolvedValue({ ...baseTx, shared: true });

    const result = await service.create(userId, {
      type: 'EXPENSE',
      accountId: accountA,
      amountMinor: '100',
      occurredAt: '2026-03-01T12:00:00.000Z',
      description: 'Coffee',
      categoryId: expenseCategoryId,
      shared: true,
    });

    expect(prisma.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: TransactionType.EXPENSE,
          amountMinor: 100n,
          categoryId: expenseCategoryId,
          shared: true,
        }),
      }),
    );
    expect(result.shared).toBe(true);
  });

  it('rejects income/expense without a category', async () => {
    accountsService.requireMemberAccount.mockResolvedValue({
      id: accountA,
      isShared: false,
      currency: 'IRR',
    });

    await expect(
      service.create(userId, {
        type: 'EXPENSE',
        accountId: accountA,
        amountMinor: '100',
        occurredAt: '2026-03-01T12:00:00.000Z',
        categoryId: undefined as unknown as string,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects category kind mismatch', async () => {
    accountsService.requireMemberAccount.mockResolvedValue({
      id: accountA,
      isShared: false,
      currency: 'IRR',
    });
    prisma.category.findFirst.mockResolvedValue({
      id: incomeCategoryId,
      kind: CategoryKind.INCOME,
      userId,
    });

    await expect(
      service.create(userId, {
        type: 'EXPENSE',
        accountId: accountA,
        amountMinor: '100',
        occurredAt: '2026-03-01T12:00:00.000Z',
        categoryId: incomeCategoryId,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates amount on an existing expense', async () => {
    prisma.accountMember.findMany.mockResolvedValue([{ accountId: accountA }]);
    prisma.transaction.findFirst.mockResolvedValue(baseTx);
    prisma.transaction.update.mockResolvedValue({
      ...baseTx,
      amountMinor: 250n,
    });

    const result = await service.update(userId, baseTx.id, {
      amountMinor: '250',
    });

    expect(prisma.transaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amountMinor: 250n }),
      }),
    );
    expect(result.amountMinor).toBe('250');
  });

  it('rejects clearing categoryId on update', async () => {
    prisma.accountMember.findMany.mockResolvedValue([{ accountId: accountA }]);
    prisma.transaction.findFirst.mockResolvedValue(baseTx);

    await expect(
      service.update(userId, baseTx.id, { categoryId: null }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects shared mark on a shared account expense', async () => {
    accountsService.requireMemberAccount.mockResolvedValue({
      id: accountA,
      isShared: true,
      currency: 'IRR',
    });
    prisma.category.findFirst.mockResolvedValue({
      id: expenseCategoryId,
      kind: CategoryKind.EXPENSE,
      userId,
    });

    await expect(
      service.create(userId, {
        type: 'EXPENSE',
        accountId: accountA,
        amountMinor: '100',
        occurredAt: '2026-03-01T12:00:00.000Z',
        categoryId: expenseCategoryId,
        shared: true,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a same-currency transfer with required category', async () => {
    accountsService.requireMemberAccount
      .mockResolvedValueOnce({
        id: accountA,
        isShared: false,
        currency: 'IRR',
      })
      .mockResolvedValueOnce({
        id: accountB,
        isShared: false,
        currency: 'IRR',
      });
    prisma.category.findFirst.mockResolvedValue({
      id: transferCategoryId,
      kind: CategoryKind.TRANSFER,
      userId,
    });
    prisma.transaction.create.mockResolvedValue({
      ...baseTx,
      type: TransactionType.TRANSFER,
      counterAccountId: accountB,
      categoryId: transferCategoryId,
      category: {
        id: transferCategoryId,
        name: 'Uncategorized',
        code: 'uncategorized',
        kind: CategoryKind.TRANSFER,
        icon: 'pi-tag',
        color: 'slate',
        isSystem: true,
      },
      shared: false,
      transferGroupId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      description: null,
    });

    const result = await service.create(userId, {
      type: 'TRANSFER',
      accountId: accountA,
      counterAccountId: accountB,
      amountMinor: '100',
      occurredAt: '2026-03-01T12:00:00.000Z',
      categoryId: transferCategoryId,
    });

    expect(result.type).toBe('TRANSFER');
    expect(result.counterAccountId).toBe(accountB);
    expect(result.categoryId).toBe(transferCategoryId);
    expect(prisma.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          categoryId: transferCategoryId,
        }),
      }),
    );
  });

  it('rejects cross-currency transfers', async () => {
    accountsService.requireMemberAccount
      .mockResolvedValueOnce({
        id: accountA,
        isShared: false,
        currency: 'IRR',
      })
      .mockResolvedValueOnce({
        id: accountUsd,
        isShared: false,
        currency: 'USD',
      });
    prisma.category.findFirst.mockResolvedValue({
      id: transferCategoryId,
      kind: CategoryKind.TRANSFER,
      userId,
    });

    await expect(
      service.create(userId, {
        type: 'TRANSFER',
        accountId: accountA,
        counterAccountId: accountUsd,
        amountMinor: '100',
        occurredAt: '2026-03-01T12:00:00.000Z',
        categoryId: transferCategoryId,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns 404 for inaccessible transactions', async () => {
    prisma.accountMember.findMany.mockResolvedValue([]);
    prisma.transaction.findFirst.mockResolvedValue(null);

    await expect(service.getForUser(userId, baseTx.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
