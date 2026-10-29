import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  updateAdminUserSchema,
  updateAppSettingsSchema,
} from '@finance/shared';
import type {
  UpdateAdminUserDto,
  UpdateAppSettingsDto,
} from '@finance/shared';
import { AdminGuard } from '../auth/admin.guard';
import { SessionGuard } from '../auth/session.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(SessionGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('settings')
  async getSettings() {
    const settings = await this.adminService.getSettings();
    return { settings };
  }

  @Patch('settings')
  async updateSettings(
    @Body(new ZodValidationPipe(updateAppSettingsSchema))
    body: UpdateAppSettingsDto,
  ) {
    const settings = await this.adminService.updateSettings(body);
    return { settings };
  }

  @Get('users')
  async listUsers() {
    const users = await this.adminService.listUsers();
    return { users };
  }

  @Patch('users/:id')
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateAdminUserSchema))
    body: UpdateAdminUserDto,
  ) {
    const user = await this.adminService.updateUser(id, body);
    return { user };
  }

  @Delete('users/:id')
  @HttpCode(204)
  async deleteUser(@Param('id', ParseUUIDPipe) id: string) {
    await this.adminService.deleteUser(id);
  }
}
