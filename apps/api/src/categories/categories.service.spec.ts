import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CategoryKind } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CategoriesService } from './categories.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: {
    category: {
      findMany: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      createMany: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    transaction: { updateMany: ReturnType<typeof vi.fn> };
    $transaction: ReturnType<typeof vi.fn>;
  };

  const userId = '11111111-1111-1111-1111-111111111111';
  const categoryId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const uncategorizedId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  const userCategory = {
    id: categoryId,
    userId,
    kind: CategoryKind.EXPENSE,
    name: 'Snacks',
    code: null,
    icon: 'pi-coffee',
    color: 'orange',
    isSystem: false,
    createdAt: new Date('2026-03-01T00:00:00.000Z'),
    updatedAt: new Date('2026-03-01T00:00:00.000Z'),
  };

  const systemCategory = {
    ...userCategory,
    id: uncategorizedId,
    name: 'Uncategorized',
    code: 'uncategorized',
    icon: 'pi-tag',
    color: 'slate',
    isSystem: true,
  };

  beforeEach(async () => {
    prisma = {
      category: {
        findMany: vi.fn().mockResolvedValue(
          // Pretend full catalog already seeded so ensureDefaults is a no-op
          [{ kind: 'EXPENSE', code: 'uncategorized' }],
        ),
        findFirst: vi.fn(),
        create: vi.fn(),
        createMany: vi.fn().mockResolvedValue({ count: 0 }),
        update: vi.fn(),
        delete: vi.fn(),
      },
      transaction: { updateMany: vi.fn() },
      $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn(prisma),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(CategoriesService);
  });

  it('creates a user category with icon and color', async () => {
    prisma.category.create.mockResolvedValue(userCategory);

    const result = await service.create(userId, {
      name: 'Snacks',
      kind: 'EXPENSE',
      icon: 'pi-coffee',
      color: 'orange',
    });

    expect(prisma.category.create).toHaveBeenCalledWith({
      data: {
        userId,
        kind: 'EXPENSE',
        name: 'Snacks',
        code: null,
        icon: 'pi-coffee',
        color: 'orange',
        isSystem: false,
      },
    });
    expect(result.kind).toBe('EXPENSE');
    expect(result.isSystem).toBe(false);
    expect(result.icon).toBe('pi-coffee');
    expect(result.color).toBe('orange');
  });

  it('rejects editing a system category', async () => {
    prisma.category.findFirst.mockResolvedValue(systemCategory);

    await expect(
      service.update(userId, uncategorizedId, { name: 'Misc' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects deleting a system category', async () => {
    prisma.category.findFirst.mockResolvedValue(systemCategory);

    await expect(service.remove(userId, uncategorizedId)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('reassigns transactions then deletes a user category', async () => {
    prisma.category.findFirst
      .mockResolvedValueOnce(userCategory)
      .mockResolvedValueOnce(systemCategory);
    prisma.transaction.updateMany.mockResolvedValue({ count: 2 });
    prisma.category.delete.mockResolvedValue(userCategory);

    await service.remove(userId, categoryId);

    expect(prisma.transaction.updateMany).toHaveBeenCalledWith({
      where: { categoryId },
      data: { categoryId: uncategorizedId },
    });
    expect(prisma.category.delete).toHaveBeenCalledWith({
      where: { id: categoryId },
    });
  });

  it('returns 404 for missing category', async () => {
    prisma.category.findFirst.mockResolvedValue(null);

    await expect(
      service.update(userId, categoryId, { name: 'X' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
