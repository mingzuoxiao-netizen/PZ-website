
/**
 * Unified asset resolver - PASS-THROUGH ONLY (v2.0)
 * Per requirements: Frontend does NOT resolve or prefix URLs.
 */

export type AssetInput = string | null | undefined;

/**
 * Directly returns the URL provided by the Snapshot.
 * Snapshot URLs are absolute and finalized by the backend.
 */
export function getAssetUrl(asset: AssetInput): string {
  if (!asset) return '';
  return asset;
}

/**
 * Utility for Admin logic only.
 */
export function extractKeyFromUrl(url: string): string | null {
  if (!url) return null;
  // Handle absolute URL to get the key part for deletion
  try {
    const parsed = new URL(url);
    return parsed.pathname.replace(/^\/+/, '').replace(/^uploads\//, '');
  } catch (e) {
    return url.replace(/^\/+/, '').replace(/^uploads\//, '');
  }
}
