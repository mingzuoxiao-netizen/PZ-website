import React, { useEffect, useState } from 'react';
import { Edit, Search, PackageX, X, CheckSquare, Square, Send, Loader2, FileUp, AlertTriangle, Trash2 } from 'lucide-react';
import { ProductVariant, Category, ProductionSite } from '../../../types';
import { resolveImage } from '../../../utils/imageResolver';
import { AdminRowSkeleton } from '../../../components/common/Skeleton';
import StatusChip from '../ui/StatusChip';
import {getStatusDefinition} from '../ui/status';
import {ListShell,Toast} from '../ui/BackofficeComponents';
import {useBackofficeConfirm} from '../ui/useBackofficeConfirm';
import {backofficeError} from '../ui/feedback';

export type BulkAction='category'|'submit'|'unpublish';
export type BulkResult={id:string;code:string;ok:boolean;status?:string;reason?:string;
  issues?:Array<{field:string;message:string}>};
export type BulkResponse={success:boolean;requested:number;succeeded:number;failed:number;results:BulkResult[]};

interface ProductListProps {
  items: ProductVariant[];
  categories: Category[];
  categoryTitle?: string;
  onEdit: (item: ProductVariant) => void;
  onDuplicate?: (item: ProductVariant) => void;
  onBulkAction?:(action:BulkAction,ids:string[],category?:string,reason?:string)=>Promise<BulkResponse>;
  onBusyChange?: (busy:boolean) => void;
  onRefresh?: () => void;
  onSubmit?: (id: string) => Promise<void>;
  onStartRevision?: (item: ProductVariant) => void;
  onCatalogVisibility?: (item: ProductVariant) => Promise<void>;
  serverFiltered?: boolean;
  onArchive?: (item: ProductVariant) => Promise<void>;
  onPermanentDelete?: (item: ProductVariant) => Promise<
    void|{state:'deleted'|'verified_removed'|'already_absent'}>;
  forceDeleteEnabled?: boolean;
  onCreate: () => void;
  onBack: () => void;
  userRole?: 'ADMIN' | 'FACTORY';
  lang: 'en' | 'zh';
  isLoading?: boolean;
}

const ProductList: React.FC<ProductListProps> = ({ 
    items, categories, onEdit, onDuplicate, onBulkAction, onBusyChange, onRefresh, onSubmit, onStartRevision, onCatalogVisibility, onArchive, serverFiltered = false, onPermanentDelete, forceDeleteEnabled = false, userRole, lang = "en", isLoading = false
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
  const [bulkCategory,setBulkCategory]=useState('');
  const [bulkReason,setBulkReason]=useState('');
  const [bulkSummary,setBulkSummary]=useState<BulkResponse|null>(null);
  const [bulkError,setBulkError]=useState('');
  const [notice,setNotice]=useState<{message:string;error?:boolean}|null>(null);
  const {ask,confirmationDialog}=useBackofficeConfirm();
  const notify=(message:string,error=false)=>setNotice({message,error});
  useEffect(()=>{onBusyChange?.(isBulkProcessing||submittingIds.length>0);return ()=>onBusyChange?.(false);},[isBulkProcessing,submittingIds.length,onBusyChange]);


  const isFactory = userRole === "FACTORY";
  const isAdmin = userRole === "ADMIN";
  const eligibleForPermanentDelete=(status?:string)=>
    forceDeleteEnabled ||
    ['draft','rejected','unpublished','inactive','archived'].includes(String(status||''));
  const adminCanDelete=isAdmin&&!!onPermanentDelete;
  const deletionBusy=deletingId!==null||isBulkProcessing;

  const statusOptions=['published','awaiting_review','draft','rejected','returned_to_uploader',
    'pending_supervisor','pending_admin','returned_to_supervisor',
    'approved_pending_publish','unpublished','inactive','archived'];

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
  const selectedRows=filteredItems.filter(item=>item.id&&selectedIds.includes(item.id));
  const canChangeCategory=selectedRows.length>0&&selectedRows.every(item=>
    ['draft','rejected'].includes(String(item.status||'')));
  const canUnpublish=isAdmin&&selectedRows.length>0&&selectedRows.every(item=>
    item.status==='published'&&!item.catalog_hidden&&!item.archived_at);
  useEffect(()=>{
    setSelectedIds(prev=>prev.filter(id=>items.some(x=>x.id===id&&(!isFactory||['draft','rejected','returned_to_uploader'].includes(x.status||'')))));
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
      notify('已更新 '+(item.code||item.name)+' 的公开状态。');
    } catch (error) {
      notify(backofficeError(error,'更新上架状态失败，请刷新核对状态。'),true);
    } finally {
      setVisibilityId(null);
    }
  };

  const handlePermanentDelete=async(item:ProductVariant)=>{
    if(!onPermanentDelete||!item.id||deletionBusy)return;
    if(!await ask({title:'彻底删除产品',danger:true,confirmLabel:'彻底删除',
      description:forceDeleteEnabled
      ? '该操作不可恢复，会从管理与公开目录移除 '+item.code+'，释放 SKU；仅保留必要审计历史及 R2 原图。'
      : '该操作不可恢复，会释放 '+item.code+' 的 SKU；R2 原图不删除。有审核历史或曾发布的产品受服务端保护。'}))return;
    setDeletingId(item.id);
    try{
      const outcome=await onPermanentDelete(item);
      setSelectedIds(prev=>prev.filter(id=>id!==item.id));
      await onRefresh?.();
      if(outcome&&outcome.state==='already_absent')
        notify('数据库中已无 '+item.code+'，未重复删除。');
      else if(outcome&&outcome.state==='verified_removed')
        notify('已彻底删除 '+item.code+'；已复核 SKU 可复用，必要审计历史保留。');
      else notify('已彻底删除 '+item.code+'；SKU 可复用，必要审计历史保留。');
    }catch(error:any){
      await onRefresh?.();
      notify(backofficeError(error,'彻底删除失败，请刷新核对产品状态后重试。'),true);
    }finally{setDeletingId(null);}
  };

  const handleAdminBulkDelete=async()=>{
    if(!onPermanentDelete||deletionBusy||!adminSelected.length)return;
    const batch=[...adminSelected];
    if(!await ask({title:'批量彻底删除产品',danger:true,confirmLabel:'彻底删除',
      description:'即将彻底删除选中的 '+batch.length+' 件产品，操作不可恢复。每件独立验证权限；已删除 SKU 可复用，必要审计历史和 R2 原图保留。'}))return;
    setIsBulkProcessing(true);
    const failed:{id:string;sku:string;reason:string}[]=[];
    let succeeded=0,alreadyAbsent=0,verified=0;
    try{
      // Preserve per-product RBAC, version guards and separate readback checks.
      for(const item of batch){
        try{
          const result=await onPermanentDelete(item);
          if(result&&result.state==='already_absent')alreadyAbsent++;
          else {
            succeeded++;
            if(result&&result.state==='verified_removed')verified++;
          }
        }catch(error:any){
          const raw=String(error?.message||'删除结果未确认');
          failed.push({id:item.id!,sku:item.code||item.name||item.id!,
            reason:backofficeError(raw,'删除失败，请刷新核对该产品状态。')});
        }
      }
      setSelectedIds(failed.map(x=>x.id));
      await onRefresh?.();
      const summary='批量删除结果：成功 '+succeeded+' 件，失败 '+failed.length+
        ' 件'+(alreadyAbsent?'，数据库中已不存在 '+alreadyAbsent+' 件':'')+
        '。'+(verified?'\n其中 '+verified+' 件经状态复查确认已移除。':'');
      if(failed.length)notify(summary+'\n'+
        failed.slice(0,5).map(x=>x.sku+'：'+x.reason).join('\n')+
        (failed.length>5?'\n其余失败项目请单独核对。':'')+
        '\n失败产品仍受保护，请核对状态后决定是否重试。',true);
      else notify(summary+'\nR2 原图及必要审计历史已保留。');
    }finally{setIsBulkProcessing(false);}
  };

  const handleSubmitForReview = async (id: string) => {
      if (!await ask({title:'提交审核',description:'确认提交此产品进入审核流程吗？',confirmLabel:'提交审核'})) return;
      if (!onSubmit||isBulkProcessing||submittingIds.includes(id)) return;
      setSubmittingIds(prev => [...prev, id]);
      try {
          await onSubmit(id);
          notify('已提交 '+(items.find(item=>item.id===id)?.code||'产品')+' 审核。');
      } catch (e: any) {
          notify(backofficeError(e,'提交审核失败，请核对必填项及当前状态。'),true);
      } finally {
          try{await onRefresh?.();}catch{notify('提交已结束，但列表刷新失败，请刷新核对状态。',true);}
          setSubmittingIds(prev => prev.filter(i => i !== id));
      }
  };

  const executeBulk=async(action:BulkAction)=>{
    if(!onBulkAction||isBulkProcessing||submittingIds.length||!selectedIds.length)return;
    const ids=selectedRows.map(item=>item.id!).slice(0,50);
    if(!ids.length||ids.length!==selectedIds.length){setBulkError('只能操作本页有效的 1–50 件产品。');return;}
    if(action==='category'&&!canChangeCategory){setBulkError('只能批量修改未进入审核流程的草稿。');return;}
    if(action==='category'&&!bulkCategory){setBulkError('请选择目标品类。');return;}
    if(action==='unpublish'&&(!canUnpublish||bulkReason.trim().length<5)){
      setBulkError('下架必须选中在售产品并填写不少于 5 个字的原因。');return;
    }
    const title=action==='category'?'修改品类':action==='submit'?'提交审核':'下架';
    if(!await ask({title,description:'确认对选中 '+ids.length+' 件产品执行'+title+'？每件都将独立进行后端权限及状态检查。',confirmLabel:title,danger:action==='unpublish'}))return;
    setIsBulkProcessing(true);setBulkError('');setBulkSummary(null);
    try{
      const result=await onBulkAction(action,ids,
        action==='category'?bulkCategory:undefined,
        action==='unpublish'?bulkReason.trim():undefined);
      if(result.success!==true||!Array.isArray(result.results)||result.results.length!==ids.length||
        result.succeeded+result.failed!==ids.length)
        throw Error('服务端批量结果不完整，请刷新后核对产品状态。');
      setBulkSummary(result);setSelectedIds(result.results.filter(item=>!item.ok).map(item=>item.id));
      notify('批量'+title+'：成功 '+result.succeeded+' 件，失败 '+result.failed+' 件。',result.failed>0);
      try{await onRefresh?.();}
      catch{setBulkError('部分操作可能已成功，但列表刷新失败。请刷新并核对状态。');}
    }catch(error:any){setBulkError(backofficeError(error,'操作未完成，请刷新列表核对状态。'));}
    finally{setIsBulkProcessing(false);}
  };
  const handleBulkSubmit = async () => {
      if(onBulkAction){await executeBulk('submit');return;}
      if (selectedIds.length === 0 || !onSubmit || isBulkProcessing || submittingIds.length>0) return;
      if (!await ask({title:'批量提交审核',description:'确认将选中的 '+selectedIds.length+' 个产品提交审核吗？',confirmLabel:'提交审核'})) return;

      setIsBulkProcessing(true);
      try {
          // Some submissions can succeed while others fail (e.g. a stale status).
          // Keep failed IDs selected; never claim the entire batch succeeded.
          const ids = filteredItems.filter(item=>!!item.id&&selectedIds.includes(item.id)&&['draft','rejected','returned_to_uploader'].includes(item.status||'')).map(item=>item.id!);
          const results:PromiseSettledResult<void>[]=[];
          for(const id of ids){
            try{await onSubmit(id);results.push({status:'fulfilled',value:undefined});}
            catch(reason){results.push({status:'rejected',reason});}
          }
          const failedIds = ids.filter((_, i) => results[i].status === 'rejected');
          setSelectedIds(failedIds);
          await onRefresh?.();
          if (failedIds.length) {
              notify(T(
                  `${ids.length - failedIds.length} submitted, ${failedIds.length} failed. Failed items remain selected; refresh and inspect their status before retrying.`,
                  `成功提交 ${ids.length - failedIds.length} 个，失败 ${failedIds.length} 个。失败的产品仍保持选中，请刷新核对状态后再决定是否重试。`
              ),true);
          } else {
              notify('已提交 '+ids.length+' 件产品审核。');
          }
      } catch (e: any) {
          notify(backofficeError(e,'批量提交审核失败，请刷新状态后重试。'),true);
      } finally {
          setIsBulkProcessing(false);
      }
  };


  return (
    <ListShell label="产品列表">
    <div className="animate-fade-in relative">
       {notice&&<div className="mb-3"><Toast variant={notice.error?'error':'success'} message={notice.message} onClose={()=>setNotice(null)}/></div>}
       {confirmationDialog}
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
               {statusOptions.map(key=><option key={key} value={key}>{getStatusDefinition(key).label}</option>)}
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

       {isFactory&&onSubmit&&filteredItems.some(item=>['draft','rejected','returned_to_uploader'].includes(item.status||''))&&
         <label className="mb-3 flex items-center gap-2 rounded border bg-white p-3 text-sm">
           <input type="checkbox" aria-label="全选本页可提交产品" disabled={isBulkProcessing||submittingIds.length>0}
             checked={filteredItems.filter(item=>['draft','rejected','returned_to_uploader'].includes(item.status||'')).every(item=>selectedIds.includes(item.id!))}
             onChange={e=>setSelectedIds(e.target.checked?filteredItems.filter(item=>item.id&&['draft','rejected','returned_to_uploader'].includes(item.status||'')).map(item=>item.id!):[])}/>
           全选本页可提交产品 · 已选 {selectedIds.length} 件
         </label>}
       <div className="bg-white border border-stone-200 shadow-sm rounded-sm overflow-hidden">
            <div className="divide-y divide-stone-100">
              {isLoading ? (
                  Array.from({ length: 5 }).map((_, idx) => <AdminRowSkeleton key={idx} />)
              ) : filteredItems.length === 0 ? (
                  <div className="py-32 flex flex-col items-center justify-center text-stone-400">
                      <PackageX size={48} strokeWidth={1} className="mb-4 opacity-20" />
                      <p className="text-xs font-bold uppercase tracking-widest">{T("Zero matching records found.","没有符合条件的产品。")}</p>
                  </div>
              ) : (
                filteredItems.map((item) => {
                    const isSelected = selectedIds.includes(item.id!);
                    const isSubmitting = submittingIds.includes(item.id!);
                    const imageUrl = resolveImage(item.images?.[0]);
                    const catalogStatus = item.archived_at ? 'archived' : item.status === 'published' && item.catalog_hidden ? 'unpublished' : item.status;
                    
                    const isPublished = item.status === 'published';
                    const hasNoImages = !item.images || item.images.length === 0;

                    return (
                    <div key={item.id} className={`p-4 transition-colors flex flex-wrap items-center gap-3 sm:gap-6 group ${isSelected ? 'bg-safety-50' : 'hover:bg-stone-50'}`}>
                        {adminCanDelete&&!onBulkAction&&eligibleForPermanentDelete(item.status)&&!!item.id&&
                          <button type="button" aria-label={'选择永久删除 '+(item.code||item.name)}
                            disabled={deletionBusy} aria-pressed={isSelected}
                            onClick={()=>toggleSelect(item.id!)}
                            className="text-stone-400 hover:text-red-700 disabled:opacity-40">
                            {isSelected?<CheckSquare size={18} className="text-red-700"/>:<Square size={18}/>}
                          </button>}
                        {isAdmin && !!onBulkAction && !!item.id &&
                          <button type="button" aria-label={'选择批量操作 '+(item.code||item.name)}
                            disabled={deletionBusy} aria-pressed={isSelected}
                            onClick={()=>toggleSelect(item.id!)}
                            className="text-stone-500 hover:text-stone-900 disabled:opacity-40">
                            {isSelected?<CheckSquare size={18}/>:<Square size={18}/>}
                          </button>}
                        {isFactory && !!onSubmit && ['draft','rejected','returned_to_uploader'].includes(item.status||'') && <button type="button" aria-label={T('Select product for review','选择产品提交审核')}
                            disabled={isBulkProcessing||submittingIds.length>0} onClick={() => item.id && toggleSelect(item.id)} className="text-stone-300 hover:text-safety-700">
                            {isSelected ? <CheckSquare size={18} className="text-safety-700"/> : <Square size={18}/>}
                        </button>}
                        <div className="w-14 h-14 bg-stone-100 flex-shrink-0 border border-stone-200 overflow-hidden relative rounded-sm">
                            {imageUrl ? (
                                <img src={imageUrl} loading="lazy" alt="" className="w-full h-full object-cover mix-blend-multiply" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-stone-300 text-xs bg-stone-50">
                                   <AlertTriangle size={14} className="mb-1 text-amber-500 opacity-50" />
                                   {T("NO ASSET","无图片")}
                                </div>
                            )}
                        </div>
                        <div className="flex-grow min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                                <h4 className="font-bold text-stone-900 text-sm truncate font-serif">{lang === "zh" ? (item.name_cn || item.name) : item.name}</h4>
                                <StatusChip status={catalogStatus||'draft'}/>
                                {isPublished && hasNoImages && (
                                    <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded animate-pulse" title={T("Due to lack of valid assets, this product is automatically suppressed on the public site.","缺少有效图片，该产品不会在公开网站展示。")}>
                                        <AlertTriangle size={10} /> {T("Hidden (Missing Assets)","因缺少图片未公开")}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-4 font-mono text-xs">
                                <span className="text-stone-400 font-bold uppercase">{item.code || T("NO SKU","无 SKU")}</span>
                                <span className="text-stone-500 uppercase tracking-tight">{(categories.find(c => c.id === item.category)?.[lang === 'zh' ? 'title_cn' : 'title'] || categories.find(c => c.id === item.category)?.title || item.category) || T('General','未分类')}</span>
                                {(item.production_sites || []).map(site => (
                                    <span key={site} className="rounded bg-stone-100 px-1.5 py-0.5 text-stone-600 uppercase">
                                        {site === 'zhaoqing' ? T('Zhaoqing','肇庆') : T('Cambodia','柬埔寨')}
                                    </span>
                                ))}
                            </div>
                            {item.return_reason&&['rejected','returned_to_uploader'].includes(item.status||'')&&<p className="mt-2 text-sm text-red-800">需修改：{item.return_reason}</p>}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {isFactory && (['draft','rejected','returned_to_uploader'].includes(item.status||'')) && (
                                <button 
                                    onClick={() => item.id && handleSubmitForReview(item.id)}
                                    disabled={isSubmitting||isBulkProcessing}
                                    className="flex items-center gap-2 bg-stone-900 text-white px-4 py-2 text-xs font-bold uppercase hover:bg-safety-700 transition-colors rounded-sm"
                                >
                                    {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                    {T("Submit Review","提交审核")}
                                </button>
                            )}
                            {isFactory && isPublished && onStartRevision && (
                                <button type="button" onClick={() => onStartRevision(item)}
                                  className="rounded border border-amber-700 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-50"
                                  title={T('Only the original uploading staff may request a revision','仅原上传人员可提交修订申请')}>
                                  {T('Request revision','申请修改')}
                                </button>
                            )}
                            {isFactory&&onDuplicate&&<button type="button" disabled={isBulkProcessing||submittingIds.length>0}
                              onClick={()=>onDuplicate(item)} className="rounded border px-3 py-2 text-xs">复制为新产品</button>}
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
                                {adminCanDelete&&item.id&&(
                                    <button type="button"
                                      disabled={deletionBusy||!eligibleForPermanentDelete(item.status)}
                                      onClick={()=>void handlePermanentDelete(item)}
                                      aria-label={eligibleForPermanentDelete(item.status)?'永久删除 SKU':'强制删除尚未启用'}
                                      title={!eligibleForPermanentDelete(item.status)?
                                        '当前 Worker 尚未启用强制删除：请检查 D1 016、环境开关和 Staging Worker。':
                                        forceDeleteEnabled?'管理员强制移除：保留必要审计历史':'永久删除：需要无历史审核关联'}
                                      className="rounded-sm border border-transparent p-2 text-red-700 hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30">
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

       {/* Task18 bulk actions: never allow bulk approval or publication. */}
       {!!onBulkAction&&<section aria-label="安全批量操作" className="mt-4 space-y-3 rounded border border-stone-200 bg-white p-4">
         <div className="flex flex-wrap items-center justify-between gap-3">
           <h3 className="text-sm font-semibold">安全批量操作 · 最多 50 件</h3>
           <span role="status" className="text-sm text-stone-600">已选择 {selectedIds.length} 件</span>
           {isAdmin&&<label className="flex items-center gap-2 text-xs">
             <input type="checkbox" aria-label="全选本页产品用于批量操作"
               disabled={deletionBusy||!filteredItems.length}
               checked={!!filteredItems.length&&filteredItems.every(item=>item.id&&selectedIds.includes(item.id))}
               onChange={e=>setSelectedIds(e.target.checked?filteredItems.filter(item=>item.id).slice(0,50).map(item=>item.id!):[])}/>
             全选本页</label>}
         </div>
         <div className="flex flex-wrap items-end gap-3">
           <label className="min-w-48 flex-1 text-xs font-semibold">更改品类（仅草稿）
             <select aria-label="批量目标品类" className="mt-1 w-full rounded border border-stone-300 px-3 py-2.5 text-sm"
               value={bulkCategory} onChange={e=>setBulkCategory(e.target.value)} disabled={isBulkProcessing}>
               <option value="">选择目标品类</option>
               {categories.filter(c=>!c.hidden).map(c=><option key={c.id} value={c.id}>{c.title_cn||c.title}</option>)}
             </select>
           </label>
           <button type="button" className="min-h-11 rounded border border-stone-900 px-4 text-sm font-semibold disabled:opacity-40"
             disabled={deletionBusy||!canChangeCategory||!bulkCategory} onClick={()=>void executeBulk('category')}>
             批量更改品类
           </button>
           {isFactory&&!!onSubmit&&<button type="button" disabled={deletionBusy||!selectedIds.length}
             onClick={()=>void executeBulk('submit')}
             className="min-h-11 rounded bg-stone-900 px-4 text-sm font-semibold text-white disabled:opacity-40">批量提交审核</button>}
         </div>
         {isAdmin&&<div className="flex flex-wrap items-end gap-3 border-t pt-3">
           <label className="min-w-56 flex-1 text-xs font-semibold">下架原因（必填，5–500 字）
             <textarea aria-label="批量下架原因" rows={2} maxLength={500}
               value={bulkReason} onChange={e=>setBulkReason(e.target.value)}
               className="mt-1 w-full rounded border border-stone-300 p-2 text-sm" disabled={deletionBusy}/>
           </label>
           <button type="button" disabled={deletionBusy||!canUnpublish||bulkReason.trim().length<5}
             onClick={()=>void executeBulk('unpublish')}
             className="min-h-11 rounded bg-red-800 px-4 text-sm font-semibold text-white disabled:opacity-40">
             批量下架
           </button>
         </div>}
         <p className="text-xs text-stone-500">逐件进行后端权限、状态及预检，允许部分成功；不能批量审核批准或发布。失败项保留选中。</p>
         {bulkError&&<p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">{bulkError}</p>}
         {bulkSummary&&<div role="status" className="rounded border border-stone-200 bg-stone-50 p-3 text-sm">
           <strong>批量结果：成功 {bulkSummary.succeeded} 件 · 失败 {bulkSummary.failed} 件</strong>
           <ul aria-label="批量逐项结果" className="mt-2 max-h-72 space-y-1 overflow-y-auto">
             {bulkSummary.results.map((row,i)=><li key={row.id+'-'+i} className={row.ok?'text-green-800':'text-red-800'}>
               {row.code||row.id}：{row.ok?'已完成':row.reason||'未完成'}
               {!row.ok&&!!row.issues?.length&&' · '+row.issues.map(issue=>issue.field+'：'+issue.message).join('；')}
             </li>)}
           </ul>
         </div>}
       </section>}
       {/* Bulk Action Bar */}
       {adminCanDelete&&adminDeleteCandidates.length>0&&
          <details className="mt-4">
          <summary className="cursor-pointer text-sm text-stone-600">更多操作：永久删除产品</summary>
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
              {forceDeleteEnabled?'可直接移除已发布及有审核历史的产品；释放 SKU、保留必要审计记录及 R2 原图。无需输入 SKU。':
                '当前 Worker 未启用强制移除，只能删除无审核历史且未发布的产品；无需输入 SKU。'}
            </p>
          </div></details>}
       {isFactory && !!onSubmit && !onBulkAction && selectedIds.length > 0 && (
           <div className="sticky bottom-4 z-[60] mx-auto mt-4 w-full max-w-xl">
               <div className="bg-stone-900 text-white px-4 py-3 rounded-lg shadow-2xl flex flex-wrap items-center gap-3 border border-white/10 backdrop-blur-md">
                   <div className="flex items-center gap-3 pr-8 border-r border-white/10">
                       <span className="text-xs font-mono font-bold text-safety-700 bg-safety-700/10 px-2 py-1 rounded">{selectedIds.length}</span>
                       <span className="text-xs font-bold uppercase tracking-widest whitespace-nowrap">{T("Selected","已选择")}</span>
                   </div>
                   <button type="button" onClick={() => void handleBulkSubmit()} disabled={isBulkProcessing||submittingIds.length>0}
                       className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-safety-700 hover:text-safety-600 transition-colors">
                       {isBulkProcessing ? <Loader2 size={14} className="animate-spin"/> : <FileUp size={14} />}
                       {T('Submit for review','批量提交审核')}
                   </button>
                   <button type="button" aria-label="清除已选产品" disabled={isBulkProcessing} onClick={() => setSelectedIds([])} className="text-white/40 hover:text-white ml-4"><X size={16} /></button>
               </div>
           </div>
       )}
    </div>
    </ListShell>
  );
};

export default ProductList;
