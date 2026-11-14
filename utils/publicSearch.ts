import type { ProductVariant } from '../types';

// Keep the small category synonym list in step with the D1 Worker search predicate.
const CATEGORY_ALIASES: [string, string[]][] = [
  ['tables', ['table', 'tables', 'dining table', '餐桌', '桌']],
  ['seating', ['chair', 'chairs', 'bench', '座椅', '椅', '凳']],
  ['cabinetry', ['cabinet', 'casegoods', 'storage', '储物柜', '柜']],
  ['butcher-block', ['butcher block', 'countertop', 'worktop', '台面', '砧板', '岛台']],
];

export function searchCategoryAlias(query: string): string | null {
  const text = query.trim().toLowerCase();
  return CATEGORY_ALIASES.find(([, terms]) => terms.includes(text))?.[0] || null;
}

export function productMatchesPublicSearch(product: ProductVariant, query: string): boolean {
  const text = query.trim().toLowerCase();
  if (!text) return true;
  const fields = [product.name, product.name_cn, product.code, product.description,
    product.description_cn, product.material, product.category, product.sub_category];
  if (fields.some(field => String(field || '').toLowerCase().includes(text))) return true;
  const alias = searchCategoryAlias(text);
  return !!alias && String(product.category || '').toLowerCase().includes(alias);
}
