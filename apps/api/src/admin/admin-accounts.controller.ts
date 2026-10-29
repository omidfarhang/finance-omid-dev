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
  UpdateAccountDto,
} from '@finance/shared';
import { AdminGuard } from '../auth/admin.guard';
import { SessionGuard } from '../auth/session.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AccountsService } from '../accounts/accounts.service';

@Controller('admin/users/:userId/accounts')
@UseGuards(SessionGuard, AdminGuard)
export class AdminAccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  async list(@Param('userId', ParseUUIDPipe) userId: string) {
    const accounts = await this.accountsService.listForUser(userId);
    return { accounts };
  }

  @Post()
  async create(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body(new ZodValidationPipe(createAccountSchema)) body: CreateAccountDto,
  ) {
    const account = await this.accountsService.create(userId, body);
    return { account };
  }

  @Get(':id')
  async get(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const account = await this.accountsService.getForUser(userId, id);
    return { account };
  }

  @Patch(':id')
  async update(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateAccountSchema)) body: UpdateAccountDto,
  ) {
    const account = await this.accountsService.update(userId, id, body);
    return { account };
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.accountsService.remove(userId, id);
  }

  @Post(':id/members')
  async addMember(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(addAccountMemberSchema))
    body: AddAccountMemberDto,
  ) {
    const account = await this.accountsService.addMember(userId, id, body);
    return { account };
  }

  @Delete(':id/members/:memberUserId')
  async removeMember(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberUserId', ParseUUIDPipe) memberUserId: string,
  ) {
    const account = await this.accountsService.removeMember(
      userId,
      id,
      memberUserId,
    );
    return { account };
  }
}
