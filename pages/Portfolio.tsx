
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { X, Loader2, AlertCircle, Download, FileText, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { usePublishedSiteConfig } from '../contexts/SiteConfigContext';
import { ProductVariant } from '../types';
import { categories as staticCategories } from '../data/inventory';
import { getAssetUrl } from '../utils/getAssetUrl';
import { normalizeProducts } from '../utils/normalizeProduct';
import { API_BASE } from '../utils/siteConfig';

const Portfolio: React.FC = () => {
  const { t, language } = useLanguage();
  const { config } = usePublishedSiteConfig();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<ProductVariant | null>(null);
  const [products, setProducts] = useState<ProductVariant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch Products
  useEffect(() => {
    const fetchPortfolio = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const url = `${API_BASE}/products?limit=1000&_t=${Date.now()}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        
        const json = await response.json();
        
        let rawData = [];
        if (json.products && Array.isArray(json.products)) {
            rawData = json.products;
        } else if (json.data && Array.isArray(json.data)) {
            rawData = json.data;
        } else if (Array.isArray(json)) {
            rawData = json;
        } else if (json.results && Array.isArray(json.results)) {
            rawData = json.results;
        }

        let loadedProducts = normalizeProducts(rawData);
        // Filter only PUBLISHED
        loadedProducts = loadedProducts.filter(p => 
            p.status && (p.status.toLowerCase() === 'published' || p.status.toLowerCase() === 'pub')
        );
        
        setProducts(loadedProducts);
      } catch (e: any) {
        console.error("[Portfolio] Fetch failed:", e);
        setError(`Unable to load products. (${e.message})`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolio();
  }, []);

  // 2. Derive Available Categories (Only those with products)
  const availableCategories = useMemo(() => {
    const validIds = new Set(products.map(p => p.category?.toLowerCase().trim()));
    return staticCategories.filter(cat => {
        return validIds.has(cat.id.toLowerCase()) || validIds.has(cat.title.toLowerCase());
    });
  }, [products]);

  // 3. Handle URL Params
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setActiveCategory(cat);
    
    const prodId = searchParams.get('product');
    if (prodId && products.length > 0) {
      const found = products.find(p => p.id === prodId || p.name === prodId);
      if (found) setSelectedProduct(found);
    }
  }, [searchParams, products]);

  // 4. Grouping Logic for "Exhibition Mode"
  const getProductsByCategory = (catId: string) => {
      return products.filter(p => {
          const pCat = (p.category || '').toLowerCase().trim();
          const tCat = catId.toLowerCase().trim();
          // Match ID or Title (legacy support)
          const activeCategoryDef = staticCategories.find(c => c.id.toLowerCase() === tCat);
          const activeTitle = activeCategoryDef ? activeCategoryDef.title.toLowerCase() : '';
          return pCat === tCat || pCat === activeTitle;
      });
  };

  // Handlers
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

  // Language & Display Logic
  const getProductDisplay = (product: ProductVariant | null) => {
    if (!product) return { name: '', desc: '', size: '' };
    const name = language === 'zh' ? (product.name_cn || product.name) : product.name;
    const desc = language === 'zh' ? (product.description_cn || product.description) : product.description;
    const size = product.size || t.collections.pdp.customSizes;
    return { name, desc, size };
  };

  // --- RENDER COMPONENT: SINGLE PRODUCT CARD ---
  const ProductCard = ({ product, idx }: { product: ProductVariant, idx: number }) => (
    <div 
        className="group cursor-pointer flex flex-col h-full" 
        onClick={() => openProduct(product)}
    >
        <div className="aspect-[4/5] w-full bg-stone-100 relative overflow-hidden mb-4 shadow-sm border border-stone-100 transition-all duration-500 group-hover:shadow-md">
            {/* Primary Image */}
            <img 
                src={getAssetUrl(product.images[0])} 
                alt={product.name} 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x500?text=No+Image';
                }}
            />
            {/* Clean Hover Overlay */}
            <div className="absolute inset-0 bg-stone-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        
        <div className="mt-auto">
            <h3 className="font-serif text-lg text-stone-900 group-hover:text-safety-700 transition-colors leading-tight mb-1">
                {getProductDisplay(product).name}
            </h3>
            <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">
                {product.code || "Ref. " + (idx + 1).toString().padStart(3, '0')}
            </p>
        </div>
    </div>
  );

  return (
    <div className="bg-stone-50 min-h-screen pt-32 pb-20">
      
      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-fade-in" onClick={closeProduct}>
           <div className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-sm shadow-2xl flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
              <div className="w-full md:w-1/2 bg-stone-100 relative min-h-[300px]">
                 <img 
                   src={getAssetUrl(selectedProduct.images[0])} 
                   alt={selectedProduct.name} 
                   className="w-full h-full object-cover absolute inset-0"
                 />
                 <button onClick={closeProduct} className="absolute top-4 left-4 md:hidden bg-white/50 p-2 rounded-full">
                    <X size={20} />
                 </button>
              </div>
              <div className="w-full md:w-1/2 p-8 md:p-12 relative">
                <button onClick={closeProduct} className="absolute top-8 right-8 hidden md:block text-stone-400 hover:text-stone-900">
                    <X size={24} />
                 </button>
                 
                 {/* Dynamic Language Display */}
                 <h2 className="font-serif text-3xl text-stone-900 mb-6">
                    {getProductDisplay(selectedProduct).name}
                 </h2>
                 
                 <div className="w-12 h-1 bg-safety-700 mb-8"></div>
                 
                 <p className="text-stone-600 mb-8 leading-relaxed">
                   {getProductDisplay(selectedProduct).desc || t.collections.pdp.descExtra}
                 </p>

                 <div className="grid grid-cols-2 gap-6 text-sm text-stone-600 mb-10">
                    <div>
                        <span className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-1">{t.collections.pdp.techDims}</span>
                        {getProductDisplay(selectedProduct).size}
                    </div>
                    <div>
                        <span className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-1">{t.collections.pdp.matConst}</span>
                        {selectedProduct.material || "Solid Wood"}
                    </div>
                 </div>

                 <Link to="/inquire" className="inline-block bg-stone-900 text-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-safety-700 transition-colors">
                    {t.collections.pdp.inquireOrder}
                 </Link>
              </div>
           </div>
        </div>
      )}

      <div className="container mx-auto px-6 md:px-12">
        <div className="mb-16 text-center">
            <h1 className="font-serif text-4xl md:text-5xl text-stone-900 mb-4">Portfolio</h1>
            <p className="text-stone-500 max-w-2xl mx-auto mb-8">{t.collections.intro}</p>

            {/* Catalog Download Section */}
            {config?.catalog?.url && (
                <div className="inline-block animate-fade-in-up">
                    <a 
                        href={getAssetUrl(config.catalog.url)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 bg-white border border-stone-200 hover:border-safety-700 px-6 py-4 shadow-sm group transition-all"
                    >
                        <div className="bg-stone-100 p-2 rounded-full text-stone-500 group-hover:bg-safety-700 group-hover:text-white transition-colors">
                            <FileText size={20} />
                        </div>
                        <div className="text-left">
                            <div className="text-xs font-bold uppercase tracking-widest text-stone-900 group-hover:text-safety-700 transition-colors">
                                {t.collections.catalogDesc || "Download 2025 Catalog"}
                            </div>
                            <div className="text-[10px] text-stone-400 font-mono mt-1 flex items-center">
                                PDF Document <Download size={10} className="ml-2" />
                            </div>
                        </div>
                    </a>
                </div>
            )}
        </div>

        {/* Filters */}
        {products.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4 mb-20 sticky top-[70px] md:top-[90px] z-30 bg-stone-50/95 backdrop-blur-sm py-4 -mx-6 px-6 shadow-sm border-b border-stone-200">
                <button 
                    onClick={() => { setActiveCategory('all'); setSearchParams({}, { replace: true }); }}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors rounded-sm ${activeCategory === 'all' ? 'bg-stone-900 text-white' : 'bg-white text-stone-500 hover:text-stone-900 border border-stone-200'}`}
                >
                    ALL
                </button>
                {/* Only render categories that actually exist in the product list */}
                {availableCategories.map(cat => (
                    <button 
                        key={cat.id}
                        onClick={() => { setActiveCategory(cat.id); setSearchParams({ category: cat.id }, { replace: true }); }}
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors rounded-sm ${activeCategory === cat.id ? 'bg-stone-900 text-white' : 'bg-white text-stone-500 hover:text-stone-900 border border-stone-200'}`}
                    >
                        {cat.title}
                    </button>
                ))}
            </div>
        )}

        {/* Loading / Error / Empty States */}
        {isLoading ? (
             <div className="col-span-full flex justify-center py-20 text-stone-400">
                <Loader2 className="animate-spin mr-2" /> Loading Portfolio...
             </div>
        ) : error ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-stone-400">
                <AlertCircle className="mb-2 text-red-400" size={32} />
                <p>{error}</p>
            </div>
        ) : products.length === 0 ? (
            <div className="text-center py-20 bg-stone-100 border border-stone-200 rounded-sm">
                <p className="text-stone-500 font-serif text-lg mb-2">No published products found.</p>
            </div>
        ) : (
            /* 
               ================================================================
               EXHIBITION LAYOUT LOGIC
               ================================================================
            */
            <div className="space-y-24">
                {activeCategory === 'all' ? (
                    /* EXHIBITION MODE: Stacked Categories */
                    availableCategories.map((cat, catIdx) => {
                        const catProducts = getProductsByCategory(cat.id);
                        if (catProducts.length === 0) return null;

                        return (
                            <section key={cat.id} className="animate-fade-in" style={{ animationDelay: `${catIdx * 100}ms` }}>
                                {/* Sticky Category Header */}
                                <div className="sticky top-[138px] md:top-[162px] z-20 bg-stone-50/95 backdrop-blur py-4 mb-8 border-b border-stone-200 flex justify-between items-end">
                                    <div className="flex items-center gap-4">
                                        <h2 className="font-serif text-2xl md:text-3xl text-stone-900">{cat.title}</h2>
                                        <span className="text-xs font-mono text-stone-400 bg-white border border-stone-200 px-2 py-0.5 rounded-full">
                                            {catProducts.length}
                                        </span>
                                    </div>
                                    <Link 
                                        to={`?category=${cat.id}`}
                                        className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-safety-700 flex items-center transition-colors pb-1"
                                    >
                                        View Full <ArrowRight size={12} className="ml-1"/>
                                    </Link>
                                </div>

                                {/* Category Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10">
                                    {catProducts.map((product, idx) => (
                                        <ProductCard key={product.id || idx} product={product} idx={idx} />
                                    ))}
                                </div>
                            </section>
                        );
                    })
                ) : (
                    /* FILTERED MODE: Single Grid */
                    (() => {
                        const filteredProducts = getProductsByCategory(activeCategory);
                        if (filteredProducts.length === 0) {
                            return (
                                <div className="text-center py-20 text-stone-400">
                                    <p>No products found in the "{activeCategory}" category.</p>
                                    <button onClick={() => setActiveCategory('all')} className="mt-4 text-safety-700 underline text-sm">View All Products</button>
                                </div>
                            );
                        }
                        return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10 animate-fade-in">
                                {filteredProducts.map((product, idx) => (
                                    <ProductCard key={product.id || idx} product={product} idx={idx} />
                                ))}
                            </div>
                        );
                    })()
                )}
            </div>
        )}

      </div>
    </div>
  );
};

export default Portfolio;
