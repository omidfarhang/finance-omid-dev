import type { CalendarSystem, NextMonthForecast } from '@finance/shared';
import { nextMonthBounds } from '@finance/shared';
import { RecurringType } from '../generated/prisma/client';

export type RuleForForecast = {
  type: RecurringType;
  amountMinor: bigint;
  currency: string;
  active: boolean;
  interval: 'MONTHLY';
  anchorDay: number;
};

export type ForecastContext = {
  calendar: CalendarSystem;
  timeZone: string | null;
  from?: Date;
};

export function buildNextMonthForecast(
  rules: RuleForForecast[],
  context: ForecastContext,
): NextMonthForecast {
  const bounds = nextMonthBounds(
    context.from ?? new Date(),
    context.calendar,
    context.timeZone,
  );
  const byCurrency = new Map<
    string,
    { income: bigint; expense: bigint }
  >();

  for (const rule of rules) {
    if (!rule.active || rule.interval !== 'MONTHLY') {
      continue;
    }
    if (rule.anchorDay < 1 || rule.anchorDay > 28) {
      continue;
    }
    const bucket = byCurrency.get(rule.currency) ?? {
      income: 0n,
      expense: 0n,
    };
    if (rule.type === RecurringType.INCOME) {
      bucket.income += rule.amountMinor;
    } else {
      bucket.expense += rule.amountMinor;
    }
    byCurrency.set(rule.currency, bucket);
  }

  const currencies = [...byCurrency.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, bucket]) => ({
      currency,
      expectedIncomeMinor: bucket.income.toString(),
      expectedExpenseMinor: bucket.expense.toString(),
      surplusMinor: (bucket.income - bucket.expense).toString(),
    }));

  return {
    projection: true,
    calendar: bounds.calendar,
    year: bounds.year,
    month: bounds.month,
    currencies,
  };
}
