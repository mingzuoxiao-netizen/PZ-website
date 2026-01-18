import React, { useState, useEffect } from 'react';
import { ProductVariant, Category } from '../../../types';
import { Save, Shuffle, Tag, Ruler, Box, Lock, Send, Clock, CheckCircle, Ban } from 'lucide-react';
import PZImageManager from './PZImageManager';
import LivePreview from './LivePreview';
import { useLanguage } from '../../../contexts/LanguageContext';
import { extractKeyFromUrl } from '../../../utils/imageResolver';
import { adminFetch } from '../../../utils/adminFetch';

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
  fixedCategoryId, userRole 
}) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<Partial<ProductVariant>>(initialData);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (fixedCategoryId && !initialData.id) {
        setFormData(prev => ({ ...prev, category: fixedCategoryId }));
    }
  }, [fixedCategoryId, initialData.id]);

  const handleChange = (field: keyof ProductVariant, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCloudDelete = async (url: string) => {
      const key = extractKeyFromUrl(url);
      if (!key) return;
      try {
          await adminFetch('admin/delete-image', { method: 'POST', body: JSON.stringify({ key }) });
      } catch (e) { console.warn("Asset deletion failed", e); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    if (!formData.name) { alert("Name required"); setSubmitting(false); return; }
    
    let finalStatus = formData.status || 'draft';
    if (userRole === 'FACTORY' && finalStatus === 'published') finalStatus = 'pending';

    onSave({
        ...formData,
        status: finalStatus,
        is_published: finalStatus === 'published' ? 1 : 0
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-fade-in">
       <div className="lg:col-span-2">
          <div className="bg-white p-8 border border-stone-200 shadow-sm mb-8">
             <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-stone-400 mb-2">Registry Category</label>
                        <select value={formData.category || ''} onChange={e => handleChange('category', e.target.value)} disabled={!!fixedCategoryId} className="w-full bg-stone-50 border border-stone-200 p-4 text-sm font-bold disabled:opacity-50">
                            <option value="">Select...</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-stone-400 mb-2">Product Name (EN)</label>
                        <input type="text" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} className="w-full border border-stone-200 p-4 font-serif text-lg outline-none focus:border-safety-700" />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-stone-400 mb-2">Technical Description</label>
                        <textarea rows={4} value={formData.description || ''} onChange={e => handleChange('description', e.target.value)} className="w-full border border-stone-200 p-4 text-sm outline-none focus:border-safety-700 resize-none" />
                    </div>
                </div>

                <div className="bg-stone-50 p-6 border border-stone-200 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-stone-400 mb-2">Material Specification</label>
                        <input type="text" value={formData.material || ''} onChange={e => handleChange('material', e.target.value)} className="w-full bg-white border border-stone-200 p-3 text-sm" />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-stone-400 mb-2">SKU Reference</label>
                        <input type="text" value={formData.code || ''} onChange={e => handleChange('code', e.target.value)} className="w-full bg-white border border-stone-200 p-3 text-sm font-mono uppercase" />
                    </div>
                </div>

                <PZImageManager 
                    label="Image Assets"
                    images={formData.images || []}
                    onUpdate={(imgs) => handleChange('images', imgs)}
                    onDelete={handleCloudDelete}
                    onUpload={onUpload}
                    onError={alert}
                />

                <div className="flex gap-4 pt-8">
                    <button type="button" onClick={onCancel} className="px-8 py-4 border border-stone-200 text-[10px] font-bold uppercase tracking-widest hover:bg-stone-50">Cancel</button>
                    <button type="submit" disabled={submitting} className="flex-1 bg-stone-900 text-white font-bold uppercase tracking-[0.2em] py-4 hover:bg-safety-700 transition-colors">
                        {submitting ? "Processing..." : userRole === 'ADMIN' ? "Save Entry" : "Submit Review"}
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