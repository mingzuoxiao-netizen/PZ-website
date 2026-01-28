import React, { useState, useEffect } from 'react';
import { ProductVariant, Category } from '../../../types';
import PZImageManager from './PZImageManager';
import LivePreview from './LivePreview';
import { useProductImageActions } from '../../../hooks/useProductImageActions';
import { Save, ArrowLeft, Info, Send, Loader2, RefreshCw } from 'lucide-react';

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

  // Initialize A-version standardized image actions
  const imageActions = useProductImageActions({
      role: userRole,
      autoPublish: userRole === 'ADMIN' ? 'products' : 'none',
      allowCloudDelete: false // Minimum risk: de-reference only
  });

  useEffect(() => {
    if (fixedCategoryId && !initialData.id) {
        setFormData(prev => ({ ...prev, category: fixedCategoryId }));
    }
  }, [fixedCategoryId, initialData.id]);

  const handleChange = (field: keyof ProductVariant, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  /**
   * handleCloudDelete: A-Version implementation
   * Removes reference from product images list in DB without physical file deletion.
   */
  const handleCloudDelete = async (urlToRemove: string) => {
      // Must have ID to sync back to registry
      if (!formData.id) {
          // If product isn't saved yet, just update local state
          const current = formData.images || [];
          handleChange('images', current.filter(u => u !== urlToRemove));
          return;
      }

      setIsSyncing(true);
      try {
          // Syncs removal to DB + triggers Auto-Publish if Admin
          const updated = await imageActions.removeImageFromProduct(formData as any, urlToRemove);
          setFormData(updated as any);
      } catch (e: any) {
          alert(`Registry Sync Failed: ${e.message}`);
      } finally {
          setIsSyncing(false);
      }
  };

  /**
   * handleImageUpdate: Handles sorting or appending
   */
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
        alert("Product name is required."); 
        setSubmitting(false); 
        return; 
    }
    
    let finalStatus = formData.status || 'draft';
    if (userRole === 'FACTORY' && !initialData.id) {
        finalStatus = 'draft';
    }

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
      } catch (e) {
          // Errors are reported by parent component
      } finally {
          setIsPromoting(false);
      }
  };

  // Check formData.id to ensure the button appears immediately after a successful initial save
  const canPromote = userRole === 'FACTORY' && !!formData.id && (formData.status === 'draft' || formData.status === 'rejected');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-fade-in">
       <div className="lg:col-span-2">
          {userRole === 'FACTORY' && (
              <div className="bg-stone-900 border border-stone-800 p-6 mb-6 rounded-sm flex items-start gap-4 shadow-xl">
                  <Info size={20} className="text-safety-700 mt-0.5" />
                  <div className="text-xs text-stone-300 leading-relaxed">
                      <p className="font-bold text-white mb-1 uppercase tracking-widest">Protocol Instruction</p>
                      <p>Image removal updates the registry immediately while <span className="text-safety-700">retaining cloud backups</span>. Submit for audit once data is complete.</p>
                  </div>
              </div>
          )}

          <div className="bg-white p-8 border border-stone-200 shadow-sm mb-8 rounded-sm relative">
             {isSyncing && (
                 <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-20 flex items-center justify-center">
                     <div className="flex items-center gap-3 bg-stone-900 text-white px-6 py-3 rounded-full shadow-2xl">
                         <RefreshCw size={16} className="animate-spin text-safety-700" />
                         <span className="text-[10px] font-bold uppercase tracking-widest">Synchronizing Registry...</span>
                     </div>
                 </div>
             )}

             <form onSubmit={handleLocalSave} className="space-y-8">
                <div className="grid grid-cols-1 gap-8">
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-stone-400 mb-3 tracking-widest">1. Series Assignment</label>
                        <select 
                            value={formData.category || ''} 
                            onChange={e => handleChange('category', e.target.value)} 
                            disabled={!!fixedCategoryId} 
                            className="w-full bg-stone-50 border border-stone-200 p-4 text-sm font-bold focus:border-stone-900 outline-none transition-colors"
                        >
                            <option value="">Select category...</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] uppercase font-bold text-stone-400 mb-3 tracking-widest">2. Core Information</label>
                        <div className="space-y-4">
                            <input 
                                type="text" 
                                value={formData.name || ''} 
                                onChange={e => handleChange('name', e.target.value)} 
                                className="w-full border border-stone-200 p-4 font-serif text-lg outline-none focus:border-safety-700" 
                                placeholder="Product Name (e.g. Zen Solid Ash Desk)" 
                            />
                            <textarea 
                                rows={4} 
                                value={formData.description || ''} 
                                onChange={e => handleChange('description', e.target.value)} 
                                className="w-full border border-stone-200 p-4 text-sm outline-none focus:border-safety-700 resize-none" 
                                placeholder="Technical specs, manufacturing notes, or design attributes..." 
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-stone-50 p-6 border border-stone-100 grid grid-cols-1 md:grid-cols-2 gap-6 rounded-sm">
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-stone-400 mb-2">Material Type</label>
                        <input type="text" value={formData.material || ''} onChange={e => handleChange('material', e.target.value)} className="w-full bg-white border border-stone-200 p-3 text-sm focus:border-stone-900 outline-none" placeholder="e.g. North American Walnut" />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-stone-400 mb-2">Factory SKU Code</label>
                        <input type="text" value={formData.code || ''} onChange={e => handleChange('code', e.target.value)} className="w-full bg-white border border-stone-200 p-3 text-sm font-mono uppercase focus:border-stone-900 outline-none" placeholder="PZ-XXX-000" />
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] uppercase font-bold text-stone-400 mb-3 tracking-widest">3. Media Assets</label>
                    <PZImageManager 
                        label="Product Images"
                        images={formData.images || []}
                        onUpdate={handleImageUpdate}
                        onDelete={handleCloudDelete}
                        onUpload={imageActions.uploadImage}
                        onError={alert}
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-stone-100">
                    <button type="button" onClick={onCancel} className="flex-1 px-8 py-4 border border-stone-200 text-[10px] font-bold uppercase tracking-widest hover:bg-stone-50 flex items-center justify-center gap-2">
                        <ArrowLeft size={14} /> Discard
                    </button>
                    
                    <button type="submit" disabled={submitting || isPromoting || isSyncing} className="flex-1 bg-white border border-stone-900 text-stone-900 font-bold uppercase tracking-[0.2em] py-4 hover:bg-stone-900 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm">
                        {submitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Save Draft
                    </button>

                    {canPromote && (
                        <button 
                            type="button" 
                            onClick={handlePromote}
                            disabled={submitting || isPromoting || isSyncing} 
                            className="flex-1 bg-stone-900 text-white font-bold uppercase tracking-[0.2em] py-4 hover:bg-safety-700 transition-colors flex items-center justify-center gap-2 shadow-lg"
                        >
                            {isPromoting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                            Submit Review
                        </button>
                    )}
                </div>
             </form>
          </div>
       </div>
       <div className="lg:col-span-1">
          <div className="sticky top-24">
              <div className="bg-stone-900 text-white px-4 py-2 text-[9px] font-bold uppercase tracking-widest rounded-t-sm inline-block">Registry Snapshot</div>
              <LivePreview formData={formData} />
          </div>
       </div>
    </div>
  );
};

export default ProductForm;