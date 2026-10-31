import type { CategoryColorId, CategoryIconId, PublicCategory } from '@finance/shared';
import type { Category } from '../generated/prisma/client';

export function toPublicCategory(category: Category): PublicCategory {
  return {
    id: category.id,
    name: category.name,
    code: category.code,
    kind: category.kind,
    icon: category.icon as CategoryIconId,
    color: category.color as CategoryColorId,
    isSystem: category.isSystem,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}
