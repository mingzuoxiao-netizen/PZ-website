import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { X, AlertCircle, FileText, ArrowRight, ChevronLeft, Layers, Hash, LayoutGrid } from 'lucide-react';
import { usePublishedSiteConfig } from '../contexts/SiteConfigContext';
import { ProductVariant } from '../types';
import { categories as staticCategories } from '../data/inventory';
import { normalizeProducts } from '../utils/normalizeProduct';
import { API_BASE } from '../utils/siteConfig';
import { resolveImage } from '../utils/imageResolver';
import { publishedSiteCategories } from '../utils/catalogCategories';
import { useLanguage } from '../contexts/LanguageContext';
import { adminFetch } from '../utils/adminFetch';
import { extractSubCategories, extractProductsArray, isPublishedProduct } from '../utils/extractProducts';
import { ProductCardSkeleton } from '../components/common/Skeleton';
import { fetchPublicCatalogPage, fetchPublicCatalogFacets, fetchPublicCatalogProduct, CategoryFacet } from '../utils/publicCatalog';
import ProductDetailModal from '../components/catalog/ProductDetailModal';

const Portfolio: React.FC = () => {
  const { language } = useLanguage();
  const T = (en: string, zh: string) => language === 'zh' ? zh : en;
  const { config, mode } = usePublishedSiteConfig();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeSubCategory, setActiveSubCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<ProductVariant | null>(null);
  const [products, setProducts] = useState<ProductVariant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [facets, setFacets] = useState<CategoryFacet[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const listRequestId = useRef(0);

  useEffect(() => {
    if (mode !== 'public') return;
    const controller = new AbortController();
    fetchPublicCatalogFacets(controller.signal)
      .then(data => { if (!controller.signal.aborted) setFacets(data); })
      .catch(err => { if (!controller.signal.aborted) console.warn('Catalog facets failed', err); });
    return () => controller.abort();
  }, [mode]);

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++listRequestId.current;
    setIsLoading(true);
    setError(null);
    setProducts([]);
    setNextCursor(null);
    const load = async () => {
      try {
        if (mode === 'public') {
          if (activeCategory === 'all') return;
          const page = await fetchPublicCatalogPage({
            category: activeCategory, sub: activeSubCategory, limit: 24,
            signal: controller.signal
          });
          if (controller.signal.aborted || requestId !== listRequestId.current) return;
          setProducts(page.items);
          setNextCursor(page.nextCursor);
        } else {
          const res = await adminFetch('admin/products?limit=1000');
          if (controller.signal.aborted || requestId !== listRequestId.current) return;
          setProducts(normalizeProducts(extractProductsArray(res)));
        }
      } catch (e: any) {
        if (!controller.signal.aborted && requestId === listRequestId.current)
          setError(e.message || 'Product catalog unavailable.');
      } finally {
        if (!controller.signal.aborted && requestId === listRequestId.current) setIsLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [mode, activeCategory, activeSubCategory]);

  const loadMore = async () => {
    if (mode !== 'public' || !nextCursor || loadingMore) return;
    const requestId = listRequestId.current;
    setLoadingMore(true);
    try {
      const page = await fetchPublicCatalogPage({
        category: activeCategory, sub: activeSubCategory,
        limit: 24, cursor: nextCursor
      });
      if (requestId !== listRequestId.current) return;
      setProducts(previous => {
        const existing = new Set(previous.map(p => p.id));
        return [...previous, ...page.items.filter(p => !existing.has(p.id))];
      });
      setNextCursor(page.nextCursor);
    } catch (e: any) {
      if (requestId === listRequestId.current) setError(e.message || 'Additional products failed to load.');
    } finally {
      setLoadingMore(false);
    }
  };

  const availableCategories = useMemo(() => {
    const productCategoryStrs = mode === 'public'
      ? new Set(facets.filter(f => f.count > 0).map(f => f.id))
      : new Set(products.map(p => (p.category || '').toLowerCase().trim()));
    const sourceCategories = publishedSiteCategories(config?.categories);
    
    if (mode === 'public') return sourceCategories;
    return sourceCategories.filter(cat => {
        const catId = cat.id.toLowerCase().trim();
        const catTitle = cat.title.toLowerCase().trim();
        return productCategoryStrs.has(catId) || productCategoryStrs.has(catTitle);
    });
  }, [products, config, facets, mode]);

  const subCategories = useMemo(() => {
    if (activeCategory === 'all') return [];
    if (mode === 'public') {
      return (facets.find(f => f.id === activeCategory.toLowerCase())?.subCategories || [])
        .map(s => s.name);
    }
    return extractSubCategories(products, activeCategory);
  }, [activeCategory, products, facets, mode]);

  useEffect(() => {
    const cat = searchParams.get('category');
    setActiveCategory(cat || 'all');
    
    const sub = searchParams.get('sub');
    setActiveSubCategory(sub || 'all');
    
    const prodId = searchParams.get('product');
    if (prodId && products.length > 0) {
      const found = products.find(p => p.id === prodId || p.code === prodId);
      if (found) setSelectedProduct(found);
    }
  }, [searchParams, products]);

  useEffect(() => {
    if (mode !== 'public') return;
    const id = searchParams.get('product');
    if (!id || products.some(p => p.id === id || p.code === id)) return;
    const controller = new AbortController();
    fetchPublicCatalogProduct(id, controller.signal)
      .then(p => { if (!controller.signal.aborted && p) setSelectedProduct(p); })
      .catch(err => { if (!controller.signal.aborted) console.warn('Product detail unavailable', err); });
    return () => controller.abort();
  }, [mode, searchParams, products]);

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all' || mode === 'public') return products;
    const cat = activeCategory.toLowerCase().trim();
    let items = products.filter(p => (p.category || '').toLowerCase().trim() === cat);

    if (activeSubCategory !== 'all') {
        const sub = activeSubCategory.toLowerCase().trim();
        items = items.filter(p => (p.sub_category || '').toLowerCase().trim() === sub);
    }
    return items;
  }, [activeCategory, activeSubCategory, products, mode]);

  const handleCategorySelect = (catId: string) => {
      setActiveCategory(catId);
      setActiveSubCategory('all');
      setSearchParams({ category: catId }, { replace: true });
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubCategorySelect = (subName: string) => {
      setActiveSubCategory(subName);
      setSearchParams({ category: activeCategory, sub: subName }, { replace: true });
  };

  const closeProduct = () => {
    setSelectedProduct(null);
    if (searchParams.has('product')) {
      const next = new URLSearchParams(searchParams);
      next.delete('product');
      setSearchParams(next, { replace: true });
    }
  };

  const openProduct = (product: ProductVariant) => {
    setSelectedProduct(product);
    if (mode === 'public' && (product.id || product.code)) {
      const next = new URLSearchParams(searchParams);
      next.set('product', String(product.id || product.code));
      setSearchParams(next, { replace: true });
    }
  };

  const handleBackToOverview = () => {
      setActiveCategory('all');
      setActiveSubCategory('all');
      setSearchParams({}, { replace: true });
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeCategoryDef = availableCategories.find(c => c.id.toLowerCase() === activeCategory.toLowerCase());
  const activeFacet = facets.find(f => f.id === activeCategory.toLowerCase());
  const displayedCount = mode === 'public'
    ? (activeSubCategory === 'all' ? (activeFacet?.count || 0)
      : (activeFacet?.subCategories.find(s => s.name.toLowerCase() === activeSubCategory.toLowerCase())?.count || 0))
    : filteredProducts.length;
  const heroPoster = resolveImage(config?.portfolio?.hero_poster);

  return (
    <div className="bg-white min-h-screen pt-32 pb-20 selection:bg-safety-700 selection:text-white">
      {selectedProduct && (
        <ProductDetailModal product={selectedProduct} language={language} onClose={closeProduct} />
      )}

      <div className="container mx-auto px-6 md:px-12">
        {/* Navigation Header */}
        <div className="mb-16 border-b border-stone-100 pb-12">
            {activeCategory !== 'all' ? (
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="animate-fade-in-up">
                        <button onClick={handleBackToOverview} className="group flex items-center text-stone-400 hover:text-stone-900 text-[10px] font-bold uppercase tracking-[0.3em] mb-6 transition-colors font-mono">
                            <ChevronLeft size={14} className="mr-2 group-hover:-translate-x-1 transition-transform"/ >{T('Return to Portfolio','返回产品分类')}
                        </button>
                        <h1 className="font-serif text-5xl md:text-7xl text-stone-900 leading-tight mb-4 tracking-tighter">
                            {language === 'zh' ? (activeCategoryDef?.title_zh || activeCategoryDef?.title) : activeCategoryDef?.title}
                        </h1>
                        <p className="text-stone-400 font-mono text-xs uppercase tracking-[0.2em]">
                            {isLoading ? '...' : displayedCount} {T('Items Indexed','件产品')} // {activeSubCategory === 'all' ? 'Master Collection' : activeSubCategory}
                        </p>
                    </div>
                    {config?.catalog?.url && (
                        <a href={resolveImage(config.catalog.url)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 bg-stone-50 border border-stone-200 hover:border-safety-700 px-8 py-5 transition-all group shadow-sm">
                            <FileText size={20} className="text-stone-400 group-hover:text-safety-700 transition-colors" />
                            <span className="text-xs font-bold uppercase tracking-[0.2em] text-stone-900">{T("Technical Catalog (PDF)","下载产品目录")}</span>
                        </a>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="max-w-2xl">
                        <h3 className="text-safety-700 font-bold tracking-[0.3em] uppercase text-[10px] mb-6 inline-block border-b border-safety-700 pb-1 font-mono">{T("Archive Registry","产品系列")}</h3>
                        <h1 className="font-serif text-5xl md:text-8xl text-stone-900 mb-8 tracking-tighter leading-none">{T("Portfolio","产品中心")}</h1>
                        <p className="text-stone-500 text-xl md:text-2xl font-light leading-relaxed">
                            {T('Explore solid wood components and furniture manufactured for brands, importers and commercial buyers. Browse our collections to see available products and specifications.','探索面向家具品牌、进口商和商业采购客户的实木组件与家具系列，按分类查看产品及规格。')}
                        </p>
                    </div>
                    {heroPoster && (
                        <div className="hidden lg:block relative aspect-[16/9] bg-stone-100 overflow-hidden shadow-2xl rounded-sm">
                            <img src={heroPoster} className="w-full h-full object-cover opacity-90" alt="Portfolio Feature" />
                            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/20 to-transparent"></div>
                        </div>
                    )}
                </div>
            )}
        </div>

        {error ? (
            <div className="flex flex-col items-center justify-center py-40 text-stone-400 border border-dashed border-stone-100">
                <AlertCircle className="mb-4 text-safety-700" size={48} />
                <p className="font-mono text-sm uppercase tracking-widest">{error}</p>
            </div>
        ) : (
            <>
                {activeCategory === 'all' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12 animate-fade-in">
                        {isLoading ? (
                            Array.from({ length: 6 }).map((_, idx) => <ProductCardSkeleton key={idx} />)
                        ) : (
                            availableCategories.map((cat) => {
                                const count = mode === 'public'
                                  ? (facets.find(f => f.id === cat.id.toLowerCase())?.count || 0)
                                  : products.filter(p => (p.category || '').toLowerCase().trim() === cat.id.toLowerCase().trim()).length;
                                return (
                                    <button type="button" key={cat.id} className="group cursor-pointer flex flex-col text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#754831]" onClick={() => handleCategorySelect(cat.id)} aria-label={T('View collection: ', '查看产品分类：') + (language === 'zh' ? (cat.title_zh || cat.title) : cat.title)}>
                                        <div className="relative aspect-[4/5] bg-stone-100 overflow-hidden mb-8 shadow-inner">
                                            <img src={resolveImage(cat.image)} loading="lazy" alt={language === 'zh' ? (cat.title_zh || cat.title) : cat.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                            <div className="absolute inset-0 bg-stone-950/20 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
                                                <div className="w-16 h-16 bg-white flex items-center justify-center rounded-full scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-500">
                                                    <ArrowRight size={24} className="text-stone-900" />
                                                </div>
                                            </div>
                                            <div className="absolute top-6 left-6">
                                                <span className="bg-stone-900 text-white px-3 py-1 font-mono text-[10px] uppercase tracking-widest">{count} {T('Items','件产品')}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <h3 className="font-serif text-3xl text-stone-900 mb-2 group-hover:text-safety-700 transition-colors leading-tight">{language === 'zh' ? (cat.title_zh || cat.title) : cat.title}</h3>
                                            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-[0.2em] font-mono">{cat.subtitle}</p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-16 animate-fade-in">
                        <aside className="lg:w-64 flex-shrink-0">
                            <div className="sticky top-32">
                                <h3 className="text-stone-900 font-mono font-bold text-[10px] uppercase tracking-[0.3em] mb-10 pb-4 border-b border-stone-100 flex items-center">
                                    <Layers size={14} className="mr-2 text-safety-700" /> {T('Filter by Series','按系列筛选')}
                                </h3>
                                <div className="space-y-4">
                                    <button 
                                        onClick={() => handleSubCategorySelect('all')}
                                        className={`w-full text-left flex items-center justify-between group transition-all font-mono
                                            ${activeSubCategory === 'all' ? 'text-safety-700 translate-x-2' : 'text-stone-400 hover:text-stone-900'}
                                        `}
                                    >
                                        <span className="text-xs font-bold uppercase tracking-widest">{T("Master Set","全部产品")}</span>
                                        <Hash size={12} className={activeSubCategory === 'all' ? 'opacity-100' : 'opacity-0'} />
                                    </button>
                                    {subCategories.map(sub => (
                                        <button 
                                            key={sub}
                                            onClick={() => handleSubCategorySelect(sub)}
                                            className={`w-full text-left flex items-center justify-between group transition-all font-mono
                                                ${activeSubCategory === sub ? 'text-safety-700 translate-x-2' : 'text-stone-400 hover:text-stone-900'}
                                            `}
                                        >
                                            <span className="text-xs font-bold uppercase tracking-widest">{sub}</span>
                                            <Hash size={12} className={activeSubCategory === sub ? 'opacity-100' : 'opacity-0'} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </aside>
                        <div className="flex-grow">
                            {isLoading ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-12">
                                    {Array.from({ length: 6 }).map((_, idx) => <ProductCardSkeleton key={idx} />)}
                                </div>
                            ) : filteredProducts.length === 0 ? (
                                <div className="py-40 text-center bg-stone-50 border border-dashed border-stone-200 flex flex-col items-center">
                                    <LayoutGrid size={48} className="text-stone-200 mb-6" />
                                    <p className="font-mono text-[10px] uppercase tracking-widest text-stone-400">{T("Zero entries detected for specified criteria.","当前筛选条件下暂无已发布的产品。")}</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-12">
                                    {filteredProducts.map((product, idx) => (
                                        <button type="button" key={product.id || idx} className="group w-full cursor-pointer text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#754831]" onClick={() => openProduct(product)} aria-label={T('View details: ','查看详情：') + (language === 'zh' ? (product.name_cn || product.name) : product.name)}>
                                            <div className="aspect-square w-full bg-stone-100 relative overflow-hidden mb-6 shadow-sm transition-all duration-500 group-hover:shadow-xl">
                                                <img 
                                                    src={resolveImage(product.images[0])} 
                                                    loading="lazy"
                                                    alt={product.name} 
                                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                                                />
                                                {product.sub_category && (
                                                    <div className="absolute bottom-4 left-4">
                                                        <span className="bg-white/90 backdrop-blur-md text-stone-900 px-3 py-1 text-[9px] font-mono font-bold uppercase tracking-[0.2em]">{product.sub_category}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <h3 className="font-serif text-xl text-stone-900 group-hover:text-safety-700 transition-colors leading-tight mb-2">{language === 'zh' ? (product.name_cn || product.name) : product.name}</h3>
                                                <div className="flex items-center gap-4 font-mono">
                                                    <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">ID / {product.code || (idx + 1).toString().padStart(3, '0')}</span>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {mode === 'public' && nextCursor && !isLoading && (
                              <div className="mt-16 text-center">
                                <button onClick={loadMore} disabled={loadingMore}
                                  className="bg-stone-900 text-white px-12 py-4 text-xs font-bold uppercase tracking-widest disabled:opacity-50">
                                  {loadingMore ? T('Loading...','正在加载…') : T('Load More Products','加载更多产品')}
                                </button>
                              </div>
                            )}
                        </div>
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
};

export default Portfolio;