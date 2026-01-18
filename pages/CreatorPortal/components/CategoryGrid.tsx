import React from 'react';
import { ChevronRight, LayoutGrid, Plus, ArrowRight } from 'lucide-react';
import { Category, ProductVariant } from '../../../types';

interface CategoryGridProps {
  categories: Category[];
  products: ProductVariant[];
  onSelectCategory: (categoryId: string) => void;
  onSelectAll: () => void;
  onCreateCategory?: () => void;
}

const CategoryGrid: React.FC<CategoryGridProps> = ({ categories, products, onSelectCategory, onSelectAll, onCreateCategory }) => {
  const getCount = (catId: string) => {
    return products.filter(p => (p.category || '').toLowerCase() === catId.toLowerCase()).length;
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-end mb-8">
          <div className="flex items-center gap-3 border-l-4 border-stone-900 pl-4">
            <h2 className="text-xl font-bold text-stone-900 uppercase tracking-widest">Select Collection</h2>
          </div>
          <button 
              onClick={onSelectAll}
              className="text-stone-400 hover:text-stone-900 text-[10px] font-bold uppercase tracking-widest flex items-center transition-colors group"
          >
              View Master Registry <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform"/>
          </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {categories.map((cat) => {
          const count = getCount(cat.id);
          return (
            <div 
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className="group bg-white border border-stone-200 hover:border-stone-900 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl flex flex-col p-10 min-h-[260px] rounded-sm"
            >
                <div className="flex justify-between items-start mb-8">
                    <div className="p-3 bg-stone-50 text-stone-400 rounded-sm group-hover:bg-stone-900 group-hover:text-white transition-colors">
                        <LayoutGrid size={24} />
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="font-mono font-bold text-3xl text-stone-200 group-hover:text-safety-700 transition-colors">
                            {String(count).padStart(2, '0')}
                        </span>
                        <span className="text-[8px] font-bold text-stone-300 uppercase tracking-tighter">SKU Count</span>
                    </div>
                </div>

                <div className="mt-auto">
                    <h3 className="font-serif text-3xl text-stone-900 mb-2 group-hover:text-safety-700 transition-colors leading-tight">{cat.title}</h3>
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{cat.subtitle || 'Production Line'}</p>
                </div>

                <div className="mt-8 pt-4 border-t border-stone-100 flex items-center justify-between text-stone-400 text-[9px] font-bold uppercase tracking-widest group-hover:text-stone-900 transition-colors">
                    <span>Access Registry</span>
                    <ChevronRight size={14} className="transform group-hover:translate-x-1 transition-transform"/>
                </div>
            </div>
          );
        })}

        {onCreateCategory && (
            <div 
                onClick={onCreateCategory}
                className="group bg-stone-100/50 border-2 border-dashed border-stone-200 hover:border-stone-400 hover:bg-white transition-all cursor-pointer flex flex-col items-center justify-center p-10 min-h-[260px] rounded-sm"
            >
                <div className="bg-white p-5 rounded-full mb-6 shadow-sm border border-stone-100 group-hover:scale-110 transition-transform group-hover:border-stone-900">
                    <Plus size={32} className="text-stone-300 group-hover:text-stone-900 transition-colors" />
                </div>
                <h3 className="font-bold text-stone-400 group-hover:text-stone-900 uppercase tracking-[0.2em] text-[10px] mb-2 transition-colors">New Category Request</h3>
                <p className="text-[9px] text-stone-400 group-hover:text-stone-500 transition-colors text-center max-w-[180px]">Submit technical proposal for a new production series.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default CategoryGrid;