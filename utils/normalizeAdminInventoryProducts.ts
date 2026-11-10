import type {ProductVariant} from '../types';
import {normalizeProducts} from './normalizeProduct';

/**
 * Admin product inventory must use the D1 products.status field. Historical
 * is_published may be true even when the current workflow is not published;
 * allowing it to override status exposes an invalid "下架" operation.
 */
export const normalizeAdminInventoryProducts=(rows:ProductVariant[]):ProductVariant[]=>
  normalizeProducts(rows).map((item,index)=>({
    ...item,
    status:String(rows[index]?.status||'draft').trim().toLowerCase() as ProductVariant['status']
  }));
