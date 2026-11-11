import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { factoryFetch } from '../../utils/factoryFetch';
import {fetchBackofficePage} from '../../utils/backofficeLists';
import { ProductVariant, Category } from '../../types';
import { normalizeProducts } from '../../utils/normalizeProduct';
import { categoryMatches } from '../../utils/categoryMatching';
import { categories as staticCategories } from '../../data/inventory';
import { publishedSiteCategories } from '../../utils/catalogCategories';
import PortalLayout from './PortalLayout';
import { 
    Package, ChevronLeft, LayoutGrid, ClipboardList, AlertCircle, 
    Clock, Plus, X, Save, Send, Loader2, Layers, Bell, CheckCircle, Database 
} from 'lucide-react';

// Components
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import FactoryCategoryManagement from './components/FactoryCategoryManagement';
import PZImageManager from './components/PZImageManager';
import BatchCreator from './components/BatchCreator';
import PublishedRevisionQueue, {type RevisionDetail} from './components/PublishedRevisionQueue';

interface Notification {
    id: string;
    type: 'approval' | 'category' | 'sync';
    message: string;
    target?: string;
}

const FactoryWorkspace: React.FC = () => {
  const [products, setProducts] = useState<ProductVariant[]>([]);
  const [activeTab, setActiveTab] = useState<'inventory' | 'categories'>('inventory');
  const [categories, setCategories] = useState<Category[]>(staticCategories);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ProductVariant | null>(null);
  const [revisionEditing,setRevisionEditing] = useState<{
    product:ProductVariant;revisionId?:string;draftRevision?:number
  }|null>(null);
  const [revisionEnabled,setRevisionEnabled] = useState(false);
  const [revisionRefresh,setRevisionRefresh] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [isBatchCreating, setIsBatchCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [siteVersion, setSiteVersion] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Refs for state comparison
  const productsRef = useRef<ProductVariant[]>([]);
  const categoriesRef = useRef<Category[]>(staticCategories);

  const [isRequestingCategory, setIsRequestingCategory] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [catRequest, setCatRequest] = useState({ title: '', title_cn: '', subtitle: '', image: '' });
  const [categoryRequestRefreshKey,setCategoryRequestRefreshKey]=useState(0);
  const [categoryQuickSearch,setCategoryQuickSearch]=useState('');
  const [catalogPage,setCatalogPage]=useState(1);
  const [catalogSearch,setCatalogSearch]=useState('');
  const [catalogQuery,setCatalogQuery]=useState('');
  const [catalogStatus,setCatalogStatus]=useState('action');
  const [catalogSite,setCatalogSite]=useState('all');
  const [catalogTotal,setCatalogTotal]=useState<number|null>(null);
  const [catalogError,setCatalogError]=useState('');
  const [productActionError,setProductActionError]=useState('');
  const [statusCounts,setStatusCounts]=useState<{status:string;count:number}[]>([]);
  const [categoryFacets,setCategoryFacets]=useState<{category:string|null;count:number}[]>([]);
  const categoryFacetRef=useRef<typeof categoryFacets>([]);
  const catalogGeneration=useRef(0);
  const formDirty=useRef(false);
  const formBusy=useRef(false);
  const rememberDirty=useCallback((dirty:boolean)=>{formDirty.current=dirty;},[]);
  const rememberBusy=useCallback((busy:boolean)=>{formBusy.current=busy;},[]);
  const [creationKey,setCreationKey]=useState(0);
  const [creationTemplate,setCreationTemplate]=useState<Partial<ProductVariant>>({});
  const canLeave=()=>!formBusy.current&&(!formDirty.current||window.confirm('当前产品资料尚未保存，确认离开吗？'));


  const ownerTotal=statusCounts.reduce((sum,row)=>sum+row.count,0);
  const categoryCounts=useMemo(()=>categories.map(category=>({
    id:category.id,label:category.title_cn||category.title_zh||category.title,
    count:categoryFacets.filter(row=>categoryMatches(row.category,category)).reduce((sum,row)=>sum+row.count,0)
  })),[categoryFacets,categories]);
  const uncategorizedCount=useMemo(()=>categoryFacets.filter(row=>!categories.some(category=>categoryMatches(row.category,category)))
    .reduce((sum,row)=>sum+row.count,0),[categoryFacets,categories]);
  const visibleCategoryCounts=categoryCounts.filter(c=>
    c.label.toLocaleLowerCase().includes(categoryQuickSearch.trim().toLocaleLowerCase())
  );
  const userName = sessionStorage.getItem('pz_user_name') || '工厂操作员';

  const addNotification = (type: Notification['type'], message: string, target?: string) => {
      const id = Math.random().toString(36).substr(2, 9);
      setNotifications(prev => [{ id, type, message, target }, ...prev].slice(0, 3));
      setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== id));
      }, 8000);
  };

  const loadSiteConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/site-config');
      if (!res.ok) return;
      const json = await res.json();
      const config = json.config ?? json;
      const incomingCats = config.categories || [];

      if (incomingCats.length > 0) {
          // Detect new categories
          const currentIds = new Set(categoriesRef.current.map(c => c.id));
          const added = incomingCats.filter((c: any) => !currentIds.has(c.id));
          
          if (added.length > 0) {
                  added.forEach((c: any) => addNotification('category', `新增产品系列：${c.title}`));
          }
          
          setCategories(publishedSiteCategories(incomingCats));
          categoriesRef.current = publishedSiteCategories(incomingCats);
      }
    } catch (e) {
      console.error("[Registry] Config sync failed:", e);
    }
  }, []);

  const loadData = useCallback(async (isSilent = false) => {
    const request=++catalogGeneration.current;
    if(!isSilent){setLoading(true);setProducts([]);}
    setCatalogError('');
    try{
      let aliases:string[]|undefined;
      if(selectedCategoryId){
        const selected=categoriesRef.current.find(category=>category.id===selectedCategoryId);
        aliases=categoryFacetRef.current.filter(row=>selectedCategoryId==='__uncategorized'
          ?!categoriesRef.current.some(category=>categoryMatches(row.category,category))
          :selected?categoryMatches(row.category,selected):row.category===selectedCategoryId).map(row=>row.category||'');
      }
      const res=await fetchBackofficePage<ProductVariant>('factory/products',{
        page:catalogPage,q:catalogQuery,status:catalogStatus,site:catalogSite==='all'?undefined:catalogSite,
        categories:aliases
      });
      if(request!==catalogGeneration.current)return;
      if(catalogPage>1&&!res.items.length){setCatalogPage(Math.max(1,Math.ceil(res.total/50)));return;}
      const incomingProducts=normalizeProducts(res.items);
      setProducts(incomingProducts);productsRef.current=incomingProducts;
      setCatalogTotal(res.total);setStatusCounts(res.status_counts||[]);
      setCategoryFacets(res.category_counts||[]);categoryFacetRef.current=res.category_counts||[];
    }catch(e:any){
      if(request===catalogGeneration.current){setCatalogError(e?.message||'无法读取完整产品列表');setCatalogTotal(null);}
    }finally{if(request===catalogGeneration.current)setLoading(false);}
  },[catalogPage,catalogQuery,catalogStatus,catalogSite,selectedCategoryId]);

  useEffect(() => { void loadData();return ()=>{catalogGeneration.current++;}; }, [loadData]);
  useEffect(()=>{void loadSiteConfig();},[loadSiteConfig]);

  useEffect(() => {
    const dataInterval = setInterval(() => {
        if (document.visibilityState!=='hidden' && !isCreating && !editingItem && !isBatchCreating && !revisionEditing) {
            loadData(true);
        }
    }, 30000);

    const configInterval = setInterval(async () => {
        if(document.visibilityState==='hidden')return;
        try {
            const res = await fetch('/api/site-config/meta', { cache: 'no-store' });
            if (!res.ok) return;
            const meta = await res.json();
            
            if (!siteVersion) {
                setSiteVersion(meta.version);
            } else if (meta.version !== siteVersion) {
                setSiteVersion(meta.version);
                await loadSiteConfig();
                loadData(true); // Sync everything
            }
        } catch {}
    }, 30000);

    const handleFocus = () => {if(!isCreating&&!editingItem&&!isBatchCreating&&!revisionEditing)void loadData(true);};
    window.addEventListener('focus', handleFocus);

    return () => {
        clearInterval(dataInterval);
        clearInterval(configInterval);
        window.removeEventListener('focus', handleFocus);
    };
  }, [loadData, loadSiteConfig, siteVersion, isCreating, editingItem, isBatchCreating, revisionEditing]);

  const stats = useMemo(() => ({
    pending:statusCounts.filter(row=>['awaiting_review','pending_supervisor','pending_admin','returned_to_supervisor','approved_pending_publish'].includes(row.status)).reduce((sum,row)=>sum+row.count,0),
    rejected:statusCounts.filter(row=>['rejected','returned_to_uploader'].includes(row.status)).reduce((sum,row)=>sum+row.count,0),
    total:ownerTotal
  }),[statusCounts,ownerTotal]);

  const persistDraft=async(product:ProductVariant)=>{
    setProductActionError('');
    const saved=await factoryFetch<{success?:boolean;id?:string}>(product.id?'factory/products/'+encodeURIComponent(product.id):'factory/products',{
      method:product.id?'PUT':'POST',body:JSON.stringify({...product,status:'draft'})
    });
    const id=product.id||saved.id;
    if(saved.success!==true||!id)throw Error('草稿保存结果未确认，请在产品列表按 SKU 核对，勿重复创建。');
    return id;
  };
  const handleSaveDraft=async(product:ProductVariant)=>{
    await persistDraft(product);setEditingItem(null);setIsCreating(false);setCreationTemplate({});await loadData(true);
  };
  const handleSubmitForReview=async(productId:string,refreshAfter=true)=>{
    try{
      const result=await factoryFetch<{success?:boolean;status?:string}>('factory/products/'+encodeURIComponent(productId)+'/submit',{method:'POST'});
      if(result.success!==true||result.status!=='pending_supervisor')throw Error('提交结果未确认，请刷新列表核对，勿重复提交。');
      setEditingItem(null);setIsCreating(false);setCreationTemplate({});
    }catch(e){if(refreshAfter)await loadData(true);throw e;}
    if(refreshAfter)await loadData(true);
  };
  const handleSaveAndSubmit=async(product:ProductVariant)=>{
    const id=await persistDraft(product);
    try{await handleSubmitForReview(id,false);}
    catch(e:any){
      setEditingItem(null);setIsCreating(false);setCreationTemplate({});setCatalogSearch(product.code||'');setCatalogQuery(product.code||'');setCatalogStatus('all');setCatalogPage(1);
      const message='草稿已保存，SKU '+product.code+'；提交未完成，请在列表核对状态：'+(e?.message||'');
      setProductActionError(message);throw Error(message);
    }finally{await loadData(true);}
  };
  const handleSaveNext=async(product:ProductVariant)=>{
    await persistDraft(product);
    setCreationTemplate({...product,id:undefined,name:'',name_cn:'',code:'',images:[],image:'',
      specifications:{...product.specifications,media_roles:{}}});
    setEditingItem(null);setIsCreating(true);setCreationKey(key=>key+1);await loadData(true);
  };
  const duplicateProduct=(product:ProductVariant)=>{
    const fields=['name','name_cn','category','sub_category','material','size','finish','description','description_cn','images','production_sites','specifications'] as const;
    const draft:Record<string,unknown>={};for(const key of fields)draft[key]=product[key];
    setCreationTemplate({...draft,code:'',status:'draft'});setCreationKey(key=>key+1);setIsCreating(true);
  };

  // Published SKU revisions are stored in a separate D1 table: never PUT the
  // live /factory/products/:id record here. The Worker independently validates
  // every field, original product ownership and current R2 image references.
  const handleSaveRevision = async (data:ProductVariant) => {
    if(!revisionEditing?.product?.id)throw Error('未找到需要修改的已发布产品');
    const allowed=['name','name_cn','category','sub_category','material','size','finish',
      'description','description_cn','images','production_sites','specifications'] as const;
    const draft:Record<string,unknown>={};
    for(const field of allowed){
      const value=data[field];
      if(value!==undefined)draft[field]=value;
    }
    const creating=!revisionEditing.revisionId;
    const endpoint=creating
      ?'factory/products/'+encodeURIComponent(revisionEditing.product.id)+'/revisions'
      :'factory/revisions/'+encodeURIComponent(revisionEditing.revisionId!);
    const payload=creating?{draft}:{draft,expected_draft_revision:revisionEditing.draftRevision};
    const response=await factoryFetch<{success?:boolean}>(endpoint,{
      method:creating?'POST':'PUT',body:JSON.stringify(payload)
    });
    if(response.success!==true)throw Error('修订草稿保存结果未确认，请刷新后核对。');
    setRevisionEditing(null);
    setRevisionRefresh(n=>n+1);
    await loadData(true);
  };
  const beginRevision=(product:ProductVariant)=>{
    setEditingItem(null);setIsCreating(false);setIsBatchCreating(false);
    setRevisionEditing({product});
  };
  const continueRevision=(detail:RevisionDetail)=>{
    setEditingItem(null);setIsCreating(false);setIsBatchCreating(false);
    setRevisionEditing({
      product:{
        ...detail.draft,id:detail.product_id,status:'draft',
        image:detail.draft.images?.[0]||''
      } as ProductVariant,
      revisionId:detail.id,draftRevision:detail.draft_revision
    });
  };

  // O(batch size) indexed SKU lookup, rather than downloading the entire catalog.
  const checkBatchSkuCodes = async (codes: string[]): Promise<string[]> => {
      const res = await factoryFetch<{ existingCodes?: string[] }>('factory/products/check-skus', {
          method: 'POST',
          body: JSON.stringify({ codes }),
      });
      if (!Array.isArray(res?.existingCodes)) throw new Error('SKU 校验接口暂不可用。');
      return res.existingCodes;
  };

  const createBatchDraft = async (product: any): Promise<void> => {
      const response = await factoryFetch<{ success?: boolean }>('factory/products', {
          method: 'POST',
          body: JSON.stringify({ ...product, status: 'draft', is_published: 0 }),
      });
      if (response?.success !== true) throw new Error('草稿保存结果未确认，请到产品总库核对 SKU。');
  };

  const handleBack = () => {
      if(!canLeave())return;
      setCreationTemplate({});
      if (isBatchCreating && !window.confirm('确认离开批量录入吗？未完成的输入将丢失。')) return;
      if (isCreating || editingItem || isBatchCreating || revisionEditing) {
          setIsCreating(false);
          setIsBatchCreating(false);
          setEditingItem(null);
          setRevisionEditing(null);
      } else if (selectedCategoryId) {
          setSelectedCategoryId(null);
      }
  };

  const navItems = [
    { id: 'inventory', label: '工厂产品管理', icon: <Package size={18} /> },
    { id: 'categories', label: '产品分类申请', icon: <LayoutGrid size={18} /> }
  ];

  return (
    <PortalLayout role="FACTORY" userName={userName} navItems={navItems} activeTab={activeTab} onTabChange={(tab) => {if(!canLeave())return;setCreationTemplate({});setEditingItem(null);setIsCreating(false);setIsBatchCreating(false);setRevisionEditing(null);setActiveTab(tab as 'inventory' | 'categories');}}>
      {activeTab === 'categories' ? (
        <FactoryCategoryManagement categories={categories} newCategoryRefreshKey={categoryRequestRefreshKey} onUpload={async file => {
          const form = new FormData(); form.append('file', file);
          const uploaded = await factoryFetch<{url:string}>('upload-image', { method: 'POST', body: form });
          if (!uploaded.url) throw new Error('上传封面未返回图片地址');
          return uploaded.url;
        }} />
      ) : (<>

      
      {/* Comms Notification Center */}
      <div className="fixed top-24 right-8 z-[200] flex flex-col gap-3 pointer-events-none">
          {notifications.map(n => (
              <div key={n.id} className="w-80 bg-stone-900 border-l-4 border-safety-700 p-4 shadow-2xl animate-fade-in-up pointer-events-auto">
                  <div className="flex items-start gap-3">
                      {n.type === 'approval' ? <CheckCircle size={18} className="text-green-500 flex-shrink-0" /> : <Database size={18} className="text-safety-700 flex-shrink-0" />}
                      <div>
                          <p className="text-[10px] font-mono font-bold uppercase text-stone-500 tracking-widest mb-1">{n.type === 'approval' ? '产品状态更新' : '系统通知'}</p>
                          <p className="text-xs text-white leading-relaxed font-bold">{n.message}</p>
                      </div>
                  </div>
              </div>
          ))}
      </div>

      {isRequestingCategory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/70 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white w-full max-w-xl shadow-2xl rounded-sm overflow-hidden animate-fade-in-up">
                  <div className="bg-stone-900 p-6 flex justify-between items-center text-white">
                      <div className="flex items-center gap-3"><LayoutGrid size={18} className="text-safety-700" /><h4 className="text-[10px] font-bold uppercase tracking-[0.2em]">新增产品分类申请</h4></div>
                      <button onClick={() => setIsRequestingCategory(false)} className="opacity-60 hover:opacity-100"><X size={20} /></button>
                  </div>
                  <form onSubmit={async (e) => {
                      e.preventDefault();
                      if (!catRequest.title.trim() || !catRequest.title_cn.trim() || !catRequest.image) return alert('请填写中英文分类名称并上传封面图片。');
                      setIsSavingCategory(true);
                      try {
                          const created = await factoryFetch<{success:boolean;id:string;status:string}>(
                            'factory/category-requests', {method:'POST',body:JSON.stringify(catRequest)}
                          );
                          if (!created?.id || !['pending_supervisor','pending'].includes(created.status) || created.success !== true)
                            throw new Error('分类申请结果未确认，请刷新记录检查，勿重复提交。');
                          setIsRequestingCategory(false);
                          setCatRequest({ title: '', title_cn: '', subtitle: '', image: '' });
                          setCategoryRequestRefreshKey(value=>value+1);
                          setActiveTab('categories');
                          if(created.status==='pending') {
                            alert('当前提交到了旧审核流程，请联系管理员确认新品类双级审核是否启用。');
                          } else {
                            alert('新品类申请已提交到部门主管，请在我的新品类申请中查看进度。');
                          }
                      } catch (e: any) {
                          const message = String(e?.message || '未知错误');
                          alert(message.includes('Not found') && !message.includes('草稿已创建')
                            ? '当前 Worker 尚未提供「新品类申请」接口（404）。当前没有提交成功，请联系管理员检查环境部署。'
                            : message);
                      }
                      finally { setIsSavingCategory(false); }
                  }} className="p-8 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                              <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">分类英文名称（必填）</label>
                                  <input type="text" required value={catRequest.title} onChange={e => setCatRequest({...catRequest, title: e.target.value})} className="w-full border border-stone-200 p-3 text-sm focus:border-stone-900 outline-none" />
                                  <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mt-3 mb-2">中文名称（必填）</label>
                                  <input type="text" value={catRequest.title_cn} onChange={e => setCatRequest({...catRequest, title_cn: e.target.value})} className="w-full border border-stone-200 p-3 text-sm focus:border-stone-900 outline-none" placeholder="例如：实木台面" />
                              </div>
                              <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">分类副标题（选填，200 字以内）</label>
                                  <textarea rows={3} maxLength={200} value={catRequest.subtitle} onChange={e => setCatRequest({...catRequest, subtitle: e.target.value})} className="w-full border border-stone-200 p-3 text-xs focus:border-stone-900 outline-none resize-none" />
                              </div>
                          </div>
                          <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">分类封面</label>
                              <PZImageManager images={catRequest.image ? [catRequest.image] : []} onUpdate={(imgs) => setCatRequest({...catRequest, image: imgs[0] || ''})} onUpload={async (f) => { const fd = new FormData(); fd.append('file', f); const r = await factoryFetch('upload-image', { method: 'POST', body: fd }); return r.url; }} maxImages={1} aspectRatio={4/3} onError={alert} />
                          </div>
                      </div>
                      <div className="pt-6 border-t border-stone-100 flex gap-4">
                          <button type="button" onClick={() => setIsRequestingCategory(false)} className="flex-1 py-4 border border-stone-200 text-[10px] font-bold uppercase tracking-widest">取消</button>
                          <button type="submit" disabled={isSavingCategory} className="flex-[2] bg-stone-900 text-white py-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-safety-700 transition-all flex items-center justify-center gap-3">
                              {isSavingCategory ? <Loader2 size={16} className="animate-spin" /> : <><Send size={14} /> 提交审核</>}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                  {(selectedCategoryId || isCreating || editingItem || isBatchCreating || revisionEditing) && (
                      <button onClick={handleBack} className="p-2 bg-white border border-stone-200 rounded-full hover:border-stone-900 transition-colors shadow-sm group"><ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" /></button>
                  )}
                  <div>
                      <h1 className="text-2xl font-serif text-stone-900">{revisionEditing ? '修改已发布产品' : isBatchCreating ? '批量录入产品' : isCreating ? '新增产品' : editingItem ? '编辑产品' : selectedCategoryId ? '分类产品管理' : catalogStatus==='action'?'我的待办':'我的产品'}</h1>
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-400 mt-1"><span>工厂后台</span><span>/</span><span className="text-stone-900">{selectedCategoryId ? categories.find(c => c.id === selectedCategoryId)?.title : '产品总库'}</span></div>
                  </div>
              </div>
              {!isCreating && !editingItem && !isBatchCreating && !revisionEditing && (
                  <div className="hidden md:flex gap-6">
                      <div className="bg-white border border-stone-100 px-4 py-2 rounded shadow-sm flex items-center gap-3"><Clock size={16} className="text-amber-500" /><div><div className="text-[10px] text-stone-400 font-bold uppercase">待审核</div><div className="text-sm font-bold text-stone-900">{catalogTotal===null?'未同步':stats.pending}</div></div></div>
                      <div className="bg-white border border-stone-100 px-4 py-2 rounded shadow-sm flex items-center gap-3"><AlertCircle size={16} className="text-red-500" /><div><div className="text-[10px] text-stone-400 font-bold uppercase">已退回</div><div className="text-sm font-bold text-stone-900">{catalogTotal===null?'未同步':stats.rejected}</div></div></div>
                  </div>
              )}
          </div>
          <div className="h-px bg-stone-200 w-full mb-8"></div>
      </div>

      {productActionError&&<div role="alert" className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
        {productActionError}<button type="button" onClick={()=>setProductActionError('')} className="ml-3 underline">知道了</button>
      </div>}
      {loading && products.length === 0 ? (
        <div className="py-40 flex flex-col items-center justify-center text-stone-300 font-mono"><Package className="animate-bounce mb-4 opacity-20" size={48} /><span className="text-[10px] font-bold tracking-widest uppercase">正在加载产品…</span></div>
      ) : isBatchCreating ? (
          <BatchCreator lang="zh"
              fixedCategoryId={selectedCategoryId && selectedCategoryId !== 'all' && categories.some(c => c.id === selectedCategoryId) ? selectedCategoryId : undefined}
              categories={categories}
              onCancel={handleBack}
              onCreateDraft={createBatchDraft}
              onCheckSkuCodes={checkBatchSkuCodes}
              onCompleted={async () => { await loadData(); }}
              onUpload={async (f) => { const fd = new FormData(); fd.append('file', f); const r = await factoryFetch('upload-image', { method: 'POST', body: fd }); return r.url; }}
          />
      ) : revisionEditing ? (
            <div>
              <p className="mb-5 rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                当前官网仍展示已发布版本。此处只编辑独立修订草稿，保存后请在下方“已发布产品修订”中提交审核。
                不会直接覆盖已发布产品。
              </p>
              <ProductForm
                onDirtyChange={rememberDirty} onBusyChange={rememberBusy}
                initialData={revisionEditing.product}
                categories={categories}
                onSave={handleSaveRevision}
                onCancel={handleBack}
                userRole="FACTORY"
                lang="zh"
              />
            </div>
      ) : editingItem || isCreating ? (
            <ProductForm key={editingItem?.id||creationKey}
                onDirtyChange={rememberDirty} onBusyChange={rememberBusy}
                onSaveAndSubmit={handleSaveAndSubmit} onSaveNext={handleSaveNext}
                initialData={editingItem || creationTemplate} 
                fixedCategoryId={isCreating && selectedCategoryId && selectedCategoryId !== 'all' && categories.some(c => c.id === selectedCategoryId) ? selectedCategoryId : undefined}
                categories={categories} 
                onSave={handleSaveDraft} 
                onSubmit={handleSubmitForReview}
                onCancel={handleBack} 
                userRole="FACTORY" 
                lang="zh" 
            />
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-end justify-between gap-3 rounded border border-stone-200 bg-white p-4">
                <label className="min-w-[190px] flex-1 text-xs font-semibold text-stone-700">
                  产品分类
                  <select aria-label="筛选产品分类" value={selectedCategoryId || 'all'}
                    onChange={e=>{if(formBusy.current)return;setSelectedCategoryId(e.target.value==='all'?null:e.target.value);setCatalogPage(1);}}
                    className="mt-2 w-full rounded border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900">
                    <option value="all">全部分类 · 我的产品</option>
                     <option value="__uncategorized">未归类（{uncategorizedCount}）</option>
                    {categories.map(c=><option value={c.id} key={c.id}>
                      {c.title_cn || c.title_zh || c.title}
                    </option>)}
                  </select>
                </label>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={()=>setIsRequestingCategory(true)}
                    className="rounded border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50">
                    申请新品类
                  </button>
                  <button type="button" onClick={()=>setIsBatchCreating(true)}
                    className="rounded border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50">
                    批量录入
                  </button>
                  <button type="button" onClick={()=>setIsCreating(true)}
                    className="rounded bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-800">
                    + 新建产品
                  </button>
                </div>
              </div>
              <details className="rounded border border-stone-200 bg-white p-4">
                <summary className="cursor-pointer text-sm font-semibold">按品类快速筛选（可展开）</summary>
                <div className="mt-3">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold">按品类查看 · 数量为我的完整产品库统计</h2>
                  <input aria-label="搜索产品品类" type="search" value={categoryQuickSearch}
                    onChange={e=>setCategoryQuickSearch(e.target.value)}
                    placeholder="搜索品类名称" className="rounded border border-stone-300 px-3 py-2 text-xs" />
                </div>
                <div className="flex flex-wrap gap-2" role="group" aria-label="产品品类快捷筛选">
                  <button type="button" aria-pressed={!selectedCategoryId}
                    onClick={()=>{if(formBusy.current)return;setSelectedCategoryId(null);setCatalogPage(1);}}
                    className={'rounded border px-3 py-2 text-xs '+(!selectedCategoryId?'bg-stone-900 text-white':'bg-stone-50 text-stone-700')}>
                    我的产品总量 · {catalogTotal===null?'未同步':ownerTotal}
                  </button>
                  {visibleCategoryCounts.map(c=><button type="button" key={c.id}
                    aria-pressed={selectedCategoryId===c.id} onClick={()=>{if(formBusy.current)return;setSelectedCategoryId(c.id);setCatalogPage(1);}}
                    className={'rounded border px-3 py-2 text-xs '+(selectedCategoryId===c.id?'bg-stone-900 text-white':'bg-white text-stone-700 hover:bg-stone-50')}>
                    {c.label} · {catalogTotal===null?'未同步':c.count}
                  </button>)}
                  <button type="button" aria-pressed={selectedCategoryId==='__uncategorized'}
                    onClick={()=>{if(formBusy.current)return;setSelectedCategoryId('__uncategorized');setCatalogPage(1);}}
                    className={'rounded border px-3 py-2 text-xs '+(selectedCategoryId==='__uncategorized'?'bg-stone-900 text-white':'bg-amber-50 text-amber-900')}>
                    未归类 · {catalogTotal===null?'未同步':uncategorizedCount}
                  </button>
                </div>
              </div>
              </details>
              <form aria-label="筛选我的产品" onSubmit={event=>{event.preventDefault();if(formBusy.current)return;setCatalogQuery(catalogSearch.trim());setCatalogPage(1);}}
                className="flex flex-wrap items-end gap-3 rounded border bg-white p-3">
                <label className="flex-1 text-xs">SKU 或产品名称<input type="search" maxLength={120} aria-label="搜索全部我的产品" value={catalogSearch}
                  onChange={e=>setCatalogSearch(e.target.value)} className="mt-1 w-full rounded border px-3 py-2 text-sm"/></label>
                <label className="text-xs">状态<select aria-label="我的产品状态" value={catalogStatus}
                  onChange={e=>{if(formBusy.current)return;setCatalogStatus(e.target.value);setCatalogPage(1);}} className="mt-1 block rounded border px-3 py-2 text-sm">
                  <option value="action">需要我处理</option><option value="all">全部产品</option><option value="draft">草稿</option>
                  <option value="returned_to_uploader">退回待修改</option><option value="waiting">等待审核与发布</option><option value="published">已发布</option>
                </select></label>
                <label className="text-xs">生产基地<select aria-label="我的产品生产基地" value={catalogSite}
                  onChange={e=>{if(formBusy.current)return;setCatalogSite(e.target.value);setCatalogPage(1);}} className="mt-1 block rounded border px-3 py-2 text-sm">
                  <option value="all">全部基地</option><option value="zhaoqing">肇庆</option><option value="cambodia">柬埔寨</option><option value="unassigned">未指定</option>
                </select></label>
                <button type="submit" className="rounded bg-stone-900 px-4 py-2 text-sm text-white">搜索</button>
                <button type="button" onClick={()=>{if(formBusy.current)return;setCatalogSearch('');setCatalogQuery('');setCatalogStatus('action');setCatalogSite('all');setSelectedCategoryId(null);setCatalogPage(1);}}
                  className="rounded border px-3 py-2 text-sm">回到我的待办</button>
              </form>
              {catalogError&&<div role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">{catalogError}
                <button type="button" onClick={()=>void loadData()} className="ml-3 underline">重新读取</button></div>}
              <ProductList
                 lang="zh"
                 items={products} isLoading={loading} serverFiltered onDuplicate={duplicateProduct} onBusyChange={rememberBusy}
                categories={categories}
                onEdit={setEditingItem}
                onCreate={()=>setIsCreating(true)}
                onRefresh={()=>loadData(true)}
                onBack={handleBack}
                onSubmit={id=>handleSubmitForReview(id,false)}
                onStartRevision={revisionEnabled?beginRevision:undefined}
                userRole="FACTORY"
              />
              <nav aria-label="我的产品分页" className="flex flex-wrap items-center justify-end gap-3 text-sm">
                <span role="status">{catalogTotal===null?'数量未同步':`匹配 ${catalogTotal} 件 · 第 ${catalogPage} 页 · 每页 50 件`}</span>
                <button type="button" disabled={loading||catalogPage===1} onClick={()=>{if(!formBusy.current)setCatalogPage(page=>page-1);}} className="rounded border px-3 py-2">上一页</button>
                <button type="button" disabled={loading||catalogTotal===null||catalogPage*50>=catalogTotal} onClick={()=>{if(!formBusy.current)setCatalogPage(page=>page+1);}} className="rounded border px-3 py-2">下一页</button>
              </nav>
            </div>
          )}
          {!revisionEditing&&!editingItem&&!isCreating&&!isBatchCreating&&
            <PublishedRevisionQueue role="FACTORY" paged onEdit={continueRevision}
              onEnabledChange={setRevisionEnabled} refreshKey={revisionRefresh}/>}
          </>)}
    </PortalLayout>
  );
};

export default FactoryWorkspace;
