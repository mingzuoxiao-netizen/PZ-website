
import React, { useState } from 'react';
import { Edit, Trash2, Plus, Search } from 'lucide-react';
import { ProductVariant, Category } from '../../../types';
import { getAssetUrl } from '../../../utils/getAssetUrl';
import { useLanguage } from '../../../contexts/LanguageContext';

interface ProductListProps {
  items: ProductVariant[];
  categories: Category[];
  onEdit: (item: ProductVariant) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}

const ProductList: React.FC<ProductListProps> = ({ items, categories, onEdit, onDelete, onCreate }) => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');

  // Defensive: Ensure items is an array
  const safeItems = Array.isArray(items) ? items.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    (i.code && i.code.toLowerCase().includes(search.toLowerCase()))
  ) : [];

  return (
    <div className="animate-fade-in">
       <div className="flex justify-between items-center mb-8">
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
             <input 
               type="text" 
               placeholder={t.creator.inventory.search} 
               value={search}
               onChange={e => setSearch(e.target.value)}
               className="pl-10 pr-4 py-3 border border-stone-200 rounded-sm w-80 text-sm focus:outline-none focus:border-amber-700"
             />
          </div>
          <button 
            onClick={onCreate}
            className="bg-stone-900 text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-amber-700 transition-colors flex items-center"
          >
             <Plus size={16} className="mr-2" /> {t.creator.form.create}
          </button>
       </div>

       <div className="bg-white border border-stone-200 shadow-sm rounded-sm overflow-hidden">
            <div className="divide-y divide-stone-100">
              {safeItems.length === 0 ? (
                  <div className="p-8 text-center text-stone-500">{t.creator.inventory.noItems}</div>
              ) : (
                safeItems.map((item) => {
                    // UI RULE: Strictly use images array
                    const imageUrl = getAssetUrl(item.images[0]);
                    const categoryName = categories.find(c => c.id === item.category)?.title || item.category;

                    return (
                    <div key={item.id} className="p-4 hover:bg-stone-50 transition-colors flex items-center gap-6">
                        <div className="w-16 h-16 bg-stone-100 flex-shrink-0">
                            {imageUrl && <img src={imageUrl} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-grow">
                            <h4 className="font-bold text-stone-900 text-sm">{item.name}</h4>
                            <div className="flex items-center text-xs text-stone-500 mt-1 space-x-4">
                                <span>{item.code}</span>
                                <span className="bg-stone-100 px-2 py-0.5 rounded">{categoryName}</span>
                                <span className="text-stone-400">{item.status}</span>
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <button onClick={() => onEdit(item)} className="p-2 text-stone-400 hover:text-amber-700 transition-colors">
                                <Edit size={18} />
                            </button>
                            <button onClick={() => item.id && onDelete(item.id)} className="p-2 text-stone-400 hover:text-red-600 transition-colors">
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
