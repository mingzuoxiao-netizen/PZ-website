
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { X, Loader2, AlertCircle, Download, FileText } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { usePublishedSiteConfig } from '../contexts/SiteConfigContext';
import { ProductVariant } from '../types';
import { categories as staticCategories } from '../data/inventory';
import { getAssetUrl } from '../utils/getAssetUrl';
import { normalizeProducts } from '../utils/normalizeProduct';
import { API_BASE } from '../utils/siteConfig';

const Collections: React.FC = () => {
  const { t } = useLanguage();
  const { config } = usePublishedSiteConfig();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<ProductVariant | null>(null);
  const [products, setProducts] = useState<ProductVariant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch Products directly from API
  useEffect(() => {
    const fetchPortfolio = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Add timestamp to prevent caching
        const response = await fetch(`${API_BASE}/products?limit=1000&_t=${Date.now()}`);
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        
        const json = await response.json();
        
        // Handle various response structures: { data: [...] } or [...] or { results: [...] }
        let rawData = [];
        if (Array.isArray(json)) {
            rawData = json;
        } else if (json.data && Array.isArray(json.data)) {
            rawData = json.data;
        } else if (json.results && Array.isArray(json.results)) {
            rawData = json.results;
        }

        // Normalize data
        let loadedProducts = normalizeProducts(rawData);
        
        // Filter only PUBLISHED products for the public site
        // and robustly handle status case-sensitivity
        loadedProducts = loadedProducts.filter(p => 
            p.status && (p.status.toLowerCase() === 'published' || p.status.toLowerCase() === 'pub')
        );
        
        console.log("Portfolio Loaded Products:", loadedProducts);
        setProducts(loadedProducts);
      } catch (e: any) {
        console.error("Portfolio Error:", e);
        setError(`Unable to load products. (${e.message})`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolio();
  }, []);

  // 2. Derive Available Categories
  // Filter static categories to ONLY show ones that have uploaded products
  const availableCategories = useMemo(() => {
    // Collect all unique categories from loaded products
    const validIds = new Set(products.map(p => p.category?.toLowerCase().trim()));
    
    return staticCategories.filter(cat => {
        // Check if the static category ID matches any product category
        // Also checks if product category matches the static category TITLE (handling legacy data where Title was saved as ID)
        return validIds.has(cat.id.toLowerCase()) || validIds.has(cat.title.toLowerCase());
    });
  }, [products]);

  // 3. Handle URL Params (Deep Linking)
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setActiveCategory(cat);
    
    const prodId = searchParams.get('product');
    if (prodId && products.length > 0) {
      const found = products.find(p => p.id === prodId || p.name === prodId);
      if (found) setSelectedProduct(found);
    }
  }, [searchParams, products]);

  // 4. Robust Filter Logic
  const displayedProducts = useMemo(() => {
    if (activeCategory === 'all') return products;
    
    return products.filter(p => {
        const pCat = (p.category || '').toLowerCase().trim();
        const tCat = activeCategory.toLowerCase().trim();
        
        // Match against ID or Title of the active category to be safe
        const activeCategoryDef = staticCategories.find(c => c.id.toLowerCase() === tCat);
        const activeTitle = activeCategoryDef ? activeCategoryDef.title.toLowerCase() : '';

        return pCat === tCat || pCat === activeTitle;
    });
  }, [activeCategory, products]);

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
                   className="w-full h-full object-cover absolute inset-0 mix-blend-multiply"
                 />
                 <button onClick={closeProduct} className="absolute top-4 left-4 md:hidden bg-white/50 p-2 rounded-full">
                    <X size={20} />
                 </button>
              </div>
              <div className="w-full md:w-1/2 p-8 md:p-12 relative">
                <button onClick={closeProduct} className="absolute top-8 right-8 hidden md:block text-stone-400 hover:text-stone-900">
                    <X size={24} />
                 </button>
                 
                 <h2 className="font-serif text-3xl text-stone-900 mb-2">{selectedProduct.name}</h2>
                 {selectedProduct.name_cn && <p className="text-stone-500 mb-6">{selectedProduct.name_cn}</p>}
                 
                 <div className="w-12 h-1 bg-safety-700 mb-8"></div>
                 
                 <p className="text-stone-600 mb-8 leading-relaxed">
                   {selectedProduct.description || selectedProduct.description_cn || t.collections.pdp.descExtra}
                 </p>

                 <div className="grid grid-cols-2 gap-6 text-sm text-stone-600 mb-10">
                    <div>
                        <span className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-1">{t.collections.pdp.techDims}</span>
                        {selectedProduct.size || "Standard"}
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
        <div className="mb-12 text-center">
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

        {/* Dynamic Category Filter */}
        {products.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4 mb-16">
                <button 
                    onClick={() => { setActiveCategory('all'); setSearchParams({}, { replace: true }); }}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${activeCategory === 'all' ? 'bg-stone-900 text-white' : 'bg-white text-stone-500 hover:text-stone-900'}`}
                >
                    ALL
                </button>
                {/* Only render categories that actually exist in the product list */}
                {availableCategories.map(cat => (
                    <button 
                        key={cat.id}
                        onClick={() => { setActiveCategory(cat.id); setSearchParams({ category: cat.id }, { replace: true }); }}
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${activeCategory === cat.id ? 'bg-stone-900 text-white' : 'bg-white text-stone-500 hover:text-stone-900'}`}
                    >
                        {cat.title}
                    </button>
                ))}
            </div>
        )}

        {/* Error / Loading State */}
        {error && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-stone-400">
                <AlertCircle className="mb-2 text-red-400" size={32} />
                <p>{error}</p>
                <button 
                    onClick={() => window.location.reload()} 
                    className="mt-4 text-xs font-bold uppercase border-b border-stone-400 hover:text-stone-900"
                >
                    Retry
                </button>
            </div>
        )}

        {isLoading ? (
             <div className="col-span-full flex justify-center py-20 text-stone-400">
                <Loader2 className="animate-spin mr-2" /> Loading Portfolio...
             </div>
        ) : (
            <>
                {/* Empty State */}
                {products.length === 0 ? (
                    <div className="text-center py-20 bg-stone-100 border border-stone-200 rounded-sm">
                        <p className="text-stone-500 font-serif text-lg mb-2">No published products found.</p>
                        <p className="text-xs text-stone-400">
                            Check that your products are set to "Published" status in the Creator Portal.
                        </p>
                    </div>
                ) : displayedProducts.length === 0 ? (
                    <div className="text-center py-20 text-stone-400">
                        <p>No products found in the "{activeCategory}" category.</p>
                        <button onClick={() => setActiveCategory('all')} className="mt-4 text-safety-700 underline text-sm">View All Products</button>
                    </div>
                ) : (
                    /* Product Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
                        {displayedProducts.map((product, idx) => (
                        <div 
                            key={product.id || idx} 
                            className="group cursor-pointer animate-fade-in-up" 
                            style={{ animationDelay: `${idx * 50}ms` }}
                            onClick={() => openProduct(product)}
                        >
                            <div className="aspect-[3/4] bg-stone-100 overflow-hidden relative mb-4">
                                {/* Primary Image */}
                                <img 
                                    src={getAssetUrl(product.images[0])} 
                                    alt={product.name} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 mix-blend-multiply"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x500?text=No+Image';
                                    }}
                                />
                                
                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                                    <span className="bg-white text-stone-900 px-4 py-2 text-[10px] font-bold uppercase tracking-widest shadow-sm">
                                        View Details
                                    </span>
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-serif text-lg text-stone-900 group-hover:text-safety-700 transition-colors">{product.name}</h3>
                                    <p className="text-xs text-stone-400 uppercase tracking-widest mt-1 font-bold">
                                        {product.code || "Ref. " + (idx + 1).toString().padStart(3, '0')}
                                    </p>
                                </div>
                            </div>
                        </div>
                        ))}
                    </div>
                )}
            </>
        )}

      </div>
    </div>
  );
};

export default Collections;
