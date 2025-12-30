const CDN_BASE = 'https://cdn.peng-zhan.com';

function safeEncodePath(path: string) {
  return path
    .split('/')
    .map(seg => encodeURIComponent(seg))
    .join('/');
}

export function resolveImage(input?: string | null): string {
  if (!input) return '';

  // 1️⃣ Browser-native URLs
  if (
    input.startsWith('http://') ||
    input.startsWith('https://') ||
    input.startsWith('data:') ||
    input.startsWith('blob:')
  ) {
    return input;
  }

  // 2️⃣ Normalize legacy / dirty paths
  const clean = input
    .replace(/^\/+/, '')
    .replace(/^uploads\//, '');

  // 3️⃣ Always resolve to CDN uploads
  return `${CDN_BASE}/uploads/${safeEncodePath(clean)}`;
}

/**
 * Extract storage key from full URL (used for delete)
 */
export function extractKeyFromUrl(url?: string | null): string | null {
  if (!url) return null;

  if (url.startsWith(CDN_BASE)) {
    return url
      .replace(CDN_BASE, '')
      .replace(/^\/+/, '')
      .replace(/^uploads\//, '');
  }

  if (url.startsWith('http')) {
    return url.replace(/^https?:\/\/[^/]+\//, '').replace(/^uploads\//, '');
  }

  return null;
}
