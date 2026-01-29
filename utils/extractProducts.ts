import { ProductVariant } from '../types';

/**
 * Advanced product extraction utilities for organizing registry data.
 */

export interface GroupedProducts {
  [key: string]: ProductVariant[];
}

/**
 * Robust extraction of product arrays from various API response shapes.
 */
export function extractProductsArray(response: any): any[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (response.items && Array.isArray(response.items)) return response.items;
  if (response.products && Array.isArray(response.products)) return response.products;
  if (response.data && Array.isArray(response.data)) return response.data;
  return [];
}

/**
 * Unified logic to determine if a product is considered 'published'.
 * STRICT PROTOCOL: Must be marked published AND must possess at least one digital asset.
 */
export function isPublishedProduct(product: ProductVariant): boolean {
  if (!product.status) return false;
  
  const s = product.status.toLowerCase().trim();
  const isMarkedPublished = s === 'published' || s === 'pub';
  
  // Industrial Safety: Never display a product without imagery to the public
  const hasAssets = Array.isArray(product.images) && product.images.length > 0;
  
  return isMarkedPublished && hasAssets;
}

/**
 * Extracts unique sub-categories from a list of products within a specific category.
 */
export function extractSubCategories(products: ProductVariant[], categoryId: string): string[] {
  const target = categoryId.toLowerCase().trim();
  const subs = new Set<string>();
  
  products.forEach(p => {
    const pCat = (p.category || '').toLowerCase().trim();
    if (pCat === target && p.sub_category && p.sub_category.trim()) {
      subs.add(p.sub_category.trim());
    }
  });

  return Array.from(subs).sort();
}

/**
 * Filters products by visibility and category hierarchy.
 */
export function filterRegistry(
  products: ProductVariant[], 
  options: { category?: string; sub?: string; search?: string; onlyPublished?: boolean }
): ProductVariant[] {
  let filtered = [...products];

  if (options.onlyPublished) {
    // Enforcement of isPublishedProduct (Status + Assets)
    filtered = filtered.filter(isPublishedProduct);
  }

  if (options.category && options.category !== 'all') {
    const cat = options.category.toLowerCase().trim();
    filtered = filtered.filter(p => (p.category || '').toLowerCase().trim() === cat);
  }

  if (options.sub && options.sub !== 'all') {
    const sub = options.sub.toLowerCase().trim();
    filtered = filtered.filter(p => (p.sub_category || '').toLowerCase().trim() === sub);
  }

  if (options.search) {
    const q = options.search.toLowerCase();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.code && p.code.toLowerCase().includes(q))
    );
  }

  return filtered;
}