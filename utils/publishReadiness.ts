import type { ProductVariant } from '../types';
import { dimensionFieldsForCategory, readProductSpecifications } from './productSpecifications';

// Keep this list in sync with the mirrored Worker patch validation.
export type PublishReadinessField =
  'name' | 'code' | 'category' | 'images' | 'material' | 'description' | 'dimensions';

export function publishReadinessIssues(
  product: Partial<ProductVariant>,
  categoryLabel = String(product.category || '')
): PublishReadinessField[] {
  const issues: PublishReadinessField[] = [];
  const name = String(product.name || '').trim();
  if (!name || /^[0-9\s.,+-]+$/.test(name) ||
      /\b(?:test|demo|sample)\b|测试/i.test(name)) issues.push('name');
  const code = String(product.code || '').trim().toUpperCase();
  if (!/^PZ-[A-Z0-9][A-Z0-9_-]{1,39}$/.test(code)) issues.push('code');
  if (!String(product.category || '').trim()) issues.push('category');
  if (!Array.isArray(product.images) ||
      !product.images.some(image => typeof image === 'string' && !!image.trim()))
    issues.push('images');
  if (!String(product.material || '').trim()) issues.push('material');
  if (!String(product.description || '').trim()) issues.push('description');

  const dimensions = readProductSpecifications(product.specifications).dimensions_cm;
  if (dimensionFieldsForCategory(categoryLabel).some(({ key }) => {
    const value = dimensions?.[key];
    return typeof value !== 'number' || !Number.isFinite(value) || value <= 0;
  })) issues.push('dimensions');
  return issues;
}

export const publishReadinessLabels: Record<PublishReadinessField, { en: string; zh: string }> = {
  name: { en: 'valid English name (not a number or placeholder)', zh: '有效英文名称（不能是纯数字或测试占位词）' },
  code: { en: 'valid SKU', zh: '有效 SKU 编号' },
  category: { en: 'product category', zh: '产品分类' },
  images: { en: 'at least one product image', zh: '至少一张产品图片' },
  material: { en: 'primary material', zh: '主要材料' },
  description: { en: 'English description', zh: '英文产品描述' },
  dimensions: { en: 'complete positive dimensions (cm)', zh: '完整且大于零的产品尺寸（厘米）' }
};
