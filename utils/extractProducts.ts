import { ProductVariant } from '../types';

/**
 * Advanced product extraction utilities for organizing registry data.
 */

export interface GroupedProducts {
  [key: string]: ProductVariant[];
}

/**
 * Robust extraction of product arrays from various API response shapes.
 * Handles:
 * - [ {item}, {item} ]
 * - { items: [...] }
 * - { data: [...] }
 * - { products: [...] }
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
 * Compatible with legacy 'pub' and standard 'published' strings.
 */
export function isPublishedProduct(product: ProductVariant): boolean {
  if (!product.status) return false;
  const s = product.status.toLowerCase().trim();
  return s === 'published' || s === 'pub';
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
 * Groups products by their sub-category.
 */
export function groupBySubCategory(products: ProductVariant[]): GroupedProducts {
  return products.reduce((acc, product) => {
    const sub = product.sub_category || 'General';
    if (!acc[sub]) acc[acc[sub] ? sub : 'General'] = []; // Basic safety
    if (!acc[sub]) acc[sub] = [];
    acc[sub].push(product);
    return acc;
  }, {} as GroupedProducts);
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