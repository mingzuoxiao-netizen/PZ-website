import React, { useState, useEffect } from 'react';
import { ProductVariant, Category } from '../../../types';
import PZImageManager from './PZImageManager';
import LivePreview from './LivePreview';
import { useProductImageActions } from '../../../hooks/useProductImageActions';
import { Save, ArrowLeft, Info, Send, Loader2, RefreshCw, Layers, ClipboardList, Database } from 'lucide-react';

interface ProductFormProps {
  initialData: Partial<ProductVariant>;
  categories: Category[];
  onSave: (data: any) => void;
  onSubmit?: (id: string) => Promise<void>;
  onCancel: () => void;
  onUpload?: (file: File) => Promise<string>; 
  fixedCategoryId?: string;
  userRole: 'ADMIN' | 'FACTORY';
  lang: 'en' | 'zh'; 
}

const ProductForm: React.FC<ProductFormProps> = ({ 
  initialData, categories, onSave, onSubmit, onCancel, 
  fixedCategoryId, userRole 
}) => {
  const [formData, setFormData] = useState<Partial<ProductVariant>>(initialData);
  const [submitting, setSubmitting] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const imageActions = useProductImageActions({
      role: userRole,
      autoPublish: userRole === 'ADMIN' ? 'products' : 'none',
      allowCloudDelete: false
  });

  useEffect(() => {
    if (fixedCategoryId && !initialData.id) {
        setFormData(prev => ({ ...prev, category: fixedCategoryId }));
    }
  }, [fixedCategoryId, initialData.id]);

  const handleChange = (field: keyof ProductVariant, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCloudDelete = async (urlToRemove: string) => {
      if (!formData.id) {
          const current = formData.images || [];
          handleChange('images', current.filter(u => u !== urlToRemove));
          return;
      }
      setIsSyncing(true);
      try {
          const updated = await imageActions.removeImageFromProduct(formData as any, urlToRemove);
          setFormData(updated as any);
      } catch (e: any) {
          alert(`Sync Warning: ${e.message}`);
      } finally {
          setIsSyncing(false);
      }
  };

  const handleImageUpdate = async (nextImages: string[]) => {
      if (formData.id) {
          setIsSyncing(true);
          try {
              const updated = await imageActions.reorderProductImages(formData as any, nextImages);
              setFormData(updated as any);
          } catch (e: any) {
              alert(`Sort Sync Failed: ${e.message}`);
          } finally {
              setIsSyncing(false);
          }
      } else {
          handleChange('images', nextImages);
      }
  };

  const handleLocalSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    if (!formData.name) { 
        alert("Product name is required for induction."); 
        setSubmitting(false); 
        return; 
    }
    
    let finalStatus = formData.status || 'draft';
    onSave({
        ...formData,
        status: finalStatus,
        is_published: finalStatus === 'published' ? 1 : 0
    });
  };

  const handlePromote = async () => {
      if (!formData.id || !onSubmit) return;
      if (!confirm("Proceed with submitting this SKU to the master registry audit?")) return;
      setIsPromoting(true);
      try {
          await onSubmit(formData.id);
      } catch (e) { /* Error reported by parent */ }
      finally { setIsPromoting(false); }
  };

  const canPromote = userRole === 'FACTORY' && !!formData.id && (formData.status === 'draft' || formData.status === 'rejected');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-fade-in pb-20">
       
       {/* Left: Functional Form */}
       <div className="lg:col-span-8">
          <div className="bg-white border border-stone-200 shadow-xl rounded-sm overflow-hidden relative">
             {isSyncing && (
                 <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-20 flex items-center justify-center">
                     <div className="flex items-center gap-3 bg-stone-900 text-white px-6 py-3 rounded-full shadow-2xl">
                         <RefreshCw size={16} className="animate-spin text-safety-700" />
                         <span className="text-[10px] font-bold uppercase tracking-widest">Registry Syncing...</span>
                     </div>
                 </div>
             )}

             <div className="bg-stone-900 px-8 py-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-3">
                   <ClipboardList size={18} className="text-safety-700" />
                   <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">Product Induction Protocol</h3>
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-[9px] font-mono opacity-40 uppercase">Revision v1.2</span>
                </div>
             </div>

             <form onSubmit={handleLocalSave} className="p-8 space-y-12">
                
                {/* 1. Identification Section */}
                <section>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-900 text-xs font-bold font-mono">01</div>
                        <h4 className="text-[11px] font-bold uppercase tracking-widest text-stone-900">Identification & Classification</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-stone-400 mb-2">Production Series</label>
                            <select 
                                value={formData.category || ''} 
                                onChange={e => handleChange('category', e.target.value)} 
                                disabled={!!fixedCategoryId} 
                                className="w-full bg-stone-50 border border-stone-200 p-4 text-sm font-bold focus:border-stone-900 outline-none transition-colors appearance-none"
                            >
                                <option value="">Select Target Category...</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-stone-400 mb-2">Sub-Collection (Optional)</label>
                            <input 
                                type="text" 
                                value={formData.sub_category || ''} 
                                onChange={e => handleChange('sub_category', e.target.value)} 
                                className="w-full bg-stone-50 border border-stone-200 p-4 text-sm focus:border-stone-900 outline-none transition-colors" 
                                placeholder="e.g. Minimalist Series" 
                            />
                        </div>
                    </div>
                </section>

                {/* 2. Core Information Section */}
                <section>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-900 text-xs font-bold font-mono">02</div>
                        <h4 className="text-[11px] font-bold uppercase tracking-widest text-stone-900">Product Specification</h4>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-stone-400 mb-2">Display Name</label>
                            <input 
                                type="text" 
                                required
                                value={formData.name || ''} 
                                onChange={e => handleChange('name', e.target.value)} 
                                className="w-full border-b-2 border-stone-100 p-4 font-serif text-2xl outline-none focus:border-safety-700 transition-colors" 
                                placeholder="Formal Product Title" 
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-stone-400 mb-2">Technical Description</label>
                            <textarea 
                                rows={4} 
                                value={formData.description || ''} 
                                onChange={e => handleChange('description', e.target.value)} 
                                className="w-full bg-stone-50 border border-stone-200 p-4 text-sm outline-none focus:border-stone-900 resize-none leading-relaxed" 
                                placeholder="Detail the structural characteristics and design intent..." 
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-stone-400 mb-2">Primary Material</label>
                            <input type="text" value={formData.material || ''} onChange={e => handleChange('material', e.target.value)} className="w-full border border-stone-200 p-4 text-sm focus:border-stone-900 outline-none" placeholder="e.g. Solid North American Oak" />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-stone-400 mb-2">Registry SKU Code</label>
                            <div className="flex">
                                <span className="bg-stone-100 border border-r-0 border-stone-200 px-4 flex items-center text-stone-400 font-mono text-xs font-bold">PZ-</span>
                                <input 
                                    type="text" 
                                    value={(formData.code || '').replace(/^PZ-/, '')} 
                                    onChange={e => handleChange('code', `PZ-${e.target.value.toUpperCase()}`)} 
                                    className="w-full border border-stone-200 p-4 text-sm font-mono focus:border-stone-900 outline-none uppercase" 
                                    placeholder="XXX-000" 
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. Assets Section */}
                <section>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-900 text-xs font-bold font-mono">03</div>
                        <h4 className="text-[11px] font-bold uppercase tracking-widest text-stone-900">Digital Asset Management</h4>
                    </div>
                    <PZImageManager 
                        images={formData.images || []}
                        onUpdate={handleImageUpdate}
                        onDelete={handleCloudDelete}
                        onUpload={imageActions.uploadImage}
                        onError={alert}
                    />
                </section>

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-12 border-t border-stone-100">
                    <button type="button" onClick={onCancel} className="px-10 py-5 border border-stone-200 text-[10px] font-bold uppercase tracking-widest hover:bg-stone-50 transition-colors flex items-center justify-center gap-3 group">
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Discard
                    </button>
                    
                    <button type="submit" disabled={submitting || isPromoting || isSyncing} className="flex-grow bg-white border-2 border-stone-900 text-stone-900 font-bold uppercase tracking-[0.2em] py-5 hover:bg-stone-900 hover:text-white transition-all flex items-center justify-center gap-3 shadow-lg">
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Store Draft
                    </button>

                    {canPromote && (
                        <button 
                            type="button" 
                            onClick={handlePromote}
                            disabled={submitting || isPromoting || isSyncing} 
                            className="flex-grow bg-safety-700 text-white font-bold uppercase tracking-[0.2em] py-5 hover:bg-safety-600 transition-all flex items-center justify-center gap-3 shadow-xl"
                        >
                            {isPromoting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            Submit for Review
                        </button>
                    )}
                </div>
             </form>
          </div>
       </div>

       {/* Right: Technical Blueprint Preview */}
       <div className="lg:col-span-4">
          <div className="sticky top-24">
              <div className="bg-stone-900 text-white px-5 py-3 flex items-center gap-2 rounded-t-sm">
                  <Database size={14} className="text-safety-700" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Registry Insight Preview</span>
              </div>
              <div className="border border-t-0 border-stone-200 p-1 bg-stone-50 shadow-2xl">
                 <LivePreview formData={formData} />
              </div>
              
              <div className="mt-8 p-6 bg-amber-50 border border-amber-200 rounded-sm">
                  <div className="flex items-start gap-3">
                      <Info size={18} className="text-amber-700 flex-shrink-0 mt-0.5" />
                      <div className="text-[10px] text-amber-800 leading-relaxed uppercase tracking-widest font-bold">
                          <p className="mb-2">Induction Note:</p>
                          <p className="font-normal normal-case text-amber-600">This form adheres to Version-A Safety Protocols. Physical deletion of cloud assets is restricted to prevent library corruption.</p>
                      </div>
                  </div>
              </div>
          </div>
       </div>
    </div>
  );
};

export default ProductForm;