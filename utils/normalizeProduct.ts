import { ProductVariant } from '../types';
import { isPublishedProduct } from './extractProducts';

/**
 * SINGLE SOURCE OF TRUTH FOR PRODUCT DATA NORMALIZATION.
 * Maps any backend status variation to the canonical frontend enum:
 * - published
 * - awaiting_review
 * - draft
 * - rejected
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
    images = input.images.filter((url: any) => typeof url === 'string' && url.trim().length > 0);
  } else if (typeof input.image === 'string' && input.image.trim().length > 0) {
    images = [input.image];
  }

  // 2. Normalize Status (Standardize into 4 canonical states)
  let status = 'draft';
  const rawStatus = String(input.status || '').toLowerCase().trim();
  const isPublishedVal = String(input.is_published);
  
  if (isPublishedVal === '1' || isPublishedVal === 'true' || input.is_published === true || ['published', 'public', 'live'].includes(rawStatus)) {
      status = 'published';
  } 
  else if (['awaiting_review', 'pending', 'review', 'submitted'].includes(rawStatus)) {
      status = 'awaiting_review';
  } 
  else if (['rejected', 'declined'].includes(rawStatus)) {
      status = 'rejected';
  } 
  else {
      status = 'draft';
  }

  const normalized = {
    ...input,
    id: input.id?.toString() || '',
    name: input.name || 'Untitled Product',
    images: images, 
    image: images[0] || '', 
    category: (input.category || input.categoryId || '').toString().toLowerCase().trim(),
    sub_category: input.sub_category || input.subCategoryName || '',
    name_cn: input.name_cn || input.name_zh || '',
    description: input.description || '',
    description_cn: input.description_cn || input.description_zh || '',
    size: input.size || input.dimensions || '',
    material: input.material || '',
    code: input.code || '',
    status: status,
    colors: Array.isArray(input.colors) ? input.colors : []
  } as ProductVariant & { __invalid?: boolean };

  // Apply Protocol Validation Flag
  normalized.__invalid = !isPublishedProduct(normalized);

  return normalized;
}

export function normalizeProducts(list: any[] | undefined | null): ProductVariant[] {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeProduct);
}