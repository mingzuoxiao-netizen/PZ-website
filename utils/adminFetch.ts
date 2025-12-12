
export const ADMIN_API_BASE = "https://pz-inquiry-api.mingzuoxiao29.workers.dev";
export const ADMIN_SESSION_KEY = "pz_admin_token";

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
  skipAuth?: boolean;
}

/**
 * Wrapper around fetch to handle Admin Authentication and Base URL.
 * Automatically injects the token from sessionStorage.
 */
export async function adminFetch<T = any>(
  endpoint: string, 
  { params, skipAuth = false, ...customConfig }: FetchOptions = {}
): Promise<T> {
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(customConfig.headers || {}),
  };

  // Inject Admin Token if available and not skipped
  if (!skipAuth) {
    const token = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (token) {
      // Standard Bearer scheme
      (headers as any)['Authorization'] = `Bearer ${token}`;
      // Custom header if needed by specific backend logic
      (headers as any)['X-Admin-Token'] = token;
    }
  }

  // Handle FormData: Remove 'Content-Type' to let the browser set the boundary
  if (customConfig.body instanceof FormData) {
    // @ts-ignore
    delete headers['Content-Type'];
  }

  const config: RequestInit = {
    method: 'GET', // Default method
    ...customConfig,
    headers,
  };

  // Construct Full URL
  let url = endpoint.startsWith('http') 
    ? endpoint 
    : `${ADMIN_API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  // Append Query Parameters
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `${url.includes('?') ? '&' : '?'}${searchParams.toString()}`;
  }

  try {
    const response = await fetch(url, config);

    // Handle Auth Errors (401/403)
    if (response.status === 401 || response.status === 403) {
      console.warn('Unauthorized access. Admin session may be invalid or expired.');
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP Error ${response.status}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return {} as T;
    }

    // Parse JSON if content-type matches
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    // Fallback to text
    return (await response.text()) as unknown as T;

  } catch (error) {
    console.error(`[adminFetch] Request failed for ${url}:`, error);
    throw error;
  }
}
