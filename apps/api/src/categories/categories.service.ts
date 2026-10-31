import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateCategoryDto,
  ListCategoriesQuery,
  UpdateCategoryDto,
} from '@finance/shared';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ensureDefaultCategories,
  requireUncategorizedId,
} from './category-defaults';
import { toPublicCategory } from './categories.mapper';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureDefaultsForUser(userId: string) {
    await ensureDefaultCategories(this.prisma, userId);
  }

  async listForUser(userId: string, query: ListCategoriesQuery = {}) {
    await ensureDefaultCategories(this.prisma, userId);
    const categories = await this.prisma.category.findMany({
      where: {
        userId,
        ...(query.kind ? { kind: query.kind } : {}),
      },
      orderBy: [{ kind: 'asc' }, { isSystem: 'desc' }, { name: 'asc' }],
    });
    return categories.map(toPublicCategory);
  }

  async create(userId: string, dto: CreateCategoryDto) {
    await ensureDefaultCategories(this.prisma, userId);
    try {
      const category = await this.prisma.category.create({
        data: {
          userId,
          kind: dto.kind,
          name: dto.name,
          code: null,
          icon: dto.icon,
          color: dto.color,
          isSystem: false,
        },
      });
      return toPublicCategory(category);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new BadRequestException('Category name already exists');
      }
      throw err;
    }
  }

  async update(userId: string, categoryId: string, dto: UpdateCategoryDto) {
    const existing = await this.requireOwned(userId, categoryId);
    if (existing.isSystem) {
      throw new BadRequestException('System categories cannot be edited');
    }
    try {
      const category = await this.prisma.category.update({
        where: { id: categoryId },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.icon !== undefined ? { icon: dto.icon } : {}),
          ...(dto.color !== undefined ? { color: dto.color } : {}),
        },
      });
      return toPublicCategory(category);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new BadRequestException('Category name already exists');
      }
      throw err;
    }
  }

  async remove(userId: string, categoryId: string) {
    const existing = await this.requireOwned(userId, categoryId);
    if (existing.isSystem) {
      throw new BadRequestException('System categories cannot be deleted');
    }

    await this.prisma.$transaction(async (tx) => {
      const uncategorizedId = await requireUncategorizedId(
        tx,
        userId,
        existing.kind,
      );
      if (uncategorizedId === categoryId) {
        throw new BadRequestException('System categories cannot be deleted');
      }
      await tx.transaction.updateMany({
        where: { categoryId },
        data: { categoryId: uncategorizedId },
      });
      await tx.category.delete({ where: { id: categoryId } });
    });
  }

  private async requireOwned(userId: string, categoryId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, userId },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }
}
