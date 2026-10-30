import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: {
    user: {
      findMany: Mock;
      findUnique: Mock;
      update: Mock;
      count: Mock;
      delete: Mock;
    };
    session: { deleteMany: Mock };
    pendingLogin: { deleteMany: Mock };
    wallet: { findMany: Mock; deleteMany: Mock };
    account: { deleteMany: Mock };
    accountMember: { deleteMany: Mock };
    appSettings: { upsert: Mock };
    $transaction: Mock;
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
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
        delete: vi.fn(),
      },
      session: { deleteMany: vi.fn() },
      pendingLogin: { deleteMany: vi.fn() },
      wallet: { findMany: vi.fn(), deleteMany: vi.fn() },
      account: { deleteMany: vi.fn() },
      accountMember: { deleteMany: vi.fn() },
      appSettings: {
        upsert: vi.fn().mockResolvedValue({
          id: 1,
          registrationOpen: true,
        }),
      },
      $transaction: vi.fn(async (fn) => fn(prisma)),
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
