
import React from 'react';
import { Save, Plus, Trash2, Loader2, CornerDownRight, Box, Ruler, Tag, Wand2 } from 'lucide-react';
import PZImageManager from './PZImageManager';
import { useLanguage } from '../../../contexts/LanguageContext';

interface ProductFormProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onSubmit: (e: React.FormEvent) => void;
  isCreatingCategory: boolean;
  setIsCreatingCategory: (v: boolean) => void;
  isCreatingSubCategory: boolean;
  setIsCreatingSubCategory: (v: boolean) => void;
  mergedCategories: any[];
  activeSubCategories: any[];
  submitting: boolean;
  editingId: string | null;
  cancelEdit: () => void;
  triggerDelete: (id: string) => void;
  generateProductCode: () => void;
  onError: (msg: string) => void;
}

const ProductForm: React.FC<ProductFormProps> = ({
  formData, setFormData, onSubmit,
  isCreatingCategory, setIsCreatingCategory,
  isCreatingSubCategory, setIsCreatingSubCategory,
  mergedCategories, activeSubCategories,
  submitting, editingId, cancelEdit, triggerDelete, generateProductCode, onError
}) => {
  const { language } = useLanguage();

  // Helper to handle image updates
  const handleImagesUpdate = (newImages: string[]) => {
    setFormData((prev: any) => ({
      ...prev,
      images: newImages,
      image: newImages.length > 0 ? newImages[0] : '' // Sync Main Image
    }));
  };

  return (
    <div className={`bg-white p-6 md:p-12 border ${editingId ? 'border-amber-500 ring-4 ring-amber-500/10' : 'border-stone-200'} shadow-xl relative h-fit transition-all duration-300 order-1`}>
                
      {submitting && (
        <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center">
          <Loader2 size={48} className="text-[#a16207] animate-spin mb-4" />
          <span className="text-stone-900 font-bold uppercase tracking-widest">
            {language === 'zh' ? '保存中...' : 'Saving...'}
          </span>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-stone-900 uppercase tracking-widest text-sm">
          {editingId 
            ? (language === 'zh' ? '编辑产品' : 'Edit Product') 
            : (language === 'zh' ? '添加新产品' : 'Add New Product')}
        </h3>
        {editingId && (
          <button onClick={cancelEdit} className="text-xs text-stone-400 hover:text-stone-900 underline">
            {language === 'zh' ? '取消' : 'Cancel'}
          </button>
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
      
        {/* Status Selector */}
        <div className="bg-stone-50 p-4 border border-stone-200 flex items-center justify-between">
          <label className="text-xs uppercase tracking-wider text-stone-500 font-bold">{language === 'zh' ? '状态' : 'Status'}</label>
          <div className="flex space-x-2">
            {['published', 'draft', 'archived'].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setFormData((p: any) => ({...p, status: s}))}
                className={`px-3 py-1 text-xs uppercase font-bold tracking-wider border rounded-sm transition-all ${
                  formData.status === s 
                  ? (s === 'published' ? 'bg-green-600 text-white border-green-600' : s === 'draft' ? 'bg-amber-500 text-white border-amber-500' : 'bg-stone-500 text-white border-stone-500')
                  : 'bg-white text-stone-400 border-stone-200 hover:border-stone-400'
                }`}
              >
                {s === 'published' ? (language === 'zh' ? '发布' : 'Pub') : s === 'draft' ? (language === 'zh' ? '草稿' : 'Draft') : (language === 'zh' ? '归档' : 'Arch')}
              </button>
            ))}
          </div>
        </div>

        {/* Category Section */}
        <div className="space-y-4 bg-stone-50 p-6 rounded-sm border border-stone-100">
          <div className="flex justify-between items-end mb-2">
            <label className="text-xs uppercase tracking-wider text-stone-500 font-bold flex items-center">
              {language === 'zh' ? '主分类' : 'Main Category'}
            </label>
            {!editingId && (
              <button 
                type="button"
                onClick={() => {
                  setIsCreatingCategory(!isCreatingCategory);
                  setIsCreatingSubCategory(false);
                }}
                className={`text-[10px] uppercase font-bold tracking-widest flex items-center ${isCreatingCategory ? 'text-red-500' : 'text-amber-700'}`}
              >
                {isCreatingCategory 
                  ? (language === 'zh' ? '取消新建' : 'Cancel New') 
                  : (language === 'zh' ? '+ 新建分类' : '+ Create New')}
              </button>
            )}
          </div>

          {isCreatingCategory ? (
            <div className="space-y-3 animate-fade-in-up">
              <input 
                type="text"
                placeholder={language === 'zh' ? "新分类名称 (英文)" : "New Category Name (EN)"}
                className="w-full bg-white border border-amber-300 text-stone-900 px-4 py-2 text-sm focus:border-[#a16207] outline-none"
                value={formData.newCatTitle}
                onChange={e => setFormData((prev: any) => ({...prev, newCatTitle: e.target.value}))}
              />
              <input 
                type="text"
                placeholder={language === 'zh' ? "新分类名称 (中文)" : "New Category Name (ZH)"}
                className="w-full bg-white border border-amber-300 text-stone-900 px-4 py-2 text-sm focus:border-[#a16207] outline-none"
                value={formData.newCatTitleZh}
                onChange={e => setFormData((prev: any) => ({...prev, newCatTitleZh: e.target.value}))}
              />
            </div>
          ) : (
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, categoryId: e.target.value }))}
              className="w-full bg-white border border-stone-200 text-stone-900 px-4 py-3 focus:border-[#a16207] outline-none"
            >
              {mergedCategories?.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {language === 'zh' ? c.title_zh || c.title : c.title}
                </option>
              ))}
            </select>
          )}

          <div className="mt-6">
            <div className="flex justify-between items-end mb-2 pl-4 border-l-2 border-stone-200">
              <label className="text-xs uppercase tracking-wider text-stone-500 font-bold flex items-center">
                <CornerDownRight size={12} className="mr-2" /> {language === 'zh' ? '子分类' : 'Sub-Category'}
              </label>
              {!editingId && !isCreatingCategory && (
                <button 
                  type="button"
                  onClick={() => setIsCreatingSubCategory(!isCreatingSubCategory)}
                  className={`text-[10px] uppercase font-bold tracking-widest flex items-center ${isCreatingSubCategory ? 'text-red-500' : 'text-amber-700'}`}
                >
                  {isCreatingSubCategory 
                    ? (language === 'zh' ? '取消新建' : 'Cancel New') 
                    : (language === 'zh' ? '+ 新建子分类' : '+ Create New')}
                </button>
              )}
            </div>

            {isCreatingCategory || isCreatingSubCategory ? (
              <div className="space-y-3 pl-4 border-l-2 border-amber-200 animate-fade-in-up">
                <input 
                  type="text"
                  placeholder={language === 'zh' ? "新子分类 (英文)" : "New Sub-Category (EN)"}
                  className="w-full bg-white border border-amber-300 text-stone-900 px-4 py-2 text-sm focus:border-[#a16207] outline-none"
                  value={formData.newSubName}
                  onChange={e => setFormData((prev: any) => ({...prev, newSubName: e.target.value}))}
                />
                <input 
                  type="text"
                  placeholder={language === 'zh' ? "新子分类 (中文)" : "New Sub-Category (ZH)"}
                  className="w-full bg-white border border-amber-300 text-stone-900 px-4 py-2 text-sm focus:border-[#a16207] outline-none"
                  value={formData.newSubNameZh}
                  onChange={e => setFormData((prev: any) => ({...prev, newSubNameZh: e.target.value}))}
                />
              </div>
            ) : (
              <div className="pl-4 border-l-2 border-stone-200">
                <select
                  value={formData.subCategoryName}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, subCategoryName: e.target.value }))}
                  className="w-full bg-white border border-stone-200 text-stone-900 px-4 py-3 focus:border-[#a16207] outline-none"
                >
                  {activeSubCategories?.map((sc: any, idx: number) => (
                    <option key={idx} value={sc.name}>
                      {language === 'zh' ? sc.name_zh || sc.name : sc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2 font-bold">
              {language === 'zh' ? '产品名称 (EN)' : 'Product Name'} <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, name: e.target.value }))}
              className="w-full bg-stone-50 border border-stone-200 text-stone-900 px-4 py-3 focus:border-[#a16207] outline-none"
              placeholder="e.g., Zenith Dining Table"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2 font-bold">
              {language === 'zh' ? '产品名称 (中文) - 选填' : 'Product Name (ZH) - Optional'}
            </label>
            <input
              type="text"
              value={formData.name_zh}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, name_zh: e.target.value }))}
              className="w-full bg-stone-50 border border-stone-200 text-stone-900 px-4 py-3 focus:border-[#a16207] outline-none"
              placeholder="例如：Zenith 餐桌"
            />
          </div>
        </div>

        {/* SPECIFICATIONS */}
        <div className="bg-stone-50 p-6 rounded-sm border border-stone-100">
          <h4 className="text-xs uppercase tracking-widest font-bold text-stone-500 mb-4 border-b border-stone-200 pb-2">
            {language === 'zh' ? '规格参数' : 'Specifications'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="md:col-span-1 lg:col-span-1">
              <label className="block text-[10px] uppercase tracking-wider text-stone-400 mb-2 font-bold flex items-center">
                <Box size={10} className="mr-1"/> {language === 'zh' ? '材质' : 'Material'}
              </label>
              <input 
                type="text" 
                className="w-full bg-white border border-stone-200 text-stone-900 px-3 py-2 text-sm focus:border-[#a16207] outline-none"
                placeholder="e.g. White Oak"
                value={formData.material}
                onChange={e => setFormData((prev: any) => ({...prev, material: e.target.value}))}
              />
            </div>
            <div className="md:col-span-1 lg:col-span-1">
              <label className="block text-[10px] uppercase tracking-wider text-stone-400 mb-2 font-bold flex items-center">
                <Ruler size={10} className="mr-1"/> {language === 'zh' ? '尺寸' : 'Dimensions'}
              </label>
              <input 
                type="text" 
                className="w-full bg-white border border-stone-200 text-stone-900 px-3 py-2 text-sm focus:border-[#a16207] outline-none"
                placeholder="e.g. 1200x600mm"
                value={formData.dimensions}
                onChange={e => setFormData((prev: any) => ({...prev, dimensions: e.target.value}))}
              />
            </div>
            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-[10px] uppercase tracking-wider text-stone-400 mb-2 font-bold flex items-center">
                <Tag size={10} className="mr-1"/> {language === 'zh' ? '产品编号' : 'Product Code'}
              </label>
              <div className="flex">
                <input 
                  type="text" 
                  className="w-full bg-white border border-stone-200 text-stone-900 px-3 py-2 text-sm focus:border-[#a16207] outline-none border-r-0"
                  placeholder="e.g. PZ-TAB-2025-01"
                  value={formData.code}
                  onChange={e => setFormData((prev: any) => ({...prev, code: e.target.value}))}
                />
                <button 
                  type="button"
                  onClick={generateProductCode}
                  className="bg-stone-200 px-3 hover:bg-amber-100 hover:text-amber-800 border border-stone-200 border-l-0"
                  title="Auto Generate"
                >
                  <Wand2 size={14}/>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2 font-bold">
              {language === 'zh' ? '描述 (EN)' : 'Description'}
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, description: e.target.value }))}
              className="w-full bg-stone-50 border border-stone-200 text-stone-900 px-4 py-3 focus:border-[#a16207] outline-none"
              placeholder="Short product description..."
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2 font-bold">
              {language === 'zh' ? '描述 (中文) - 选填' : 'Description (ZH) - Optional'}
            </label>
            <textarea
              rows={3}
              value={formData.description_zh}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, description_zh: e.target.value }))}
              className="w-full bg-stone-50 border border-stone-200 text-stone-900 px-4 py-3 focus:border-[#a16207] outline-none"
              placeholder="简短的产品描述..."
            />
          </div>
        </div>

        {/* New Unified Image Manager (Multi Mode) with 4:3 Crop Enforcement */}
        <PZImageManager
          label={language === 'zh' ? '产品图片 (第一张为主图)' : 'Product Images (First is Main)'}
          images={formData.images || []}
          onUpdate={handleImagesUpdate}
          onError={onError}
          maxImages={10} // Allow multiple
          aspectRatio={4/3} // Enforce 4:3 for products
        />

        <div className="flex space-x-4 pb-8 md:pb-0 mt-6">
          {editingId && (
            <button
              type="button"
              onClick={() => triggerDelete(editingId)}
              className="flex-none w-14 bg-red-100 text-red-600 font-bold uppercase tracking-widest py-4 hover:bg-red-200 transition-colors flex justify-center items-center rounded-sm"
              title={language === 'zh' ? '删除产品' : 'Delete Product'}
            >
              <Trash2 size={18} />
            </button>
          )}

          <button
            type="submit"
            disabled={submitting || !formData.image}
            className={`flex-1 text-white font-bold uppercase tracking-widest py-4 transition-colors flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg
              ${editingId ? 'bg-amber-700 hover:bg-amber-800' : 'bg-[#281815] hover:bg-[#a16207]'}
            `}
          >
            {submitting ? (
              language === 'zh' ? '处理中...' : 'Processing...'
            ) : (
              <>
                {editingId ? (language === 'zh' ? '更新产品' : 'Update Product') : (language === 'zh' ? '发布产品' : 'Publish Product')}
                {editingId ? <Save size={16} className="ml-2" /> : <Plus size={16} className="ml-2 group-hover:rotate-90 transition-transform" />}
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};

export default ProductForm;
