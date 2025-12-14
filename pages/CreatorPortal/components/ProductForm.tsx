import React, { useState } from 'react';
import { ProductVariant, Category } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { Save, X } from 'lucide-react';
import PZImageManager from './PZImageManager';
import LivePreview from './LivePreview';

interface ProductFormProps {
  initialData: Partial<ProductVariant>;
  categories: Category[];
  onSave: (data: ProductVariant) => void;
  onCancel: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ initialData, categories, onSave, onCancel }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<Partial<ProductVariant>>(initialData);
  const [submitting, setSubmitting] = useState(false);
  const editingId = initialData.id;

  const handleChange = (field: keyof ProductVariant, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Basic validation
    if (!formData.name) {
        alert("Name is required");
        setSubmitting(false);
        return;
    }
    // ensure images is array
    if (!formData.images) formData.images = [];
    
    onSave(formData as ProductVariant);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-fade-in">
       <div className="lg:col-span-2">
          <div className="bg-white p-8 border border-stone-200 shadow-sm mb-8">
             <h2 className="font-serif text-2xl text-stone-900 mb-6">
                {editingId ? t.creator.form.edit : t.creator.form.add}
             </h2>
             
             <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                   <div>
                      <label className="block text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">Name</label>
                      <input 
                        type="text" 
                        value={formData.name || ''} 
                        onChange={e => handleChange('name', e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 p-3 text-sm focus:border-amber-700 outline-none"
                      />
                   </div>
                   <div>
                      <label className="block text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">Code</label>
                      <input 
                        type="text" 
                        value={formData.code || ''} 
                        onChange={e => handleChange('code', e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 p-3 text-sm focus:border-amber-700 outline-none"
                      />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div>
                      <label className="block text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">Category</label>
                      <select 
                        value={formData.category || ''}
                        onChange={e => handleChange('category', e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 p-3 text-sm focus:border-amber-700 outline-none"
                      >
                         <option value="">Select Category</option>
                         {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="block text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">Status</label>
                      <select 
                        value={formData.status || 'published'}
                        onChange={e => handleChange('status', e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 p-3 text-sm focus:border-amber-700 outline-none"
                      >
                         <option value="published">Published</option>
                         <option value="draft">Draft</option>
                         <option value="hidden">Hidden</option>
                      </select>
                   </div>
                </div>

                <div>
                    <label className="block text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">Description</label>
                    <textarea 
                        rows={5}
                        value={formData.description || ''}
                        onChange={e => handleChange('description', e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 p-3 text-sm focus:border-amber-700 outline-none resize-none"
                    />
                </div>

                <div>
                   <PZImageManager 
                     label="Product Images"
                     images={formData.images || []}
                     onUpdate={(imgs) => handleChange('images', imgs)}
                     onError={alert}
                   />
                </div>

                <div className="flex gap-4 pt-6 border-t border-stone-100">
                    <button
                        type="submit"
                        disabled={submitting || !(formData.images && formData.images.length > 0)}
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
                    <button 
                        type="button" 
                        onClick={onCancel}
                        className="px-8 border border-stone-200 text-stone-500 hover:text-stone-900 uppercase font-bold text-xs tracking-widest"
                    >
                        {t.creator.form.cancel}
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