
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { X, Loader2, AlertCircle, Download, FileText } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { usePublishedSiteConfig } from '../contexts/SiteConfigContext';
import { ProductVariant } from '../types';
import { categories as staticCategories } from '../data/inventory';
import { normalizeProducts } from '../utils/normalizeProduct';
import { API_BASE } from '../utils/siteConfig';

const Collections: React.FC = () => {
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
        let rawData = json.products || json.data || (Array.isArray(json) ? json : []);
        let loadedProducts = normalizeProducts(rawData).filter(p => 
            p.status?.toLowerCase() === 'published' || p.status?.toLowerCase() === 'pub'
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
    return staticCategories.filter(cat => validIds.has(cat.id.toLowerCase()) || validIds.has(cat.title.toLowerCase()));
  }, [products]);

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setActiveCategory(cat);
    const prodId = searchParams.get('product');
    if (prodId && products.length > 0) {
      const found = products.find(p => p.id === prodId || p.name === prodId);
      if (found) setSelectedProduct(found);
    }
  }, [searchParams, products]);

  const displayedProducts = useMemo(() => {
    if (activeCategory === 'all') return products;
    return products.filter(p => {
        const pCat = (p.category || '').toLowerCase().trim();
        const tCat = activeCategory.toLowerCase().trim();
        const activeCategoryDef = staticCategories.find(c => c.id.toLowerCase() === tCat);
        const activeTitle = activeCategoryDef ? activeCategoryDef.title.toLowerCase() : '';
        return pCat === tCat || pCat === activeTitle;
    });
  }, [activeCategory, products]);

  const closeProduct = () => {
    setSelectedProduct(null);
    const params = new URLSearchParams(searchParams);
    params.delete('product');
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="bg-stone-50 min-h-screen pt-32 pb-20">
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4" onClick={closeProduct}>
           <div className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-sm shadow-2xl flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
              <div className="w-full md:w-1/2 bg-stone-100 relative min-h-[300px]">
                 <img src={selectedProduct.images[0]} alt={selectedProduct.name} className="w-full h-full object-cover absolute inset-0" />
              </div>
              <div className="w-full md:w-1/2 p-8 md:p-12 relative">
                <button onClick={closeProduct} className="absolute top-8 right-8 text-stone-400 hover:text-stone-900"><X size={24} /></button>
                 <h2 className="font-serif text-3xl text-stone-900 mb-6">{selectedProduct.name}</h2>
                 <p className="text-stone-600 mb-8">{selectedProduct.description || t.collections.pdp.descExtra}</p>
                 <Link to="/inquire" className="inline-block bg-stone-900 text-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-safety-700 transition-colors">{t.collections.pdp.inquireOrder}</Link>
              </div>
           </div>
        </div>
      )}

      <div className="container mx-auto px-6 md:px-12">
        <div className="mb-12 text-center">
            <h1 className="font-serif text-4xl md:text-5xl text-stone-900 mb-4">Portfolio</h1>
            {config?.catalog?.url && (
                <div className="inline-block">
                    <a href={config.catalog.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 bg-white border border-stone-200 px-6 py-4 shadow-sm group">
                        <FileText size={20} className="text-stone-400 group-hover:text-safety-700" />
                        <span className="text-xs font-bold uppercase tracking-widest text-stone-900">{t.collections.requestPdf}</span>
                    </a>
                </div>
            )}
        </div>

        {isLoading ? (
             <div className="col-span-full flex justify-center py-20 text-stone-400"><Loader2 className="animate-spin mr-2" /> Loading...</div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {displayedProducts.map((product, idx) => (
                    <div key={product.id || idx} className="group cursor-pointer" onClick={() => setSelectedProduct(product)}>
                        <div className="aspect-[3/4] bg-stone-100 overflow-hidden mb-4">
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        </div>
                        <h3 className="font-serif text-lg text-stone-900">{product.name}</h3>
                        <p className="text-[10px] text-stone-400 uppercase font-bold">{product.code || "Ref. " + (idx + 1)}</p>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default Collections;
