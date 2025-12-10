
import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ChevronRight, LayoutGrid, Home, Plus, Minus, Download, FileText, Share2, Ruler, ArrowUpRight, BoxSelect } from 'lucide-react';
import { Category, SubCategory, ProductVariant } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { categories as staticCategories } from '../data/inventory';
import { useLanguage } from '../contexts/LanguageContext';

const Collections: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeSubCategory, setActiveSubCategory] = useState<SubCategory | null>(null);
  // New State for Product Detail View
  const [activeProduct, setActiveProduct] = useState<ProductVariant | null>(null);
  
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  // Dynamic Data Logic: Merge Static Categories + Custom Structure + Custom Items
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
                            name: item.name,
                            name_zh: item.name_zh,
                            description: item.description,
                            description_zh: item.description_zh,
                            image: item.image
                        });
                    }
                }
            });
        }
    } catch (e) {
        console.error("Error loading custom inventory", e);
    }

    return combined;
  }, [staticCategories]);

  // Update active states if data changes
  useEffect(() => {
      if(activeCategory) {
          const updatedCat = mergedCategories.find(c => c.id === activeCategory.id);
          if(updatedCat) setActiveCategory(updatedCat);
          
          if(activeSubCategory) {
              const updatedSub = updatedCat?.subCategories.find(s => s.name === activeSubCategory.name);
              if(updatedSub) setActiveSubCategory(updatedSub);
          }
      }
  }, [mergedCategories]);

  // Scroll to top on transitions
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeCategory, activeProduct]); // Added activeProduct to dependency

  const handleCategoryClick = (cat: Category) => {
    setActiveCategory(cat);
    setActiveSubCategory(null);
    setActiveProduct(null);
  };

  const handleSubCategoryClick = (sub: SubCategory) => {
    setActiveSubCategory(sub);
    setActiveProduct(null);
  };

  const handleProductClick = (product: ProductVariant) => {
    setActiveProduct(product);
  }

  const resetToOverview = () => {
    setActiveCategory(null);
    setActiveSubCategory(null);
    setActiveProduct(null);
  };

  const resetToCategory = () => {
    setActiveSubCategory(null);
    setActiveProduct(null);
  };

  const resetToSubCategory = () => {
    setActiveProduct(null);
  };

  const getStr = (obj: any, key: string) => {
    if (language === 'zh' && obj[`${key}_zh`]) {
      return obj[`${key}_zh`];
    }
    return obj[key];
  };

  // --- COMPONENT: Accordion Item ---
  const AccordionItem = ({ title, children, defaultOpen = false }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
      <div className="border-t border-stone-200">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full py-5 flex justify-between items-center text-left group"
        >
          <span className="font-sans font-bold text-sm uppercase tracking-widest text-stone-900 group-hover:text-amber-700 transition-colors">
            {title}
          </span>
          {isOpen ? <Minus size={16} className="text-stone-400" /> : <Plus size={16} className="text-stone-400" />}
        </button>
        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[800px] opacity-100 pb-8' : 'max-h-0 opacity-0'}`}>
          {children}
        </div>
      </div>
    );
  };

  // --- BREADCRUMBS ---
  const Breadcrumbs = () => (
    <div className="flex items-center text-xs font-bold uppercase tracking-widest text-stone-500 mb-8 overflow-x-auto whitespace-nowrap pb-2">
      <button onClick={resetToOverview} className="hover:text-amber-700 flex items-center transition-colors">
        <Home size={12} className="mr-2" /> {t.collections.title}
      </button>
      
      {activeCategory && (
        <>
          <ChevronRight size={12} className="mx-3 text-stone-300" />
          <button 
            onClick={resetToCategory} 
            className={`transition-colors ${activeSubCategory ? 'hover:text-amber-700' : 'text-stone-900 cursor-default'}`}
          >
            {getStr(activeCategory, 'title')}
          </button>
        </>
      )}

      {activeSubCategory && (
        <>
          <ChevronRight size={12} className="mx-3 text-stone-300" />
          <button
            onClick={resetToSubCategory}
            className={`transition-colors ${activeProduct ? 'hover:text-amber-700' : 'text-stone-900 cursor-default'}`}
          >
            {getStr(activeSubCategory, 'name')}
          </button>
        </>
      )}

      {activeProduct && (
        <>
          <ChevronRight size={12} className="mx-3 text-stone-300" />
          <span className="text-stone-900">{getStr(activeProduct, 'name')}</span>
        </>
      )}
    </div>
  );

  // --- RENDER ---
  return (
    <div className="pt-32 pb-20 bg-stone-50 min-h-screen">
      <div className="container mx-auto px-6 md:px-12">
        
        {/* Header Section (Only shown on overview) */}
        {!activeCategory && (
          <div className="mb-16 animate-fade-in text-center md:text-left">
             <h1 className="font-serif text-4xl md:text-6xl text-stone-900 mb-4">{t.collections.title}</h1>
             <p className="text-stone-600 max-w-2xl text-lg font-light">
               {t.collections.intro}
             </p>
          </div>
        )}

        {/* VIEW 1: Main Grid (Overview) */}
        {!activeCategory && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mergedCategories.map((cat, idx) => (
              <div 
                key={cat.id || idx} 
                onClick={() => handleCategoryClick(cat)}
                className="group cursor-pointer relative overflow-hidden bg-white shadow-sm hover:shadow-2xl transition-all duration-500 aspect-[4/5] md:aspect-[3/4]"
              >
                <div className="absolute inset-0 w-full h-full overflow-hidden">
                  <div className="absolute inset-0 bg-stone-900/10 group-hover:bg-stone-900/0 transition-colors z-10"></div>
                  <img 
                    src={cat.image} 
                    alt={cat.title} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                </div>
                <div className="absolute inset-0 z-20 flex flex-col justify-end p-8 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-transparent opacity-90 hover:opacity-100 transition-opacity">
                   <span className="text-amber-200 text-[10px] uppercase tracking-[0.2em] font-bold mb-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">0{idx + 1} — {t.collections.collection}</span>
                   <h2 className="text-white font-serif text-2xl md:text-3xl mb-2 leading-tight">{getStr(cat, 'title')}</h2>
                   <p className="text-stone-300 text-xs font-light mb-6 opacity-80 line-clamp-2">{getStr(cat, 'subtitle')}</p>
                   <div className="flex items-center text-white text-xs uppercase tracking-widest font-bold group-hover:text-amber-200 transition-colors">
                     {t.collections.viewProducts} <ChevronRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CATEGORY & PRODUCT VIEWS */}
        {activeCategory && (
          <div className="animate-fade-in">
            <Breadcrumbs />
            
            {activeProduct ? (
              // ==========================================
              // VIEW 3: PRODUCT DETAIL PAGE (PDP)
              // Designed like Carl Hansen / Luxury Furniture
              // ==========================================
              <div className="animate-fade-in">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 relative">
                  
                  {/* LEFT: HERO GALLERY (Sticky on Mobile, Scroll on Desktop) */}
                  <div className="lg:col-span-8 flex flex-col gap-8">
                     {/* Main Hero Image */}
                     <div className="w-full bg-stone-100 relative overflow-hidden group cursor-zoom-in">
                        <img 
                          src={activeProduct.image} 
                          alt={getStr(activeProduct, 'name')} 
                          className="w-full h-auto object-cover transform transition-transform duration-1000 group-hover:scale-105"
                        />
                     </div>

                     {/* Detail Shots (Mocked with the same image for now) */}
                     <div className="grid grid-cols-2 gap-4">
                        <div className="aspect-[4/3] bg-stone-100 overflow-hidden">
                           <img src={activeProduct.image} className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity grayscale hover:grayscale-0" alt="Detail 1" />
                        </div>
                        <div className="aspect-[4/3] bg-stone-100 overflow-hidden">
                           <img src={activeProduct.image} className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity scale-125" alt="Detail 2" />
                        </div>
                     </div>

                     {/* SECTION 3: DIMENSIONS (Line Drawing) */}
                     <div className="py-12 border-t border-stone-200 mt-8">
                        <h3 className="font-bold text-xs uppercase tracking-widest text-stone-400 mb-8 flex items-center">
                           <Ruler size={16} className="mr-2" /> Technical Dimensions
                        </h3>
                        <div className="bg-white p-8 border border-stone-200 flex justify-center items-center h-64 md:h-80">
                           {/* Placeholder for SVG Line Drawing */}
                           <div className="opacity-30 flex flex-col items-center">
                              <svg width="200" height="150" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="stroke-stone-900 stroke-1">
                                 <rect x="50" y="50" width="100" height="10" />
                                 <line x1="60" y1="60" x2="60" y2="140" />
                                 <line x1="140" y1="60" x2="140" y2="140" />
                                 <line x1="50" y1="40" x2="150" y2="40" strokeDasharray="4 4" />
                                 <text x="100" y="30" textAnchor="middle" className="fill-stone-900 text-[10px] font-sans">120 cm</text>
                                 <line x1="160" y1="50" x2="160" y2="140" strokeDasharray="4 4" />
                                 <text x="175" y="100" textAnchor="middle" className="fill-stone-900 text-[10px] font-sans">75 cm</text>
                              </svg>
                              <span className="text-xs font-mono mt-4 text-stone-500">Digital Line Drawing Unavailable</span>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* RIGHT: STICKY INFO SIDEBAR */}
                  <div className="lg:col-span-4 relative">
                    <div className="sticky top-32 space-y-10">
                      
                      {/* Title & SKU */}
                      <div>
                        <h1 className="font-serif text-3xl md:text-5xl text-stone-900 mb-2 leading-tight">
                           {getStr(activeProduct, 'name')}
                        </h1>
                        <p className="text-xs font-bold uppercase tracking-widest text-stone-400">
                           Ref: PZ-{Math.floor(Math.random() * 9000) + 1000}
                        </p>
                      </div>

                      {/* Variant Selector (Mock) */}
                      <div>
                         <span className="block text-xs font-bold uppercase tracking-wider text-stone-900 mb-3">
                            Material Selection
                         </span>
                         <div className="flex space-x-3">
                            <button className="w-8 h-8 rounded-full bg-[#5B4332] ring-2 ring-offset-2 ring-stone-900" title="Walnut"></button>
                            <button className="w-8 h-8 rounded-full bg-[#C8B78A] hover:ring-2 hover:ring-offset-2 hover:ring-stone-300 transition-all" title="Oak"></button>
                            <button className="w-8 h-8 rounded-full bg-[#1c1917] hover:ring-2 hover:ring-offset-2 hover:ring-stone-300 transition-all" title="Ebonized Ash"></button>
                         </div>
                      </div>

                      {/* Primary Action */}
                      <div className="space-y-4 pt-4">
                        <Link 
                          to={`/inquire?subject=Product_Inquiry&product=${encodeURIComponent(getStr(activeProduct, 'name'))}`}
                          className="block w-full bg-stone-900 text-white text-center py-4 font-bold uppercase tracking-widest text-xs hover:bg-amber-700 transition-colors"
                        >
                          Inquire to Order
                        </Link>
                        <button className="flex items-center justify-center w-full py-3 text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-stone-900 transition-colors border border-transparent hover:border-stone-200">
                           <Share2 size={14} className="mr-2" /> Share Product
                        </button>
                      </div>

                      {/* ACCORDIONS */}
                      <div className="border-b border-stone-200">
                        <AccordionItem title="Description" defaultOpen={true}>
                           <p className="text-stone-600 leading-relaxed text-sm font-light">
                             {getStr(activeProduct, 'description')}
                             <br/><br/>
                             Designed with durability and aesthetic purity in mind. This piece exemplifies our commitment to precision manufacturing, utilizing 5-axis CNC technology and traditional joinery.
                           </p>
                        </AccordionItem>

                        <AccordionItem title="Materials & Construction">
                           <ul className="space-y-2 text-sm text-stone-600 font-light">
                              <li className="flex justify-between border-b border-stone-100 pb-1"><span>Primary Wood</span> <span>FAS North American Hardwood</span></li>
                              <li className="flex justify-between border-b border-stone-100 pb-1"><span>Finish</span> <span>Matte PU / Water-based</span></li>
                              <li className="flex justify-between border-b border-stone-100 pb-1"><span>Joinery</span> <span>Mortise & Tenon / Domino</span></li>
                              <li className="flex justify-between border-b border-stone-100 pb-1"><span>Hardware</span> <span>Soft-close / Heavy-duty</span></li>
                           </ul>
                        </AccordionItem>

                        <AccordionItem title="Downloads">
                           <div className="space-y-3">
                              <a href="#" className="flex items-center text-sm text-stone-600 hover:text-amber-700 transition-colors group">
                                 <FileText size={16} className="mr-3 text-stone-400 group-hover:text-amber-700" />
                                 <span>Product Spec Sheet (PDF)</span>
                                 <Download size={12} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                              </a>
                              <a href="#" className="flex items-center text-sm text-stone-600 hover:text-amber-700 transition-colors group">
                                 <BoxSelect size={16} className="mr-3 text-stone-400 group-hover:text-amber-700" />
                                 <span>3D Model (STEP)</span>
                                 <Download size={12} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                              </a>
                           </div>
                        </AccordionItem>
                      </div>

                    </div>
                  </div>
                </div>

                {/* RELATED PRODUCTS */}
                <div className="mt-32 pt-16 border-t border-stone-200">
                   <h3 className="font-serif text-2xl text-stone-900 mb-8">Related in {getStr(activeSubCategory || activeCategory, activeSubCategory ? 'name' : 'title')}</h3>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {/* Simple logic to show other items in same subcategory or category */}
                      {(activeSubCategory?.variants || activeCategory.subCategories.flatMap(s => s.variants || [])).slice(0, 4).map((rel, i) => (
                        <div 
                          key={i} 
                          className="group cursor-pointer"
                          onClick={() => {
                             setActiveProduct(rel);
                             window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                           <div className="aspect-square bg-stone-100 overflow-hidden mb-4">
                              <img src={rel.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={rel.name} />
                           </div>
                           <h4 className="font-serif text-stone-900 group-hover:text-amber-700 transition-colors">{getStr(rel, 'name')}</h4>
                           <p className="text-xs text-stone-400 uppercase tracking-wide mt-1">View Details</p>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            ) : (
              // ==========================================
              // VIEW 2: CATEGORY / SUBCATEGORY OVERVIEW
              // Sidebar + Grid of Products (Clicking product goes to PDP)
              // ==========================================
              <div className="flex flex-col lg:flex-row gap-12">
                
                {/* Sidebar Navigation */}
                <aside className="hidden lg:block w-64 shrink-0">
                    <div className="sticky top-32">
                        <h3 className="font-serif text-2xl text-stone-900 mb-6 px-4 border-l-4 border-amber-700">{getStr(activeCategory, 'title')}</h3>
                        <nav className="flex flex-col space-y-1">
                            <button 
                                onClick={resetToCategory}
                                className={`text-left px-4 py-3 text-sm uppercase tracking-wider font-bold transition-all border-l-2
                                    ${!activeSubCategory 
                                        ? 'border-stone-900 text-stone-900 bg-white shadow-sm' 
                                        : 'border-transparent text-stone-500 hover:text-stone-900 hover:bg-stone-100'
                                    }`}
                            >
                                {t.collections.overview}
                            </button>
                            {activeCategory.subCategories.map((sub, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSubCategoryClick(sub)}
                                    className={`text-left px-4 py-3 text-sm transition-all border-l-2 flex justify-between items-center group
                                        ${activeSubCategory?.name === sub.name
                                            ? 'border-stone-900 text-stone-900 bg-white shadow-sm font-bold'
                                            : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                                        }
                                    `}
                                >
                                    {getStr(sub, 'name')}
                                    {(sub.variants || []).length > 0 && (
                                        <ChevronRight size={12} className={`opacity-0 group-hover:opacity-100 transition-opacity ${activeSubCategory?.name === sub.name ? 'opacity-100 text-amber-700' : ''}`} />
                                    )}
                                </button>
                            ))}
                        </nav>
                        
                        <div className="mt-12 p-6 bg-stone-100 rounded-sm">
                            <h4 className="font-serif text-stone-900 mb-2">{t.collections.needCatalog}</h4>
                            <p className="text-xs text-stone-500 mb-4 leading-relaxed">{t.collections.catalogDesc}</p>
                            <Link 
                              to="/inquire?subject=Catalog" 
                              className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-amber-700 hover:text-stone-900 transition-colors"
                            >
                              {t.collections.requestPdf} <ChevronRight size={12} className="ml-1" />
                            </Link>
                        </div>
                    </div>
                </aside>

                {/* Mobile Subcategory Menu */}
                <div className="lg:hidden mb-8 -mx-6 px-6 overflow-x-auto">
                    <div className="flex space-x-2">
                        <button 
                            onClick={resetToCategory}
                            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap border transition-colors
                                ${!activeSubCategory ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-600 border-stone-200'}`}
                        >
                            {t.collections.overview}
                        </button>
                        {activeCategory.subCategories.map((sub, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSubCategoryClick(sub)}
                                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap border transition-colors
                                    ${activeSubCategory?.name === sub.name ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-600 border-stone-200'}`}
                            >
                                {getStr(sub, 'name')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 min-h-[500px]">
                    {activeSubCategory ? (
                        // SubCategory Items Grid -> Clicking item goes to PDP
                        <div className="animate-fade-in-up">
                            <div className="mb-8 border-b border-stone-200 pb-8">
                                <h2 className="font-serif text-4xl text-stone-900 mb-4">{getStr(activeSubCategory, 'name')}</h2>
                                <p className="text-stone-600 text-lg font-light leading-relaxed max-w-2xl">{getStr(activeSubCategory, 'description')}</p>
                            </div>

                            <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-6">{t.collections.availableSpecs}</h3>
                            
                            {(activeSubCategory.variants && activeSubCategory.variants.length > 0) ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {activeSubCategory.variants.map((variant, idx) => (
                                        <div 
                                          key={idx} 
                                          onClick={() => handleProductClick(variant)} // GO TO PDP
                                          className="bg-white group border border-stone-100 hover:border-amber-700/20 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full cursor-pointer"
                                        >
                                            <div className="aspect-[4/3] w-full overflow-hidden bg-stone-100 relative">
                                                <img 
                                                    src={variant.image} 
                                                    alt={getStr(variant, 'name')} 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                                                />
                                                {/* Overlay CTA */}
                                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <span className="bg-white text-stone-900 px-6 py-3 text-xs font-bold uppercase tracking-widest">
                                                       View Details
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-6 flex-grow flex flex-col justify-center">
                                                <h3 className="font-serif text-xl text-stone-900 mb-2 group-hover:text-amber-700 transition-colors">{getStr(variant, 'name')}</h3>
                                                <p className="text-stone-500 text-sm leading-relaxed line-clamp-2">{getStr(variant, 'description')}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center bg-stone-50 border border-stone-200 border-dashed">
                                    <p className="text-stone-500 italic">No products currently listed in this category.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        // Category Overview (Subcategories Grid)
                        <div className="animate-fade-in">
                            <div className="mb-10">
                                <h2 className="font-serif text-4xl text-stone-900 mb-4">{getStr(activeCategory, 'title')}</h2>
                                <p className="text-stone-600 text-lg font-light leading-relaxed">{getStr(activeCategory, 'description')}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                               {activeCategory.subCategories.map((sub, idx) => (
                                 <div 
                                    key={idx} 
                                    onClick={() => handleSubCategoryClick(sub)}
                                    className={`group bg-white border border-stone-100 shadow-sm transition-all duration-300 cursor-pointer hover:shadow-xl hover:border-amber-700/30`}
                                 >
                                    <div className="aspect-[4/3] overflow-hidden bg-stone-100 relative">
                                       <img 
                                         src={sub.image} 
                                         alt={sub.name} 
                                         className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                       />
                                       <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                                       
                                       {(sub.variants || []).length > 0 && (
                                           <div className="absolute top-4 right-4 bg-white/90 backdrop-blur text-stone-900 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                                               <LayoutGrid size={16} />
                                           </div>
                                       )}
                                    </div>
                                    <div className="p-6">
                                       <h3 className="font-serif text-xl text-stone-900 group-hover:text-amber-700 transition-colors mb-2">{getStr(sub, 'name')}</h3>
                                       <p className="text-stone-500 text-sm leading-relaxed mb-4">{getStr(sub, 'description')}</p>
                                       {(sub.variants || []).length > 0 && (
                                           <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 flex items-center group-hover:translate-x-1 transition-transform">
                                               {t.collections.viewOptions} <ChevronRight size={12} className="ml-1" />
                                           </span>
                                       )}
                                    </div>
                                 </div>
                               ))}
                            </div>
                        </div>
                    )}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Collections;
