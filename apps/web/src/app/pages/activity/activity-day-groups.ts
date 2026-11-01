import {
  instantToCivilDate,
  type CalendarSystem,
  type CivilDate,
  type PublicTransaction,
} from '@finance/shared';

export type ActivityDayGroup = {
  key: string;
  sampleIso: string;
  transactions: PublicTransaction[];
};

export function civilDayKey(civil: CivilDate): string {
  return `${civil.year}-${String(civil.month).padStart(2, '0')}-${String(civil.day).padStart(2, '0')}`;
}

/** Group newest-first transactions into civil calendar days (newest day first). */
export function groupTransactionsByDay(
  transactions: PublicTransaction[],
  calendar: CalendarSystem,
  timeZone: string | null | undefined,
): ActivityDayGroup[] {
  const groups = new Map<string, ActivityDayGroup>();
  const order: string[] = [];

  for (const tx of transactions) {
    const instant = new Date(tx.occurredAt);
    if (Number.isNaN(instant.getTime())) {
      continue;
    }
    const civil = instantToCivilDate(instant, calendar, timeZone);
    const key = civilDayKey(civil);
    const existing = groups.get(key);
    if (existing) {
      existing.transactions.push(tx);
    } else {
      order.push(key);
      groups.set(key, {
        key,
        sampleIso: tx.occurredAt,
        transactions: [tx],
      });
    }
  }

  return order.map((key) => groups.get(key)!);
}
