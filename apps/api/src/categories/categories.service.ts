import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CreateCategoryDto, UpdateCategoryDto } from '@finance/shared';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { toPublicCategory } from './categories.mapper';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string) {
    const categories = await this.prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
    return categories.map(toPublicCategory);
  }

  async create(userId: string, dto: CreateCategoryDto) {
    try {
      const category = await this.prisma.category.create({
        data: { userId, name: dto.name },
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
    await this.requireOwned(userId, categoryId);
    try {
      const category = await this.prisma.category.update({
        where: { id: categoryId },
        data: { name: dto.name },
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
    await this.requireOwned(userId, categoryId);
    await this.prisma.category.delete({ where: { id: categoryId } });
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
