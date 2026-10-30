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
  createRecurringSchema,
  updateRecurringSchema,
} from '@finance/shared';
import type {
  CreateRecurringDto,
  PublicUser,
  UpdateRecurringDto,
} from '@finance/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CurrentUser } from '../auth/session.decorator';
import { SessionGuard } from '../auth/session.guard';
import { RecurringsService } from './recurrings.service';

@Controller()
@UseGuards(SessionGuard)
export class RecurringsController {
  constructor(private readonly recurringsService: RecurringsService) {}

  @Get('recurrings')
  async list(@CurrentUser() user: PublicUser) {
    const recurrings = await this.recurringsService.listForUser(user.id);
    return { recurrings };
  }

  @Post('recurrings')
  async create(
    @CurrentUser() user: PublicUser,
    @Body(new ZodValidationPipe(createRecurringSchema))
    body: CreateRecurringDto,
  ) {
    const recurring = await this.recurringsService.create(user.id, body);
    return { recurring };
  }

  @Patch('recurrings/:id')
  async update(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateRecurringSchema))
    body: UpdateRecurringDto,
  ) {
    const recurring = await this.recurringsService.update(user.id, id, body);
    return { recurring };
  }

  @Delete('recurrings/:id')
  @HttpCode(204)
  async remove(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.recurringsService.remove(user.id, id);
  }

  @Get('forecast/next-month')
  async nextMonth(@CurrentUser() user: PublicUser) {
    return this.recurringsService.nextMonthForecast(user.id);
  }
}
