
import React, { useState, useEffect } from 'react';
import { ProductVariant, Category } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { Save, X, Shuffle, Tag, Ruler, Box, Lock, Send, Clock, CheckCircle, AlertCircle, Ban } from 'lucide-react';
import PZImageManager from './PZImageManager';
import LivePreview from './LivePreview';

interface ProductFormProps {
  initialData: Partial<ProductVariant>;
  categories: Category[];
  onSave: (data: ProductVariant) => void;
  onCancel: () => void;
  fixedCategoryId?: string;
  userRole: 'ADMIN' | 'FACTORY';
}

const ProductForm: React.FC<ProductFormProps> = ({ initialData, categories, onSave, onCancel, fixedCategoryId, userRole }) => {
  const { t } = useLanguage();
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
        alert("Name is required");
        setSubmitting(false);
        return;
    }
    
    if (!formData.category) {
        alert("Please select a Category");
        setSubmitting(false);
        return;
    }

    // Role-based Status Logic
    let finalStatus = formData.status || 'draft';
    
    // Factory cannot force 'published' if it wasn't already
    if (userRole === 'FACTORY' && finalStatus === 'published' && initialData.status !== 'published') {
        finalStatus = 'pending';
    }

    const payload: ProductVariant = {
        ...(formData as ProductVariant),
        status: finalStatus,
        category: (formData.category || '').toLowerCase().trim(),
        images: Array.isArray(formData.images) ? formData.images : [],
        image: Array.isArray(formData.images) && formData.images.length > 0 ? formData.images[0] : (formData.image || '')
    };

    onSave(payload);
  };

  const fixedCategoryTitle = categories.find(c => c.id === fixedCategoryId)?.title;

  // Mock Audit Log for UI
  const auditLog = [
    { event: 'Created', user: 'Factory User', date: 'Oct 20, 2024' },
    { event: 'Submitted for Review', user: 'Factory User', date: 'Oct 21, 2024' },
    { event: 'Rejected (Missing Dims)', user: 'Admin', date: 'Oct 22, 2024' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-fade-in">
       {/* LEFT COLUMN: FORM */}
       <div className="lg:col-span-2">
          
          {/* Status Header */}
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
                    {formData.status || 'Draft'}
                </span>
             </div>
             {userRole === 'ADMIN' && (
                 <div className="flex space-x-2">
                     <button type="button" onClick={() => handleChange('status', 'draft')} className="px-4 py-2 text-xs font-bold bg-stone-100 text-stone-500 hover:bg-stone-200 uppercase">Set Draft</button>
                     <button type="button" onClick={() => handleChange('status', 'published')} className="px-4 py-2 text-xs font-bold bg-green-600 text-white hover:bg-green-700 uppercase">Force Publish</button>
                 </div>
             )}
          </div>

          <div className="bg-white p-8 border border-stone-200 shadow-sm mb-8">
             <h2 className="font-serif text-lg font-bold uppercase tracking-[0.1em] text-stone-900 mb-8 border-b border-stone-100 pb-4">
                {editingId ? t.creator.form.edit : t.creator.form.add}
             </h2>
             
             <form onSubmit={handleSubmit} className="space-y-8">
                
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
                            className="w-full bg-white border border-stone-200 p-4 text-lg font-serif text-stone-900 focus:border-amber-700 outline-none shadow-sm"
                        />
                    </div>
                </div>

                {/* DESCRIPTIONS */}
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
                        />
                    </div>
                </div>

                {/* SPECIFICATIONS */}
                <div className="bg-stone-50 p-6 border border-stone-200 rounded-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-6 border-b border-stone-200 pb-2">
                        {t.creator.form.specs}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="flex items-center text-[10px] uppercase tracking-wider text-stone-500 font-bold mb-2">
                                <Box size={12} className="mr-1"/> {t.creator.form.material}
                            </label>
                            <input 
                                type="text" 
                                value={formData.material || ''} 
                                onChange={e => handleChange('material', e.target.value)}
                                className="w-full bg-white border border-stone-200 p-3 text-sm focus:border-amber-700 outline-none"
                            />
                        </div>
                        <div>
                            <label className="flex items-center text-[10px] uppercase tracking-wider text-stone-500 font-bold mb-2">
                                <Ruler size={12} className="mr-1"/> {t.creator.form.dims}
                            </label>
                            <input 
                                type="text" 
                                value={formData.size || ''} 
                                onChange={e => handleChange('size', e.target.value)}
                                className="w-full bg-white border border-stone-200 p-3 text-sm focus:border-amber-700 outline-none"
                            />
                        </div>
                        <div>
                            <label className="flex items-center text-[10px] uppercase tracking-wider text-stone-500 font-bold mb-2">
                                <Tag size={12} className="mr-1"/> {t.creator.form.code}
                            </label>
                            <div className="flex shadow-sm">
                                <input 
                                    type="text" 
                                    value={formData.code || ''} 
                                    onChange={e => handleChange('code', e.target.value)}
                                    className="w-full bg-white border border-stone-200 border-r-0 p-3 text-sm focus:border-amber-700 outline-none font-mono uppercase"
                                />
                                <button 
                                    type="button"
                                    onClick={generateCode}
                                    className="bg-stone-100 px-3 hover:bg-stone-200 text-stone-600 border border-stone-200 border-l-0"
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

                {/* AUDIT TIMELINE (New) */}
                <div className="border-t border-stone-200 pt-8 mt-8">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-6">Audit Timeline</h3>
                    <div className="space-y-6 relative border-l border-stone-200 ml-2 pl-6">
                        {auditLog.map((log, i) => (
                            <div key={i} className="relative">
                                <div className="absolute -left-[29px] top-1 w-2.5 h-2.5 rounded-full bg-stone-300 border-2 border-white"></div>
                                <div className="text-sm font-bold text-stone-700">{log.event}</div>
                                <div className="text-xs text-stone-500">{log.user} • {log.date}</div>
                            </div>
                        ))}
                    </div>
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
                    
                    {/* Primary Action changes based on Role */}
                    <button
                        type="submit"
                        disabled={submitting}
                        className={`flex-1 text-white font-bold uppercase tracking-widest py-4 transition-colors flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg
                        ${userRole === 'ADMIN' ? 'bg-[#281815] hover:bg-[#a16207]' : 'bg-blue-700 hover:bg-blue-800'}
                        `}
                        onClick={() => {
                            if (userRole === 'FACTORY') {
                                // Force status for factory
                                handleChange('status', 'pending');
                            }
                        }}
                    >
                        {submitting ? (
                          t.creator.form.processing
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

       {/* RIGHT COLUMN: LIVE PREVIEW (Sticky) */}
       <div className="lg:col-span-1">
          <LivePreview formData={formData} />
       </div>
    </div>
  );
};

export default ProductForm;
