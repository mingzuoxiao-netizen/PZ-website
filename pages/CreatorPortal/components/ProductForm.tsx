
import React, { useState, useEffect } from 'react';
import { ProductVariant, Category } from '../../../types';
import { Save, X, Shuffle, Tag, Ruler, Box, Lock, Send, Clock, CheckCircle, Ban } from 'lucide-react';
import PZImageManager from './PZImageManager';
import LivePreview from './LivePreview';
import { useLanguage } from '../../../contexts/LanguageContext';

interface ProductFormProps {
  initialData: Partial<ProductVariant>;
  categories: Category[];
  onSave: (data: any) => void;
  onCancel: () => void;
  onUpload: (file: File) => Promise<string>;
  fixedCategoryId?: string;
  userRole: 'ADMIN' | 'FACTORY';
  lang: 'en' | 'zh'; 
}

const ProductForm: React.FC<ProductFormProps> = ({ 
  initialData, categories, onSave, onCancel, onUpload, 
  fixedCategoryId, userRole, lang 
}) => {
  const { t } = useLanguage();
  const txt = t.creator.form;
  const statusLabels = t.creator.statusLabels;

  const [formData, setFormData] = useState<Partial<ProductVariant>>(initialData);
  const [submitting, setSubmitting] = useState(false);
  const editingId = initialData.id;

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
    
    if (!formData.name) {
        alert("Product Name (EN) is required");
        setSubmitting(false);
        return;
    }
    
    if (!formData.category) {
        alert("Please select a Category");
        setSubmitting(false);
        return;
    }

    let finalStatus = formData.status || 'draft';
    if (userRole === 'FACTORY' && finalStatus === 'published' && initialData.status !== 'published') {
        finalStatus = 'pending';
    }

    // ✅ Normalizing payload for Backend Compatibility
    const payload = {
        ...(formData as ProductVariant),
        status: finalStatus,
        is_published: finalStatus === 'published' ? 1 : 0, // Common legacy database field
        category: (formData.category || '').toLowerCase().trim(),
        images: Array.isArray(formData.images) ? formData.images : [],
        image: Array.isArray(formData.images) && formData.images.length > 0 ? formData.images[0] : (formData.image || '')
    };

    onSave(payload);
  };

  const fixedCategoryTitle = categories.find(c => c.id === fixedCategoryId)?.title;

  const getStatusLabel = (status: string | undefined) => {
      const s = status?.toLowerCase() || 'draft';
      if (s === 'published') return statusLabels.published;
      if (s === 'pending') return statusLabels.pending;
      if (s === 'rejected') return statusLabels.rejected;
      return statusLabels.draft;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-fade-in">
       <div className="lg:col-span-2">
          {/* Status Bar */}
          <div className="flex items-center justify-between bg-white border border-stone-200 p-6 mb-6 shadow-sm">
             <div>
                <span className="text-xs font-bold text-stone-400 uppercase tracking-widest block mb-1">Current Status</span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                    ${formData.status === 'published' ? 'bg-green-100 text-green-700' : 
                      formData.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                      formData.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                      'bg-stone-100 text-stone-600'}
                `}>
                    {formData.status === 'published' && <CheckCircle size={14} className="mr-2"/>}
                    {formData.status === 'pending' && <Clock size={14} className="mr-2"/>}
                    {formData.status === 'rejected' && <Ban size={14} className="mr-2"/>}
                    {getStatusLabel(formData.status)}
                </span>
             </div>
             {userRole === 'ADMIN' && (
                 <div className="flex space-x-2">
                     <button type="button" onClick={() => handleChange('status', 'draft')} className="px-4 py-2 text-xs font-bold bg-stone-100 text-stone-500 hover:bg-stone-200 uppercase">Draft</button>
                     <button type="button" onClick={() => handleChange('status', 'published')} className="px-4 py-2 text-xs font-bold bg-green-600 text-white hover:bg-green-700 uppercase">Publish Now</button>
                 </div>
             )}
          </div>

          <div className="bg-white p-8 border border-stone-200 shadow-sm mb-8">
             <h2 className="font-serif text-lg font-bold uppercase tracking-[0.1em] text-stone-900 mb-8 border-b border-stone-100 pb-4">
                {editingId ? "Edit Product" : "Add New Product"}
             </h2>
             
             <form onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-stone-50/50 p-6 border border-stone-100 rounded-sm space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs uppercase tracking-wider text-stone-500 font-bold flex items-center">
                                    Main Category
                                    {fixedCategoryId && <Lock size={12} className="ml-2 text-amber-600"/>}
                                </label>
                            </div>
                            
                            {fixedCategoryId ? (
                                <div className="w-full bg-stone-100 border border-stone-200 p-4 text-sm font-bold text-stone-500 cursor-not-allowed flex justify-between items-center">
                                    {fixedCategoryTitle}
                                    <span className="text-[10px] uppercase tracking-widest text-amber-600">Locked</span>
                                </div>
                            ) : (
                                <select 
                                    value={formData.category || ''}
                                    onChange={e => handleChange('category', e.target.value)}
                                    className="w-full bg-white border border-stone-200 p-4 text-sm font-medium text-stone-900 focus:border-amber-700 outline-none shadow-sm appearance-none"
                                >
                                    <option value="">Select Category...</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                </select>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">
                            Product Name (EN) <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="text" 
                            value={formData.name || ''} 
                            onChange={e => handleChange('name', e.target.value)}
                            className="w-full bg-white border border-stone-200 p-4 text-lg font-serif text-stone-900 focus:border-amber-700 outline-none shadow-sm"
                            placeholder="e.g. Modern Dining Table"
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">
                            Product Name (CN)
                        </label>
                        <input 
                            type="text" 
                            value={formData.name_cn || ''} 
                            onChange={e => handleChange('name_cn', e.target.value)}
                            className="w-full bg-white border border-stone-200 p-4 text-lg font-sans text-stone-900 focus:border-amber-700 outline-none shadow-sm"
                            placeholder="Chinese name (optional)..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">
                            Description (EN)
                        </label>
                        <textarea 
                            rows={3}
                            value={formData.description || ''} 
                            onChange={e => handleChange('description', e.target.value)}
                            className="w-full bg-white border border-stone-200 p-3 text-sm text-stone-900 focus:border-amber-700 outline-none shadow-sm resize-none"
                            placeholder="Detailed product description in English..."
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">
                            Description (CN)
                        </label>
                        <textarea 
                            rows={3}
                            value={formData.description_cn || ''} 
                            onChange={e => handleChange('description_cn', e.target.value)}
                            className="w-full bg-white border border-stone-200 p-3 text-sm text-stone-900 focus:border-amber-700 outline-none shadow-sm resize-none"
                            placeholder="Chinese description (optional)..."
                        />
                    </div>
                </div>

                <div className="bg-stone-50 p-6 border border-stone-200 rounded-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-6 border-b border-stone-200 pb-2">
                        Specifications
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="flex items-center text-[10px] uppercase tracking-wider text-stone-500 font-bold mb-2">
                                <Box size={12} className="mr-1"/> Material
                            </label>
                            <input 
                                type="text" 
                                value={formData.material || ''} 
                                onChange={e => handleChange('material', e.target.value)}
                                className="w-full bg-white border border-stone-200 p-3 text-sm focus:border-amber-700 outline-none"
                                placeholder="e.g. Solid Oak"
                            />
                        </div>
                        <div>
                            <label className="flex items-center text-[10px] uppercase tracking-wider text-stone-500 font-bold mb-2">
                                <Ruler size={12} className="mr-1"/> Dimensions
                            </label>
                            <input 
                                type="text" 
                                value={formData.size || ''} 
                                onChange={e => handleChange('size', e.target.value)}
                                className="w-full bg-white border border-stone-200 p-3 text-sm focus:border-amber-700 outline-none"
                                placeholder="e.g. 2000x1000x750mm"
                            />
                        </div>
                        <div>
                            <label className="flex items-center text-[10px] uppercase tracking-wider text-stone-500 font-bold mb-2">
                                <Tag size={12} className="mr-1"/> SKU Code
                            </label>
                            <div className="flex shadow-sm">
                                <input 
                                    type="text" 
                                    value={formData.code || ''} 
                                    onChange={e => handleChange('code', e.target.value)}
                                    className="w-full bg-white border border-stone-200 border-r-0 p-3 text-sm focus:border-amber-700 outline-none font-mono uppercase"
                                    placeholder="SKU-001"
                                />
                                <button 
                                    type="button"
                                    onClick={generateCode}
                                    className="bg-stone-100 px-3 hover:bg-stone-200 text-stone-600 border border-stone-200 border-l-0 transition-colors"
                                >
                                    <Shuffle size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                   <PZImageManager 
                     label="Image Gallery"
                     images={formData.images || []}
                     onUpdate={(imgs) => {
                       setFormData(prev => ({ 
                         ...prev, 
                         images: imgs,
                         image: imgs[0] || '' 
                       }));
                     }}
                     onError={alert}
                     onUpload={onUpload}
                   />
                </div>

                <div className="flex gap-4 pt-6 border-t border-stone-100 sticky bottom-0 bg-white/95 backdrop-blur-md p-4 -mx-4 -mb-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-20">
                    <button 
                        type="button" 
                        onClick={onCancel}
                        className="px-8 py-4 border border-stone-200 text-stone-500 hover:text-stone-900 hover:border-stone-400 uppercase font-bold text-xs tracking-widest transition-all"
                    >
                        Cancel
                    </button>
                    
                    <button
                        type="submit"
                        disabled={submitting}
                        className={`flex-1 text-white font-bold uppercase tracking-widest py-4 transition-colors flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg
                        ${userRole === 'ADMIN' ? 'bg-[#281815] hover:bg-[#a16207]' : 'bg-blue-700 hover:bg-blue-800'}
                        `}
                    >
                        {submitting ? (
                          "Processing..."
                        ) : (
                          <>
                             {userRole === 'ADMIN' ? (
                                <><Save size={16} className="mr-2" /> Publish Changes</>
                             ) : (
                                <><Send size={16} className="mr-2" /> Submit for Review</>
                             )}
                          </>
                        )}
                    </button>
                </div>
             </form>
          </div>
       </div>

       <div className="lg:col-span-1">
          <LivePreview formData={formData} />
       </div>
    </div>
  );
};

export default ProductForm;
