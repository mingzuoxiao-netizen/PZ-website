

/**
 * Unified asset resolver
 * Used across Home / Product / CMS / Admin
 */

const CDN_BASE =
  (import.meta as any).env?.VITE_CDN_BASE ||
  'https://cdn.peng-zhan.com';

export type AssetInput =
  | string
  | null
  | undefined;

/**
 * Resolve any asset reference to a usable URL
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