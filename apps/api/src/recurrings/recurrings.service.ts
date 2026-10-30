import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateRecurringDto,
  NextMonthForecast,
  UpdateRecurringDto,
} from '@finance/shared';
import {
  RecurringInterval,
  RecurringType,
} from '../generated/prisma/client';
import { parseMinorUnits } from '../accounts/accounts.mapper';
import { PrismaService } from '../prisma/prisma.service';
import { buildNextMonthForecast } from './forecast';
import { toPublicRecurring } from './recurrings.mapper';

@Injectable()
export class RecurringsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string) {
    const rules = await this.prisma.recurringRule.findMany({
      where: { userId },
      orderBy: [{ currency: 'asc' }, { anchorDay: 'asc' }],
    });
    return rules.map(toPublicRecurring);
  }

  async create(userId: string, dto: CreateRecurringDto) {
    const rule = await this.prisma.recurringRule.create({
      data: {
        userId,
        type: dto.type as RecurringType,
        amountMinor: parseMinorUnits(dto.amountMinor),
        currency: dto.currency,
        description: dto.description ?? null,
        interval: (dto.interval ?? 'MONTHLY') as RecurringInterval,
        anchorDay: dto.anchorDay,
        active: dto.active ?? true,
      },
    });
    return toPublicRecurring(rule);
  }

  async update(userId: string, id: string, dto: UpdateRecurringDto) {
    await this.requireOwned(userId, id);
    const rule = await this.prisma.recurringRule.update({
      where: { id },
      data: {
        type: dto.type as RecurringType | undefined,
        amountMinor:
          dto.amountMinor !== undefined
            ? parseMinorUnits(dto.amountMinor)
            : undefined,
        currency: dto.currency,
        description:
          dto.description === undefined ? undefined : dto.description,
        interval: dto.interval as RecurringInterval | undefined,
        anchorDay: dto.anchorDay,
        active: dto.active,
      },
    });
    return toPublicRecurring(rule);
  }

  async remove(userId: string, id: string) {
    await this.requireOwned(userId, id);
    await this.prisma.recurringRule.delete({ where: { id } });
  }

  async nextMonthForecast(userId: string): Promise<NextMonthForecast> {
    const rules = await this.prisma.recurringRule.findMany({
      where: { userId },
    });
    return buildNextMonthForecast(
      rules.map((r) => ({
        type: r.type,
        amountMinor: r.amountMinor,
        currency: r.currency,
        active: r.active,
        interval: 'MONTHLY' as const,
        anchorDay: r.anchorDay,
      })),
    );
  }

  private async requireOwned(userId: string, id: string) {
    const rule = await this.prisma.recurringRule.findFirst({
      where: { id, userId },
    });
    if (!rule) {
      throw new NotFoundException('Recurring rule not found');
    }
    return rule;
  }
}
