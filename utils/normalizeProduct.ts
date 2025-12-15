
import { ProductVariant } from '../types';

/**
 * SINGLE SOURCE OF TRUTH FOR PRODUCT DATA NORMALIZATION.
 * 
 * Rules:
 * 1. 'images' is strictly an array of strings.
 * 2. 'image' is populated ONLY for legacy backend compatibility.
 * 3. UI must NEVER read 'image'. UI must read 'images[0]'.
 * 4. This function MUST be called immediately upon data ingress (API, LocalStorage, Static).
 */
export function normalizeProduct(input: any): ProductVariant {
  if (!input || typeof input !== 'object') {
    return {
      id: '',
      name: 'Unknown Product',
      image: '',
      images: [],
    } as ProductVariant;
  }

  // 1. Normalize Images (Strict Array)
  let images: string[] = [];

  if (Array.isArray(input.images) && input.images.length > 0) {
    // Primary Source: Array
    images = input.images.filter((url: any) => typeof url === 'string' && url.trim().length > 0);
  } else if (typeof input.image === 'string' && input.image.trim().length > 0) {
    // Fallback Source: Single String (Legacy)
    images = [input.image];
  }

  // 2. Normalize Status
  // Backend statuses: draft, pending, published, rejected, archived
  let status = 'draft';
  if (input.status) {
      const s = input.status.toLowerCase();
      // Map legacy/frontend-only terms to backend terms if necessary
      if (s === 'pending_review') {
          status = 'pending';
      } else if (s === 'pub') {
          status = 'published';
      } else if (['published', 'draft', 'archived', 'pending', 'rejected'].includes(s)) {
          status = s;
      }
  }

  return {
    ...input,
    id: input.id || '',
    name: input.name || 'Untitled Product',
    
    // IMAGE NORMALIZATION
    // Source of Truth for UI:
    images: images, 
    // Legacy Backup (Write-only for backend):
    image: images[0] || '',

    // FIELD NORMALIZATION (Handle schema evolution)
    category: (input.category || input.categoryId || '').toLowerCase(), // Normalize ID
    sub_category: input.sub_category || input.subCategoryName || '',
    
    name_cn: input.name_cn || input.name_zh || '',
    description: input.description || '',
    description_cn: input.description_cn || input.description_zh || '',
    
    size: input.size || input.dimensions || '',
    material: input.material || '',
    code: input.code || '',
    status: status,
    
    colors: Array.isArray(input.colors) ? input.colors : []
  };
}

export function normalizeProducts(list: any[] | undefined | null): ProductVariant[] {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeProduct);
}
