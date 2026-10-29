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
  UseGuards,
} from '@nestjs/common';
import {
  createWalletSchema,
  updateWalletSchema,
} from '@finance/shared';
import type { CreateWalletDto, UpdateWalletDto } from '@finance/shared';
import { AdminGuard } from '../auth/admin.guard';
import { SessionGuard } from '../auth/session.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { WalletsService } from '../wallets/wallets.service';

@Controller('admin/users/:userId/wallets')
@UseGuards(SessionGuard, AdminGuard)
export class AdminWalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get()
  async list(@Param('userId', ParseUUIDPipe) userId: string) {
    const wallets = await this.walletsService.listForUser(userId);
    return { wallets };
  }

  @Post()
  async create(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body(new ZodValidationPipe(createWalletSchema)) body: CreateWalletDto,
  ) {
    const wallet = await this.walletsService.create(userId, body);
    return { wallet };
  }

  @Get(':id')
  async get(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const wallet = await this.walletsService.getForUser(userId, id);
    return { wallet };
  }

  @Patch(':id')
  async update(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateWalletSchema)) body: UpdateWalletDto,
  ) {
    const wallet = await this.walletsService.update(userId, id, body);
    return { wallet };
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.walletsService.remove(userId, id);
  }
}
