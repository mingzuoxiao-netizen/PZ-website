import { API_BASE } from './siteConfig';
import { extractProductsArray, isPublishedProduct } from './extractProducts';
import { normalizeProducts } from './normalizeProduct';
import type { ProductVariant } from '../types';

export interface CategoryFacet {
  id: string;
  count: number;
  subCategories: { name: string; count: number }[];
}
export interface CatalogPage {
  items: ProductVariant[];
  nextCursor: string | null;
  hasMore: boolean;
}
interface CatalogFilters {
  category?: string;
  sub?: string;
  q?: string;
  limit?: number;
  cursor?: string | null;
  signal?: AbortSignal;
}
const catalogEndpoint = API_BASE + '/products';

// v=2 enables paginated D1 reads after Worker rollout.
// Before that, legacy KV snapshots continue to work in Cloudflare Preview.
export async function fetchPublicCatalogPage({
  category, sub, q, limit = 24, cursor, signal
}: CatalogFilters = {}): Promise<CatalogPage> {
  const params = new URLSearchParams({ v: '2', limit: String(limit) });
  if (category && category !== 'all') params.set('category', category);
  if (sub && sub !== 'all') params.set('sub', sub);
  if (q) params.set('q', q);
  if (cursor) params.set('cursor', cursor);
  const response = await fetch(catalogEndpoint + '?' + params.toString(), { signal });
  if (!response.ok) throw new Error('Product catalog unavailable (HTTP ' + response.status + ')');
  const json = await response.json();
  const paged = typeof json.hasMore === 'boolean';
  let items = normalizeProducts(extractProductsArray(json)).filter(isPublishedProduct);
  if (!paged) {
    // Legacy whole-snapshot fallback; temporary until V2 is online.
    if (category && category !== 'all') {
      items = items.filter(p => p.category?.toLowerCase() === category.toLowerCase());
    }
    if (sub && sub !== 'all') {
      items = items.filter(p => p.sub_category?.toLowerCase() === sub.toLowerCase());
    }
    if (q) {
      const term = q.toLowerCase();
      items = items.filter(p => [p.name, p.code, p.description]
        .some(v => (v || '').toLowerCase().includes(term)));
    }
  }
  return {
    items,
    nextCursor: paged && typeof json.nextCursor === 'string' ? json.nextCursor : null,
    hasMore: paged ? json.hasMore : false
  };
}

export async function fetchPublicCatalogFacets(signal?: AbortSignal): Promise<CategoryFacet[]> {
  const response = await fetch(catalogEndpoint + '?v=2&summary=categories', { signal });
  if (!response.ok) throw new Error('Product categories unavailable (HTTP ' + response.status + ')');
  const json = await response.json();
  if (Array.isArray(json.categories)) {
    return json.categories.map((c: any) => ({
      id: String(c.id || '').toLowerCase(),
      count: Number(c.count || 0),
      subCategories: Array.isArray(c.subCategories)
        ? c.subCategories.map((s: any) => ({
            name: String(s.name || ''), count: Number(s.count || 0)
          }))
        : []
    }));
  }
  const products = normalizeProducts(extractProductsArray(json)).filter(isPublishedProduct);
  const groups = new Map<string, CategoryFacet>();
  for (const p of products) {
    const id = (p.category || '').toLowerCase();
    if (!id) continue;
    if (!groups.has(id)) groups.set(id, { id, count: 0, subCategories: [] });
    const group = groups.get(id)!;
    group.count++;
    if (p.sub_category) {
      const found = group.subCategories.find(s => s.name === p.sub_category);
      if (found) found.count++;
      else group.subCategories.push({ name: p.sub_category, count: 1 });
    }
  }
  return Array.from(groups.values());
}

export async function fetchPublicCatalogProduct(
  id: string, signal?: AbortSignal
): Promise<ProductVariant | null> {
  const response = await fetch(catalogEndpoint + '?v=2&id=' + encodeURIComponent(id), { signal });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Product details unavailable (HTTP ' + response.status + ')');
  const json = await response.json();
  const product = json.item
    ? normalizeProducts([json.item])[0]
    : normalizeProducts(extractProductsArray(json)).find(p => p.id === id || p.code === id);
  return product && isPublishedProduct(product) ? product : null;
}
