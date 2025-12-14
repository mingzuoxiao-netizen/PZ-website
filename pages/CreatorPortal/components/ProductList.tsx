
import React, { useState } from 'react';
import { Edit, Trash2, Plus, Search, ArrowLeft } from 'lucide-react';
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

  return (
    <div className="animate-fade-in">
       {/* Header with Back Button and Create Button */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
              <button 
                onClick={onBack}
                className="text-stone-400 hover:text-stone-900 text-xs font-bold uppercase tracking-widest flex items-center mb-2 transition-colors"
              >
                <ArrowLeft size={14} className="mr-1"/> Back to Categories
              </button>
              <h2 className="font-serif text-2xl text-stone-900">
                {categoryTitle || "Products"} 
                <span className="text-stone-400 ml-3 text-lg font-sans">({safeItems.length})</span>
              </h2>
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-grow md:flex-grow-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input 
                type="text" 
                placeholder={t.creator.inventory.search} 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 pr-4 py-3 border border-stone-200 rounded-sm w-full md:w-64 text-sm focus:outline-none focus:border-amber-700"
                />
            </div>
            <button 
                onClick={onCreate}
                className="bg-stone-900 text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-amber-700 transition-colors flex items-center whitespace-nowrap shadow-md"
            >
                <Plus size={16} className="mr-2" /> {t.creator.form.create}
            </button>
          </div>
       </div>

       {/* List Container */}
       <div className="bg-white border border-stone-200 shadow-sm rounded-sm overflow-hidden">
            <div className="divide-y divide-stone-100">
              {safeItems.length === 0 ? (
                  <div className="p-12 text-center text-stone-400">
                      <p className="mb-4">No products found in this category.</p>
                      <button onClick={onCreate} className="text-amber-700 underline text-sm font-bold">Create the first one</button>
                  </div>
              ) : (
                safeItems.map((item) => {
                    // UI RULE: Strictly use images array
                    const imageUrl = getAssetUrl(item.images[0]);
                    const categoryName = categories.find(c => c.id === item.category)?.title || item.category;

                    return (
                    <div key={item.id} className="p-4 hover:bg-stone-50 transition-colors flex items-center gap-6 group">
                        <div className="w-16 h-16 bg-stone-100 flex-shrink-0 border border-stone-100">
                            {imageUrl && <img src={imageUrl} alt="" className="w-full h-full object-cover mix-blend-multiply" />}
                        </div>
                        <div className="flex-grow">
                            <h4 className="font-bold text-stone-900 text-sm group-hover:text-amber-700 transition-colors">{item.name}</h4>
                            <div className="flex items-center text-xs text-stone-500 mt-1 space-x-4">
                                <span className="font-mono text-stone-400">{item.code || "NO-CODE"}</span>
                                <span className="bg-stone-100 px-2 py-0.5 rounded text-[10px] uppercase tracking-wide">{categoryName}</span>
                                <span className={`uppercase font-bold text-[10px] ${item.status === 'published' ? 'text-green-600' : 'text-stone-400'}`}>
                                    {item.status === 'published' ? 'Live' : item.status}
                                </span>
                            </div>
                        </div>
                        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => onEdit(item)} className="p-2 text-stone-400 hover:text-amber-700 hover:bg-amber-50 rounded transition-all" title="Edit">
                                <Edit size={18} />
                            </button>
                            <button onClick={() => item.id && onDelete(item.id)} className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition-all" title="Delete">
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
