import { z } from 'zod';

export const categoryKindSchema = z.enum(['INCOME', 'EXPENSE', 'TRANSFER']);
export type CategoryKind = z.infer<typeof categoryKindSchema>;

/** Curated PrimeIcons ids for categories. */
export const CATEGORY_ICON_IDS = [
  'pi-tag',
  'pi-wallet',
  'pi-money-bill',
  'pi-briefcase',
  'pi-building',
  'pi-chart-line',
  'pi-percentage',
  'pi-home',
  'pi-gift',
  'pi-replay',
  'pi-star',
  'pi-ellipsis-h',
  'pi-shopping-cart',
  'pi-shop',
  'pi-car',
  'pi-bolt',
  'pi-wrench',
  'pi-wifi',
  'pi-heart',
  'pi-shield',
  'pi-shopping-bag',
  'pi-truck',
  'pi-ticket',
  'pi-book',
  'pi-map',
  'pi-user',
  'pi-paw',
  'pi-users',
  'pi-file',
  'pi-credit-card',
  'pi-heart-fill',
  'pi-arrow-right-arrow-left',
  'pi-box',
  'pi-inbox',
  'pi-dollar',
  'pi-globe',
  'pi-phone',
  'pi-calendar',
  'pi-coffee',
  'pi-image',
] as const;

export const categoryIconSchema = z.enum(CATEGORY_ICON_IDS);
export type CategoryIconId = z.infer<typeof categoryIconSchema>;

/** Named palette keys for category grouping and charts. */
export const CATEGORY_COLOR_IDS = [
  'slate',
  'red',
  'orange',
  'amber',
  'lime',
  'emerald',
  'cyan',
  'blue',
  'violet',
  'pink',
] as const;

export const categoryColorSchema = z.enum(CATEGORY_COLOR_IDS);
export type CategoryColorId = z.infer<typeof categoryColorSchema>;

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  kind: categoryKindSchema,
  icon: categoryIconSchema,
  color: categoryColorSchema,
});
export type CreateCategoryDto = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    icon: categoryIconSchema.optional(),
    color: categoryColorSchema.optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.icon !== undefined ||
      value.color !== undefined,
    { message: 'At least one field is required' },
  );
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;

const emptyToUndefined = (value: unknown) =>
  value === '' || value === null || value === undefined ? undefined : value;

export const listCategoriesQuerySchema = z.object({
  kind: z.preprocess(emptyToUndefined, categoryKindSchema.optional()),
});
export type ListCategoriesQuery = z.infer<typeof listCategoriesQuerySchema>;

export const publicCategorySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  code: z.string().nullable(),
  kind: categoryKindSchema,
  icon: categoryIconSchema,
  color: categoryColorSchema,
  isSystem: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type PublicCategory = z.infer<typeof publicCategorySchema>;
