import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { resolveImage } from '../../utils/imageResolver';

interface ProductGalleryProps {
  images?: string[];
  name: string;
  language: 'en' | 'zh';
}

/** Displays approved product image URLs only. Does not invent fallback product photos. */
const ProductGallery: React.FC<ProductGalleryProps> = ({ images = [], name, language }) => {
  const sources = images.filter((image): image is string => typeof image === 'string' && image.trim().length > 0);
  const [active, setActive] = useState(0);
  const index = Math.min(active, Math.max(0, sources.length - 1));
  const L = (en: string, zh: string) => language === 'zh' ? zh : en;

  const move = (delta: number) => {
    setActive(current => (current + delta + sources.length) % sources.length);
  };

  if (!sources.length) {
    return (
      <div className="flex min-h-[300px] items-center justify-center gap-3 bg-[#eee8e2] text-[#8a796a]" role="status">
        <ImageOff size={22} aria-hidden="true" />
        {L('Product images unavailable', '暂无产品图片')}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[#eeeae5]">
      <div
        className="group relative min-h-[300px] flex-1 overflow-hidden bg-[#e9e1d8] sm:min-h-[430px]"
        role="group"
        aria-label={L('Product image gallery', '产品图片画廊')}
        onKeyDown={event => {
          if (event.key === 'ArrowLeft' && sources.length > 1) { event.preventDefault(); move(-1); }
          if (event.key === 'ArrowRight' && sources.length > 1) { event.preventDefault(); move(1); }
        }}
      >
        <img
          src={resolveImage(sources[index])}
          alt={name + ' — ' + L('image', '图片') + ' ' + (index + 1)}
          loading="eager"
          decoding="async"
          className="absolute inset-0 h-full w-full object-contain"
        />
        <span className="absolute left-5 top-5 rounded-sm bg-white/90 px-3 py-2 font-mono text-[10px] tracking-[0.14em] text-[#49362a]">
          {String(index + 1).padStart(2, '0')} / {String(sources.length).padStart(2, '0')}
        </span>
        {sources.length > 1 && (
          <div className="absolute inset-x-4 top-1/2 flex -translate-y-1/2 justify-between pointer-events-none">
            <button type="button" onClick={() => move(-1)}
              aria-label={L('Previous product image', '上一张产品图片')}
              className="pointer-events-auto rounded-full bg-white/90 p-3 text-[#30221b] shadow hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#754831]">
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => move(1)}
              aria-label={L('Next product image', '下一张产品图片')}
              className="pointer-events-auto rounded-full bg-white/90 p-3 text-[#30221b] shadow hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#754831]">
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
      {sources.length > 1 && (
        <div className="flex gap-2 overflow-x-auto border-t border-[#e7dfd6] bg-white p-3" aria-label={L('Choose a product image', '选择产品图片')}>
          {sources.map((source, i) => (
            <button key={source + i} type="button"
              onClick={() => setActive(i)}
              aria-label={L('Show image', '查看图片') + ' ' + (i + 1)}
              aria-pressed={index === i}
              className={'h-16 w-20 shrink-0 overflow-hidden rounded-sm border-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#754831] ' + (index === i ? 'border-[#754831]' : 'border-transparent hover:border-[#cab7a7]')}>
              <img src={resolveImage(source)} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
