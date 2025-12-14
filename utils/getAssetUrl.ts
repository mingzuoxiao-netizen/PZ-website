
/**
 * Unified asset resolver
 * Used across Home / Product / CMS / Admin
 * 
 * CONSTRAINTS:
 * 1. CDN_BASE is internal and must not be exported.
 * 2. getAssetUrl is the primary rendering API.
 */

const CDN_BASE =
  (import.meta as any).env?.VITE_CDN_BASE ||
  'https://cdn.peng-zhan.com';

export type AssetInput =
  | string
  | null
  | undefined;

/**
 * Resolve any asset reference to a usable URL for Rendering.
 * This is the ONLY allowed way to resolve image URLs in the frontend.
 */
export function getAssetUrl(
  asset: AssetInput,
  options?: {
    fallback?: string;
  }
): string {
  const fallback =
    options?.fallback || '';

  if (!asset) return fallback;

  // Already absolute (http / https / data)
  if (
    asset.startsWith('http://') ||
    asset.startsWith('https://') ||
    asset.startsWith('data:')
  ) {
    return asset;
  }

  // Normalize path
  const normalized = asset.replace(/^\/+/, '');

  return `${CDN_BASE}/${normalized}`;
}

/**
 * UTILITY: Extract storage key from a full CDN URL.
 * Strictly used for Admin/CMS deletion logic.
 * Do NOT use for rendering.
 */
export function extractKeyFromUrl(url: string): string | null {
  if (!url) return null;
  
  if (url.startsWith(CDN_BASE)) {
    return url.replace(CDN_BASE, '').replace(/^\/+/, '');
  }
  
  // If it's already a relative key (fallback scenario), return it cleaned
  if (!url.startsWith('http')) {
    return url.replace(/^\/+/, '');
  }

  return null;
}
