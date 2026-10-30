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
  createTransactionSchema,
  listTransactionsQuerySchema,
  updateTransactionSchema,
} from '@finance/shared';
import type {
  CreateTransactionDto,
  ListTransactionsQuery,
  PublicUser,
  UpdateTransactionDto,
} from '@finance/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CurrentUser } from '../auth/session.decorator';
import { SessionGuard } from '../auth/session.guard';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
@UseGuards(SessionGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  async list(
    @CurrentUser() user: PublicUser,
    @Query(new ZodValidationPipe(listTransactionsQuerySchema))
    query: ListTransactionsQuery,
  ) {
    const transactions = await this.transactionsService.listForUser(
      user.id,
      query,
    );
    return { transactions };
  }

  @Post()
  async create(
    @CurrentUser() user: PublicUser,
    @Body(new ZodValidationPipe(createTransactionSchema))
    body: CreateTransactionDto,
  ) {
    const transaction = await this.transactionsService.create(user.id, body);
    return { transaction };
  }

  @Get(':id')
  async get(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const transaction = await this.transactionsService.getForUser(user.id, id);
    return { transaction };
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateTransactionSchema))
    body: UpdateTransactionDto,
  ) {
    const transaction = await this.transactionsService.update(
      user.id,
      id,
      body,
    );
    return { transaction };
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.transactionsService.remove(user.id, id);
  }
}
