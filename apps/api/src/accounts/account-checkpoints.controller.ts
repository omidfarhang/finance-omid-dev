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
  createCheckpointSchema,
  updateCheckpointSchema,
} from '@finance/shared';
import type {
  CreateCheckpointDto,
  PublicUser,
  UpdateCheckpointDto,
} from '@finance/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CurrentUser } from '../auth/session.decorator';
import { SessionGuard } from '../auth/session.guard';
import { CheckpointsService } from './checkpoints.service';

@Controller('accounts')
@UseGuards(SessionGuard)
export class AccountCheckpointsController {
  constructor(private readonly checkpointsService: CheckpointsService) {}

  @Get(':accountId/checkpoints')
  async list(
    @CurrentUser() user: PublicUser,
    @Param('accountId', ParseUUIDPipe) accountId: string,
  ) {
    const checkpoints = await this.checkpointsService.listForAccount(
      user.id,
      accountId,
    );
    return { checkpoints };
  }

  @Post(':accountId/checkpoints')
  async create(
    @CurrentUser() user: PublicUser,
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Body(new ZodValidationPipe(createCheckpointSchema))
    body: CreateCheckpointDto,
  ) {
    const checkpoint = await this.checkpointsService.create(
      user.id,
      accountId,
      body,
    );
    return { checkpoint };
  }
}

@Controller('checkpoints')
@UseGuards(SessionGuard)
export class CheckpointsController {
  constructor(private readonly checkpointsService: CheckpointsService) {}

  /** Cross-account list for Activity (membership-scoped). */
  @Get()
  async list(
    @CurrentUser() user: PublicUser,
    @Query('accountId') accountId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const checkpoints = await this.checkpointsService.listForUser(user.id, {
      accountId: accountId || undefined,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
    return { checkpoints };
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateCheckpointSchema))
    body: UpdateCheckpointDto,
  ) {
    const checkpoint = await this.checkpointsService.update(user.id, id, body);
    return { checkpoint };
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.checkpointsService.remove(user.id, id);
  }
}
