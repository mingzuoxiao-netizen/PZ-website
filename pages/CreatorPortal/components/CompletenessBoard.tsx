import React,{useCallback,useEffect,useRef,useState} from 'react';
import {AlertCircle,Download,AlertTriangle,RefreshCw} from 'lucide-react';
import {adminFetch} from '../../../utils/adminFetch';
import type {DashboardTarget} from './RoleHome';
import {Button,EmptyState,ListShell,ListSkeleton,Toast} from '../ui/BackofficeComponents';
import {backofficeError} from '../ui/feedback';

type GapKey='material'|'description'|'dimensions'|'images'|'name';
const GAP_LABELS:Record<GapKey,string>={
  material:'主要材质',description:'英文产品描述',
  dimensions:'产品尺寸',images:'产品图片与用途',name:'英文产品名称'
};
type GapRow={id:string;code:string;name:string;category:string;
  owner_id:string;owner_name:string;missing:GapKey[];updated_at:string|null};
type Group={category?:string;owner_id?:string;owner_name?:string;count:number;fields:Partial<Record<GapKey,number>>};
type GapReport={list_version:1;updated_at:string;total_scanned:number;
  total_with_gaps:number;total:number;page:number;page_size:number;has_more:boolean;
  items:GapRow[];by_category:Group[];by_owner:Group[]};
const labels=(keys:GapKey[])=>keys.map(key=>GAP_LABELS[key]||key).join('、');
const CompletenessBoard:React.FC<{
  onNavigate:(target:DashboardTarget)=>void
}>=({onNavigate})=>{
  const requestNumber=useRef(0);
  const [page,setPage]=useState(1),[category,setCategory]=useState(''),[owner,setOwner]=useState('');
  const [report,setReport]=useState<GapReport|null>(null);
  const [loading,setLoading]=useState(true),[exporting,setExporting]=useState(false);
  const [error,setError]=useState(''),[notice,setNotice]=useState('');
  const params=useCallback((exportCsv=false)=>new URLSearchParams({
    page:String(page),page_size:'50',
    ...(category?{category}:{}),...(owner?{owner}:{}),
    ...(exportCsv?{export:'csv'}:{})
  }).toString(),[page,category,owner]);
  const load=useCallback(async()=>{
    const current=++requestNumber.current;
    setLoading(true);setError('');setReport(null);
    try{
      const result=await adminFetch<GapReport>('admin/dashboard/completeness?'+params());
      if(result?.list_version!==1||!Array.isArray(result.items)||
         !Array.isArray(result.by_category)||!Array.isArray(result.by_owner))
        throw Error('完整度统计响应不符合当前版本，已停止展示。');
      if(current===requestNumber.current)setReport(result);
    }catch(e:any){if(current===requestNumber.current)setError(backofficeError(e,'无法同步资料缺口，请刷新重试。'));}
    finally{if(current===requestNumber.current)setLoading(false);}
  },[params]);
  useEffect(()=>{void load();return()=>{requestNumber.current++;};},[load]);
  const exportCsv=async()=>{
    if(exporting)return;
    setExporting(true);setError('');
    try{
      const content=await adminFetch<string>('admin/dashboard/completeness?'+params(true));
      // Response.text() removes a UTF-8 BOM; add exactly one back for Excel.
      if(typeof content!=='string'||!content.includes('SKU'))
        throw Error('CSV 文件格式异常，未开始下载。');
      const blob=new Blob(['\uFEFF'+content.replace(/^\uFEFF/,'')],{type:'text/csv;charset=utf-8'});
      const href=URL.createObjectURL(blob),link=document.createElement('a');
      link.href=href;link.download='PZ_产品资料缺口.csv';document.body.append(link);
      link.click();link.remove();URL.revokeObjectURL(href);
      setNotice('已导出产品资料缺口 CSV。');
    }catch(e:any){setError(backofficeError(e,'导出失败，请刷新重试。'));}
    finally{setExporting(false);}
  };
  return <section aria-label="产品资料完整度看板" className="space-y-5">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-serif text-2xl">产品资料完整度</h1>
        <p className="mt-1 text-sm leading-6 text-stone-600">
          直接复用产品保存与审核的机器校验规则，统计未发布产品的五类资料缺口。
          已发布产品不会混入；不会将完整产品库传给浏览器。
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={loading||exporting} onClick={()=>void load()}>
          <RefreshCw size={16}/>刷新
        </Button>
        <Button type="button" variant="primary" disabled={loading||exporting||!report}
          loading={exporting} onClick={()=>void exportCsv()}>
          <Download size={16}/>{exporting?'正在导出…':'导出缺口 CSV'}
        </Button>
      </div>
    </header>
    {error&&<Toast variant="error" message={error} onClose={()=>setError('')}/>}
    {notice&&<Toast message={notice} onClose={()=>setNotice('')}/>}
    {loading?<ListSkeleton rows={3}/>:report&&<>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ['检查产品总数',report.total_scanned],
          ['存在缺口的产品',report.total_with_gaps],
          ['当前筛选匹配',report.total]
        ].map(([label,num])=><div key={label} className="rounded border bg-white p-4">
          <p className="text-xs text-stone-600">{label}</p>
          <p className="mt-2 font-serif text-3xl tabular-nums">{num}</p>
        </div>)}
      </div>
      <div className="grid gap-3 rounded border bg-white p-4 sm:grid-cols-2">
        <label className="text-sm font-semibold">按品类筛选
          <select aria-label="完整度按品类筛选" value={category}
            onChange={e=>{setCategory(e.target.value);setPage(1);}}
            className="mt-1 block w-full rounded border border-stone-300 p-3 text-sm font-normal">
            <option value="">所有品类</option>
            {report.by_category.map(item=><option key={item.category} value={item.category}>
              {item.category} · {item.count} 件</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold">按所属操作员筛选
          <select aria-label="完整度按负责人筛选" value={owner}
            onChange={e=>{setOwner(e.target.value);setPage(1);}}
            className="mt-1 block w-full rounded border border-stone-300 p-3 text-sm font-normal">
            <option value="">所有操作员</option>
            {report.by_owner.map(item=><option key={item.owner_id} value={item.owner_id}>
              {item.owner_name||'未分配'} · {item.count} 件</option>)}
          </select>
        </label>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <section className="rounded border border-stone-200 bg-white p-4" aria-label="按品类汇总">
          <h2 className="mb-3 font-semibold">按品类汇总</h2>
          {report.by_category.length===0?<p className="text-sm text-stone-500">没有资料缺口。</p>:
            <ul className="max-h-72 space-y-2 overflow-y-auto text-sm">
              {report.by_category.map(item=><li key={item.category}
                className="rounded border border-stone-100 p-2">
                <button type="button" onClick={()=>{setCategory(item.category||'');setPage(1);}}
                  className="font-semibold underline">{item.category} · {item.count} 件</button>
                <p className="mt-1 text-xs text-stone-500">
                  {Object.entries(item.fields).map(([key,value])=>GAP_LABELS[key as GapKey]+' '+value).join('、')}
                </p>
              </li>)}
            </ul>}
        </section>
        <section className="rounded border border-stone-200 bg-white p-4" aria-label="按操作员汇总">
          <h2 className="mb-3 font-semibold">按操作员汇总</h2>
          {report.by_owner.length===0?<p className="text-sm text-stone-500">没有资料缺口。</p>:
            <ul className="max-h-72 space-y-2 overflow-y-auto text-sm">
              {report.by_owner.map(item=><li key={item.owner_id}
                className="rounded border border-stone-100 p-2">
                <button type="button" className="font-semibold underline"
                  onClick={()=>{setOwner(item.owner_id||'');setPage(1);}}>
                  {item.owner_name||'未分配'} · {item.count} 件
                </button>
                <p className="mt-1 text-xs text-stone-500">
                  {Object.entries(item.fields).map(([key,value])=>GAP_LABELS[key as GapKey]+' '+value).join('、')}
                </p>
              </li>)}
            </ul>}
        </section>
      </div>
      <ListShell label="产品缺口明细" page={page} hasMore={report.has_more} onPageChange={setPage}>
      <section aria-label="产品缺口明细" className="min-w-0 rounded border border-stone-200 bg-white p-4">
        <h2 className="mb-2 flex items-center gap-2 font-semibold"><AlertTriangle size={18}/>缺口明细</h2>
        {report.items.length===0?<p className="py-8 text-center text-sm text-stone-500">当前筛选没有缺口记录。</p>:
          <div className="space-y-2">
            {report.items.map(item=><article key={item.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded border border-stone-200 p-3">
              <div className="min-w-0 flex-1 space-y-1">
                <p className="break-all text-sm font-semibold">{item.code||'未填写 SKU'} · {item.name||'未填写英文名称'}</p>
                <p className="text-xs text-stone-500">品类：{item.category} · 负责人：{item.owner_name}</p>
                <p className="text-xs leading-6 text-red-800">需补齐：{labels(item.missing)}</p>
              </div>
              <button type="button" className="min-h-11 rounded border px-3 text-sm font-semibold"
                onClick={()=>onNavigate({tab:'inventory',sku:item.code||''})}>定位产品</button>
            </article>)}
          </div>}
      </section>
      </ListShell>
    </>}
  </section>;
};
export default CompletenessBoard;
