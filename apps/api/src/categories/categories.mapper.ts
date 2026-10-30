import type { PublicCategory } from '@finance/shared';
import type { Category } from '../generated/prisma/client';

export function toPublicCategory(category: Category): PublicCategory {
  return {
    id: category.id,
    name: category.name,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}
