import React, { useState } from 'react';
import { Edit, Trash2, Search, PackageX, X, CheckSquare, Square, CheckCircle, Ban, Send, Loader2, FileUp, AlertTriangle } from 'lucide-react';
import { ProductVariant, Category, ProductionSite } from '../../../types';
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
    items, categories, onEdit, onDelete, onBulkStatusChange, onBulkDelete, onRefresh, onSubmit, userRole, lang = "en", isLoading = false
}) => {
  const T = (en: string, zh: string) => lang === 'zh' ? zh : en;
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [siteFilter, setSiteFilter] = useState<'all' | 'unassigned' | ProductionSite>('all');
  const [submittingIds, setSubmittingIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const isFactory = userRole === "FACTORY";
  const isAdmin = userRole === "ADMIN";

  const statusMap: Record<string, { label: string, color: string }> = {
    all: { label: T('All Statuses','全部状态'), color: '' },
    published: { label: T('Published','已发布'), color: 'bg-green-100 text-green-700' },
    awaiting_review: { label: T('Awaiting Audit','待审核'), color: 'bg-amber-100 text-amber-700' },
    draft: { label: T('Draft','草稿'), color: 'bg-stone-100 text-stone-500' },
    rejected: { label: T('Correction Req','已退回'), color: 'bg-red-100 text-red-700' }
  };

  const filteredItems = Array.isArray(items) ? items.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase()) || 
                         (i.code && i.code.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
    const sites = i.production_sites || [];
    const matchesSite = siteFilter === 'all' || (siteFilter === 'unassigned' ? sites.length === 0 : sites.includes(siteFilter));
    return matchesSearch && matchesStatus && matchesSite;
  }) : [];

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSubmitForReview = async (id: string) => {
      if (!confirm(T("Are you sure you want to submit this record to the master registry audit?","确认提交此产品进行审核吗？"))) return;
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
      if (!confirm(T(`Confirm submission of ${selectedIds.length} items for technical audit?`,`确认将选中的 ${selectedIds.length} 个产品提交审核吗？`))) return;

      setIsBulkProcessing(true);
      try {
          await Promise.all(selectedIds.map(id => onSubmit(id)));
          setSelectedIds([]);
          if (onRefresh) onRefresh();
          alert(T("Bulk submission successful.","批量提交成功。"));
      } catch (e: any) {
          alert("Bulk processing error: " + e.message);
      } finally {
          setIsBulkProcessing(false);
      }
  };

  const handleBulkDeleteAction = async () => {
    if (selectedIds.length === 0 || !onBulkDelete) return;
    if (!confirm(T(`PERMANENTLY delete ${selectedIds.length} selected records? This action is IRREVERSIBLE.`,`确认永久删除 ${selectedIds.length} 个产品吗？此操作不可撤销。`))) return;

    setIsBulkProcessing(true);
    try {
        await onBulkDelete(selectedIds);
        setSelectedIds([]);
        alert(T("Bulk deletion completed.","批量删除完成。"));
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
                        placeholder={T("Search SKU or Title...","搜索产品名称或 SKU…")} 
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
                <option value="all">{T("View All Statuses","查看全部状态")}</option>
                <option value="published">{T("Published","已发布")}</option>
                <option value="draft">{T("Draft","草稿")}</option>
                <option value="awaiting_review">{T("Awaiting Audit","待审核")}</option>
                <option value="rejected">{T("Correction Req","已退回")}</option>
             </select>
             <select
                aria-label={T("Filter production site","筛选生产基地")}
                value={siteFilter}
                onChange={e => setSiteFilter(e.target.value as typeof siteFilter)}
                className="bg-white border border-stone-200 px-4 py-3 text-[10px] font-bold text-stone-600 outline-none uppercase tracking-widest"
             >
                <option value="all">{T("All Production Sites","全部生产基地")}</option>
                <option value="zhaoqing">{T("Zhaoqing · China","中国肇庆")}</option>
                <option value="cambodia">{T("Kandal · Cambodia","柬埔寨干丹")}</option>
                <option value="unassigned">{T("Not Assigned","未指定生产基地")}</option>
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
                      <p className="text-[10px] font-bold uppercase tracking-widest">{T("Zero matching records found.","没有符合条件的产品。")}</p>
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
                                    <div className="flex items-center gap-1 text-[8px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded animate-pulse" title={T("Due to lack of valid assets, this product is automatically suppressed on the public site.","缺少有效图片，该产品不会在公开网站展示。")}>
                                        <AlertTriangle size={10} /> Hidden (Missing Assets)
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-4 font-mono text-[9px]">
                                <span className="text-stone-400 font-bold uppercase">{item.code || "NO_SKU"}</span>
                                <span className="text-stone-500 uppercase tracking-tight">{item.category || 'GENERAL'}</span>
                                {(item.production_sites || []).map(site => (
                                    <span key={site} className="rounded bg-stone-100 px-1.5 py-0.5 text-stone-600 uppercase">
                                        {site === 'zhaoqing' ? 'Zhaoqing' : 'Cambodia'}
                                    </span>
                                ))}
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
                                {(!isFactory || item.status === 'draft' || item.status === 'rejected') && (
                                    <button onClick={() => onEdit(item)} className="p-2 text-stone-400 hover:text-stone-900 hover:bg-white border border-transparent hover:border-stone-200 transition-all rounded-sm" title={T("Edit","编辑")}><Edit size={16} /></button>
                                )}
                                {isAdmin && onDelete && (
                                    <button 
                                        onClick={() => item.id && onDelete(item.id)} 
                                        className="p-2 text-stone-400 hover:text-red-600 hover:bg-white border border-transparent hover:border-stone-200 transition-all rounded-sm"
                                        title={T("Delete","删除")}
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
                       <span className="text-xs font-bold uppercase tracking-widest whitespace-nowrap">{T("Selected","已选择")}</span>
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