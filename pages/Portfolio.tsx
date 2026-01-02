
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { X, Loader2, AlertCircle, Download, FileText, ArrowRight, ChevronLeft, Layers } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { usePublishedSiteConfig } from '../contexts/SiteConfigContext';
import { ProductVariant } from '../types';
import { categories as staticCategories } from '../data/inventory';
import { normalizeProducts } from '../utils/normalizeProduct';
import { API_BASE } from '../utils/siteConfig';

const Portfolio: React.FC = () => {
  const { t } = useLanguage();
  const { config } = usePublishedSiteConfig();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<ProductVariant | null>(null);
  const [products, setProducts] = useState<ProductVariant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPortfolio = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const url = `${API_BASE}/products?limit=1000&_t=${Date.now()}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        
        const json = await response.json();
        let rawData = json.products || json.data || json.results || (Array.isArray(json) ? json : []);
        let loadedProducts = normalizeProducts(rawData).filter(p => 
            p.status && (p.status.toLowerCase() === 'published' || p.status.toLowerCase() === 'pub')
        );
        setProducts(loadedProducts);
      } catch (e: any) {
        setError(`Unable to load products. (${e.message})`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPortfolio();
  }, []);

  const availableCategories = useMemo(() => {
    const validIds = new Set(products.map(p => p.category?.toLowerCase().trim()));
    const sourceCategories = (config?.categories && config.categories.length > 0) ? config.categories : staticCategories;
    return sourceCategories.filter(cat => validIds.has(cat.id.toLowerCase()) || validIds.has(cat.title.toLowerCase()));
  }, [products, config]);

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setActiveCategory(cat);
    const prodId = searchParams.get('product');
    if (prodId && products.length > 0) {
      const found = products.find(p => p.id === prodId || p.name === prodId);
      if (found) setSelectedProduct(found);
    }
  }, [searchParams, products]);

  const getProductsByCategory = (catId: string) => {
      return products.filter(p => {
          const pCat = (p.category || '').toLowerCase().trim();
          const tCat = catId.toLowerCase().trim();
          const activeCategoryDef = availableCategories.find(c => c.id.toLowerCase() === tCat);
          const activeTitle = activeCategoryDef ? activeCategoryDef.title.toLowerCase() : '';
          return pCat === tCat || pCat === activeTitle;
      });
  };

  const getCategoryCover = (catId: string, defaultCover: string) => {
      if (defaultCover && !defaultCover.includes('unsplash')) return defaultCover;
      const catProducts = getProductsByCategory(catId);
      if (catProducts.length > 0 && catProducts[0].images.length > 0) return catProducts[0].images[0];
      return defaultCover;
  };

  const handleCategorySelect = (catId: string) => {
      setActiveCategory(catId);
      setSearchParams({ category: catId }, { replace: true });
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToOverview = () => {
      setActiveCategory('all');
      setSearchParams({}, { replace: true });
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openProduct = (product: ProductVariant) => {
    setSelectedProduct(product);
    const params = new URLSearchParams(searchParams);
    if (product.id) params.set('product', product.id);
    setSearchParams(params, { replace: true });
  };

  const closeProduct = () => {
    setSelectedProduct(null);
    const params = new URLSearchParams(searchParams);
    params.delete('product');
    setSearchParams(params, { replace: true });
  };

  const activeCategoryDef = availableCategories.find(c => c.id === activeCategory);

  return (
    <div className="bg-stone-50 min-h-screen pt-32 pb-20">
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-fade-in" onClick={closeProduct}>
           <div className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-sm shadow-2xl flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
              <div className="w-full md:w-1/2 bg-stone-100 relative min-h-[300px]">
                 <img src={selectedProduct.images[0]} alt={selectedProduct.name} className="w-full h-full object-cover absolute inset-0" />
                 <button onClick={closeProduct} className="absolute top-4 left-4 md:hidden bg-white/50 p-2 rounded-full"><X size={20} /></button>
              </div>
              <div className="w-full md:w-1/2 p-8 md:p-12 relative">
                <button onClick={closeProduct} className="absolute top-8 right-8 hidden md:block text-stone-400 hover:text-stone-900"><X size={24} /></button>
                <h2 className="font-serif text-3xl text-stone-900 mb-6">{selectedProduct.name}</h2>
                <div className="w-12 h-1 bg-safety-700 mb-8"></div>
                <p className="text-stone-600 mb-8 leading-relaxed">{selectedProduct.description || t.collections.pdp.descExtra}</p>
                <div className="grid grid-cols-2 gap-6 text-sm text-stone-600 mb-10">
                    <div><span className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-1">{t.collections.pdp.techDims}</span>{selectedProduct.size || t.collections.pdp.customSizes}</div>
                    <div><span className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-1">{t.collections.pdp.matConst}</span>{selectedProduct.material || "Solid Wood"}</div>
                </div>
                <Link to="/inquire" className="inline-block bg-stone-900 text-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-safety-700 transition-colors">{t.collections.pdp.inquireOrder}</Link>
              </div>
           </div>
        </div>
      )}

      <div className="container mx-auto px-6 md:px-12">
        <div className="mb-12">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-stone-200 pb-8">
                <div>
                    {activeCategory !== 'all' ? (
                        <button onClick={handleBackToOverview} className="group flex items-center text-stone-400 hover:text-stone-900 text-xs font-bold uppercase tracking-widest mb-4 transition-colors">
                            <ChevronLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform"/> {t.collections.collection}
                        </button>
                    ) : ( <h1 className="font-serif text-4xl md:text-5xl text-stone-900 mb-4">Portfolio</h1> )}
                    <h2 className="font-serif text-3xl md:text-5xl text-stone-900 leading-tight">{activeCategory === 'all' ? "Collections Overview" : activeCategoryDef?.title}</h2>
                </div>
                {config?.catalog?.url && (
                    <a href={config.catalog.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white border border-stone-200 hover:border-safety-700 px-5 py-3 shadow-sm group transition-all">
                        <FileText size={18} className="text-stone-400 group-hover:text-safety-700 transition-colors" />
                        <span className="text-xs font-bold uppercase tracking-widest text-stone-600 group-hover:text-stone-900">{t.collections.requestPdf}</span>
                        <Download size={14} className="text-stone-400" />
                    </a>
                )}
            </div>
            {activeCategory === 'all' && ( <p className="text-stone-500 max-w-2xl mt-8 leading-relaxed">{t.collections.intro}</p> )}
        </div>

        {isLoading ? ( <div className="col-span-full flex justify-center py-20 text-stone-400"><Loader2 className="animate-spin mr-2" /> Loading Portfolio...</div>
        ) : error ? ( <div className="col-span-full flex flex-col items-center justify-center py-20 text-stone-400"><AlertCircle className="mb-2 text-red-400" size={32} /><p>{error}</p></div>
        ) : (
            <>
                {activeCategory === 'all' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 animate-fade-in">
                        {availableCategories.map((cat) => {
                            const count = getProductsByCategory(cat.id).length;
                            const coverImage = getCategoryCover(cat.id, cat.image);
                            return (
                                <div key={cat.id} className="group cursor-pointer block h-full flex flex-col" onClick={() => handleCategorySelect(cat.id)}>
                                    <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden mb-6 shadow-sm border border-stone-100 transition-all duration-700 group-hover:shadow-xl">
                                        <img src={coverImage} alt={cat.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                                        <div className="absolute inset-0 bg-stone-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                                            <span className="bg-white text-stone-900 px-6 py-3 text-xs font-bold uppercase tracking-widest flex items-center shadow-lg">{t.collections.viewProducts} <ArrowRight size={14} className="ml-2"/></span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-start mt-auto">
                                        <div><h3 className="font-serif text-2xl text-stone-900 mb-2 group-hover:text-safety-700 transition-colors">{cat.title}</h3><p className="text-xs text-stone-400 font-bold uppercase tracking-widest line-clamp-1">{cat.subtitle}</p></div>
                                        <span className="flex items-center text-[10px] font-bold uppercase tracking-widest bg-stone-100 border border-stone-200 text-stone-500 px-3 py-1 rounded-full whitespace-nowrap mt-1"><Layers size={10} className="mr-2 opacity-50"/> {count} Items</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="animate-fade-in">
                        {getProductsByCategory(activeCategory).length === 0 ? (
                            <div className="text-center py-20 text-stone-400 bg-stone-100 border border-stone-200"><p>No published products in this collection yet.</p></div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10">
                                {getProductsByCategory(activeCategory).map((product, idx) => (
                                    <div key={product.id || idx} className="group cursor-pointer flex flex-col h-full" onClick={() => openProduct(product)}>
                                        <div className="aspect-[4/5] w-full bg-stone-100 relative overflow-hidden mb-4 shadow-sm border border-stone-100 transition-all duration-500 group-hover:shadow-md">
                                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                                            <div className="absolute inset-0 bg-stone-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        </div>
                                        <div className="mt-auto">
                                            <h3 className="font-serif text-lg text-stone-900 group-hover:text-safety-700 transition-colors leading-tight mb-1">{product.name}</h3>
                                            <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">{product.code || "Ref. " + (idx + 1).toString().padStart(3, '0')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="mt-20 border-t border-stone-200 pt-8 text-center"><button onClick={handleBackToOverview} className="text-stone-400 hover:text-stone-900 text-xs font-bold uppercase tracking-widest transition-colors">Back to All Collections</button></div>
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
};

export default Portfolio;
