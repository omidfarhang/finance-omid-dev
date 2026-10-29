import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: {
    user: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
      delete: jest.Mock;
    };
    session: { deleteMany: jest.Mock };
    pendingLogin: { deleteMany: jest.Mock };
    wallet: { findMany: jest.Mock; deleteMany: jest.Mock };
    account: { deleteMany: jest.Mock };
    accountMember: { deleteMany: jest.Mock };
    appSettings: { upsert: jest.Mock };
    $transaction: jest.Mock;
  };

  const adminUser = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'admin@example.com',
    displayName: 'Admin',
    role: 'ADMIN',
    disabledAt: null,
    totpEnabled: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const memberUser = {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'user@example.com',
    displayName: 'User',
    role: 'USER',
    disabledAt: null,
    totpEnabled: false,
    createdAt: new Date('2026-01-02T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        delete: jest.fn(),
      },
      session: { deleteMany: jest.fn() },
      pendingLogin: { deleteMany: jest.fn() },
      wallet: { findMany: jest.fn(), deleteMany: jest.fn() },
      account: { deleteMany: jest.fn() },
      accountMember: { deleteMany: jest.fn() },
      appSettings: {
        upsert: jest.fn().mockResolvedValue({
          id: 1,
          registrationOpen: true,
        }),
      },
      $transaction: jest.fn(async (fn) => fn(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(AdminService);
  });

  it('lists users', async () => {
    prisma.user.findMany.mockResolvedValue([adminUser, memberUser]);
    const users = await service.listUsers();
    expect(users).toHaveLength(2);
    expect(users[0].role).toBe('ADMIN');
  });

  it('rejects demoting the last admin', async () => {
    prisma.user.findUnique.mockResolvedValue(adminUser);
    prisma.user.count.mockResolvedValue(1);

    await expect(
      service.updateUser(adminUser.id, { role: 'USER' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('disables a non-admin user and clears sessions', async () => {
    prisma.user.findUnique.mockResolvedValue(memberUser);
    prisma.user.update.mockResolvedValue({
      ...memberUser,
      disabledAt: new Date('2026-02-01T00:00:00.000Z'),
    });

    const updated = await service.updateUser(memberUser.id, { disabled: true });
    expect(updated.disabledAt).toBeTruthy();
    expect(prisma.session.deleteMany).toHaveBeenCalledWith({
      where: { userId: memberUser.id },
    });
  });

  it('rejects deleting a missing user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.deleteUser(memberUser.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates registration settings', async () => {
    prisma.appSettings.upsert.mockResolvedValue({
      id: 1,
      registrationOpen: false,
    });
    const settings = await service.updateSettings({ registrationOpen: false });
    expect(settings.registrationOpen).toBe(false);
  });
});
