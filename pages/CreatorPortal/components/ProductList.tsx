import React, { useEffect, useState } from 'react';
import { Edit, Search, PackageX, X, CheckSquare, Square, Send, Loader2, FileUp, AlertTriangle, Trash2 } from 'lucide-react';
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
  onStartRevision?: (item: ProductVariant) => void;
  onCatalogVisibility?: (item: ProductVariant) => Promise<void>;
  serverFiltered?: boolean;
  onArchive?: (item: ProductVariant) => Promise<void>;
  onPermanentDelete?: (item: ProductVariant) => Promise<void>; 
  onCreate: () => void;
  onBack: () => void;
  userRole?: 'ADMIN' | 'FACTORY';
  lang: 'en' | 'zh';
  isLoading?: boolean;
}

const ProductList: React.FC<ProductListProps> = ({ 
    items, categories, onEdit, onRefresh, onSubmit, onStartRevision, onCatalogVisibility, onArchive, serverFiltered = false, onPermanentDelete, userRole, lang = "en", isLoading = false
}) => {
  const T = (en: string, zh: string) => lang === 'zh' ? zh : en;
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [visibilityId, setVisibilityId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [siteFilter, setSiteFilter] = useState<'all' | 'unassigned' | ProductionSite>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [submittingIds, setSubmittingIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [deletingId,setDeletingId] = useState<string | null>(null);

  const isFactory = userRole === "FACTORY";
  const isAdmin = userRole === "ADMIN";
  const eligibleForPermanentDelete=(status?:string)=>
    ['draft','rejected','unpublished','inactive','archived'].includes(String(status||''));
  const adminCanDelete=isAdmin&&!!onPermanentDelete;
  const deletionBusy=deletingId!==null||isBulkProcessing;

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
    approved_pending_publish: { label: '已批准待发布', color: 'bg-green-100 text-green-700' },
    unpublished: { label: '已下架', color: 'bg-stone-100 text-stone-600' },
    inactive: { label: '停用', color: 'bg-stone-100 text-stone-600' },
    archived: { label: '已归档', color: 'bg-stone-100 text-stone-600' }
  };

  const searchTerm=search.trim().toLowerCase();
  const actionStatuses=isFactory
    ? ['draft','rejected','returned_to_uploader']
    : ['pending_admin','approved_pending_publish'];
  const filteredItems = serverFiltered ? items : Array.isArray(items) ? items.filter(i => {
    const matchesSearch=[i.name,i.name_cn,i.code].some(v=>
      String(v||'').toLowerCase().includes(searchTerm));
    const catalogStatus = i.status === 'published' && i.catalog_hidden ? 'unpublished' : i.status;
    const matchesStatus=statusFilter==='all' || (statusFilter==='action'
      ? actionStatuses.includes(String(i.status||''))
      : catalogStatus===statusFilter);
    const sites=i.production_sites||[];
    const matchesSite=siteFilter==='all' || (siteFilter==='unassigned'
      ? sites.length===0 : sites.includes(siteFilter));
    return matchesSearch&&matchesStatus&&matchesSite;
  }) : [];
  const adminDeleteCandidates=adminCanDelete
    ? filteredItems.filter(x=>!!x.id&&eligibleForPermanentDelete(x.status))
    : [];
  const adminSelected=adminDeleteCandidates.filter(x=>selectedIds.includes(x.id!));
  useEffect(()=>{
    setSelectedIds(prev=>prev.filter(id=>items.some(x=>x.id===id)));
  },[items]);
  const hasCustomFilters=!['all','action','published'].includes(statusFilter)||siteFilter!=='all';

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const changeCatalogVisibility = async (item: ProductVariant) => {
    if (!onCatalogVisibility || visibilityId) return;
    setVisibilityId(item.id);
    try {
      await onCatalogVisibility(item);
    } catch (error) {
      alert(error instanceof Error ? error.message : T('Could not update catalog visibility', '更新上架状态失败'));
    } finally {
      setVisibilityId(null);
    }
  };

  const handlePermanentDelete=async(item:ProductVariant)=>{
    if(!onPermanentDelete||!item.id||deletionBusy)return;
    if(!confirm('确定永久删除这件产品？操作不可恢复，SKU 将释放，R2 原图仍保留。已有审核历史或曾发布的产品不可永久删除。'))return;
    setDeletingId(item.id);
    try{
      await onPermanentDelete(item);
      setSelectedIds(prev=>prev.filter(id=>id!==item.id));
      await onRefresh?.();
      alert('产品已永久删除，无需输入 SKU。');
    }catch(error:any){
      await onRefresh?.();
      alert(T('Permanent delete failed: ','永久删除失败：')+(error?.message||'请重试'));
    }finally{setDeletingId(null);}
  };

  const handleAdminBulkDelete=async()=>{
    if(!onPermanentDelete||deletionBusy||!adminSelected.length)return;
    const batch=[...adminSelected];
    if(!confirm('确认永久删除选中的 '+batch.length+
      ' 件产品？不可恢复，不需要输入 SKU。已有审核历史或曾发布的产品仍受后端保护，R2 原图不会删除。'))return;
    setIsBulkProcessing(true);
    const failed:{id:string;sku:string;reason:string}[]=[];
    let succeeded=0;
    try{
      // No bulk permission bypass: use existing preflight and deletion guards per item.
      for(const item of batch){
        try{await onPermanentDelete(item);succeeded++;}
        catch(error:any){
          failed.push({id:item.id!,sku:item.code||item.name||item.id!,
            reason:error?.message||'删除结果未确认'});
        }
      }
      setSelectedIds(failed.map(x=>x.id));
      await onRefresh?.();
      if(failed.length)alert('批量删除结果：成功 '+succeeded+' 件，失败 '+failed.length+
        ' 件。\n'+failed.slice(0,5).map(x=>x.sku+'：'+x.reason).join('\n')+
        (failed.length>5?'\n其余失败项目请单独核对。':'')+
        '\n失败项目已保留选中，请核对后再重试。');
      else alert('已删除 '+succeeded+' 件产品，R2 原图未删除。');
    }finally{setIsBulkProcessing(false);}
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
       {!serverFiltered && (<section className="mb-5 space-y-3 rounded border border-stone-200 bg-white p-3 sm:p-4" aria-label="产品筛选">
         <div className="flex flex-wrap items-center gap-3">
           <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded border border-stone-300 bg-white px-3 py-2.5">
             <Search size={17} className="shrink-0 text-stone-500" aria-hidden="true"/>
             <span className="sr-only">{T('Search products','搜索产品')}</span>
             <input value={search} onChange={e=>setSearch(e.target.value)}
               placeholder={T('Search name or SKU','搜索中文名、英文名或 SKU')}
               className="w-full bg-transparent text-sm text-stone-900 outline-none"/>
           </label>
           <div className="flex flex-wrap gap-1" role="group" aria-label="快捷状态筛选">
             {([
               ['all',T('All','全部')],
               ['action',T('Needs action','待处理')],
               ['published',T('Published','已发布')]
             ] as const).map(([status,name])=><button key={status} type="button"
               aria-pressed={statusFilter===status}
               onClick={()=>setStatusFilter(status)}
               className={'rounded px-3 py-2.5 text-xs font-semibold transition-colors '+
                 (statusFilter===status?'bg-stone-900 text-white':'bg-stone-100 text-stone-700 hover:bg-stone-200')}>
               {name}
             </button>)}
           </div>
           <button type="button" aria-expanded={showAdvancedFilters}
             onClick={()=>setShowAdvancedFilters(v=>!v)}
             className="rounded border border-stone-300 px-3 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50">
             {showAdvancedFilters?T('Hide filters','收起筛选'):T('More filters','更多筛选')}
             {hasCustomFilters?' · 已筛选':''}
           </button>
         </div>
         {showAdvancedFilters&&<div className="flex flex-wrap items-end gap-3 border-t border-stone-100 pt-3">
           <label className="text-xs font-semibold text-stone-700">
             {T('Specific status','具体状态')}
             <select aria-label={T('Specific status','具体状态')} value={statusFilter}
               onChange={e=>setStatusFilter(e.target.value)}
               className="mt-1 block min-w-[160px] rounded border border-stone-300 bg-white px-3 py-2 text-sm">
               <option value="all">{T('All','全部状态')}</option>
               <option value="action">{T('Needs action','待处理')}</option>
               {Object.entries(statusMap).filter(([key])=>key!=='all').map(([key,v])=>
                 <option key={key} value={key}>{v.label}</option>)}
             </select>
           </label>
           <label className="text-xs font-semibold text-stone-700">
             {T('Production site','生产基地')}
             <select aria-label={T('Production site','生产基地')} value={siteFilter}
               onChange={e=>setSiteFilter(e.target.value as typeof siteFilter)}
               className="mt-1 block min-w-[160px] rounded border border-stone-300 bg-white px-3 py-2 text-sm">
               <option value="all">{T('All sites','全部生产基地')}</option>
               <option value="zhaoqing">{T('Zhaoqing','肇庆')}</option>
               <option value="cambodia">{T('Cambodia','柬埔寨干丹')}</option>
               <option value="unassigned">{T('Unassigned','未指定')}</option>
             </select>
           </label>
           <button type="button" onClick={()=>{setStatusFilter('all');setSiteFilter('all');setSearch('');}}
             className="rounded border border-stone-300 px-3 py-2 text-xs text-stone-700 hover:bg-stone-50">
             {T('Clear filters','清除筛选')}
           </button>
         </div>}
         <p className="text-right text-xs text-stone-500" role="status">
           {isLoading?T('Loading products…','正在读取产品…'):
             T(`Showing ${filteredItems.length} / ${items.length}`,
               `显示 ${filteredItems.length} / ${items.length} 件产品`)}
         </p>
       </section>)}

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
                    const catalogStatus = item.archived_at ? 'archived' : item.status === 'published' && item.catalog_hidden ? 'unpublished' : item.status;
                    const statusInfo = statusMap[catalogStatus || 'draft'] || statusMap.draft;
                    
                    const isPublished = item.status === 'published';
                    const hasNoImages = !item.images || item.images.length === 0;

                    return (
                    <div key={item.id} className={`p-4 transition-colors flex items-center gap-6 group ${isSelected ? 'bg-safety-50' : 'hover:bg-stone-50'}`}>
                        {adminCanDelete&&eligibleForPermanentDelete(item.status)&&!!item.id&&
                          <button type="button" aria-label={'选择永久删除 '+(item.code||item.name)}
                            disabled={deletionBusy} aria-pressed={isSelected}
                            onClick={()=>toggleSelect(item.id!)}
                            className="text-stone-400 hover:text-red-700 disabled:opacity-40">
                            {isSelected?<CheckSquare size={18} className="text-red-700"/>:<Square size={18}/>}
                          </button>}
                        {isFactory && !!onSubmit && ['draft','rejected','returned_to_uploader'].includes(item.status||'') && <button type="button" aria-label={T('Select product for review','选择产品提交审核')}
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
                            {isFactory && isPublished && onStartRevision && (
                                <button type="button" onClick={() => onStartRevision(item)}
                                  className="rounded border border-amber-700 px-3 py-2 text-[10px] font-semibold text-amber-800 hover:bg-amber-50"
                                  title={T('Only the original uploading staff may request a revision','仅原上传人员可提交修订申请')}>
                                  {T('Request revision','申请修改')}
                                </button>
                            )}
                            <div className="flex">
                                {(isAdmin ? ['draft','rejected'].includes(item.status||'') : ['draft','rejected','returned_to_uploader'].includes(item.status||'')) && (
                                    <button onClick={() => onEdit(item)} aria-label={T("Edit draft","编辑草稿")} className="p-2 text-stone-400 hover:text-stone-900 hover:bg-white border border-transparent hover:border-stone-200 transition-all rounded-sm" title={T("Edit","编辑")}><Edit size={16} /></button>
                                )}
                                {isAdmin && isPublished && !item.archived_at && onCatalogVisibility && (
                                  <button type="button" disabled={visibilityId !== null}
                                    onClick={() => void changeCatalogVisibility(item)}
                                    className="rounded px-2 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-50">
                                    {item.catalog_hidden ? T('Relist', '重新上架') : T('Unpublish', '下架')}
                                  </button>
                                )}
                                {isAdmin && isPublished && item.catalog_hidden && onArchive && (
                                  <button type="button" onClick={() => void onArchive(item)}
                                    className="rounded px-2 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-100">
                                    {item.archived_at ? T('Restore to unlisted', '恢复为已下架') : T('Archive', '归档')}
                                  </button>
                                )}
                                {adminCanDelete&&eligibleForPermanentDelete(item.status)&&item.id&&(
                                    <button type="button" disabled={deletionBusy}
                                      onClick={()=>void handlePermanentDelete(item)}
                                      aria-label={T('Permanently delete SKU','永久删除 SKU')}
                                      title={T('Permanent deletion, if no review history exists','永久删除：需要无历史审核关联')}
                                      className="rounded-sm border border-transparent p-2 text-red-700 hover:border-red-200 hover:bg-red-50 disabled:opacity-40">
                                      {deletingId===item.id?<Loader2 size={16} className="animate-spin"/>:<Trash2 size={16}/>}
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
       {adminCanDelete&&adminDeleteCandidates.length>0&&
          <div aria-label="管理员批量删除产品"
            className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded border border-red-200 bg-red-50 p-3">
            <label className="flex items-center gap-2 text-xs text-red-900">
              <input type="checkbox" aria-label="全选本页可删除产品"
                disabled={deletionBusy}
                checked={adminSelected.length===adminDeleteCandidates.length}
                onChange={e=>setSelectedIds(e.target.checked?adminDeleteCandidates.map(x=>x.id!):[])}/>
              全选本页可删除产品（{adminDeleteCandidates.length}）
            </label>
            <div className="flex items-center gap-3">
              <span className="text-xs text-red-900">已选 {adminSelected.length} 件</span>
              <button type="button" disabled={deletionBusy||adminSelected.length===0}
                onClick={()=>void handleAdminBulkDelete()}
                className="rounded bg-red-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40">
                {isBulkProcessing?'正在删除…':'批量删除'}
              </button>
            </div>
            <p className="w-full text-xs text-stone-600">
              仅删除未发布且无历史关联的产品；已发布产品请下架或归档。无需输入 SKU。
            </p>
          </div>}
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