
/**
 * Unified image resolver for Peng-Zhan Platform.
 * 
 * NOTE: As of v2.0, the Backend returns full absolute URLs.
 * This utility now acts as a safety pass-through.
 */
export function resolveImage(input?: string | null): string {
  if (!input) return '';
  
  // Return the URL directly as provided by the API Snapshot
  return input;
}

/**
 * Extract storage key from a full CDN URL (used for delete logic in Admin tools)
 */
export function extractKeyFromUrl(url?: string | null): string | null {
  if (!url) return null;
  const CDN_BASE = 'https://cdn.peng-zhan.com';

  if (url.startsWith(CDN_BASE)) {
    return url
      .replace(CDN_BASE, '')
      .replace(/^\/+/, '')
      .replace(/^uploads\//, '');
  }

  if (url.startsWith('http')) {
    return url.replace(/^https?:\/\/[^/]+\//, '').replace(/^uploads\//, '');
  }

  return url.replace(/^\/+/, '').replace(/^uploads\//, '');
}
