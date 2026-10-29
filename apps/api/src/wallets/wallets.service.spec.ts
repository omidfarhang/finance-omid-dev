import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { WalletsService } from './wallets.service';

describe('WalletsService', () => {
  let service: WalletsService;
  let prisma: {
    wallet: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    account: { count: jest.Mock };
  };

  const userId = '11111111-1111-1111-1111-111111111111';
  const otherUserId = '22222222-2222-2222-2222-222222222222';
  const walletId = '33333333-3333-3333-3333-333333333333';

  const baseWallet = {
    id: walletId,
    ownerUserId: userId,
    name: 'Personal',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    prisma = {
      wallet: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      account: { count: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(WalletsService);
  });

  it('creates a wallet for the user', async () => {
    prisma.wallet.create.mockResolvedValue(baseWallet);

    const result = await service.create(userId, { name: 'Personal' });

    expect(prisma.wallet.create).toHaveBeenCalledWith({
      data: { ownerUserId: userId, name: 'Personal' },
    });
    expect(result).toEqual({
      id: walletId,
      name: 'Personal',
      ownerUserId: userId,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('lists only the user wallets', async () => {
    prisma.wallet.findMany.mockResolvedValue([baseWallet]);

    const result = await service.listForUser(userId);

    expect(prisma.wallet.findMany).toHaveBeenCalledWith({
      where: { ownerUserId: userId },
      orderBy: { createdAt: 'asc' },
    });
    expect(result).toHaveLength(1);
  });

  it('returns 404 when wallet belongs to another user', async () => {
    prisma.wallet.findUnique.mockResolvedValue({
      ...baseWallet,
      ownerUserId: otherUserId,
    });

    await expect(service.getForUser(userId, walletId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('refuses to delete a wallet that still has accounts', async () => {
    prisma.wallet.findUnique.mockResolvedValue(baseWallet);
    prisma.account.count.mockResolvedValue(1);

    await expect(service.remove(userId, walletId)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.wallet.delete).not.toHaveBeenCalled();
  });

  it('deletes an empty wallet', async () => {
    prisma.wallet.findUnique.mockResolvedValue(baseWallet);
    prisma.account.count.mockResolvedValue(0);
    prisma.wallet.delete.mockResolvedValue(baseWallet);

    await service.remove(userId, walletId);

    expect(prisma.wallet.delete).toHaveBeenCalledWith({ where: { id: walletId } });
  });
});
