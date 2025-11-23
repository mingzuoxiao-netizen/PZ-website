import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronRight, LayoutGrid, Home } from 'lucide-react';
import { Category, SubCategory } from '../types';
import { Link } from 'react-router-dom';
import { categories } from '../data/inventory';
import { useLanguage } from '../contexts/LanguageContext';

const Collections: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeSubCategory, setActiveSubCategory] = useState<SubCategory | null>(null);
  const { t, language } = useLanguage();

  // Scroll to top when switching main categories
  useEffect(() => {
    if (activeCategory) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeCategory]);

  const handleCategoryClick = (cat: Category) => {
    setActiveCategory(cat);
    setActiveSubCategory(null);
  };

  const handleSubCategoryClick = (sub: SubCategory) => {
    if (sub.variants && sub.variants.length > 0) {
        setActiveSubCategory(sub);
    }
  };

  const resetToOverview = () => {
    setActiveCategory(null);
    setActiveSubCategory(null);
  };

  const resetToCategory = () => {
    setActiveSubCategory(null);
  };

  // Helper to get translated string
  const getStr = (obj: any, key: string) => {
    if (language === 'zh' && obj[`${key}_zh`]) {
      return obj[`${key}_zh`];
    }
    return obj[key];
  };

  // Breadcrumb Component
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
          <span className="text-stone-900">{getStr(activeSubCategory, 'name')}</span>
        </>
      )}
    </div>
  );

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

        {/* Level 1: Main Grid View (Overview) */}
        {!activeCategory && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((cat) => (
              <div 
                key={cat.id} 
                onClick={() => handleCategoryClick(cat)}
                className="group cursor-pointer relative overflow-hidden bg-white shadow-sm hover:shadow-2xl transition-all duration-500 aspect-[4/5] md:aspect-[3/4]"
              >
                {/* Image Container */}
                <div className="absolute inset-0 w-full h-full overflow-hidden">
                  <div className="absolute inset-0 bg-stone-900/10 group-hover:bg-stone-900/0 transition-colors z-10"></div>
                  <img 
                    src={cat.image} 
                    alt={cat.title} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                </div>
                
                {/* Content Overlay */}
                <div className="absolute inset-0 z-20 flex flex-col justify-end p-8 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-transparent opacity-90 hover:opacity-100 transition-opacity">
                   <span className="text-amber-200 text-[10px] uppercase tracking-[0.2em] font-bold mb-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">0{categories.indexOf(cat) + 1} — {t.collections.collection}</span>
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

        {/* Level 2 & 3: Category Detail View with Sidebar */}
        {activeCategory && (
          <div className="animate-fade-in">
            <Breadcrumbs />
            
            <div className="flex flex-col lg:flex-row gap-12">
                
                {/* Sidebar Navigation (Desktop) */}
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
                                    disabled={!sub.variants} // Disable if no variants to show? Or maybe just show details. 
                                    className={`text-left px-4 py-3 text-sm transition-all border-l-2 flex justify-between items-center group
                                        ${activeSubCategory?.name === sub.name
                                            ? 'border-stone-900 text-stone-900 bg-white shadow-sm font-bold'
                                            : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                                        }
                                        ${!sub.variants ? 'opacity-50 cursor-default' : ''}
                                    `}
                                >
                                    {getStr(sub, 'name')}
                                    {sub.variants && (
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

                {/* Mobile Subcategory Menu (Horizontal Scroll) */}
                <div className="lg:hidden mb-8 -mx-6 px-6 overflow-x-auto">
                    <div className="flex space-x-2">
                        <button 
                            onClick={resetToCategory}
                            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap border transition-colors
                                ${!activeSubCategory ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-600 border-stone-200'}`}
                        >
                            {t.collections.overview}
                        </button>
                        {activeCategory.subCategories.map((sub, idx) => sub.variants && (
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

                {/* Main Content Area */}
                <div className="flex-1 min-h-[500px]">
                    {activeSubCategory ? (
                        // Level 3: Variants View
                        <div className="animate-fade-in-up">
                            <div className="mb-8 border-b border-stone-200 pb-8">
                                <h2 className="font-serif text-4xl text-stone-900 mb-4">{getStr(activeSubCategory, 'name')}</h2>
                                <p className="text-stone-600 text-lg font-light leading-relaxed max-w-2xl">{getStr(activeSubCategory, 'description')}</p>
                            </div>

                            <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-6">{t.collections.availableSpecs}</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {activeSubCategory.variants?.map((variant, idx) => (
                                    <div key={idx} className="bg-white group border border-stone-100 hover:border-amber-700/20 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full">
                                        <div className="aspect-[4/3] w-full overflow-hidden bg-stone-100 relative">
                                            <img 
                                                src={variant.image} 
                                                alt={variant.name} 
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"></div>
                                        </div>
                                        <div className="p-6 flex-grow flex flex-col justify-center">
                                            <h3 className="font-serif text-xl text-stone-900 mb-2">{getStr(variant, 'name')}</h3>
                                            <p className="text-stone-500 text-sm leading-relaxed">{getStr(variant, 'description')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        // Level 2: Subcategories Grid (Overview)
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
                                    className={`group bg-white border border-stone-100 shadow-sm transition-all duration-300 ${sub.variants ? 'cursor-pointer hover:shadow-xl hover:border-amber-700/30' : 'opacity-80'}`}
                                 >
                                    <div className="aspect-[4/3] overflow-hidden bg-stone-100 relative">
                                       <img 
                                         src={sub.image} 
                                         alt={sub.name} 
                                         className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                       />
                                       <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                                       
                                       {sub.variants && (
                                           <div className="absolute top-4 right-4 bg-white/90 backdrop-blur text-stone-900 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                                               <LayoutGrid size={16} />
                                           </div>
                                       )}
                                    </div>
                                    <div className="p-6">
                                       <h3 className="font-serif text-xl text-stone-900 group-hover:text-amber-700 transition-colors mb-2">{getStr(sub, 'name')}</h3>
                                       <p className="text-stone-500 text-sm leading-relaxed mb-4">{getStr(sub, 'description')}</p>
                                       {sub.variants && (
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
          </div>
        )}

      </div>
    </div>
  );
};

export default Collections;