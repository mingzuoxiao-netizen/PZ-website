
import { API_BASE } from './siteConfig';

/**
 * Unified image resolver for Peng-Zhan Platform.
 * 
 * Ensures that all image strings are valid absolute URLs.
 * If a relative path is provided, it prefixes it with the CDN/API base.
 */
export function resolveImage(input?: string | null): string {
  if (!input) return '';
  
  // If it's already an absolute URL (http/https), return it
  if (input.startsWith('http')) {
    return input;
  }

  // If it's a data URL (base64), return it
  if (input.startsWith('data:')) {
    return input;
  }

  // Handle relative paths from the backend (ensuring no double slashes)
  const cleanBase = API_BASE.replace(/\/+$/, '');
  const cleanInput = input.replace(/^\/+/, '');
  
  return `${cleanBase}/${cleanInput}`;
}

/**
 * Extract storage key from a full CDN URL (used for delete logic in Admin tools)
 */
export function extractKeyFromUrl(url?: string | null): string | null {
  if (!url) return null;
  const CDN_BASE = 'https://cdn.peng-zhan.com';

  try {
    const parsed = new URL(url);
    // If it's our managed CDN or API, extract the path
    if (url.includes('peng-zhan.com') || url.includes('workers.dev')) {
        return parsed.pathname.replace(/^\/+/, '').replace(/^uploads\//, '');
    }
    return parsed.pathname.replace(/^\/+/, '');
  } catch (e) {
    // Fallback for non-URL strings
    return url.replace(/^\/+/, '').replace(/^uploads\//, '');
  }
}
