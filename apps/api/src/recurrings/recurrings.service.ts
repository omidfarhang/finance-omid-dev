import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateRecurringDto,
  MonthAnchor,
  NextMonthForecast,
  RecurringInterval,
  UpdateRecurringDto,
} from '@finance/shared';
import {
  CategoryKind,
  MonthAnchor as PrismaMonthAnchor,
  RecurringInterval as PrismaInterval,
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
      orderBy: [{ currency: 'asc' }, { interval: 'asc' }, { createdAt: 'asc' }],
    });
    return rules.map(toPublicRecurring);
  }

  async create(userId: string, dto: CreateRecurringDto) {
    const normalized = await this.normalizeWrite(userId, dto, null);
    const rule = await this.prisma.recurringRule.create({
      data: {
        userId,
        ...normalized,
      },
    });
    return toPublicRecurring(rule);
  }

  async update(userId: string, id: string, dto: UpdateRecurringDto) {
    const existing = await this.requireOwned(userId, id);
    const merged = {
      type: dto.type ?? existing.type,
      amountMinor: dto.amountMinor ?? existing.amountMinor.toString(),
      currency: dto.currency ?? existing.currency,
      categoryId:
        dto.categoryId === undefined ? existing.categoryId : dto.categoryId,
      description:
        dto.description === undefined
          ? existing.description
          : dto.description,
      interval: (dto.interval ?? existing.interval) as RecurringInterval,
      monthAnchor: (dto.monthAnchor ??
        existing.monthAnchor) as MonthAnchor,
      anchorDay:
        dto.anchorDay === undefined ? existing.anchorDay : dto.anchorDay,
      anchorMonth:
        dto.anchorMonth === undefined
          ? existing.anchorMonth
          : dto.anchorMonth,
      weekday: dto.weekday === undefined ? existing.weekday : dto.weekday,
      fromAccountId:
        dto.fromAccountId === undefined
          ? existing.fromAccountId
          : dto.fromAccountId,
      toAccountId:
        dto.toAccountId === undefined
          ? existing.toAccountId
          : dto.toAccountId,
      active: dto.active ?? existing.active,
    };
    const normalized = await this.normalizeWrite(userId, merged, existing.id);
    const rule = await this.prisma.recurringRule.update({
      where: { id },
      data: normalized,
    });
    return toPublicRecurring(rule);
  }

  async remove(userId: string, id: string) {
    await this.requireOwned(userId, id);
    await this.prisma.recurringRule.delete({ where: { id } });
  }

  async nextMonthForecast(userId: string): Promise<NextMonthForecast> {
    const [user, rules] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: userId } }),
      this.prisma.recurringRule.findMany({ where: { userId } }),
    ]);
    return buildNextMonthForecast(
      rules.map((r) => ({
        type: r.type,
        amountMinor: r.amountMinor,
        currency: r.currency,
        active: r.active,
        interval: r.interval as RecurringInterval,
        monthAnchor: r.monthAnchor as MonthAnchor,
        anchorDay: r.anchorDay,
        anchorMonth: r.anchorMonth,
        weekday: r.weekday,
      })),
      {
        calendar: user.calendar,
        timeZone: user.timeZone,
      },
    );
  }

  private async normalizeWrite(
    userId: string,
    dto: {
      type: string;
      amountMinor: string;
      currency: string;
      categoryId?: string | null;
      description?: string | null;
      interval: RecurringInterval;
      monthAnchor?: MonthAnchor;
      anchorDay?: number | null;
      anchorMonth?: number | null;
      weekday?: number | null;
      fromAccountId?: string | null;
      toAccountId?: string | null;
      active?: boolean;
    },
    _existingId: string | null,
  ) {
    const type = dto.type as RecurringType;
    const interval = dto.interval as PrismaInterval;
    const monthAnchor = (dto.monthAnchor ?? 'DAY') as PrismaMonthAnchor;

    let currency = dto.currency;
    let fromAccountId: string | null = null;
    let toAccountId: string | null = null;

    if (type === RecurringType.TRANSFER) {
      if (!dto.fromAccountId || !dto.toAccountId) {
        throw new BadRequestException(
          'fromAccountId and toAccountId are required for TRANSFER',
        );
      }
      const [from, to] = await Promise.all([
        this.requireAccessibleAccount(userId, dto.fromAccountId),
        this.requireAccessibleAccount(userId, dto.toAccountId),
      ]);
      if (from.currency !== to.currency) {
        throw new BadRequestException(
          'Transfer recurrings require same-currency accounts',
        );
      }
      if (from.id === to.id) {
        throw new BadRequestException('from and to accounts must differ');
      }
      fromAccountId = from.id;
      toAccountId = to.id;
      currency = from.currency;
    } else {
      fromAccountId = null;
      toAccountId = null;
    }

    const categoryId = await this.resolveCategoryId(
      userId,
      dto.categoryId,
      type,
    );

    let anchorDay: number | null = null;
    let anchorMonth: number | null = null;
    let weekday: number | null = null;
    let resolvedMonthAnchor = monthAnchor;

    if (interval === PrismaInterval.WEEKLY) {
      if (dto.weekday === undefined || dto.weekday === null) {
        throw new BadRequestException('weekday is required for WEEKLY rules');
      }
      weekday = dto.weekday;
      resolvedMonthAnchor = PrismaMonthAnchor.DAY;
    } else if (
      interval === PrismaInterval.MONTHLY ||
      interval === PrismaInterval.YEARLY
    ) {
      resolvedMonthAnchor = monthAnchor;
      if (monthAnchor === PrismaMonthAnchor.DAY) {
        if (dto.anchorDay === undefined || dto.anchorDay === null) {
          throw new BadRequestException(
            'anchorDay is required when monthAnchor is DAY',
          );
        }
        anchorDay = dto.anchorDay;
      } else {
        anchorDay = null;
      }
      if (interval === PrismaInterval.YEARLY) {
        if (dto.anchorMonth === undefined || dto.anchorMonth === null) {
          throw new BadRequestException(
            'anchorMonth is required for YEARLY rules',
          );
        }
        anchorMonth = dto.anchorMonth;
      }
    } else {
      // DAILY
      resolvedMonthAnchor = PrismaMonthAnchor.DAY;
      anchorDay = null;
    }

    return {
      type,
      amountMinor: parseMinorUnits(dto.amountMinor),
      currency,
      categoryId,
      description: dto.description ?? null,
      interval,
      monthAnchor: resolvedMonthAnchor,
      anchorDay,
      anchorMonth,
      weekday,
      fromAccountId,
      toAccountId,
      active: dto.active ?? true,
    };
  }

  private async resolveCategoryId(
    userId: string,
    categoryId: string | null | undefined,
    type: RecurringType,
  ): Promise<string | null> {
    if (!categoryId) {
      return null;
    }
    const expectedKind =
      type === RecurringType.INCOME
        ? CategoryKind.INCOME
        : type === RecurringType.EXPENSE
          ? CategoryKind.EXPENSE
          : CategoryKind.TRANSFER;
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, userId },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    if (category.kind !== expectedKind) {
      throw new BadRequestException(
        `Category kind must be ${expectedKind} for ${type} recurrings`,
      );
    }
    return category.id;
  }

  private async requireAccessibleAccount(userId: string, accountId: string) {
    const member = await this.prisma.accountMember.findUnique({
      where: {
        accountId_userId: { accountId, userId },
      },
      include: { account: true },
    });
    if (!member) {
      throw new NotFoundException('Account not found');
    }
    return member.account;
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
