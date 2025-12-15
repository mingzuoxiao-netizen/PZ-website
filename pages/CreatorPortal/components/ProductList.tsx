
import React, { useState } from 'react';
import { Edit, Trash2, Plus, Search, ArrowLeft, Bird, PackageX, X } from 'lucide-react';
import { ProductVariant, Category } from '../../../types';
import { getAssetUrl } from '../../../utils/getAssetUrl';
import { useLanguage } from '../../../contexts/LanguageContext';

interface ProductListProps {
  items: ProductVariant[];
  categories: Category[];
  categoryTitle?: string;
  onEdit: (item: ProductVariant) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  onBack: () => void;
}

const ProductList: React.FC<ProductListProps> = ({ 
    items, categories, categoryTitle, onEdit, onDelete, onCreate, onBack 
}) => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');

  // Defensive: Ensure items is an array
  const safeItems = Array.isArray(items) ? items.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    (i.code && i.code.toLowerCase().includes(search.toLowerCase()))
  ) : [];

  const isSearching = search.trim().length > 0;

  return (
    <div className="animate-fade-in">
       {/* Header with Back Button and Create Button */}
       <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-8 gap-6">
          <div>
              <button 
                onClick={onBack}
                className="text-stone-400 hover:text-stone-900 text-xs font-bold uppercase tracking-widest flex items-center mb-2 transition-colors group"
              >
                <ArrowLeft size={14} className="mr-1 group-hover:-translate-x-1 transition-transform"/> {t.creator.inventory.backCategories}
              </button>
              <h2 className="font-serif text-3xl text-stone-900 flex items-center gap-3">
                {categoryTitle || "Products"} 
                <span className="bg-stone-100 text-stone-500 text-sm font-sans px-2 py-1 rounded-full font-bold">
                    {safeItems.length}
                </span>
              </h2>
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
            {/* Enhanced Search Bar with Eagle Icon */}
            <div className="relative flex-grow md:flex-grow-0 group">
                <div className="flex items-center bg-white border border-stone-200 rounded-sm shadow-sm transition-all duration-300 focus-within:border-amber-700 focus-within:ring-1 focus-within:ring-amber-700/20 overflow-hidden">
                    <div className="pl-3 text-stone-400 group-focus-within:text-amber-700 transition-colors">
                        <Search size={18} />
                    </div>
                    <input 
                        type="text" 
                        placeholder={t.creator.inventory.search} 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-3 pr-4 py-3 w-full md:w-64 text-sm focus:outline-none placeholder-stone-400 text-stone-900 bg-transparent"
                    />
                    {/* Clear Search Button (if searching) */}
                    {isSearching && (
                        <button 
                            onClick={() => setSearch('')}
                            className="pr-2 text-stone-300 hover:text-stone-600 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    )}
                    {/* The requested Eagle Icon ("形象") acting as a decorative seal */}
                    <div className="pr-3 pl-3 border-l border-stone-100 text-stone-300 group-focus-within:text-amber-700 transition-colors flex items-center" title="Eagle Eye View">
                        <Bird size={20} strokeWidth={1.5} />
                    </div>
                </div>
            </div>

            <button 
                onClick={onCreate}
                className="bg-stone-900 text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-amber-700 transition-all flex items-center justify-center whitespace-nowrap shadow-md hover:shadow-lg active:transform active:scale-95"
            >
                <Plus size={16} className="mr-2" /> {t.creator.form.create}
            </button>
          </div>
       </div>

       {/* List Container */}
       <div className="bg-white border border-stone-200 shadow-sm rounded-sm overflow-hidden min-h-[500px]">
            <div className="divide-y divide-stone-100 h-full">
              {safeItems.length === 0 ? (
                  // --- NEW EMPTY STATE ---
                  <div className="h-full min-h-[500px] flex flex-col items-center justify-center p-12 bg-gradient-to-b from-white to-stone-50/50">
                    
                    {/* Graphic Composition */}
                    <div className="relative mb-10 group cursor-default">
                        {/* Outer Ring */}
                        <div className="absolute inset-0 bg-stone-100 rounded-full scale-[1.8] opacity-40 border border-stone-200 dashed-border"></div>
                        {/* Middle Ring with Pulse */}
                        <div className="absolute inset-0 bg-stone-100 rounded-full scale-[1.4] opacity-60 animate-pulse"></div>
                        
                        {/* Center Icon Circle */}
                        <div className="relative w-28 h-28 bg-white border-2 border-stone-100 rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.05)] z-10 group-hover:border-amber-200 group-hover:shadow-[0_10px_30px_rgba(180,83,9,0.15)] group-hover:-translate-y-2 transition-all duration-700 ease-out">
                            {isSearching ? (
                                <Search strokeWidth={1} size={48} className="text-stone-300 group-hover:text-amber-700 transition-colors duration-500" />
                            ) : (
                                <PackageX strokeWidth={1} size={48} className="text-stone-300 group-hover:text-amber-700 transition-colors duration-500" />
                            )}
                        </div>

                        {/* Floating Badge (Bird) */}
                        <div className="absolute -top-2 -right-4 bg-white border border-stone-100 p-2 rounded-full shadow-sm z-20 animate-[bounce_3s_infinite]">
                             <Bird size={16} className="text-amber-700" />
                        </div>
                    </div>

                    {/* Typography */}
                    <h3 className="font-serif text-3xl text-stone-900 mb-4 tracking-tight">
                        {isSearching ? `${t.creator.inventory.noMatchTitle} "${search}"` : t.creator.inventory.emptyTitle}
                    </h3>
                    
                    <p className="text-stone-500 max-w-md text-center text-sm leading-relaxed mb-10 font-light">
                        {isSearching 
                            ? t.creator.inventory.noMatchDesc 
                            : t.creator.inventory.emptyDesc
                        }
                    </p>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-none justify-center">
                        {isSearching && (
                            <button 
                                onClick={() => setSearch('')}
                                className="px-8 py-4 border border-stone-200 bg-white text-stone-500 text-xs font-bold uppercase tracking-widest hover:border-stone-400 hover:text-stone-900 transition-all rounded-sm"
                            >
                                {t.creator.inventory.clearSearch}
                            </button>
                        )}
                        <button 
                            onClick={onCreate}
                            className="px-10 py-4 bg-stone-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-amber-700 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all rounded-sm flex items-center justify-center"
                        >
                            <Plus size={16} className="mr-2" />
                            {isSearching ? t.creator.inventory.createNewAnyway : t.creator.inventory.createProduct}
                        </button>
                    </div>

                    {/* Decorative Footer */}
                    <div className="mt-16 pt-8 border-t border-stone-200/60 w-48 text-center opacity-60">
                        <span className="text-[9px] font-mono text-stone-400 tracking-[0.3em] uppercase block mb-1">
                            System Status
                        </span>
                        <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest flex items-center justify-center gap-2">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Ready
                        </span>
                    </div>
                  </div>
              ) : (
                safeItems.map((item) => {
                    // UI RULE: Strictly use images array
                    const imageUrl = getAssetUrl(item.images[0]);
                    const categoryName = categories.find(c => c.id === item.category)?.title || item.category;

                    return (
                    <div key={item.id} className="p-4 hover:bg-stone-50 transition-colors flex items-center gap-6 group">
                        {/* Thumbnail */}
                        <div className="w-16 h-16 bg-stone-100 flex-shrink-0 border border-stone-200 overflow-hidden relative">
                            {imageUrl ? (
                                <img src={imageUrl} alt="" className="w-full h-full object-cover mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-stone-300 text-[10px]">NO IMG</div>
                            )}
                        </div>
                        
                        {/* Info */}
                        <div className="flex-grow min-w-0">
                            <h4 className="font-bold text-stone-900 text-sm group-hover:text-amber-700 transition-colors truncate pr-4">{item.name}</h4>
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                <span className="font-mono text-[10px] text-stone-400 bg-stone-100 px-1.5 rounded">{item.code || "NO-CODE"}</span>
                                <span className="text-[10px] text-stone-500 uppercase tracking-wide border-l border-stone-200 pl-3">{categoryName}</span>
                                
                                <span className={`uppercase font-bold text-[9px] tracking-wider px-2 py-0.5 rounded-full ${
                                    item.status === 'published' ? 'bg-green-100 text-green-700' : 
                                    item.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                    item.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                    item.status === 'archived' ? 'bg-stone-800 text-stone-200' :
                                    'bg-stone-200 text-stone-500' // Draft / Hidden
                                }`}>
                                    {item.status === 'published' ? 'Live' : item.status || 'Draft'}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                            <button onClick={() => onEdit(item)} className="p-2 text-stone-400 hover:text-amber-700 hover:bg-white border border-transparent hover:border-stone-200 rounded transition-all" title="Edit">
                                <Edit size={18} />
                            </button>
                            <button onClick={() => item.id && onDelete(item.id)} className="p-2 text-stone-400 hover:text-red-600 hover:bg-white border border-transparent hover:border-stone-200 rounded transition-all" title="Delete">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                    );
                })
              )}
            </div>
       </div>
    </div>
  );
};

export default ProductList;
