import {
  instantToCivilDate,
  type CalendarSystem,
  type PublicCheckpoint,
  type PublicTransaction,
} from '@finance/shared';
import { civilDayKey } from './transaction-day-groups';

export type TimelineItem =
  | { kind: 'transaction'; at: string; transaction: PublicTransaction }
  | { kind: 'checkpoint'; at: string; checkpoint: PublicCheckpoint };

export type TimelineDayGroup = {
  key: string;
  sampleIso: string;
  items: TimelineItem[];
};

/** Group transactions and checkpoints into civil calendar days (newest day first). */
export function groupTimelineByDay(
  transactions: PublicTransaction[],
  checkpoints: PublicCheckpoint[],
  calendar: CalendarSystem,
  timeZone: string | null | undefined,
): TimelineDayGroup[] {
  const items: TimelineItem[] = [
    ...transactions.map(
      (transaction): TimelineItem => ({
        kind: 'transaction',
        at: transaction.occurredAt,
        transaction,
      }),
    ),
    ...checkpoints.map(
      (checkpoint): TimelineItem => ({
        kind: 'checkpoint',
        at: checkpoint.asOf,
        checkpoint,
      }),
    ),
  ];

  items.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

  const groups = new Map<string, TimelineDayGroup>();
  const order: string[] = [];

  for (const item of items) {
    const instant = new Date(item.at);
    if (Number.isNaN(instant.getTime())) {
      continue;
    }
    const civil = instantToCivilDate(instant, calendar, timeZone);
    const key = civilDayKey(civil);
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(item);
    } else {
      order.push(key);
      groups.set(key, {
        key,
        sampleIso: item.at,
        items: [item],
      });
    }
  }

  return order.map((key) => groups.get(key)!);
}
