import React, { useState } from 'react';
import { Edit, Search, PackageX, X, CheckSquare, Square, Send, Loader2, FileUp, AlertTriangle } from 'lucide-react';
import { ProductVariant, Category, ProductionSite } from '../../../types';
import { resolveImage } from '../../../utils/imageResolver';
import { AdminRowSkeleton } from '../../../components/common/Skeleton';

interface ProductListProps {
  items: ProductVariant[];
  categories: Category[];
  categoryTitle?: string;
  onEdit: (item: ProductVariant) => void;
  onRefresh?: () => void;
  onSubmit?: (id: string) => Promise<void>; 
  onCreate: () => void;
  onBack: () => void;
  userRole?: 'ADMIN' | 'FACTORY';
  lang: 'en' | 'zh';
  isLoading?: boolean;
}

const ProductList: React.FC<ProductListProps> = ({ 
    items, categories, onEdit, onRefresh, onSubmit, userRole, lang = "en", isLoading = false
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
    rejected: { label: T('Correction Req','已退回'), color: 'bg-red-100 text-red-700' },
    returned_to_uploader: { label: '待修改', color: 'bg-red-100 text-red-700' },
    pending_supervisor: { label: '待主管初审', color: 'bg-amber-100 text-amber-700' },
    pending_admin: { label: '待管理员终审', color: 'bg-amber-100 text-amber-700' },
    returned_to_supervisor: { label: '已退回主管', color: 'bg-orange-100 text-orange-700' },
    approved_pending_publish: { label: '已批准待发布', color: 'bg-green-100 text-green-700' }
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
          alert(T(`Submission failed: ${e.message}`, `提交审核失败：${e.message}`));
      } finally {
          setSubmittingIds(prev => prev.filter(i => i !== id));
      }
  };

  const handleBulkSubmit = async () => {
      if (selectedIds.length === 0 || !onSubmit) return;
      if (!confirm(T(`Confirm submission of ${selectedIds.length} items for technical audit?`,`确认将选中的 ${selectedIds.length} 个产品提交审核吗？`))) return;

      setIsBulkProcessing(true);
      try {
          // Some submissions can succeed while others fail (e.g. a stale status).
          // Keep failed IDs selected; never claim the entire batch succeeded.
          const ids = [...selectedIds];
          const results = await Promise.allSettled(ids.map(id => onSubmit(id)));
          const failedIds = ids.filter((_, i) => results[i].status === 'rejected');
          setSelectedIds(failedIds);
          await onRefresh?.();
          if (failedIds.length) {
              alert(T(
                  `${ids.length - failedIds.length} submitted, ${failedIds.length} failed. Failed items remain selected; refresh and inspect their status before retrying.`,
                  `成功提交 ${ids.length - failedIds.length} 个，失败 ${failedIds.length} 个。失败的产品仍保持选中，请刷新核对状态后再决定是否重试。`
              ));
          } else {
              alert(T("Bulk submission successful.","批量提交成功。"));
          }
      } catch (e: any) {
          alert(T("Bulk processing error: ", "批量操作失败：") + e.message);
      } finally {
          setIsBulkProcessing(false);
      }
  };


  return (
    <div className="animate-fade-in relative">
       {isAdmin && <p role="note" className="mb-4 rounded border border-stone-200 bg-stone-50 p-3 text-xs text-stone-600">
         {T('Product approvals and publishing must go through the Review Center. Approved and published products cannot be directly edited here.',
           '产品审核与发布请在“审核中心”操作；已批准或已发布的产品不能在此直接修改。')}
       </p>}
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
                <option value="returned_to_uploader">待员工修改</option>
                <option value="pending_supervisor">待主管初审</option>
                <option value="pending_admin">待管理员终审</option>
                <option value="approved_pending_publish">待发布</option>
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
            {isLoading ? T('Syncing...','正在同步…') : T(`${filteredItems.length} records detected`, `共 ${filteredItems.length} 条产品`)}
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
                        {isFactory && !!onSubmit && <button type="button" aria-label={T('Select product for review','选择产品提交审核')}
                            onClick={() => item.id && toggleSelect(item.id)} className="text-stone-300 hover:text-safety-700">
                            {isSelected ? <CheckSquare size={18} className="text-safety-700"/> : <Square size={18}/>}
                        </button>}
                        <div className="w-14 h-14 bg-stone-100 flex-shrink-0 border border-stone-200 overflow-hidden relative rounded-sm">
                            {imageUrl ? (
                                <img src={imageUrl} loading="lazy" alt="" className="w-full h-full object-cover mix-blend-multiply" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-stone-300 text-[8px] bg-stone-50">
                                   <AlertTriangle size={14} className="mb-1 text-amber-500 opacity-50" />
                                   {T("NO ASSET","无图片")}
                                </div>
                            )}
                        </div>
                        <div className="flex-grow min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                                <h4 className="font-bold text-stone-900 text-sm truncate font-serif">{lang === "zh" ? (item.name_cn || item.name) : item.name}</h4>
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border-none uppercase tracking-tighter ${statusInfo.color}`}>
                                    {statusInfo.label}
                                </span>
                                {isPublished && hasNoImages && (
                                    <div className="flex items-center gap-1 text-[8px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded animate-pulse" title={T("Due to lack of valid assets, this product is automatically suppressed on the public site.","缺少有效图片，该产品不会在公开网站展示。")}>
                                        <AlertTriangle size={10} /> {T("Hidden (Missing Assets)","因缺少图片未公开")}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-4 font-mono text-[9px]">
                                <span className="text-stone-400 font-bold uppercase">{item.code || T("NO SKU","无 SKU")}</span>
                                <span className="text-stone-500 uppercase tracking-tight">{(categories.find(c => c.id === item.category)?.[lang === 'zh' ? 'title_cn' : 'title'] || categories.find(c => c.id === item.category)?.title || item.category) || T('General','未分类')}</span>
                                {(item.production_sites || []).map(site => (
                                    <span key={site} className="rounded bg-stone-100 px-1.5 py-0.5 text-stone-600 uppercase">
                                        {site === 'zhaoqing' ? T('Zhaoqing','肇庆') : T('Cambodia','柬埔寨')}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            {isFactory && (['draft','rejected','returned_to_uploader'].includes(item.status||'')) && (
                                <button 
                                    onClick={() => item.id && handleSubmitForReview(item.id)}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 bg-stone-900 text-white px-4 py-2 text-[10px] font-bold uppercase hover:bg-safety-700 transition-colors rounded-sm"
                                >
                                    {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                    {T("Submit Review","提交审核")}
                                </button>
                            )}
                            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                {(isAdmin ? ['draft','rejected'].includes(item.status||'') : ['draft','rejected','returned_to_uploader'].includes(item.status||'')) && (
                                    <button onClick={() => onEdit(item)} className="p-2 text-stone-400 hover:text-stone-900 hover:bg-white border border-transparent hover:border-stone-200 transition-all rounded-sm" title={T("Edit","编辑")}><Edit size={16} /></button>
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
       {isFactory && !!onSubmit && selectedIds.length > 0 && (
           <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] animate-fade-in-up">
               <div className="bg-stone-900 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-8 border border-white/10 backdrop-blur-md">
                   <div className="flex items-center gap-3 pr-8 border-r border-white/10">
                       <span className="text-xs font-mono font-bold text-safety-700 bg-safety-700/10 px-2 py-1 rounded">{selectedIds.length}</span>
                       <span className="text-xs font-bold uppercase tracking-widest whitespace-nowrap">{T("Selected","已选择")}</span>
                   </div>
                   <button type="button" onClick={() => void handleBulkSubmit()} disabled={isBulkProcessing}
                       className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-safety-700 hover:text-safety-600 transition-colors">
                       {isBulkProcessing ? <Loader2 size={14} className="animate-spin"/> : <FileUp size={14} />}
                       {T('Submit for review','批量提交审核')}
                   </button>
                   <button onClick={() => setSelectedIds([])} className="text-white/40 hover:text-white ml-4"><X size={16} /></button>
               </div>
           </div>
       )}
    </div>
  );
};

export default ProductList;