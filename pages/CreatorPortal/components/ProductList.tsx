
import React, { useState } from 'react';
import { Edit, Trash2, Plus, Search, ArrowLeft, Bird, PackageX, X } from 'lucide-react';
import { ProductVariant, Category } from '../../../types';
import { resolveImage } from '../../../utils/imageResolver';
import { useLanguage } from '../../../contexts/LanguageContext';

interface ProductListProps {
  items: ProductVariant[];
  categories: Category[];
  categoryTitle?: string;
  onEdit: (item: ProductVariant) => void;
  onDelete?: (id: string) => void;
  onCreate: () => void;
  onBack: () => void;
  lang: 'en' | 'zh';
}

const ProductList: React.FC<ProductListProps> = ({ 
    items, categories, categoryTitle, onEdit, onDelete, onCreate, onBack 
}) => {
  const [search, setSearch] = useState('');
  const { t } = useLanguage();
  const txt = t.creator.inventory;
  const statusLabels = t.creator.statusLabels;

  const safeItems = Array.isArray(items) ? items.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    (i.code && i.code.toLowerCase().includes(search.toLowerCase()))
  ) : [];

  const getStatusLabel = (status: string | undefined) => {
      const s = status?.toLowerCase() || 'draft';
      if (s === 'published') return statusLabels.published;
      if (s === 'pending') return statusLabels.pending;
      if (s === 'rejected') return statusLabels.rejected;
      return statusLabels.draft;
  };

  return (
    <div className="animate-fade-in">
       <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-8 gap-6">
          <div>
              <button onClick={onBack} className="text-stone-400 hover:text-stone-900 text-xs font-bold uppercase tracking-widest flex items-center mb-2 transition-colors group"><ArrowLeft size={14} className="mr-1 group-hover:-translate-x-1 transition-transform"/> {txt.backCategories}</button>
              <h2 className="font-serif text-3xl text-stone-900 flex items-center gap-3">{categoryTitle || "Products"} <span className="bg-stone-100 text-stone-500 text-sm font-sans px-2 py-1 rounded-full font-bold">{safeItems.length}</span></h2>
          </div>
          <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
            <div className="relative flex-grow md:flex-grow-0 group">
                <div className="flex items-center bg-white border border-stone-200 rounded-sm shadow-sm transition-all duration-300 focus-within:border-amber-700 focus-within:ring-1 focus-within:ring-amber-700/20 overflow-hidden">
                    <div className="pl-3 text-stone-400 group-focus-within:text-amber-700 transition-colors"><Search size={18} /></div>
                    <input type="text" placeholder={txt.search} value={search} onChange={e => setSearch(e.target.value)} className="pl-3 pr-4 py-3 w-full md:w-64 text-sm focus:outline-none placeholder-stone-400 text-stone-900 bg-transparent" />
                    {search && <button onClick={() => setSearch('')} className="pr-2 text-stone-300 hover:text-stone-600 transition-colors"><X size={14} /></button>}
                </div>
            </div>
            <button onClick={onCreate} className="bg-stone-900 text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-amber-700 transition-all flex items-center justify-center whitespace-nowrap shadow-md hover:shadow-lg"><Plus size={16} className="mr-2" /> {txt.createProduct}</button>
          </div>
       </div>
       <div className="bg-white border border-stone-200 shadow-sm rounded-sm overflow-hidden min-h-[500px]">
            <div className="divide-y divide-stone-100 h-full">
              {safeItems.length === 0 ? (
                  <div className="h-full min-h-[500px] flex flex-col items-center justify-center p-12 bg-gradient-to-b from-white to-stone-50/50"><div className="relative mb-10 group cursor-default"><div className="absolute inset-0 bg-stone-100 rounded-full scale-[1.4] opacity-60 animate-pulse"></div><div className="relative w-28 h-28 bg-white border-2 border-stone-100 rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.05)] z-10"><PackageX strokeWidth={1} size={48} className="text-stone-300" /></div></div><h3 className="font-serif text-3xl text-stone-900 mb-4 tracking-tight">{txt.noMatchTitle}</h3><p className="text-stone-500 max-w-md text-center text-sm leading-relaxed mb-10 font-light">{txt.noMatchDesc}</p></div>
              ) : (
                safeItems.map((item) => {
                    const imageUrl = resolveImage(item.images[0]);
                    const categoryName = categories.find(c => c.id === item.category)?.title || item.category;
                    return (
                    <div key={item.id} className="p-4 hover:bg-stone-50 transition-colors flex items-center gap-6 group">
                        <div className="w-16 h-16 bg-stone-100 flex-shrink-0 border border-stone-200 overflow-hidden relative">{imageUrl ? <img src={imageUrl} alt="" className="w-full h-full object-cover mix-blend-multiply group-hover:scale-110 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-stone-300 text-[10px]">NO IMG</div>}</div>
                        <div className="flex-grow min-w-0"><h4 className="font-bold text-stone-900 text-sm group-hover:text-amber-700 transition-colors truncate pr-4">{item.name}</h4><div className="flex items-center gap-3 mt-1.5 flex-wrap"><span className="font-mono text-[10px] text-stone-400 bg-stone-100 px-1.5 rounded">{item.code || "NO-CODE"}</span><span className="text-[10px] text-stone-500 uppercase tracking-wide border-l border-stone-200 pl-3">{categoryName}</span><span className={`uppercase font-bold text-[9px] tracking-wider px-2 py-0.5 rounded-full ${item.status === 'published' ? 'bg-green-100 text-green-700' : item.status === 'pending' ? 'bg-amber-100 text-amber-700' : item.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-stone-200 text-stone-500'}`}>{getStatusLabel(item.status)}</span></div></div>
                        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100"><button onClick={() => onEdit(item)} className="p-2 text-stone-400 hover:text-amber-700 hover:bg-white border border-transparent hover:border-stone-200 rounded transition-all"><Edit size={18} /></button>{onDelete && <button onClick={() => item.id && onDelete(item.id)} className="p-2 text-stone-400 hover:text-red-600 hover:bg-white border border-transparent hover:border-stone-200 rounded transition-all"><Trash2 size={18} /></button>}</div>
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
