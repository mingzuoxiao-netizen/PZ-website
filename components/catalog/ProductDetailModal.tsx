import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, X } from 'lucide-react';
import type { ProductVariant } from '../../types';
import ProductGallery from './ProductGallery';

interface ProductDetailModalProps {
  product: ProductVariant;
  language: 'en' | 'zh';
  onClose: () => void;
}

/** Public product details use only the existing approved catalog data. */
const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, language, onClose }) => {
  const closeRef = useRef<HTMLButtonElement>(null);
  const L = (en: string, zh: string) => language === 'zh' ? zh : en;
  const title = language === 'zh' ? (product.name_cn || product.name) : product.name;

  useEffect(() => {
    const priorFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      priorFocus?.focus();
    };
  }, [onClose]);

  const detailFields = [
    [L('Material', '材质'), product.material],
    [L('Dimensions', '尺寸'), product.size],
    [L('Finish', '表面处理'), product.finish],
    [L('Series', '产品系列'), product.sub_category || product.category]
  ].filter(([, value]) => typeof value === 'string' && value.trim());

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1b120e]/85 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={event => { if (event.currentTarget === event.target) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pz-product-detail-title"
        className="relative grid w-full max-w-6xl max-h-[92vh] overflow-y-auto bg-[#fdfbf8] shadow-[0_30px_90px_rgba(0,0,0,.35)] lg:max-h-[88vh] lg:grid-cols-[56%_44%]"
      >
        <div className="min-h-[320px] lg:min-h-[570px]">
          <ProductGallery key={product.id || product.code || product.name}
            images={product.images} name={title} language={language}/>
        </div>
        <div className="relative flex flex-col px-6 py-10 sm:px-10 lg:px-12 lg:py-16">
          <button type="button" ref={closeRef} onClick={onClose}
            aria-label={L('Close product details', '关闭产品详情')}
            className="absolute right-5 top-5 rounded-full border border-[#e6dcd2] bg-white p-2.5 text-[#594438] hover:bg-[#f3ebe3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#754831]">
            <X size={20} aria-hidden="true" />
          </button>
          <span className="mb-5 pr-10 font-mono text-[11px] uppercase tracking-[0.14em] text-[#8c644d]">
            {L('Product / SKU', '产品编号')} {product.code || '—'}
          </span>
          <h2 id="pz-product-detail-title"
            className="font-serif text-[clamp(2rem,3.1vw,3.3rem)] leading-[1.14] tracking-[-0.03em] text-[#30221b]">
            {title}
          </h2>
          <div className="mt-5 h-px w-14 bg-[#8d5839]" />
          <p className="mt-7 text-[14px] leading-[1.9] text-[#6d6259]">
            {(language === 'zh' ? (product.description_cn || product.description) : product.description)
              || L('Contact our team for detailed product specifications and available options.', '详细规格及可选方案请联系我们咨询。')}
          </p>
          {detailFields.length > 0 && (
            <dl className="mt-8 grid grid-cols-2 gap-x-5 gap-y-6 border-t border-[#e5dcd3] pt-7 text-sm">
              {detailFields.map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9b8a7c]">{label}</dt>
                  <dd className="break-words leading-relaxed text-[#38291f]">{value}</dd>
                </div>
              ))}
            </dl>
          )}
          {(product.production_sites || []).length > 0 && (
            <div className="mt-7">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9b8a7c]">{L('Manufacturing locations', '生产基地')}</p>
              <p className="mt-2 text-[13px] text-[#38291f]">
                {(product.production_sites || []).map(site => site === 'zhaoqing'
                  ? L('Zhaoqing, China', '中国肇庆')
                  : site === 'cambodia' ? L('Kandal, Cambodia', '柬埔寨干丹') : site).join(' · ')}
              </p>
            </div>
          )}
          <Link to="/inquire" onClick={onClose}
            className="mt-10 inline-flex items-center justify-center gap-3 bg-[#754831] px-6 py-4 text-[12px] font-semibold text-white hover:bg-[#573521] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#754831]">
            {L('Request Product Details', '咨询此产品')} <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <p className="mt-3 text-center text-[11px] text-[#94847a]">
            {L('OEM / ODM and bulk manufacturing inquiries welcome', '欢迎 OEM / ODM 与批量采购咨询')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
