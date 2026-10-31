import { Category } from '../types';
import { categories as fallbackCategories } from '../data/inventory';

/** Normalise approved Worker proposals without altering their canonical IDs. */
export function normalizeSiteCategory(value: any): Category {
  return {
    ...value,
    id: String(value?.id || ''),
    title: String(value?.title || ''),
    title_zh: String(value?.title_zh || value?.title_cn || '') || undefined,
    subtitle: String(value?.subtitle || ''),
    subtitle_zh: String(value?.subtitle_zh || value?.subtitle_cn || '') || undefined,
    description: String(value?.description || ''),
    description_zh: String(value?.description_zh || value?.description_cn || '') || undefined,
    image: String(value?.image || ''),
    subCategories: Array.isArray(value?.subCategories) ? value.subCategories : []
  };
}

/** Only call with published site-config on public routes. Requests awaiting review
 * are held exclusively in the authorised admin API, never added here. */
export function publishedSiteCategories(configCategories: unknown): Category[] {
  const source = Array.isArray(configCategories) && configCategories.length
    ? configCategories : fallbackCategories;
  const seen = new Set<string>();
  return source.map(normalizeSiteCategory).filter(category => {
    if (category.hidden) return false;
    const key = category.id.toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Keep the approved design's three featured cards, then append newly
 * approved categories. Other legacy categories remain on the Products page. */
export function homepageSiteCategories(configCategories: unknown): Category[] {
  const source = publishedSiteCategories(configCategories);
  const featuredIds = ['butcher-block', 'tables', 'cabinetry'];
  const featured = featuredIds.map(id => source.find(cat => cat.id.toLowerCase() === id))
    .filter((cat): cat is Category => !!cat);
  const baseIds = new Set(fallbackCategories.map(cat => cat.id.toLowerCase()));
  const extras = source.filter(cat => !featuredIds.includes(cat.id.toLowerCase())
    && (cat.source === 'proposal' || !baseIds.has(cat.id.toLowerCase())));
  return [...featured, ...extras];
}
