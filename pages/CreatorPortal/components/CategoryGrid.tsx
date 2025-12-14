
import React from 'react';
import { Layers, ChevronRight, Package, Plus } from 'lucide-react';
import { Category, ProductVariant } from '../../../types';
import { getAssetUrl } from '../../../utils/getAssetUrl';

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
                className="group bg-white border border-stone-200 hover:border-amber-700 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md flex flex-col relative overflow-hidden"
            >
                {/* Background Image with Overlay */}
                <div className="h-32 w-full relative bg-stone-100 overflow-hidden">
                    <img 
                        src={getAssetUrl(cat.image)} 
                        alt={cat.title} 
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" 
                    />
                    <div className="absolute inset-0 bg-stone-900/10 group-hover:bg-transparent transition-colors"></div>
                </div>

                {/* Content */}
                <div className="p-6 flex-grow flex flex-col justify-between relative bg-white">
                    <div className="absolute -top-6 right-6 bg-stone-900 text-white w-12 h-12 flex items-center justify-center rounded-full shadow-lg group-hover:bg-amber-700 transition-colors">
                        <span className="font-mono font-bold text-sm">{count}</span>
                    </div>

                    <div>
                        <h3 className="font-serif text-xl text-stone-900 mb-1 group-hover:text-amber-700 transition-colors">{cat.title}</h3>
                        <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">{cat.subtitle}</p>
                    </div>

                    <div className="mt-6 pt-6 border-t border-stone-100 flex items-center text-stone-400 text-xs font-bold uppercase tracking-widest group-hover:text-stone-900 transition-colors">
                        <Package size={14} className="mr-2"/> Manage Products
                    </div>
                </div>
            </div>
          );
        })}

        {/* Uncategorized / All Items Catch-all (Optional, helps find orphans) */}
        <div 
            onClick={onSelectAll}
            className="group bg-stone-50 border-2 border-dashed border-stone-300 hover:border-stone-400 transition-all cursor-pointer flex flex-col items-center justify-center p-8 min-h-[200px]"
        >
            <div className="bg-white p-4 rounded-full mb-4 shadow-sm group-hover:scale-110 transition-transform">
                <Layers size={24} className="text-stone-400" />
            </div>
            <h3 className="font-bold text-stone-600 uppercase tracking-widest text-sm mb-1">Master View</h3>
            <p className="text-stone-400 text-xs">View all {products.length} items</p>
        </div>
      </div>
    </div>
  );
};

export default CategoryGrid;
