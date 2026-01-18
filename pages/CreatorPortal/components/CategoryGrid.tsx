import React from 'react';
import { ChevronRight, Package, Plus, LayoutGrid, ArrowRight } from 'lucide-react';
import { Category, ProductVariant } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';

interface CategoryGridProps {
  categories: Category[];
  products: ProductVariant[];
  onSelectCategory: (categoryId: string) => void;
  onSelectAll: () => void;
  onCreateCategory?: () => void;
}

const CategoryGrid: React.FC<CategoryGridProps> = ({ categories, products, onSelectCategory, onSelectAll, onCreateCategory }) => {
  // 助手函数：统计每个分类的项目数
  const getCount = (catId: string) => {
    return products.filter(p => p.category?.toLowerCase() === catId.toLowerCase()).length;
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-end mb-8">
          <div className="flex items-center gap-3 border-l-4 border-stone-900 pl-4">
            <h2 className="text-xl font-bold text-stone-900 uppercase tracking-wider">选择产品系列</h2>
          </div>
          <button 
              onClick={onSelectAll}
              className="text-stone-400 hover:text-stone-900 text-xs font-bold uppercase tracking-widest flex items-center transition-colors group"
          >
              查看全量注册表 <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform"/>
          </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const count = getCount(cat.id);
          return (
            <div 
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className="group bg-white border border-stone-200 hover:border-stone-900 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md flex flex-col p-8 min-h-[220px] rounded-sm"
            >
                <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-stone-50 text-stone-400 rounded-sm group-hover:bg-stone-900 group-hover:text-white transition-colors">
                        <LayoutGrid size={24} />
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="font-mono font-bold text-2xl text-stone-200 group-hover:text-safety-700 transition-colors">
                            {String(count).padStart(2, '0')}
                        </span>
                        <span className="text-[9px] font-bold text-stone-300 uppercase tracking-tighter">SKU 计数</span>
                    </div>
                </div>

                <div className="mt-auto">
                    <h3 className="font-serif text-2xl text-stone-900 mb-2 group-hover:text-safety-700 transition-colors leading-tight">{cat.title}</h3>
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">{cat.subtitle || '标准生产系列'}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-stone-400 text-[10px] font-bold uppercase tracking-widest group-hover:text-stone-900 transition-colors">
                    <span>进入管理接口</span>
                    <ChevronRight size={14} className="transform group-hover:translate-x-1 transition-transform"/>
                </div>
            </div>
          );
        })}

        {/* 只有在有权限时显示创建入口（逻辑已在父组件控制，这里仅处理 UI） */}
        {onCreateCategory && (
            <div 
                onClick={onCreateCategory}
                className="group bg-stone-50 border-2 border-dashed border-stone-200 hover:border-stone-400 hover:bg-white transition-all cursor-pointer flex flex-col items-center justify-center p-8 min-h-[220px] rounded-sm"
            >
                <div className="bg-white p-4 rounded-full mb-4 shadow-sm border border-stone-100 group-hover:scale-110 transition-transform group-hover:border-stone-900">
                    <Plus size={24} className="text-stone-400 group-hover:text-stone-900 transition-colors" />
                </div>
                <h3 className="font-bold text-stone-500 group-hover:text-stone-900 uppercase tracking-widest text-xs mb-1 transition-colors">新增产品系列</h3>
                <p className="text-[10px] text-stone-400 group-hover:text-stone-600 transition-colors">仅限管理员操作</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default CategoryGrid;