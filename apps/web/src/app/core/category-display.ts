import type { CategoryColorId, PublicCategory } from '@finance/shared';
import type { TranslocoService } from '@jsverse/transloco';

export type CategoryLabelSource = {
  name: string;
  code?: string | null;
};

/** Localized label for a category (system code → Transloco; else stored name). */
export function categoryLabel(
  category: CategoryLabelSource,
  i18n: TranslocoService,
): string {
  if (category.code) {
    return i18n.translate(`categories.${category.code}`);
  }
  if (category.name === 'Uncategorized') {
    return i18n.translate('categories.uncategorized');
  }
  return category.name;
}

export function categoryColorCssVar(
  color: string | null | undefined,
): string | null {
  if (!color) {
    return null;
  }
  return `var(--cat-${color})`;
}

export function categoryOptionFrom(
  category: PublicCategory,
  i18n: TranslocoService,
) {
  return {
    label: categoryLabel(category, i18n),
    value: category.id,
    icon: category.icon,
    color: category.color as CategoryColorId,
  };
}

/** Prefer system Uncategorized, else first in list. */
export function defaultCategoryId(
  categories: PublicCategory[],
  kind: PublicCategory['kind'],
): string {
  const list = categories.filter((c) => c.kind === kind);
  const uncategorized =
    list.find((c) => c.code === 'uncategorized') ??
    list.find((c) => c.name === 'Uncategorized');
  return (uncategorized ?? list[0])?.id ?? '';
}
