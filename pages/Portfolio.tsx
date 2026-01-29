import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { X, AlertCircle, FileText, ArrowRight, ChevronLeft, Layers, Hash, LayoutGrid } from 'lucide-react';
import { usePublishedSiteConfig } from '../contexts/SiteConfigContext';
import { ProductVariant } from '../types';
import { categories as staticCategories } from '../data/inventory';
import { normalizeProducts } from '../utils/normalizeProduct';
import { API_BASE } from '../utils/siteConfig';
import { resolveImage } from '../utils/imageResolver';
import { adminFetch } from '../utils/adminFetch';
import { extractSubCategories, extractProductsArray, filterRegistry } from '../utils/extractProducts';
import { ProductCardSkeleton } from '../components/common/Skeleton';

const Portfolio: React.FC = () => {
  const { config, mode } = usePublishedSiteConfig();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeSubCategory, setActiveSubCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<ProductVariant | null>(null);
  const [products, setProducts] = useState<ProductVariant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPortfolio = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let rawData: any[] = [];
        if (mode === 'preview') {
            const res = await adminFetch('admin/products?limit=1000');
            rawData = extractProductsArray(res);
        } else {
            const response = await fetch(`${API_BASE}/products`);
            if (!response.ok) throw new Error(`Registry synchronization failed (HTTP ${response.status})`);
            const json = await response.json();
            rawData = extractProductsArray(json);
        }
        
        let loadedProducts = normalizeProducts(rawData);
        
        // Safety Protocol: Only show items that meet 'Published' and 'Asset' criteria
        if (mode === 'public') {
            loadedProducts = filterRegistry(loadedProducts, { onlyPublished: true });
        }
        
        setProducts(loadedProducts);
      } catch (e: any) {
        setError(e.message || "Unable to synchronize product registry.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPortfolio();
  }, [mode]);

  const availableCategories = useMemo(() => {
    const productCategoryStrs = new Set(products.map(p => (p.category || '').toLowerCase().trim()));
    const sourceCategories = (config?.categories && config.categories.length > 0) ? config.categories : staticCategories;
    
    return sourceCategories.filter(cat => {
        const catId = cat.id.toLowerCase().trim();
        const catTitle = cat.title.toLowerCase().trim();
        return productCategoryStrs.has(catId) || productCategoryStrs.has(catTitle);
    });
  }, [products, config]);

  const subCategories = useMemo(() => {
    if (activeCategory === 'all') return [];
    return extractSubCategories(products, activeCategory);
  }, [activeCategory, products]);

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

  const filteredProducts = useMemo(() => {
    return filterRegistry(products, {
        category: activeCategory,
        sub: activeSubCategory
    });
  }, [activeCategory, activeSubCategory, products]);

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

  const handleBackToOverview = () => {
      setActiveCategory('all');
      setActiveSubCategory('all');
      setSearchParams({}, { replace: true });
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeCategoryDef = availableCategories.find(c => c.id.toLowerCase() === activeCategory.toLowerCase());
  const heroPoster = resolveImage(config?.portfolio?.hero_poster);

  return (
    <div className="bg-white min-h-screen pt-32 pb-20 selection:bg-safety-700 selection:text-white">
      {/* Product Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/90 backdrop-blur-md p-4 animate-fade-in" onClick={() => setSelectedProduct(null)}>
           <div className="bg-white w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-sm shadow-2xl flex flex-col lg:flex-row" onClick={e => e.stopPropagation()}>
              <div className="w-full lg:w-3/5 bg-stone-100 relative min-h-[400px]">
                 <img 
                    src={resolveImage(selectedProduct.images[0])} 
                    alt={selectedProduct.name} 
                    className="w-full h-full object-cover absolute inset-0" 
                 />
                 <button onClick={() => setSelectedProduct(null)} className="absolute top-4 left-4 lg:hidden bg-white/80 p-2 rounded-full text-stone-900 shadow-xl"><X size={20} /></button>
              </div>
              <div className="w-full lg:w-2/5 p-8 lg:p-16 flex flex-col justify-center">
                <button onClick={() => setSelectedProduct(null)} className="hidden lg:block absolute top-8 right-8 text-stone-400 hover:text-stone-900 transition-colors"><X size={32} /></button>
                <div className="mb-8">
                    <span className="text-[10px] font-mono font-bold text-safety-700 uppercase tracking-[0.3em] mb-4 block">Archive Ref. {selectedProduct.code || 'UNKNOWN'}</span>
                    <h2 className="font-serif text-4xl text-stone-900 mb-6 leading-tight">{selectedProduct.name}</h2>
                    <div className="w-16 h-1 bg-safety-700 mb-10"></div>
                </div>
                
                <p className="text-stone-600 mb-10 leading-relaxed font-light text-lg">
                    {selectedProduct.description || "A precision-engineered piece combining structural integrity with natural material excellence for professional environments."}
                </p>

                <div className="grid grid-cols-1 gap-8 mb-12">
                    <div className="border-l-2 border-stone-100 pl-6 font-mono">
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Technical Dimensions</span>
                        <span className="text-stone-800 text-sm">{selectedProduct.size || "Custom SKU Available"}</span>
                    </div>
                    <div className="border-l-2 border-stone-100 pl-6 font-mono">
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Primary Materials</span>
                        <span className="text-stone-800 text-sm">{selectedProduct.material || "Industrial Grade Raw Wood"}</span>
                    </div>
                </div>

                <Link to="/inquire" className="bg-stone-900 text-white px-10 py-5 text-xs font-bold uppercase tracking-[0.2em] hover:bg-safety-700 transition-all text-center shadow-lg group flex items-center justify-center">
                    Initiate Project Request <ArrowRight size={16} className="ml-3 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
           </div>
        </div>
      )}

      <div className="container mx-auto px-6 md:px-12">
        {/* Navigation Header */}
        <div className="mb-16 border-b border-stone-100 pb-12">
            {activeCategory !== 'all' ? (
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="animate-fade-in-up">
                        <button onClick={handleBackToOverview} className="group flex items-center text-stone-400 hover:text-stone-900 text-[10px] font-bold uppercase tracking-[0.3em] mb-6 transition-colors font-mono">
                            <ChevronLeft size={14} className="mr-2 group-hover:-translate-x-1 transition-transform"/> Return to Portfolio
                        </button>
                        <h1 className="font-serif text-5xl md:text-7xl text-stone-900 leading-tight mb-4 tracking-tighter">
                            {activeCategoryDef?.title}
                        </h1>
                        <p className="text-stone-400 font-mono text-xs uppercase tracking-[0.2em]">
                            {isLoading ? '...' : filteredProducts.length} Items Indexed // {activeSubCategory === 'all' ? 'Master Collection' : activeSubCategory}
                        </p>
                    </div>
                    {config?.catalog?.url && (
                        <a href={resolveImage(config.catalog.url)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 bg-stone-50 border border-stone-200 hover:border-safety-700 px-8 py-5 transition-all group shadow-sm">
                            <FileText size={20} className="text-stone-400 group-hover:text-safety-700 transition-colors" />
                            <span className="text-xs font-bold uppercase tracking-[0.2em] text-stone-900">Technical Catalog (PDF)</span>
                        </a>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="max-w-2xl">
                        <h3 className="text-safety-700 font-bold tracking-[0.3em] uppercase text-[10px] mb-6 inline-block border-b border-safety-700 pb-1 font-mono">Archive Registry</h3>
                        <h1 className="font-serif text-5xl md:text-8xl text-stone-900 mb-8 tracking-tighter leading-none">Portfolio</h1>
                        <p className="text-stone-500 text-xl md:text-2xl font-light leading-relaxed">
                            A comprehensive archive of precision woodwork solutions engineered for global hospitality and commercial luxury.
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
                                const count = products.filter(p => (p.category || '').toLowerCase().trim() === cat.id.toLowerCase().trim()).length;
                                return (
                                    <div key={cat.id} className="group cursor-pointer flex flex-col" onClick={() => handleCategorySelect(cat.id)}>
                                        <div className="relative aspect-[4/5] bg-stone-100 overflow-hidden mb-8 shadow-inner">
                                            <img src={resolveImage(cat.image)} loading="lazy" alt={cat.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                            <div className="absolute inset-0 bg-stone-950/20 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
                                                <div className="w-16 h-16 bg-white flex items-center justify-center rounded-full scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-500">
                                                    <ArrowRight size={24} className="text-stone-900" />
                                                </div>
                                            </div>
                                            <div className="absolute top-6 left-6">
                                                <span className="bg-stone-900 text-white px-3 py-1 font-mono text-[10px] uppercase tracking-widest">{count} Items</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <h3 className="font-serif text-3xl text-stone-900 mb-2 group-hover:text-safety-700 transition-colors leading-tight">{cat.title}</h3>
                                            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-[0.2em] font-mono">{cat.subtitle}</p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-16 animate-fade-in">
                        <aside className="lg:w-64 flex-shrink-0">
                            <div className="sticky top-32">
                                <h3 className="text-stone-900 font-mono font-bold text-[10px] uppercase tracking-[0.3em] mb-10 pb-4 border-b border-stone-100 flex items-center">
                                    <Layers size={14} className="mr-2 text-safety-700" /> Filter Archive
                                </h3>
                                <div className="space-y-4">
                                    <button 
                                        onClick={() => handleSubCategorySelect('all')}
                                        className={`w-full text-left flex items-center justify-between group transition-all font-mono
                                            ${activeSubCategory === 'all' ? 'text-safety-700 translate-x-2' : 'text-stone-400 hover:text-stone-900'}
                                        `}
                                    >
                                        <span className="text-xs font-bold uppercase tracking-widest">Master Set</span>
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
                                    <p className="font-mono text-[10px] uppercase tracking-widest text-stone-400">Zero entries detected for specified criteria.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-12">
                                    {filteredProducts.map((product, idx) => (
                                        <div key={product.id || idx} className="group cursor-pointer" onClick={() => setSelectedProduct(product)}>
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
                                                <h3 className="font-serif text-xl text-stone-900 group-hover:text-safety-700 transition-colors leading-tight mb-2">{product.name}</h3>
                                                <div className="flex items-center gap-4 font-mono">
                                                    <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">ID / {product.code || (idx + 1).toString().padStart(3, '0')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
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