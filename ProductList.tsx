import React, { useState } from 'react';
import { Edit, Trash2, Search, PackageX, X, CheckSquare, Square, CheckCircle, Ban, Send, Loader2, FileUp, AlertTriangle } from 'lucide-react';
import { ProductVariant, Category } from '../../../types';
import { resolveImage } from '../../../utils/imageResolver';
import { AdminRowSkeleton } from '../../../components/common/Skeleton';

interface ProductListProps {
  items: ProductVariant[];
  categories: Category[];
  categoryTitle?: string;
  onEdit: (item: ProductVariant) => void;
  onDelete?: (id: string) => void;
  onBulkStatusChange?: (ids: string[], newStatus: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onRefresh?: () => void;
  onSubmit?: (id: string) => Promise<void>; 
  onCreate: () => void;
  onBack: () => void;
  userRole?: 'ADMIN' | 'FACTORY';
  lang: 'en' | 'zh';
  isLoading?: boolean;
}

const ProductList: React.FC<ProductListProps> = ({ 
    items, categories, onEdit, onDelete, onBulkStatusChange, onBulkDelete, onRefresh, onSubmit, userRole, isLoading = false
}) => {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [submittingIds, setSubmittingIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const isFactory = userRole === "FACTORY";
  const isAdmin = userRole === "ADMIN";

  const statusMap: Record<string, { label: string, color: string }> = {
    all: { label: 'All Statuses', color: '' },
    published: { label: 'Published', color: 'bg-green-100 text-green-700' },
    awaiting_review: { label: 'Awaiting Audit', color: 'bg-amber-100 text-amber-700' },
    draft: { label: 'Draft', color: 'bg-stone-100 text-stone-500' },
    rejected: { label: 'Correction Req', color: 'bg-red-100 text-red-700' }
  };

  const filteredItems = Array.isArray(items) ? items.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase()) || 
                         (i.code && i.code.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) : [];

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSubmitForReview = async (id: string) => {
      if (!confirm("Are you sure you want to submit this record to the master registry audit?")) return;
      if (!onSubmit) return;
      setSubmittingIds(prev => [...prev, id]);
      try {
          await onSubmit(id);
      } catch (e: any) {
          alert(`Submission failed: ${e.message}`);
      } finally {
          setSubmittingIds(prev => prev.filter(i => i !== id));
      }
  };

  const handleBulkSubmit = async () => {
      if (selectedIds.length === 0 || !onSubmit) return;
      if (!confirm(`Confirm submission of ${selectedIds.length} items for technical audit?`)) return;

      setIsBulkProcessing(true);
      try {
          await Promise.all(selectedIds.map(id => onSubmit(id)));
          setSelectedIds([]);
          if (onRefresh) onRefresh();
          alert("Bulk submission successful.");
      } catch (e: any) {
          alert("Bulk processing error: " + e.message);
      } finally {
          setIsBulkProcessing(false);
      }
  };

  const handleBulkDeleteAction = async () => {
    if (selectedIds.length === 0 || !onBulkDelete) return;
    if (!confirm(`PERMANENTLY delete ${selectedIds.length} selected records? This action is IRREVERSIBLE.`)) return;

    setIsBulkProcessing(true);
    try {
        await onBulkDelete(selectedIds);
        setSelectedIds([]);
        alert("Bulk deletion completed.");
    } catch (e: any) {
        alert("Deletion failed: " + e.message);
    } finally {
        setIsBulkProcessing(false);
    }
  };

  return (
    <div className="animate-fade-in relative">
       <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
             <div className="relative group max-w-sm w-full">
                <div className="flex items-center bg-white border border-stone-200 rounded-sm shadow-sm focus-within:border-stone-900 transition-all px-4 py-3">
                    <Search size={16} className="text-stone-400" />
                    <input 
                        type="text" 
                        placeholder="Search SKU or Title..." 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                        className="ml-3 w-full text-xs focus:outline-none font-sans" 
                    />
                </div>
             </div>
             <select 
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-white border border-stone-200 px-4 py-3 text-[10px] font-bold text-stone-600 outline-none uppercase tracking-widest"
             >
                <option value="all">View All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="awaiting_review">Awaiting Audit</option>
                <option value="rejected">Correction Req</option>
             </select>
          </div>
          
          <div className="text-[10px] font-mono text-stone-400 font-bold uppercase tracking-widest">
            {isLoading ? 'Syncing...' : `${filteredItems.length} records detected`}
          </div>
       </div>

       <div className="bg-white border border-stone-200 shadow-sm rounded-sm overflow-hidden">
            <div className="divide-y divide-stone-100">
              {isLoading ? (
                  Array.from({ length: 5 }).map((_, idx) => <AdminRowSkeleton key={idx} />)
              ) : filteredItems.length === 0 ? (
                  <div className="py-32 flex flex-col items-center justify-center text-stone-400">
                      <PackageX size={48} strokeWidth={1} className="mb-4 opacity-20" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">Zero matching records found.</p>
                  </div>
              ) : (
                filteredItems.map((item) => {
                    const isSelected = selectedIds.includes(item.id!);
                    const isSubmitting = submittingIds.includes(item.id!);
                    const imageUrl = resolveImage(item.images[0]);
                    const statusInfo = statusMap[item.status || 'draft'] || statusMap.draft;
                    
                    const isPublished = item.status === 'published';
                    const hasNoImages = !item.images || item.images.length === 0;

                    return (
                    <div key={item.id} className={`p-4 transition-colors flex items-center gap-6 group ${isSelected ? 'bg-safety-50' : 'hover:bg-stone-50'}`}>
                        <button onClick={() => item.id && toggleSelect(item.id)} className="text-stone-300 hover:text-safety-700">
                            {isSelected ? <CheckSquare size={18} className="text-safety-700"/> : <Square size={18}/>}
                        </button>
                        <div className="w-14 h-14 bg-stone-100 flex-shrink-0 border border-stone-200 overflow-hidden relative rounded-sm">
                            {imageUrl ? (
                                <img src={imageUrl} loading="lazy" alt="" className="w-full h-full object-cover mix-blend-multiply" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-stone-300 text-[8px] bg-stone-50">
                                   <AlertTriangle size={14} className="mb-1 text-amber-500 opacity-50" />
                                   NO ASSET
                                </div>
                            )}
                        </div>
                        <div className="flex-grow min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                                <h4 className="font-bold text-stone-900 text-sm truncate font-serif">{item.name}</h4>
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border-none uppercase tracking-tighter ${statusInfo.color}`}>
                                    {statusInfo.label}
                                </span>
                                {isPublished && hasNoImages && (
                                    <div className="flex items-center gap-1 text-[8px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded animate-pulse" title="Due to lack of valid assets, this product is automatically suppressed on the public site.">
                                        <AlertTriangle size={10} /> Hidden (Missing Assets)
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-4 font-mono text-[9px]">
                                <span className="text-stone-400 font-bold uppercase">{item.code || "NO_SKU"}</span>
                                <span className="text-stone-500 uppercase tracking-tight">{item.category || 'GENERAL'}</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            {isFactory && (item.status === 'draft' || item.status === 'rejected') && (
                                <button 
                                    onClick={() => item.id && handleSubmitForReview(item.id)}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 bg-stone-900 text-white px-4 py-2 text-[10px] font-bold uppercase hover:bg-safety-700 transition-colors rounded-sm"
                                >
                                    {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                    Submit Review
                                </button>
                            )}
                            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => onEdit(item)} className="p-2 text-stone-400 hover:text-stone-900 hover:bg-white border border-transparent hover:border-stone-200 transition-all rounded-sm" title="Edit"><Edit size={16} /></button>
                                {isAdmin && onDelete && (
                                    <button 
                                        onClick={() => item.id && onDelete(item.id)} 
                                        className="p-2 text-stone-400 hover:text-red-600 hover:bg-white border border-transparent hover:border-stone-200 transition-all rounded-sm"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    );
                })
              )}
            </div>
       </div>

       {/* Bulk Action Bar */}
       {selectedIds.length > 0 && (
           <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] animate-fade-in-up">
               <div className="bg-stone-900 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-8 border border-white/10 backdrop-blur-md">
                   <div className="flex items-center gap-3 pr-8 border-r border-white/10">
                       <span className="text-xs font-mono font-bold text-safety-700 bg-safety-700/10 px-2 py-1 rounded">{selectedIds.length}</span>
                       <span className="text-xs font-bold uppercase tracking-widest whitespace-nowrap">Selected</span>
                   </div>
                   {isFactory ? (
                       <button onClick={handleBulkSubmit} disabled={isBulkProcessing} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-safety-700 hover:text-safety-600 transition-colors">
                           {isBulkProcessing ? <Loader2 size={14} className="animate-spin"/> : <FileUp size={14} />} Transmit to Audit
                       </button>
                   ) : (
                       <div className="flex items-center gap-6">
                           <button onClick={() => { onBulkStatusChange?.(selectedIds, 'published'); setSelectedIds([]); }} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-green-400 hover:text-green-300 transition-colors">
                               <CheckCircle size={14} /> Bulk Publish
                           </button>
                           <button onClick={() => { onBulkStatusChange?.(selectedIds, 'draft'); setSelectedIds([]); }} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-white transition-colors">
                               <Ban size={14} /> Move to Draft
                           </button>
                           <div className="w-px h-4 bg-white/10 mx-2"></div>
                           <button 
                                onClick={handleBulkDeleteAction}
                                disabled={isBulkProcessing}
                                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-400 transition-colors"
                           >
                               {isBulkProcessing ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14} />} Bulk Delete
                           </button>
                       </div>
                   )}
                   <button onClick={() => setSelectedIds([])} className="text-white/40 hover:text-white ml-4"><X size={16} /></button>
               </div>
           </div>
       )}
    </div>
  );
};

export default ProductList;