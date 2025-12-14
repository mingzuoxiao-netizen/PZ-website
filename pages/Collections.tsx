
import React, { useState, useEffect } from 'react';
import { Home, Factory, MapPin, FileText, ArrowRight, Loader2, PackageX, Palette, ChevronLeft } from 'lucide-react';
import { Category, ProductVariant } from '../types';
import { Link, useLocation } from 'react-router-dom';
import { categories as staticCategories } from '../data/inventory';
import { useLanguage } from '../contexts/LanguageContext';
import { usePublishedSiteConfig } from '../contexts/SiteConfigContext';

const Portfolio: React.FC = () => {
  const [activeProduct, setActiveProduct] = useState<ProductVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayCategories, setDisplayCategories] = useState<Category[]>([]);
  
  // State for the currently displayed main image (handles color switching)
  const [currentMainImage, setCurrentMainImage] = useState<string>('');
  
  const { t } = useLanguage();
  const location = useLocation();
  const { config } = usePublishedSiteConfig();

  const catalogPdfUrl = config?.catalog?.url;

  // --- DATA LOADING ---
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // 1. Get Static Inventory
        let allCategories = JSON.parse(JSON.stringify(staticCategories));

        // 2. Get Custom Structure (Categories) from Storage
        const customStructureStr = localStorage.getItem('pz_custom_structure');
        if (customStructureStr) {
          const customCats: Category[] = JSON.parse(customStructureStr);
          // Merge custom categories
          customCats.forEach(cCat => {
             const existingIdx = allCategories.findIndex((sc: Category) => sc.id === cCat.id);
             if (existingIdx > -1) {
                // Update existing
                allCategories[existingIdx] = { ...allCategories[existingIdx], ...cCat };
             } else {
                // Add new
                allCategories.push(cCat);
             }
          });
        }

        // 3. Get Custom Products from Inventory
        const customInventoryStr = localStorage.getItem('pz_custom_inventory');
        if (customInventoryStr) {
           const customItems: any[] = JSON.parse(customInventoryStr);
           
           customItems.forEach(item => {
              // Find the category this item belongs to
              const cat = allCategories.find((c: Category) => c.id === item.categoryId);
              if (cat) {
                 // Find or Create SubCategory
                 let sub = cat.subCategories.find((s: any) => s.name === item.subCategoryName);
                 if (!sub) {
                    sub = {
                       name: item.subCategoryName || "General",
                       description: "",
                       image: item.image,
                       variants: []
                    };
                    cat.subCategories.push(sub);
                 }
                 if (!sub.variants) sub.variants = [];
                 
                 // Avoid duplicates if merging with static data that might have same ID
                 const exists = sub.variants.find((v: any) => v.id === item.id);
                 if (!exists && item.status === 'published') {
                    sub.variants.push(item);
                 }
              }
           });
        }

        // 4. Filter out empty categories
        const nonEmptyCategories = allCategories.filter((c: Category) => 
            c.subCategories.some(s => s.variants && s.variants.length > 0)
        );

        setDisplayCategories(nonEmptyCategories);

      } catch (e) {
        console.error("Failed to load portfolio data", e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Update main image when product changes
  useEffect(() => {
    if (activeProduct) {
      setCurrentMainImage(activeProduct.image);
    }
  }, [activeProduct]);

  // Handle Hash Scrolling
  useEffect(() => {
    if (!loading && location.hash) {
      const el = document.getElementById(location.hash.substring(1));
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    }
  }, [location.hash, loading]);

  // Helper to flatten products for a category
  const getCategoryProducts = (category: Category) => {
      const products: ProductVariant[] = [];
      category.subCategories.forEach(sub => {
          if (sub.variants) {
              sub.variants.forEach(v => products.push(v));
          }
      });
      return products;
  };

  return (
    <div className="pt-20 md:pt-32 bg-white min-h-screen">
      
      {!activeProduct && (
        <section className="bg-stone-50 border-b border-stone-200 py-12 md:py-16 relative overflow-hidden">
          <div className="container mx-auto px-6 md:px-12 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-end">
               <div>
                   <span className="text-safety-700 font-bold tracking-[0.2em] uppercase text-xs mb-4 block">
                     Full Portfolio
                   </span>
                   <h1 className="font-serif text-3xl md:text-5xl text-stone-900 mb-4">
                     Craftsmanship & Capabilities
                   </h1>
                   <p className="text-stone-500 max-w-xl text-sm leading-relaxed">
                     Explore our complete range of manufactured products, from solid wood components to complex mixed-material assemblies.
                   </p>
               </div>
               
               <div className="mt-8 md:mt-0 w-full md:w-auto">
                   {catalogPdfUrl ? (
                       <a 
                         href={catalogPdfUrl} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="inline-flex justify-center w-full md:w-auto items-center bg-stone-900 text-white px-6 py-3 rounded-sm shadow-md hover:bg-safety-700 transition-all text-xs font-bold uppercase tracking-widest group"
                       >
                          <FileText size={16} className="mr-2"/> Download Catalog
                       </a>
                   ) : (
                       <Link 
                         to="/inquire?subject=Catalog"
                         className="inline-flex justify-center w-full md:w-auto items-center bg-stone-900 text-white px-6 py-3 rounded-sm shadow-md hover:bg-safety-700 transition-all text-xs font-bold uppercase tracking-widest group"
                       >
                          <FileText size={16} className="mr-2"/> Request Catalog
                       </Link>
                   )}
               </div>
            </div>
          </div>
        </section>
      )}

      {loading ? (
          <div className="flex justify-center items-center h-64">
              <Loader2 className="animate-spin text-stone-300" size={32} />
          </div>
      ) : activeProduct ? (
          // ========================
          // PRODUCT DETAIL VIEW
          // ========================
          <div className="container mx-auto px-6 md:px-12 py-8 md:py-12 animate-fade-in">
              <button 
                onClick={() => setActiveProduct(null)}
                className="flex items-center text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-safety-700 mb-6 md:mb-8 transition-colors border-b border-transparent hover:border-safety-700 w-fit pb-1"
              >
                  <ChevronLeft size={14} className="mr-1" /> Back to Portfolio
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-24">
                  
                  {/* LEFT COLUMN: Text Content (Order 2 on Mobile, 1 on Desktop) */}
                  <div className="lg:col-span-5 order-2 lg:order-1">
                      <div className="lg:sticky lg:top-32">
                          <span className="text-safety-700 font-bold uppercase tracking-widest text-[10px] md:text-xs mb-3 md:mb-4 block flex items-center">
                              <Factory size={14} className="mr-2"/> Manufacturing Case Study
                          </span>
                          <h1 className="font-serif text-3xl md:text-5xl text-stone-900 mb-4 md:mb-6 leading-tight">
                              {activeProduct.name}
                          </h1>
                          <div className="w-12 md:w-16 h-1 bg-wood-pattern opacity-50 mb-6 md:mb-8"></div>
                          
                          <p className="text-stone-600 text-base md:text-lg leading-relaxed mb-8 font-light">
                              {activeProduct.description}
                          </p>

                          {/* --- COLOR VARIANT SWITCHER --- */}
                          {activeProduct.colors && activeProduct.colors.length > 0 && (
                             <div className="mb-8">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3 flex items-center">
                                   <Palette size={14} className="mr-2"/> Available Finishes
                                </h4>
                                <div className="flex flex-wrap gap-3">
                                   <button 
                                      onClick={() => setCurrentMainImage(activeProduct.image)}
                                      className={`border-2 p-0.5 rounded-sm transition-all ${currentMainImage === activeProduct.image ? 'border-amber-700' : 'border-transparent hover:border-stone-300'}`}
                                      title="Original"
                                   >
                                      <div className="w-8 h-8 md:w-10 md:h-10 bg-stone-200 overflow-hidden relative">
                                         <img src={activeProduct.image} className="w-full h-full object-cover" />
                                      </div>
                                   </button>

                                   {activeProduct.colors.map((color, idx) => (
                                      <button 
                                        key={idx}
                                        onClick={() => setCurrentMainImage(color.image)}
                                        className={`border-2 p-0.5 rounded-sm transition-all ${currentMainImage === color.image ? 'border-amber-700' : 'border-transparent hover:border-stone-300'}`}
                                        title={color.name}
                                      >
                                         <div className="w-8 h-8 md:w-10 md:h-10 bg-stone-200 overflow-hidden relative">
                                            <img src={color.image} className="w-full h-full object-cover" />
                                         </div>
                                      </button>
                                   ))}
                                </div>
                                <p className="text-xs text-stone-500 mt-2">
                                   Selected: <span className="font-bold text-stone-900">
                                      {activeProduct.colors.find(c => c.image === currentMainImage)?.name || 'Standard'}
                                   </span>
                                </p>
                             </div>
                          )}

                          <div className="bg-stone-50 border border-stone-200 p-6 md:p-8 shadow-sm mb-8 relative">
                              <h4 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-6">
                                {t.collections.pdp.techDims}
                              </h4>
                              <ul className="space-y-4 text-sm">
                                  <li className="flex justify-between border-b border-stone-200 pb-2 border-dashed">
                                      <span className="text-stone-500 font-medium">{t.collections.pdp.matSelection}</span>
                                      <span className="font-bold text-stone-900 text-right">{activeProduct.material || 'Solid Hardwood'}</span>
                                  </li>
                                  <li className="flex justify-between border-b border-stone-200 pb-2 border-dashed">
                                      <span className="text-stone-500 font-medium">{t.capabilities.limits.maxDim}</span>
                                      <span className="font-mono text-stone-900 text-right">{activeProduct.dimensions || 'Customizable'}</span>
                                  </li>
                                  <li className="flex justify-between border-b border-stone-200 pb-2 border-dashed">
                                      <span className="text-stone-500 font-medium">{t.collections.pdp.finish}</span>
                                      <span className="font-bold text-stone-900 text-right">Matte PU / UV</span>
                                  </li>
                                  <li className="flex justify-between border-b border-stone-200 pb-2 border-dashed">
                                      <span className="text-stone-500 font-medium">Origin</span>
                                      <span className="font-bold text-stone-900 flex items-center text-right"><MapPin size={12} className="mr-1"/> CN / KH</span>
                                  </li>
                                  {activeProduct.code && (
                                    <li className="flex justify-between pt-2">
                                        <span className="text-stone-500 font-medium">{t.collections.pdp.ref}</span>
                                        <span className="font-mono text-xs bg-stone-200 px-2 py-1 text-stone-600">{activeProduct.code}</span>
                                    </li>
                                  )}
                              </ul>
                          </div>

                          <Link 
                            to={`/inquire?subject=Portfolio_Inquiry&product=${encodeURIComponent(activeProduct.name)}`}
                            className="block w-full text-center md:inline-block bg-[#281815] text-white px-10 py-4 font-bold uppercase tracking-widest text-xs hover:bg-safety-700 transition-colors shadow-lg"
                          >
                              {t.collections.pdp.inquireOrder}
                          </Link>
                      </div>
                  </div>

                  {/* RIGHT COLUMN: Images (Order 1 on Mobile, 2 on Desktop) */}
                  <div className="lg:col-span-7 order-1 lg:order-2 space-y-4 md:space-y-8">
                      {/* Main Image */}
                      <div className="w-full bg-stone-100 aspect-[4/3] relative overflow-hidden shadow-xl border border-stone-200">
                          <img 
                            src={currentMainImage} 
                            className="w-full h-full object-cover transition-opacity duration-500" 
                            alt={activeProduct.name} 
                          />
                      </div>
                      
                      {/* Thumbnails - Horizontal Scroll on Mobile, Grid on Desktop */}
                      {activeProduct.images && activeProduct.images.length > 1 && (
                          <div className="flex overflow-x-auto gap-4 pb-2 md:grid md:grid-cols-2 md:gap-4 md:pb-0 md:overflow-visible snap-x">
                              {activeProduct.images.slice(1).map((img, idx) => (
                                  <div 
                                    key={idx} 
                                    className="min-w-[40%] md:min-w-0 aspect-square bg-stone-100 overflow-hidden border border-stone-200 cursor-zoom-in snap-center" 
                                    onClick={() => setCurrentMainImage(img)}
                                  >
                                      <img src={img} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt="Detail" loading="lazy" />
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      ) : (
          // ========================
          // CATEGORY LIST VIEW
          // ========================
          <div className="container mx-auto px-6 md:px-12 py-8 md:py-12">
              {/* Dynamic Categories Loop */}
              {displayCategories.map((category, index) => {
                const products = getCategoryProducts(category);
                if (products.length === 0) return null;

                return (
                  <div 
                    key={category.id} 
                    id={category.id} 
                    className="mb-16 md:mb-24 last:mb-0 border-l-2 border-stone-100 pl-4 md:pl-0 md:border-l-0 scroll-mt-32"
                  >
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 md:mb-10 pb-4 border-b border-stone-200">
                       <div className="max-w-2xl">
                          <div className="flex items-center gap-3 mb-2">
                             <span className="text-safety-700 font-mono font-bold text-lg md:text-xl opacity-50">{(index + 1).toString().padStart(2, '0')}</span>
                             <h2 className="font-serif text-2xl md:text-3xl text-stone-900">{category.title}</h2>
                          </div>
                          <p className="text-stone-500 font-light text-xs md:text-sm tracking-wide md:pl-10">
                             {category.description}
                          </p>
                       </div>
                       <div className="hidden md:block">
                          <Link to={`/inquire?subject=${category.title}`} className="text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-safety-700 flex items-center transition-colors">
                             Inquire Collection <ArrowRight size={14} className="ml-2"/>
                          </Link>
                       </div>
                    </div>

                    {/* MOBILE OPTIMIZED GRID: 2 Columns on Mobile, 3 on Desktop */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
                       {products.map((product, idx) => (
                          <div 
                             key={product.name + idx} 
                             className="group cursor-pointer flex flex-col"
                             onClick={() => {
                               setActiveProduct(product);
                               window.scrollTo({ top: 0, behavior: 'smooth' });
                             }}
                          >
                             <div className="aspect-[4/3] bg-stone-100 overflow-hidden border border-stone-200 relative mb-3 md:mb-4 transition-all duration-500 shadow-sm hover:shadow-xl">
                                <img 
                                  src={product.image} 
                                  alt={product.name} 
                                  loading="lazy"
                                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/10 transition-colors"></div>
                                <div className="absolute bottom-0 left-0 w-full p-2 md:p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-white/95 backdrop-blur border-t border-stone-100 hidden md:block">
                                   <span className="text-[10px] font-bold uppercase tracking-widest text-stone-900 flex items-center justify-between">
                                      View Details <ArrowRight size={12}/>
                                   </span>
                                </div>
                             </div>
                             
                             <div className="text-left px-1">
                                 <h3 className="font-serif text-sm md:text-lg text-stone-900 group-hover:text-safety-700 transition-colors truncate leading-tight mb-1">
                                   {product.name}
                                 </h3>
                                 <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                                    <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-stone-400 line-clamp-1">
                                      {product.subCategoryName || product.description}
                                    </p>
                                    {product.colors && product.colors.length > 0 && (
                                       <span className="hidden md:flex items-center text-[9px] font-bold text-amber-700 uppercase tracking-wider ml-2 whitespace-nowrap">
                                          <Palette size={10} className="mr-1"/> {product.colors.length} Colors
                                       </span>
                                    )}
                                 </div>
                             </div>
                          </div>
                       ))}
                    </div>
                  </div>
                );
              })}

              {displayCategories.length === 0 && (
                  <div className="text-center py-32 border border-dashed border-stone-300 bg-stone-50">
                      <PackageX className="mx-auto text-stone-300 mb-4" size={48} />
                      <p className="text-stone-400 text-sm uppercase tracking-widest font-bold">Portfolio is empty</p>
                      <p className="text-stone-400 text-xs mt-2">Products will appear here once added in Creator Mode.</p>
                  </div>
              )}
          </div>
      )}
    </div>
  );
};

export default Portfolio;
