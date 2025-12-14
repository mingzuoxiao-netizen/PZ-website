
import React from 'react';
import { ChevronRight, Package, Plus, LayoutGrid } from 'lucide-react';
import { Category, ProductVariant } from '../../../types';

interface CategoryGridProps {
  categories: Category[];
  products: ProductVariant[];
  onSelectCategory: (categoryId: string) => void;
  onSelectAll: () => void;
}

const CategoryGrid: React.FC<CategoryGridProps> = ({ categories, products, onSelectCategory, onSelectAll }) => {
  
  // Helper to count items per category
  const getCount = (catId: string) => {
    return products.filter(p => p.category?.toLowerCase() === catId.toLowerCase()).length;
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-end mb-8">
        <div>
            <h2 className="font-serif text-3xl text-stone-900 mb-2">Inventory Management</h2>
            <p className="text-stone-500 text-sm">Select a category to manage existing products or add new ones.</p>
        </div>
        <button 
            onClick={onSelectAll}
            className="text-stone-400 hover:text-stone-900 text-xs font-bold uppercase tracking-widest flex items-center transition-colors"
        >
            View Master List <ChevronRight size={14} className="ml-1"/>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const count = getCount(cat.id);
          return (
            <div 
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className="group bg-white border border-stone-200 hover:border-amber-700 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md flex flex-col p-8 min-h-[220px]"
            >
                <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-stone-50 text-stone-400 rounded-sm group-hover:bg-amber-50 group-hover:text-amber-700 transition-colors">
                        <LayoutGrid size={24} />
                    </div>
                    <span className="font-mono font-bold text-lg text-stone-300 group-hover:text-amber-700 transition-colors">
                        {String(count).padStart(2, '0')}
                    </span>
                </div>

                <div className="mt-auto">
                    <h3 className="font-serif text-2xl text-stone-900 mb-2 group-hover:text-amber-700 transition-colors">{cat.title}</h3>
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">{cat.subtitle}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-stone-400 text-[10px] font-bold uppercase tracking-widest group-hover:text-stone-900 transition-colors">
                    <span>Manage</span>
                    <ChevronRight size={14} className="transform group-hover:translate-x-1 transition-transform"/>
                </div>
            </div>
          );
        })}

        {/* Master View Card */}
        <div 
            onClick={onSelectAll}
            className="group bg-stone-50 border-2 border-dashed border-stone-300 hover:border-stone-400 transition-all cursor-pointer flex flex-col items-center justify-center p-8 min-h-[220px]"
        >
            <div className="bg-white p-4 rounded-full mb-4 shadow-sm group-hover:scale-110 transition-transform">
                <Package size={24} className="text-stone-400" />
            </div>
            <h3 className="font-bold text-stone-600 uppercase tracking-widest text-sm mb-1">Master View</h3>
            <p className="text-stone-400 text-xs">View all {products.length} items</p>
        </div>
      </div>
    </div>
  );
};

export default CategoryGrid;
