import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccountsService } from './accounts.service';
import { CheckpointsService } from './checkpoints.service';

describe('CheckpointsService', () => {
  let service: CheckpointsService;
  let prisma: {
    balanceCheckpoint: {
      findMany: Mock;
      findFirst: Mock;
      create: Mock;
      update: Mock;
      delete: Mock;
      count: Mock;
    };
    transaction: { findMany: Mock };
    account: { findMany: Mock };
  };
  let accountsService: { requireMemberAccount: Mock };

  const userId = '11111111-1111-1111-1111-111111111111';
  const accountId = '44444444-4444-4444-4444-444444444444';
  const t0 = new Date('2026-01-01T00:00:00.000Z');
  const t1 = new Date('2026-02-01T00:00:00.000Z');

  const cp1 = {
    id: 'cp-1',
    accountId,
    asOf: t0,
    balanceMinor: 1000n,
    note: null,
    createdByUserId: userId,
    createdAt: t0,
    updatedAt: t0,
  };

  const cp2 = {
    id: 'cp-2',
    accountId,
    asOf: t1,
    balanceMinor: 1500n,
    note: null,
    createdByUserId: userId,
    createdAt: t1,
    updatedAt: t1,
  };

  beforeEach(async () => {
    prisma = {
      balanceCheckpoint: {
        findMany: vi.fn().mockResolvedValue([cp1, cp2]),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      transaction: {
        findMany: vi.fn().mockResolvedValue([
          {
            type: 'INCOME',
            accountId,
            counterAccountId: null,
            amountMinor: 400n,
            occurredAt: new Date('2026-01-15T00:00:00.000Z'),
          },
        ]),
      },
      account: { findMany: vi.fn() },
    };
    accountsService = {
      requireMemberAccount: vi.fn().mockResolvedValue({ id: accountId }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckpointsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AccountsService, useValue: accountsService },
      ],
    }).compile();

    service = module.get(CheckpointsService);
  });

  it('lists checkpoints with gap vs previous window', async () => {
    const list = await service.listForAccount(userId, accountId);
    expect(list).toHaveLength(2);
    const later = list.find((c) => c.id === 'cp-2');
    const earliest = list.find((c) => c.id === 'cp-1');
    expect(earliest?.gapMinor).toBeNull();
    expect(later?.computedBalanceMinor).toBe('1400');
    expect(later?.gapMinor).toBe('100');
  });

  it('rejects deleting the last checkpoint', async () => {
    prisma.balanceCheckpoint.findFirst.mockResolvedValue(cp1);
    prisma.balanceCheckpoint.count.mockResolvedValue(1);

    await expect(service.remove(userId, cp1.id)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('maps unique constraint to ConflictException on create', async () => {
    prisma.balanceCheckpoint.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(
      service.create(userId, accountId, {
        asOf: t1.toISOString(),
        balanceMinor: '1500',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
