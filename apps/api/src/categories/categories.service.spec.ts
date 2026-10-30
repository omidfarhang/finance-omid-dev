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
    name: 'Food',
    isSystem: false,
    createdAt: new Date('2026-03-01T00:00:00.000Z'),
    updatedAt: new Date('2026-03-01T00:00:00.000Z'),
  };

  const systemCategory = {
    ...userCategory,
    id: uncategorizedId,
    name: 'Uncategorized',
    isSystem: true,
  };

  beforeEach(async () => {
    prisma = {
      category: {
        findMany: vi.fn().mockResolvedValue([]),
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

  it('creates a user category with kind', async () => {
    prisma.category.create.mockResolvedValue(userCategory);

    const result = await service.create(userId, {
      name: 'Food',
      kind: 'EXPENSE',
    });

    expect(prisma.category.create).toHaveBeenCalledWith({
      data: {
        userId,
        kind: 'EXPENSE',
        name: 'Food',
        isSystem: false,
      },
    });
    expect(result.kind).toBe('EXPENSE');
    expect(result.isSystem).toBe(false);
  });

  it('rejects renaming a system category', async () => {
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
