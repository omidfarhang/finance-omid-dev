import { z } from 'zod';
import { currencyCodeSchema, minorUnitsSchema } from './account';
import { calendarSchema } from './user';
import { positiveMinorUnitsSchema } from './transaction';

export const recurringTypeSchema = z.enum(['INCOME', 'EXPENSE']);
export type RecurringType = z.infer<typeof recurringTypeSchema>;

export const recurringIntervalSchema = z.enum(['MONTHLY']);
export type RecurringInterval = z.infer<typeof recurringIntervalSchema>;

export const createRecurringSchema = z.object({
  type: recurringTypeSchema,
  amountMinor: positiveMinorUnitsSchema,
  currency: currencyCodeSchema,
  description: z.string().trim().max(500).optional().nullable(),
  interval: recurringIntervalSchema.default('MONTHLY'),
  anchorDay: z.number().int().min(1).max(28),
  active: z.boolean().optional().default(true),
});
export type CreateRecurringDto = z.infer<typeof createRecurringSchema>;

export const updateRecurringSchema = z.object({
  type: recurringTypeSchema.optional(),
  amountMinor: positiveMinorUnitsSchema.optional(),
  currency: currencyCodeSchema.optional(),
  description: z.string().trim().max(500).optional().nullable(),
  interval: recurringIntervalSchema.optional(),
  anchorDay: z.number().int().min(1).max(28).optional(),
  active: z.boolean().optional(),
});
export type UpdateRecurringDto = z.infer<typeof updateRecurringSchema>;

export const publicRecurringSchema = z.object({
  id: z.uuid(),
  type: recurringTypeSchema,
  amountMinor: minorUnitsSchema,
  currency: z.string().length(3),
  description: z.string().nullable(),
  interval: recurringIntervalSchema,
  anchorDay: z.number().int(),
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
