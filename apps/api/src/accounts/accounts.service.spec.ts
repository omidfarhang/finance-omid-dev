import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AccountMemberRole } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WalletsService } from '../wallets/wallets.service';
import { AccountsService } from './accounts.service';

describe('AccountsService', () => {
  let service: AccountsService;
  let prisma: {
    account: {
      findMany: Mock;
      findFirst: Mock;
      findUniqueOrThrow: Mock;
      create: Mock;
      update: Mock;
      delete: Mock;
    };
    accountMember: {
      findUnique: Mock;
      create: Mock;
      count: Mock;
      delete: Mock;
    };
    balanceCheckpoint: {
      findMany: Mock;
    };
    transaction: {
      findMany: Mock;
      count: Mock;
    };
    user: { findFirst: Mock };
    $transaction: Mock;
  };
  let walletsService: { requireOwnedWallet: Mock };

  const userId = '11111111-1111-1111-1111-111111111111';
  const otherUserId = '22222222-2222-2222-2222-222222222222';
  const walletId = '33333333-3333-3333-3333-333333333333';
  const accountId = '44444444-4444-4444-4444-444444444444';
  const asOf = '2026-01-01T00:00:00.000Z';

  const ownerUser = {
    id: userId,
    email: 'owner@example.com',
    displayName: 'Owner',
  };

  const memberUser = {
    id: otherUserId,
    email: 'partner@example.com',
    displayName: 'Partner',
  };

  const baseAccount = {
    id: accountId,
    walletId,
    name: 'Cash',
    currency: 'IRR',
    isShared: false,
    createdAt: new Date(asOf),
    updatedAt: new Date(asOf),
    members: [
      {
        id: '55555555-5555-5555-5555-555555555555',
        accountId,
        userId,
        role: AccountMemberRole.OWNER,
        createdAt: new Date(asOf),
        user: ownerUser,
      },
    ],
  };

  beforeEach(async () => {
    prisma = {
      account: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      accountMember: {
        findUnique: vi.fn(),
        create: vi.fn(),
        count: vi.fn(),
        delete: vi.fn(),
      },
      balanceCheckpoint: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'cp-1',
            accountId,
            asOf: new Date(asOf),
            balanceMinor: 1000n,
            createdAt: new Date(asOf),
          },
        ]),
      },
      transaction: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
      },
      user: { findFirst: vi.fn() },
      $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          account: {
            create: prisma.account.create,
          },
        }),
      ),
    };
    walletsService = {
      requireOwnedWallet: vi.fn().mockResolvedValue({
        id: walletId,
        ownerUserId: userId,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        { provide: PrismaService, useValue: prisma },
        { provide: WalletsService, useValue: walletsService },
      ],
    }).compile();

    service = module.get(AccountsService);
  });

  it('creates an account with an initial balance checkpoint', async () => {
    prisma.account.create.mockResolvedValue(baseAccount);

    const result = await service.create(userId, {
      walletId,
      name: 'Cash',
      currency: 'IRR',
      initialBalanceMinor: '1000',
      initialBalanceAsOf: asOf,
      isShared: false,
    });

    expect(walletsService.requireOwnedWallet).toHaveBeenCalledWith(
      userId,
      walletId,
    );
    expect(prisma.account.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          currency: 'IRR',
          checkpoints: {
            create: {
              asOf: new Date(asOf),
              balanceMinor: 1000n,
              createdByUserId: userId,
            },
          },
          members: {
            create: { userId, role: AccountMemberRole.OWNER },
          },
        }),
      }),
    );
    expect(result.balanceMinor).toBe('1000');
    expect(result).not.toHaveProperty('openingBalanceMinor');
  });

  it('denies access when user is not a member', async () => {
    prisma.account.findFirst.mockResolvedValue(null);

    await expect(service.getForUser(userId, accountId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('adds a shared member by email', async () => {
    const shared = { ...baseAccount, isShared: true };
    prisma.account.findFirst.mockResolvedValue(shared);
    prisma.user.findFirst.mockResolvedValue(memberUser);
    prisma.accountMember.findUnique.mockResolvedValue(null);
    prisma.accountMember.create.mockResolvedValue({});
    prisma.account.findUniqueOrThrow.mockResolvedValue({
      ...shared,
      members: [
        ...shared.members,
        {
          id: '66666666-6666-6666-6666-666666666666',
          accountId,
          userId: otherUserId,
          role: AccountMemberRole.MEMBER,
          createdAt: new Date('2026-01-02T00:00:00.000Z'),
          user: memberUser,
        },
      ],
    });

    const result = await service.addMember(userId, accountId, {
      email: 'partner@example.com',
    });

    expect(result.members).toHaveLength(2);
    expect(result.members[1]?.email).toBe('partner@example.com');
  });

  it('refuses adding members to a personal account', async () => {
    prisma.account.findFirst.mockResolvedValue(baseAccount);

    await expect(
      service.addMember(userId, accountId, { email: 'partner@example.com' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
