
import React, { useState, useMemo, useEffect } from 'react';
import { Home, Factory, MapPin, FileText, ArrowRight } from 'lucide-react';
import { Category, SubCategory, ProductVariant } from '../types';
import { Link, useLocation } from 'react-router-dom';
import { categories as staticCategories } from '../data/inventory';
import { useLanguage } from '../contexts/LanguageContext';
import { getAsset, ASSET_KEYS } from '../utils/assets';

const Portfolio: React.FC = () => {
  const [activeProduct, setActiveProduct] = useState<ProductVariant | null>(null);
  const { t, language } = useLanguage();
  const location = useLocation();

  const catalogPdfUrl = getAsset(ASSET_KEYS.CATALOG_DOCUMENT);

  // --- DATA LOADING & MERGING ---
  const mergedCategories = useMemo(() => {
    const combined = JSON.parse(JSON.stringify(staticCategories)) as Category[];
    try {
        const rawStructure = localStorage.getItem('pz_custom_structure') || '[]';
        const customStructure = JSON.parse(rawStructure) as Category[];
        customStructure.forEach((customCat: Category) => {
            const existingIdx = combined.findIndex((c) => c.id === customCat.id);
            if (existingIdx > -1) {
                const existingCat = combined[existingIdx];
                customCat.subCategories.forEach((newSub: SubCategory) => {
                    if (!existingCat.subCategories.find((s) => s.name === newSub.name)) {
                        existingCat.subCategories.push(newSub);
                    }
                });
            } else {
                combined.push(customCat);
            }
        });
        const customItems = JSON.parse(localStorage.getItem('pz_custom_inventory') || '[]');
        if (Array.isArray(customItems) && customItems.length > 0) {
            customItems.forEach((item: any) => {
                const cat = combined.find(c => c.id === item.categoryId);
                if (cat) {
                    const sub = cat.subCategories.find(s => s.name === item.subCategoryName);
                    if (sub) {
                        if (!sub.variants) sub.variants = [];
                        sub.variants.unshift({
                            ...item,
                            name: item.name,
                            name_zh: item.name_zh,
                            description: item.description,
                            description_zh: item.description_zh,
                            image: item.image,
                            images: item.images
                        });
                    }
                }
            });
        }
    } catch (e) {
        console.error("Error loading portfolio data", e);
    }
    return combined;
  }, [staticCategories]);

  // Helper: Flatten logic to get products by Category ID
  const getProductsByCategory = (catIds: string[], limit?: number, offset: number = 0) => {
    const products: ProductVariant[] = [];
    mergedCategories.forEach(cat => {
        if (catIds.includes(cat.id)) {
            cat.subCategories.forEach(sub => {
                if (sub.variants) {
                    sub.variants.forEach(v => products.push(v));
                }
            });
        }
    });
    // Apply offset and limit
    const sliced = products.slice(offset);
    return limit ? sliced.slice(0, limit) : sliced;
  };

  const getStr = (obj: any, key: string) => {
    if (language === 'zh' && obj[`${key}_zh`]) return obj[`${key}_zh`];
    return obj[key];
  };

  // Handle Hash Scrolling on Load
  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.substring(1));
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    }
  }, [location.hash]);

  // --- NEW CURATED SECTIONS (Based on User Request) ---
  const curatedSections = [
    {
      id: 'solid-wood',
      number: '01',
      title: 'Solid Wood Projects',
      title_zh: '实木项目',
      desc: 'Demonstrating core woodworking capabilities: Tabletops, butcher blocks, and solid components.',
      desc_zh: '展示核心木工能力：桌面、层压木及实木构件。',
      categoryIds: ['tables', 'surfaces'],
      limit: 3 // "2-3 representative images"
    },
    {
      id: 'seating',
      number: '02',
      title: 'Seating Projects',
      title_zh: '椅子 / 软包项目',
      desc: 'The best way to demonstrate factory capability. Dining chairs, accent chairs, and bar stools.',
      desc_zh: '最能提升实力感的品类。餐椅、休闲椅及吧台椅。',
      categoryIds: ['seating'],
      limit: 3 // "2 upholstered + 1 wood"
    },
    {
      id: 'mixed',
      number: '03',
      title: 'Metal + Mixed Material',
      title_zh: '金属 + 混材项目',
      desc: 'Metal legs, frames, and wood combinations showing multi-craft integration.',
      desc_zh: '体现多工艺能力：金属腿、框架及木材结合。',
      // Using tables as a proxy for mixed materials, offset to show different items than section 01
      categoryIds: ['tables', 'cabinetry'], 
      limit: 3,
      offset: 3 
    },
    {
      id: 'casegoods',
      number: '04',
      title: 'Casegoods / Storage',
      title_zh: '柜体类',
      desc: 'Nightstands, media consoles, and cabinets.',
      desc_zh: '床头柜、电视柜及储物柜。',
      categoryIds: ['cabinetry', 'veneer'],
      limit: 3
    }
  ];

  return (
    <div className="pt-24 bg-white min-h-screen">
      
      {/* =========================================
          SECTION: HEADER & DOWNLOAD
          ========================================= */}
      {!activeProduct && (
        <section className="bg-stone-50 border-b border-stone-200 py-16 relative overflow-hidden">
          <div className="container mx-auto px-6 md:px-12 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-end">
               <div>
                   <span className="text-safety-700 font-bold tracking-[0.2em] uppercase text-xs mb-4 block">
                     {language === 'zh' ? '精选案例结构' : 'Curated Portfolio'}
                   </span>
                   <h1 className="font-serif text-3xl md:text-5xl text-stone-900 mb-4">
                     {language === 'zh' ? '工艺与制造能力' : 'Craftsmanship & Capabilities'}
                   </h1>
                   <p className="text-stone-500 max-w-xl text-sm leading-relaxed">
                     {language === 'zh' 
                        ? '我们通过四个核心板块展示制造实力：实木加工、复杂软包、五金结合以及柜体制造。' 
                        : 'Showcasing our manufacturing strength through four core pillars: Solid wood processing, complex upholstery, metal integration, and casegoods.'}
                   </p>
               </div>
               
               {/* CATALOG BUTTON */}
               <div className="mt-8 md:mt-0">
                   {catalogPdfUrl ? (
                       <a 
                         href={catalogPdfUrl} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="inline-flex items-center bg-stone-900 text-white px-6 py-3 rounded-sm shadow-md hover:bg-safety-700 transition-all text-xs font-bold uppercase tracking-widest group"
                       >
                          <FileText size={16} className="mr-2"/> {language === 'zh' ? '下载完整目录 (PDF)' : 'Download Catalog'}
                       </a>
                   ) : (
                       <Link 
                         to="/inquire?subject=Catalog"
                         className="inline-flex items-center bg-stone-900 text-white px-6 py-3 rounded-sm shadow-md hover:bg-safety-700 transition-all text-xs font-bold uppercase tracking-widest group"
                       >
                          <FileText size={16} className="mr-2"/> {language === 'zh' ? '索取目录 (PDF)' : 'Request Catalog'}
                       </Link>
                   )}
               </div>
            </div>
          </div>
        </section>
      )}

      {/* =========================================
          SECTION: 4 CURATED BLOCKS
          ========================================= */}
      {activeProduct ? (
          /* --- DETAIL VIEW (unchanged logic) --- */
          <div className="container mx-auto px-6 md:px-12 py-12 animate-fade-in">
              <button 
                onClick={() => setActiveProduct(null)}
                className="flex items-center text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-safety-700 mb-8 transition-colors border-b border-transparent hover:border-safety-700 w-fit pb-1"
              >
                  <Home size={14} className="mr-2" /> {language === 'zh' ? '返回列表' : 'Back to Gallery'}
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
                  {/* Left: Content */}
                  <div className="lg:col-span-5 order-2 lg:order-1">
                      <div className="sticky top-32">
                          <span className="text-safety-700 font-bold uppercase tracking-widest text-xs mb-4 block flex items-center">
                              <Factory size={14} className="mr-2"/> {language === 'zh' ? '制造案例' : 'Manufacturing Case Study'}
                          </span>
                          <h1 className="font-serif text-4xl md:text-5xl text-stone-900 mb-6 leading-tight">
                              {getStr(activeProduct, 'name')}
                          </h1>
                          <div className="w-16 h-1 bg-wood-pattern opacity-50 mb-8"></div>
                          
                          <p className="text-stone-600 text-lg leading-relaxed mb-8 font-light">
                              {getStr(activeProduct, 'description')}
                          </p>

                          {/* Specs Box */}
                          <div className="bg-stone-50 border border-stone-200 p-8 shadow-sm mb-8 relative">
                              <h4 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-6">
                                {t.collections.pdp.techDims}
                              </h4>
                              <ul className="space-y-4 text-sm">
                                  <li className="flex justify-between border-b border-stone-200 pb-2 border-dashed">
                                      <span className="text-stone-500 font-medium">{t.collections.pdp.matSelection}</span>
                                      <span className="font-bold text-stone-900">{activeProduct.material || 'Solid Hardwood'}</span>
                                  </li>
                                  <li className="flex justify-between border-b border-stone-200 pb-2 border-dashed">
                                      <span className="text-stone-500 font-medium">{t.capabilities.limits.maxDim}</span>
                                      <span className="font-mono text-stone-900">{activeProduct.dimensions || 'Customizable'}</span>
                                  </li>
                                  <li className="flex justify-between border-b border-stone-200 pb-2 border-dashed">
                                      <span className="text-stone-500 font-medium">{t.collections.pdp.finish}</span>
                                      <span className="font-bold text-stone-900">Matte PU / UV</span>
                                  </li>
                                  <li className="flex justify-between border-b border-stone-200 pb-2 border-dashed">
                                      <span className="text-stone-500 font-medium">Origin</span>
                                      <span className="font-bold text-stone-900 flex items-center"><MapPin size={12} className="mr-1"/> China / Cambodia</span>
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
                            to={`/inquire?subject=Portfolio_Inquiry&product=${encodeURIComponent(getStr(activeProduct, 'name'))}`}
                            className="inline-block bg-[#281815] text-white px-10 py-4 font-bold uppercase tracking-widest text-xs hover:bg-safety-700 transition-colors shadow-lg"
                          >
                              {t.collections.pdp.inquireOrder}
                          </Link>
                      </div>
                  </div>

                  {/* Right: Gallery */}
                  <div className="lg:col-span-7 order-1 lg:order-2 space-y-8">
                      <div className="w-full bg-stone-100 aspect-[4/3] relative overflow-hidden shadow-2xl border border-stone-200">
                          <img 
                            src={activeProduct.image} 
                            className="w-full h-full object-cover" 
                            alt={getStr(activeProduct, 'name')} 
                          />
                      </div>
                      
                      {activeProduct.images && activeProduct.images.length > 1 && (
                          <div className="grid grid-cols-2 gap-4">
                              {activeProduct.images.slice(1).map((img, idx) => (
                                  <div key={idx} className="aspect-square bg-stone-100 overflow-hidden border border-stone-200">
                                      <img src={img} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt="Detail" />
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      ) : (
          /* --- MAIN GALLERY VIEW (Updated to 4 Blocks) --- */
          <div className="container mx-auto px-6 md:px-12 py-12">
              
              {curatedSections.map((section) => {
                // Fetch products with optional limit and offset
                const offset = (section as any).offset || 0;
                const products = getProductsByCategory(section.categoryIds, section.limit, offset);
                
                if (products.length === 0) return null;

                return (
                  <div 
                    key={section.id} 
                    id={section.id} 
                    className="mb-24 last:mb-0 border-l-2 border-stone-100 pl-4 md:pl-0 md:border-l-0 scroll-mt-32"
                  >
                    {/* Section Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-stone-200">
                       <div className="max-w-2xl">
                          <div className="flex items-center gap-3 mb-2">
                             <span className="text-safety-700 font-mono font-bold text-xl opacity-50">{section.number}</span>
                             <h2 className="font-serif text-3xl text-stone-900">{getStr(section, 'title')}</h2>
                          </div>
                          <p className="text-stone-500 font-light text-sm tracking-wide md:pl-10">
                             {getStr(section, 'desc')}
                          </p>
                       </div>
                       <div className="hidden md:block">
                          <Link to={`/inquire?subject=${section.title}`} className="text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-safety-700 flex items-center transition-colors">
                             {language === 'zh' ? '咨询此类项目' : 'Inquire Project'} <ArrowRight size={14} className="ml-2"/>
                          </Link>
                       </div>
                    </div>

                    {/* Simplified Grid: 3 Columns max */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       {products.map((product, idx) => (
                          <div 
                             key={idx} 
                             className="group cursor-pointer flex flex-col"
                             onClick={() => {
                               setActiveProduct(product);
                               window.scrollTo({ top: 0, behavior: 'smooth' });
                             }}
                          >
                             <div className="aspect-[4/3] bg-stone-50 overflow-hidden border border-stone-200 relative mb-4 transition-all duration-500 shadow-sm hover:shadow-xl">
                                <img 
                                  src={product.image} 
                                  alt={getStr(product, 'name')} 
                                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/10 transition-colors"></div>
                                <div className="absolute bottom-0 left-0 w-full p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-white/95 backdrop-blur border-t border-stone-100">
                                   <span className="text-[10px] font-bold uppercase tracking-widest text-stone-900 flex items-center justify-between">
                                      {language === 'zh' ? '查看详情' : 'View Details'} <ArrowRight size={12}/>
                                   </span>
                                </div>
                             </div>
                             
                             <div className="text-left px-1">
                                 <h3 className="font-serif text-lg text-stone-900 group-hover:text-safety-700 transition-colors truncate">
                                   {getStr(product, 'name')}
                                 </h3>
                                 <p className="text-[10px] uppercase tracking-widest text-stone-400 mt-1 line-clamp-1">
                                   {getStr(product, 'description')}
                                 </p>
                             </div>
                          </div>
                       ))}
                    </div>
                  </div>
                );
              })}

              {/* Empty State */}
              {mergedCategories.every(c => c.subCategories.every(s => !s.variants || s.variants.length === 0)) && (
                  <div className="text-center py-24 border border-dashed border-stone-300 bg-stone-50">
                      <p className="text-stone-400 text-sm uppercase tracking-widest">Portfolio is currently being updated.</p>
                  </div>
              )}
          </div>
      )}
    </div>
  );
};

export default Portfolio;
