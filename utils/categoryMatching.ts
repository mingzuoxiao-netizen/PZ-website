import { Category } from '../types';

/**
 * Match legacy display-name categories (e.g. "Butcher Block") with
 * canonical registry IDs (e.g. "butcher-block"), without rewriting
 * stored product values or changing public-site filter semantics.
 */
function categoryKey(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function categoryMatches(
  productCategory: unknown,
  category: Pick<Category, 'id' | 'title'>
): boolean {
  const key = categoryKey(productCategory);
  return !!key && (key === categoryKey(category.id) || key === categoryKey(category.title));
}
