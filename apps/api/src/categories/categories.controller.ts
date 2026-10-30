import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  createCategorySchema,
  listCategoriesQuerySchema,
  updateCategorySchema,
} from '@finance/shared';
import type {
  CreateCategoryDto,
  ListCategoriesQuery,
  PublicUser,
  UpdateCategoryDto,
} from '@finance/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CurrentUser } from '../auth/session.decorator';
import { SessionGuard } from '../auth/session.guard';
import { CategoriesService } from './categories.service';

@Controller('categories')
@UseGuards(SessionGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async list(
    @CurrentUser() user: PublicUser,
    @Query(new ZodValidationPipe(listCategoriesQuerySchema))
    query: ListCategoriesQuery,
  ) {
    const categories = await this.categoriesService.listForUser(user.id, query);
    return { categories };
  }

  @Post()
  async create(
    @CurrentUser() user: PublicUser,
    @Body(new ZodValidationPipe(createCategorySchema)) body: CreateCategoryDto,
  ) {
    const category = await this.categoriesService.create(user.id, body);
    return { category };
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateCategorySchema)) body: UpdateCategoryDto,
  ) {
    const category = await this.categoriesService.update(user.id, id, body);
    return { category };
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.categoriesService.remove(user.id, id);
  }
}
