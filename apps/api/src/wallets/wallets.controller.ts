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
import type {
  CreateWalletDto,
  PublicUser,
  UpdateWalletDto,
} from '@finance/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CurrentUser } from '../auth/session.decorator';
import { SessionGuard } from '../auth/session.guard';
import { WalletsService } from './wallets.service';

@Controller('wallets')
@UseGuards(SessionGuard)
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get()
  async list(@CurrentUser() user: PublicUser) {
    const wallets = await this.walletsService.listForUser(user.id);
    return { wallets };
  }

  @Post()
  async create(
    @CurrentUser() user: PublicUser,
    @Body(new ZodValidationPipe(createWalletSchema)) body: CreateWalletDto,
  ) {
    const wallet = await this.walletsService.create(user.id, body);
    return { wallet };
  }

  @Get(':id')
  async get(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const wallet = await this.walletsService.getForUser(user.id, id);
    return { wallet };
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateWalletSchema)) body: UpdateWalletDto,
  ) {
    const wallet = await this.walletsService.update(user.id, id, body);
    return { wallet };
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.walletsService.remove(user.id, id);
  }
}
