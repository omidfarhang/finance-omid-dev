import { z } from 'zod';
import { currencyCodeSchema, minorUnitsSchema } from './account';
import { calendarSchema } from './user';
import { positiveMinorUnitsSchema } from './transaction';

export const recurringTypeSchema = z.enum(['INCOME', 'EXPENSE', 'TRANSFER']);
export type RecurringType = z.infer<typeof recurringTypeSchema>;

export const recurringIntervalSchema = z.enum([
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'YEARLY',
]);
export type RecurringInterval = z.infer<typeof recurringIntervalSchema>;

export const monthAnchorSchema = z.enum(['DAY', 'FIRST', 'LAST']);
export type MonthAnchor = z.infer<typeof monthAnchorSchema>;

const scheduleFieldsSchema = z.object({
  type: recurringTypeSchema,
  amountMinor: positiveMinorUnitsSchema,
  currency: currencyCodeSchema,
  categoryId: z.uuid().optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  interval: recurringIntervalSchema.default('MONTHLY'),
  monthAnchor: monthAnchorSchema.optional().default('DAY'),
  anchorDay: z.number().int().min(1).max(28).optional().nullable(),
  anchorMonth: z.number().int().min(1).max(12).optional().nullable(),
  weekday: z.number().int().min(0).max(6).optional().nullable(),
  fromAccountId: z.uuid().optional().nullable(),
  toAccountId: z.uuid().optional().nullable(),
  active: z.boolean().optional().default(true),
});

function refineRecurringSchedule(
  data: {
    type: RecurringType;
    interval: RecurringInterval;
    monthAnchor?: MonthAnchor;
    anchorDay?: number | null;
    anchorMonth?: number | null;
    weekday?: number | null;
    fromAccountId?: string | null;
    toAccountId?: string | null;
    currency?: string;
  },
  ctx: z.RefinementCtx,
) {
  const monthAnchor = data.monthAnchor ?? 'DAY';

  if (data.interval === 'WEEKLY') {
    if (data.weekday === undefined || data.weekday === null) {
      ctx.addIssue({
        code: 'custom',
        message: 'weekday is required for WEEKLY rules',
        path: ['weekday'],
      });
    }
  }

  if (data.interval === 'MONTHLY' || data.interval === 'YEARLY') {
    if (monthAnchor === 'DAY') {
      if (data.anchorDay === undefined || data.anchorDay === null) {
        ctx.addIssue({
          code: 'custom',
          message: 'anchorDay is required when monthAnchor is DAY',
          path: ['anchorDay'],
        });
      }
    }
  }

  if (data.interval === 'YEARLY') {
    if (data.anchorMonth === undefined || data.anchorMonth === null) {
      ctx.addIssue({
        code: 'custom',
        message: 'anchorMonth is required for YEARLY rules',
        path: ['anchorMonth'],
      });
    }
  }

  if (data.type === 'TRANSFER') {
    if (!data.fromAccountId || !data.toAccountId) {
      ctx.addIssue({
        code: 'custom',
        message: 'fromAccountId and toAccountId are required for TRANSFER',
        path: ['fromAccountId'],
      });
    } else if (data.fromAccountId === data.toAccountId) {
      ctx.addIssue({
        code: 'custom',
        message: 'from and to accounts must differ',
        path: ['toAccountId'],
      });
    }
  }
}

export const createRecurringSchema = scheduleFieldsSchema.superRefine(
  refineRecurringSchedule,
);
export type CreateRecurringDto = z.infer<typeof createRecurringSchema>;

export const updateRecurringSchema = z
  .object({
    type: recurringTypeSchema.optional(),
    amountMinor: positiveMinorUnitsSchema.optional(),
    currency: currencyCodeSchema.optional(),
    categoryId: z.uuid().optional().nullable(),
    description: z.string().trim().max(500).optional().nullable(),
    interval: recurringIntervalSchema.optional(),
    monthAnchor: monthAnchorSchema.optional(),
    anchorDay: z.number().int().min(1).max(28).optional().nullable(),
    anchorMonth: z.number().int().min(1).max(12).optional().nullable(),
    weekday: z.number().int().min(0).max(6).optional().nullable(),
    fromAccountId: z.uuid().optional().nullable(),
    toAccountId: z.uuid().optional().nullable(),
    active: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    // Partial updates: only validate schedule when interval/type/anchors present enough to check
    if (
      data.interval === undefined &&
      data.type === undefined &&
      data.monthAnchor === undefined &&
      data.anchorDay === undefined &&
      data.anchorMonth === undefined &&
      data.weekday === undefined &&
      data.fromAccountId === undefined &&
      data.toAccountId === undefined
    ) {
      return;
    }
    // Full schedule validation requires merged state on the server for PATCH;
    // here only validate self-contained contradictions when interval is sent.
    if (data.interval !== undefined) {
      refineRecurringSchedule(
        {
          type: data.type ?? 'EXPENSE',
          interval: data.interval,
          monthAnchor: data.monthAnchor,
          anchorDay: data.anchorDay,
          anchorMonth: data.anchorMonth,
          weekday: data.weekday,
          fromAccountId: data.fromAccountId,
          toAccountId: data.toAccountId,
        },
        ctx,
      );
    }
  });
export type UpdateRecurringDto = z.infer<typeof updateRecurringSchema>;

export const publicRecurringSchema = z.object({
  id: z.uuid(),
  type: recurringTypeSchema,
  amountMinor: minorUnitsSchema,
  currency: z.string().length(3),
  categoryId: z.uuid().nullable(),
  description: z.string().nullable(),
  interval: recurringIntervalSchema,
  monthAnchor: monthAnchorSchema,
  anchorDay: z.number().int().nullable(),
  anchorMonth: z.number().int().nullable(),
  weekday: z.number().int().nullable(),
  fromAccountId: z.uuid().nullable(),
  toAccountId: z.uuid().nullable(),
  active: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type PublicRecurring = z.infer<typeof publicRecurringSchema>;

export const forecastCurrencySchema = z.object({
  currency: z.string().length(3),
  expectedIncomeMinor: minorUnitsSchema,
  expectedExpenseMinor: minorUnitsSchema,
  surplusMinor: minorUnitsSchema,
});
export type ForecastCurrency = z.infer<typeof forecastCurrencySchema>;

export const nextMonthForecastSchema = z.object({
  projection: z.literal(true),
  calendar: calendarSchema,
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  currencies: z.array(forecastCurrencySchema),
});
export type NextMonthForecast = z.infer<typeof nextMonthForecastSchema>;
