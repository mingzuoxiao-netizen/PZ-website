import React, { useState } from 'react';
import { Edit, Trash2, Search, PackageX, X, LayoutGrid } from 'lucide-react';
import { ProductVariant, Category } from '../../../types';
import { resolveImage } from '../../../utils/imageResolver';

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
    items, categories, onEdit, onDelete, onBack 
}) => {
  const [search, setSearch] = useState('');

  const safeItems = Array.isArray(items) ? items.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    (i.code && i.code.toLowerCase().includes(search.toLowerCase()))
  ) : [];

  return (
    <div className="animate-fade-in">
       <div className="flex items-center justify-between mb-10">
          <div className="relative group max-w-md w-full">
              <div className="flex items-center bg-white border border-stone-200 rounded-sm shadow-sm transition-all focus-within:border-stone-900 focus-within:ring-4 focus-within:ring-stone-900/5 overflow-hidden">
                  <div className="pl-4 text-stone-400 group-focus-within:text-stone-900"><Search size={18} /></div>
                  <input 
                    type="text" 
                    placeholder="Search Registry (Name or Code)..." 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                    className="pl-3 pr-4 py-4 w-full text-sm focus:outline-none placeholder-stone-400 text-stone-900 bg-transparent font-mono" 
                  />
                  {search && <button onClick={() => setSearch('')} className="pr-4 text-stone-300 hover:text-stone-600 transition-colors"><X size={16} /></button>}
              </div>
          </div>
          <div className="text-[10px] font-mono text-stone-400 font-bold uppercase tracking-widest">
            {safeItems.length} Entries Loaded
          </div>
       </div>

       <div className="bg-white border border-stone-200 shadow-sm rounded-sm">
            <div className="divide-y divide-stone-100">
              {safeItems.length === 0 ? (
                  <div className="py-32 flex flex-col items-center justify-center text-stone-400">
                      <PackageX size={48} strokeWidth={1} className="mb-4 opacity-20" />
                      <p className="font-mono text-[10px] uppercase tracking-widest">No matching registry data found.</p>
                  </div>
              ) : (
                safeItems.map((item) => {
                    const imageUrl = resolveImage(item.images[0]);
                    const category = categories.find(c => c.id === item.category);
                    
                    return (
                    <div key={item.id} className="p-4 hover:bg-stone-50 transition-colors flex items-center gap-6 group">
                        <div className="w-14 h-14 bg-stone-100 flex-shrink-0 border border-stone-200 overflow-hidden relative rounded-sm">
                            {imageUrl ? <img src={imageUrl} alt="" className="w-full h-full object-cover mix-blend-multiply" /> : <div className="w-full h-full flex items-center justify-center text-stone-300 text-[8px]">NULL</div>}
                        </div>
                        
                        <div className="flex-grow min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                                <h4 className="font-bold text-stone-900 text-sm truncate">{item.name}</h4>
                                <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded
                                    ${item.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}
                                `}>
                                    {item.status}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 font-mono text-[10px]">
                                <span className="text-stone-400 bg-stone-100 px-1 rounded uppercase">{item.code || "UNC-00"}</span>
                                <span className="text-stone-300">/</span>
                                <span className="text-stone-500 uppercase tracking-tight">{category?.title || 'Unknown Set'}</span>
                            </div>
                        </div>

                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => onEdit(item)} className="p-2 text-stone-400 hover:text-stone-900 hover:bg-white border border-transparent hover:border-stone-200 transition-all rounded-sm"><Edit size={16} /></button>
                            {onDelete && <button onClick={() => item.id && onDelete(item.id)} className="p-2 text-stone-400 hover:text-red-600 hover:bg-white border border-transparent hover:border-stone-200 transition-all rounded-sm"><Trash2 size={16} /></button>}
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