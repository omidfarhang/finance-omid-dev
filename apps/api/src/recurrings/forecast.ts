import type { NextMonthForecast } from '@finance/shared';
import { RecurringType } from '../generated/prisma/client';

export type RuleForForecast = {
  type: RecurringType;
  amountMinor: bigint;
  currency: string;
  active: boolean;
  interval: 'MONTHLY';
  anchorDay: number;
};

/** UTC next calendar month year/month (1–12). */
export function nextUtcMonth(from: Date = new Date()): {
  year: number;
  month: number;
} {
  const year = from.getUTCFullYear();
  const month = from.getUTCMonth() + 1; // 1–12 current
  if (month === 12) {
    return { year: year + 1, month: 1 };
  }
  return { year, month: month + 1 };
}

export function buildNextMonthForecast(
  rules: RuleForForecast[],
  from: Date = new Date(),
): NextMonthForecast {
  const { year, month } = nextUtcMonth(from);
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
    year,
    month,
    currencies,
  };
}
