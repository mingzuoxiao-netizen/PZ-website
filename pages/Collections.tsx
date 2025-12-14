import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { X, ArrowRight, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { usePublishedSiteConfig } from '../contexts/SiteConfigContext';
import { Category, ProductVariant, SubCategory } from '../types';
import { categories as staticCategories } from '../data/inventory';
import { getAssetUrl } from '../utils/getAssetUrl';

// Helper to flatten products
const getAllProducts = (categories: Category[]): ProductVariant[] => {
  let products: ProductVariant[] = [];
  categories.forEach(cat => {
    cat.subCategories.forEach(sub => {
      if (sub.variants) {
        products = [...products, ...sub.variants];
      }
    });
  });
  return products;
};

const Collections: React.FC = () => {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const { config } = usePublishedSiteConfig();
  
  // State
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<ProductVariant | null>(null);
  
  // Normalize static data to ensure images[] exists
  const [dynamicCategories, setDynamicCategories] = useState<Category[]>(() => {
    return staticCategories.map(cat => ({
      ...cat,
      subCategories: cat.subCategories.map(sub => ({
        ...sub,
        variants: sub.variants?.map(v => {
          const imgs = Array.isArray(v.images) && v.images.length > 0
            ? v.images 
            : (v.image ? [v.image] : []);
          return {
            ...v,
            images: imgs,
            image: imgs[0] || ''
          };
        })
      }))
    }));
  });

  const [isLoading, setIsLoading] = useState(false);

  // Parse query params
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setActiveCategory(cat);
    
    const prodId = searchParams.get('product');
    if (prodId) {
      // Find product
      const all = getAllProducts(dynamicCategories);
      const found = all.find(p => p.id === prodId || p.name === prodId); // Fallback to name match for legacy
      if (found) setSelectedProduct(found);
    }
  }, [searchParams, dynamicCategories]);

  // Update categories with config images if available (optional enhancement)
  // For now just returning dynamicCategories
  const displayCategories = useMemo(() => {
    return dynamicCategories;
  }, [dynamicCategories]);

  const openProduct = (product: ProductVariant) => {
    setSelectedProduct(product);
    // Update URL without reload
    const params = new URLSearchParams(searchParams);
    if (product.id) params.set('product', product.id);
    else params.set('product', product.name);
    setSearchParams(params, { replace: true });
  };

  const closeProduct = () => {
    setSelectedProduct(null);
    const params = new URLSearchParams(searchParams);
    params.delete('product');
    setSearchParams(params, { replace: true });
  };

  const filteredSubCategories = useMemo(() => {
    if (activeCategory === 'all') {
      // Flatten all subcategories
      let subs: SubCategory[] = [];
      displayCategories.forEach(c => subs = [...subs, ...c.subCategories]);
      return subs;
    }
    const cat = displayCategories.find(c => c.id === activeCategory);
    return cat ? cat.subCategories : [];
  }, [activeCategory, displayCategories]);

  return (
    <div className="bg-stone-50 min-h-screen pt-32 pb-20">
      
      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-fade-in" onClick={closeProduct}>
           <div className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-sm shadow-2xl flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
              <div className="w-full md:w-1/2 bg-stone-100 relative min-h-[300px]">
                 <img 
                   src={getAssetUrl(selectedProduct.images?.[0])} 
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
            <h1 className="font-serif text-4xl md:text-5xl text-stone-900 mb-4">{t.collections.title}</h1>
            <p className="text-stone-500 max-w-2xl mx-auto">{t.collections.intro}</p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
            <button 
                onClick={() => { setActiveCategory('all'); setSearchParams({}, { replace: true }); }}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${activeCategory === 'all' ? 'bg-stone-900 text-white' : 'bg-white text-stone-500 hover:text-stone-900'}`}
            >
                All
            </button>
            {displayCategories.map(cat => (
                <button 
                    key={cat.id}
                    onClick={() => { setActiveCategory(cat.id); setSearchParams({ category: cat.id }, { replace: true }); }}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${activeCategory === cat.id ? 'bg-stone-900 text-white' : 'bg-white text-stone-500 hover:text-stone-900'}`}
                >
                    {cat.title}
                </button>
            ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
           {filteredSubCategories.map((sub, idx) => (
               <div key={idx} className="group">
                   <div className="aspect-[4/3] bg-stone-200 overflow-hidden relative mb-4">
                       <img 
                         src={getAssetUrl(sub.image)} 
                         alt={sub.name} 
                         className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                       />
                       {/* Overlay with View Products button if it has variants */}
                       {sub.variants && sub.variants.length > 0 && (
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <button className="bg-white text-stone-900 px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-safety-700 hover:text-white transition-colors">
                                   {t.collections.viewProducts}
                               </button>
                           </div>
                       )}
                   </div>
                   <h3 className="font-serif text-xl text-stone-900">{sub.name}</h3>
                   <p className="text-sm text-stone-500 mt-1 line-clamp-2">{sub.description}</p>
                   
                   {/* Variant List Preview */}
                   {sub.variants && sub.variants.length > 0 && (
                       <div className="mt-4 space-y-2 border-t border-stone-100 pt-3">
                           {sub.variants.map((variant, vIdx) => (
                               <div 
                                 key={vIdx} 
                                 onClick={() => openProduct(variant)}
                                 className="flex items-center justify-between text-xs text-stone-600 hover:text-safety-700 cursor-pointer group/item"
                               >
                                   <span>{variant.name}</span>
                                   <ArrowRight size={12} className="opacity-0 group-hover/item:opacity-100 transition-opacity" />
                               </div>
                           ))}
                       </div>
                   )}
               </div>
           ))}
        </div>

      </div>
    </div>
  );
};

export default Collections;