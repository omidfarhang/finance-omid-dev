import type {
  CalendarSystem,
  MonthAnchor,
  NextMonthForecast,
  RecurringInterval,
} from '@finance/shared';
import { daysInMonth, nextMonthBounds, weekdayIndex } from '@finance/shared';
import { RecurringType } from '../generated/prisma/client';

export type RuleForForecast = {
  type: RecurringType;
  amountMinor: bigint;
  currency: string;
  active: boolean;
  interval: RecurringInterval;
  monthAnchor: MonthAnchor;
  anchorDay: number | null;
  anchorMonth: number | null;
  weekday: number | null;
};

export type ForecastContext = {
  calendar: CalendarSystem;
  timeZone: string | null;
  from?: Date;
};

/** How many times a rule occurs in the given civil month. */
export function countOccurrencesInMonth(
  rule: Pick<
    RuleForForecast,
    'interval' | 'monthAnchor' | 'anchorDay' | 'anchorMonth' | 'weekday'
  >,
  year: number,
  month: number,
  calendar: CalendarSystem,
): number {
  const days = daysInMonth(year, month, calendar);

  switch (rule.interval) {
    case 'DAILY':
      return days;
    case 'WEEKLY': {
      if (rule.weekday === null || rule.weekday < 0 || rule.weekday > 6) {
        return 0;
      }
      let count = 0;
      for (let day = 1; day <= days; day++) {
        if (weekdayIndex({ year, month, day }, calendar) === rule.weekday) {
          count += 1;
        }
      }
      return count;
    }
    case 'MONTHLY':
      return monthlyOccurs(rule, days) ? 1 : 0;
    case 'YEARLY':
      if (rule.anchorMonth !== month) {
        return 0;
      }
      return monthlyOccurs(rule, days) ? 1 : 0;
    default:
      return 0;
  }
}

function monthlyOccurs(
  rule: Pick<RuleForForecast, 'monthAnchor' | 'anchorDay'>,
  daysInTargetMonth: number,
): boolean {
  if (rule.monthAnchor === 'FIRST' || rule.monthAnchor === 'LAST') {
    return true;
  }
  if (rule.anchorDay === null || rule.anchorDay < 1 || rule.anchorDay > 28) {
    return false;
  }
  return rule.anchorDay <= daysInTargetMonth;
}

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
    if (!rule.active) {
      continue;
    }
    if (rule.type === RecurringType.TRANSFER) {
      continue;
    }
    const occurrences = countOccurrencesInMonth(
      rule,
      bounds.year,
      bounds.month,
      bounds.calendar,
    );
    if (occurrences === 0) {
      continue;
    }
    const total = rule.amountMinor * BigInt(occurrences);
    const bucket = byCurrency.get(rule.currency) ?? {
      income: 0n,
      expense: 0n,
    };
    if (rule.type === RecurringType.INCOME) {
      bucket.income += total;
    } else {
      bucket.expense += total;
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
