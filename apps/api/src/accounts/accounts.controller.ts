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
  addAccountMemberSchema,
  createAccountSchema,
  updateAccountSchema,
} from '@finance/shared';
import type {
  AddAccountMemberDto,
  CreateAccountDto,
  PublicUser,
  UpdateAccountDto,
} from '@finance/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CurrentUser } from '../auth/session.decorator';
import { SessionGuard } from '../auth/session.guard';
import { AccountsService } from './accounts.service';

@Controller('accounts')
@UseGuards(SessionGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  async list(@CurrentUser() user: PublicUser) {
    const accounts = await this.accountsService.listForUser(user.id);
    return { accounts };
  }

  @Post()
  async create(
    @CurrentUser() user: PublicUser,
    @Body(new ZodValidationPipe(createAccountSchema)) body: CreateAccountDto,
  ) {
    const account = await this.accountsService.create(user.id, body);
    return { account };
  }

  @Get(':id')
  async get(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const account = await this.accountsService.getForUser(user.id, id);
    return { account };
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateAccountSchema)) body: UpdateAccountDto,
  ) {
    const account = await this.accountsService.update(user.id, id, body);
    return { account };
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.accountsService.remove(user.id, id);
  }

  @Post(':id/members')
  async addMember(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(addAccountMemberSchema))
    body: AddAccountMemberDto,
  ) {
    const account = await this.accountsService.addMember(user.id, id, body);
    return { account };
  }

  @Delete(':id/members/:userId')
  async removeMember(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) memberUserId: string,
  ) {
    const account = await this.accountsService.removeMember(
      user.id,
      id,
      memberUserId,
    );
    return { account };
  }
}
