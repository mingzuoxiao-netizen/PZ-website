
import React, { useState, useEffect } from 'react';
import { ProductVariant, Category } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { Save, X, Shuffle, Tag, Ruler, Box, Lock } from 'lucide-react';
import PZImageManager from './PZImageManager';
import LivePreview from './LivePreview';

interface ProductFormProps {
  initialData: Partial<ProductVariant>;
  categories: Category[];
  onSave: (data: ProductVariant) => void;
  onCancel: () => void;
  fixedCategoryId?: string; // New prop for scoped creation
}

const ProductForm: React.FC<ProductFormProps> = ({ initialData, categories, onSave, onCancel, fixedCategoryId }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<Partial<ProductVariant>>(initialData);
  const [submitting, setSubmitting] = useState(false);
  const editingId = initialData.id;

  // Auto-set category if fixed
  useEffect(() => {
    if (fixedCategoryId && !initialData.id) {
        setFormData(prev => ({ ...prev, category: fixedCategoryId }));
    }
  }, [fixedCategoryId, initialData.id]);

  const handleChange = (field: keyof ProductVariant, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateCode = () => {
    const prefix = "PZ";
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    handleChange('code', `${prefix}-${random}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    // 1. Validation
    if (!formData.name) {
        alert("Name is required");
        setSubmitting(false);
        return;
    }
    
    if (!formData.category) {
        alert("Please select a Category");
        setSubmitting(false);
        return;
    }

    // 2. Prepare Payload (Strict Status Control)
    const payload: ProductVariant = {
        ...(formData as ProductVariant),
        status: formData.status || 'draft', 
        category: (formData.category || '').toLowerCase().trim(),
        images: Array.isArray(formData.images) ? formData.images : [],
        image: Array.isArray(formData.images) && formData.images.length > 0 ? formData.images[0] : (formData.image || '')
    };

    // 3. Submit
    onSave(payload);
  };

  // Find category name for display in locked mode
  const fixedCategoryTitle = categories.find(c => c.id === fixedCategoryId)?.title;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-fade-in">
       {/* LEFT COLUMN: FORM */}
       <div className="lg:col-span-2">
          <div className="bg-white p-8 border border-stone-200 shadow-sm mb-8">
             <h2 className="font-serif text-lg font-bold uppercase tracking-[0.1em] text-stone-900 mb-8 border-b border-stone-100 pb-4">
                {editingId ? t.creator.form.edit : t.creator.form.add}
             </h2>
             
             <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* STATUS TOGGLE (Segmented Control) */}
                <div>
                    <label className="block text-xs uppercase tracking-wider text-stone-500 font-bold mb-3">
                        {t.creator.form.status}
                    </label>
                    <div className="flex border border-stone-200 rounded-sm overflow-hidden w-full max-w-md">
                        {['published', 'draft', 'hidden'].map(status => {
                            const isActive = (formData.status || 'draft') === status;
                            let label = 'DRAFT';
                            if(status === 'published') label = 'PUB';
                            if(status === 'hidden') label = 'ARCH';

                            return (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => handleChange('status', status)}
                                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors
                                        ${isActive ? 'bg-amber-500 text-white' : 'bg-stone-50 text-stone-400 hover:bg-stone-100 hover:text-stone-600'}
                                    `}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* CATEGORIES GROUP */}
                <div className="bg-stone-50/50 p-6 border border-stone-100 rounded-sm space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                        {/* Main Category */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs uppercase tracking-wider text-stone-500 font-bold flex items-center">
                                    {t.creator.form.mainCat}
                                    {fixedCategoryId && <Lock size={12} className="ml-2 text-amber-600"/>}
                                </label>
                                {!fixedCategoryId && (
                                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest cursor-pointer hover:text-amber-800">
                                        {t.creator.form.create}
                                    </span>
                                )}
                            </div>
                            
                            {fixedCategoryId ? (
                                <div className="w-full bg-stone-100 border border-stone-200 p-4 text-sm font-bold text-stone-500 cursor-not-allowed flex justify-between items-center">
                                    {fixedCategoryTitle}
                                    <span className="text-[10px] uppercase tracking-widest text-amber-600">Locked to View</span>
                                </div>
                            ) : (
                                <select 
                                    value={formData.category || ''}
                                    onChange={e => handleChange('category', e.target.value)}
                                    className="w-full bg-white border border-stone-200 p-4 text-sm font-medium text-stone-900 focus:border-amber-700 outline-none shadow-sm transition-shadow appearance-none"
                                >
                                    <option value="">Select Category...</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                </select>
                            )}
                        </div>
                        
                        {/* Sub Category */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs uppercase tracking-wider text-stone-500 font-bold">
                                    {t.creator.form.subCat}
                                </label>
                                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest cursor-pointer hover:text-amber-800">
                                    {t.creator.form.create}
                                </span >
                            </div>
                            <input 
                                type="text"
                                value={formData.sub_category || ''}
                                onChange={e => handleChange('sub_category', e.target.value)}
                                placeholder="e.g. Dining, Lounge, Storage..."
                                className="w-full bg-white border border-stone-200 p-4 text-sm font-medium text-stone-900 focus:border-amber-700 outline-none shadow-sm transition-shadow"
                            />
                        </div>
                    </div>
                </div>

                {/* PRODUCT NAMES */}
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">
                            {t.creator.form.nameEn} <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="text" 
                            value={formData.name || ''} 
                            onChange={e => handleChange('name', e.target.value)}
                            className="w-full bg-white border border-stone-200 p-4 text-lg font-serif text-stone-900 focus:border-amber-700 outline-none shadow-sm placeholder-stone-300 transition-shadow"
                            placeholder="e.g. Walnut Dining Table"
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">
                            {t.creator.form.nameZh}
                        </label>
                        <input 
                            type="text" 
                            value={formData.name_cn || ''} 
                            onChange={e => handleChange('name_cn', e.target.value)}
                            className="w-full bg-white border border-stone-200 p-3 text-sm text-stone-900 focus:border-amber-700 outline-none shadow-sm"
                            placeholder="e.g. 黑胡桃餐桌"
                        />
                    </div>
                </div>

                {/* DESCRIPTIONS (EN & CN) */}
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">
                            {t.creator.form.descEn}
                        </label>
                        <textarea 
                            rows={4}
                            value={formData.description || ''} 
                            onChange={e => handleChange('description', e.target.value)}
                            className="w-full bg-white border border-stone-200 p-3 text-sm text-stone-900 focus:border-amber-700 outline-none shadow-sm resize-none"
                            placeholder="Detailed product description..."
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">
                            {t.creator.form.descZh}
                        </label>
                        <textarea 
                            rows={4}
                            value={formData.description_cn || ''} 
                            onChange={e => handleChange('description_cn', e.target.value)}
                            className="w-full bg-white border border-stone-200 p-3 text-sm text-stone-900 focus:border-amber-700 outline-none shadow-sm resize-none"
                            placeholder="详细产品描述..."
                        />
                    </div>
                </div>

                {/* SPECIFICATIONS GROUP (Gray Box) */}
                <div className="bg-stone-50 p-6 border border-stone-200 rounded-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-6 border-b border-stone-200 pb-2">
                        {t.creator.form.specs}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Material */}
                        <div>
                            <label className="flex items-center text-[10px] uppercase tracking-wider text-stone-500 font-bold mb-2">
                                <Box size={12} className="mr-1"/> {t.creator.form.material}
                            </label>
                            <input 
                                type="text" 
                                value={formData.material || ''} 
                                onChange={e => handleChange('material', e.target.value)}
                                className="w-full bg-white border border-stone-200 p-3 text-sm focus:border-amber-700 outline-none transition-shadow"
                                placeholder="Walnut, Oak..."
                            />
                        </div>
                        
                        {/* Dimensions */}
                        <div>
                            <label className="flex items-center text-[10px] uppercase tracking-wider text-stone-500 font-bold mb-2">
                                <Ruler size={12} className="mr-1"/> {t.creator.form.dims}
                            </label>
                            <input 
                                type="text" 
                                value={formData.size || ''} 
                                onChange={e => handleChange('size', e.target.value)}
                                className="w-full bg-white border border-stone-200 p-3 text-sm focus:border-amber-700 outline-none transition-shadow"
                                placeholder="e.g. 1200x600mm"
                            />
                        </div>

                        {/* Product Code */}
                        <div>
                            <label className="flex items-center text-[10px] uppercase tracking-wider text-stone-500 font-bold mb-2">
                                <Tag size={12} className="mr-1"/> {t.creator.form.code}
                            </label>
                            <div className="flex shadow-sm">
                                <input 
                                    type="text" 
                                    value={formData.code || ''} 
                                    onChange={e => handleChange('code', e.target.value)}
                                    className="w-full bg-white border border-stone-200 border-r-0 p-3 text-sm focus:border-amber-700 outline-none font-mono uppercase transition-shadow"
                                    placeholder="PZ-0000"
                                />
                                <button 
                                    type="button"
                                    onClick={generateCode}
                                    className="bg-stone-100 px-3 hover:bg-stone-200 text-stone-600 transition-colors border border-stone-200 border-l-0"
                                    title="Generate Code"
                                >
                                    <Shuffle size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* IMAGES */}
                <div>
                   <PZImageManager 
                     label={t.creator.form.gallery}
                     images={formData.images || []}
                     onUpdate={(imgs) => {
                       setFormData(prev => ({ 
                         ...prev, 
                         images: imgs,
                         image: imgs[0] || '' 
                       }));
                     }}
                     onError={alert}
                   />
                </div>

                {/* ACTIONS */}
                <div className="flex gap-4 pt-6 border-t border-stone-100 sticky bottom-0 bg-white/95 backdrop-blur-md p-4 -mx-4 -mb-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-20">
                    <button 
                        type="button" 
                        onClick={onCancel}
                        className="px-8 py-4 border border-stone-200 text-stone-500 hover:text-stone-900 hover:border-stone-400 uppercase font-bold text-xs tracking-widest transition-all"
                    >
                        {t.creator.form.cancel}
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className={`flex-1 text-white font-bold uppercase tracking-widest py-4 transition-colors flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg
                        ${editingId ? 'bg-amber-700 hover:bg-amber-800' : 'bg-[#281815] hover:bg-[#a16207]'}
                        `}
                    >
                        {submitting ? (
                          t.creator.form.processing
                        ) : (
                          <>
                             <Save size={16} className="mr-2" /> {editingId ? t.creator.form.update : t.creator.form.publish}
                          </>
                        )}
                    </button>
                </div>
             </form>
          </div>
       </div>

       {/* RIGHT COLUMN: LIVE PREVIEW (Sticky) */}
       <div className="lg:col-span-1">
          <LivePreview formData={formData} />
       </div>
    </div>
  );
};

export default ProductForm;
