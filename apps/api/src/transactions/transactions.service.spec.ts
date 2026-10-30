import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TransactionType } from '../generated/prisma/client';
import { AccountsService } from '../accounts/accounts.service';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from './transactions.service';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prisma: {
    transaction: {
      findMany: Mock;
      findFirst: Mock;
      create: Mock;
      update: Mock;
      delete: Mock;
    };
    account: { findUniqueOrThrow: Mock };
    accountMember: { findMany: Mock };
    category: { findFirst: Mock };
  };
  let accountsService: {
    requireMemberAccount: Mock;
  };

  const userId = '11111111-1111-1111-1111-111111111111';
  const accountA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const accountB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const accountUsd = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

  const baseTx = {
    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    type: TransactionType.EXPENSE,
    accountId: accountA,
    counterAccountId: null,
    amountMinor: 100n,
    occurredAt: new Date('2026-03-01T12:00:00.000Z'),
    description: 'Coffee',
    categoryId: null,
    shared: false,
    transferGroupId: null,
    createdByUserId: userId,
    createdAt: new Date('2026-03-01T12:00:00.000Z'),
    updatedAt: new Date('2026-03-01T12:00:00.000Z'),
    category: null,
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

  it('creates an expense on a personal account with optional shared mark', async () => {
    accountsService.requireMemberAccount.mockResolvedValue({
      id: accountA,
      isShared: false,
      currency: 'IRR',
    });
    prisma.transaction.create.mockResolvedValue({ ...baseTx, shared: true });

    const result = await service.create(userId, {
      type: 'EXPENSE',
      accountId: accountA,
      amountMinor: '100',
      occurredAt: '2026-03-01T12:00:00.000Z',
      description: 'Coffee',
      shared: true,
    });

    expect(prisma.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: TransactionType.EXPENSE,
          amountMinor: 100n,
          shared: true,
        }),
      }),
    );
    expect(result.shared).toBe(true);
  });

  it('rejects shared mark on a shared account expense', async () => {
    accountsService.requireMemberAccount.mockResolvedValue({
      id: accountA,
      isShared: true,
      currency: 'IRR',
    });

    await expect(
      service.create(userId, {
        type: 'EXPENSE',
        accountId: accountA,
        amountMinor: '100',
        occurredAt: '2026-03-01T12:00:00.000Z',
        shared: true,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a same-currency transfer', async () => {
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
    prisma.transaction.create.mockResolvedValue({
      ...baseTx,
      type: TransactionType.TRANSFER,
      counterAccountId: accountB,
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
    });

    expect(result.type).toBe('TRANSFER');
    expect(result.counterAccountId).toBe(accountB);
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

    await expect(
      service.create(userId, {
        type: 'TRANSFER',
        accountId: accountA,
        counterAccountId: accountUsd,
        amountMinor: '100',
        occurredAt: '2026-03-01T12:00:00.000Z',
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
