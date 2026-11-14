import React,{useCallback,useEffect,useRef,useState} from 'react';
import {useLocation} from 'react-router-dom';
import {Inbox,RefreshCw,Search,X,Mail,Clock,CheckCircle2} from 'lucide-react';
import {adminFetch} from '../../../utils/adminFetch';
import {fetchBackofficePage} from '../../../utils/backofficeLists';

export type InquiryStatus='new'|'replied'|'quoted'|'won'|'closed';
export const INQUIRY_STATUS_LABELS:Record<InquiryStatus,string>={
  new:'新询盘',replied:'已回复',quoted:'已报价',won:'已成交',closed:'已关闭'
};
const STATUS_CLASSES:Record<InquiryStatus,string>={
  new:'border-blue-200 bg-blue-50 text-blue-900',
  replied:'border-stone-200 bg-stone-50 text-stone-800',
  quoted:'border-indigo-200 bg-indigo-50 text-indigo-900',
  won:'border-green-200 bg-green-50 text-green-900',
  closed:'border-stone-200 bg-stone-100 text-stone-600'
};
const statusEntries=Object.entries(INQUIRY_STATUS_LABELS) as [InquiryStatus,string][];
export type InquiryRow={
  id:string;name:string;email:string;company:string|null;product_type:string|null;
  country:string|null;linked_product_code:string|null;created_at:string;
  status:InquiryStatus;assignee_id:string|null;assignee_name:string|null;
  first_response_at:string|null;is_overdue:boolean;version:number;
};
export type InquiryDetail=InquiryRow&{
  message:string;source:string|null;website:string|null;updated_at:string|null;
  internal_notes:string;
};
export type InquiryHistory={
  id:string;field:'status'|'assignee_id';old_value:string|null;new_value:string|null;
  actor_id:string|null;actor_name:string|null;created_at:string;
};
type Assignee={id:string;username:string;role:string};
type DetailResponse={item:InquiryDetail;history:InquiryHistory[]};
const formatDate=(raw:string|null|undefined)=>{
  if(!raw)return '—';
  const date=new Date(raw);
  return Number.isFinite(date.getTime())
    ?new Intl.DateTimeFormat('zh-CN',{dateStyle:'medium',timeStyle:'short'}).format(date):'—';
};
const readable=(value:string|null|undefined)=>value?.trim()||'—';
const StatusChip:React.FC<{status:InquiryStatus}>=({status})=>
  <span data-inquiry-status={status} className={'inline-flex rounded border px-2 py-0.5 text-xs font-semibold '+STATUS_CLASSES[status]}>
    {INQUIRY_STATUS_LABELS[status]||'待核实'}
  </span>;
const DetailField:React.FC<{name:string;value:string|null|undefined}>=({name,value})=>
  <div><dt className="mb-1 text-xs font-semibold text-stone-500">{name}</dt>
    <dd className="break-words text-sm text-stone-900">{readable(value)}</dd></div>;

const InquiryManager:React.FC=()=>{
  const location=useLocation();
  const requestId=useRef(0);
  const [rows,setRows]=useState<InquiryRow[]>([]);
  const [assignees,setAssignees]=useState<Assignee[]>([]);
  const [page,setPage]=useState(1),[total,setTotal]=useState<number|null>(null);
  const [hasMore,setHasMore]=useState(false);
  const [queryInput,setQueryInput]=useState(''),[query,setQuery]=useState('');
  const [statusFilter,setStatusFilter]=useState(''),[assigneeFilter,setAssigneeFilter]=useState('');
  const [overdueOnly,setOverdueOnly]=useState(false);
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
  const [error,setError]=useState(''),[notice,setNotice]=useState('');
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const [detail,setDetail]=useState<InquiryDetail|null>(null);
  const [history,setHistory]=useState<InquiryHistory[]>([]);
  const [detailError,setDetailError]=useState('');
  const [detailLoading,setDetailLoading]=useState(false);
  const [formStatus,setFormStatus]=useState<InquiryStatus>('new');
  const [formAssignee,setFormAssignee]=useState('');
  const [formNotes,setFormNotes]=useState('');

  const loadList=useCallback(async()=>{
    const request=++requestId.current;
    setLoading(true);setError('');
    try{
      const result=await fetchBackofficePage<InquiryRow>('admin/inquiries',{
        page,page_size:50,q:query||undefined,status:statusFilter||undefined,
        assignee:assigneeFilter||undefined,overdue:overdueOnly?1:undefined
      });
      if(request!==requestId.current)return;
      if(page>1&&!result.items.length&&result.total>0){
        setPage(Math.max(1,Math.ceil(result.total/50)));return;
      }
      setRows(result.items);setTotal(result.total);setHasMore(result.has_more);
    }catch(e:any){
      if(request===requestId.current){setRows([]);setTotal(null);setHasMore(false);
        setError(e?.message||'询盘列表读取失败，请检查当前 Worker 和数据库迁移。');}
    }finally{if(request===requestId.current)setLoading(false);}
  },[page,query,statusFilter,assigneeFilter,overdueOnly]);
  useEffect(()=>{void loadList();return()=>{requestId.current++;};},[loadList]);
  useEffect(()=>{
    let active=true;
    void adminFetch<{items:Assignee[]}>('admin/inquiries/assignees')
      .then(data=>{if(active)setAssignees(data.items||[]);})
      .catch(()=>{if(active)setError('无法读取可分配账号，请检查当前 Worker 版本。');});
    return()=>{active=false;};
  },[]);

  const openDetail=useCallback(async(id:string)=>{
    if(!/^[a-zA-Z0-9_-]{1,120}$/.test(id))return;
    setSelectedId(id);setDetail(null);setDetailError('');setDetailLoading(true);
    try{
      const result=await adminFetch<DetailResponse>('admin/inquiries/'+encodeURIComponent(id));
      if(!result?.item||!Array.isArray(result.history))throw Error('详情结果不完整');
      setDetail(result.item);setHistory(result.history);
      setFormStatus(result.item.status);setFormAssignee(result.item.assignee_id||'');
      setFormNotes(result.item.internal_notes||'');
    }catch(e:any){setDetailError(e?.message||'无法读取询盘详情，请刷新重试。');}
    finally{setDetailLoading(false);}
  },[]);
  useEffect(()=>{
    const id=new URLSearchParams(location.search).get('inquiryId');
    if(id&&/^[a-zA-Z0-9_-]{1,120}$/.test(id))void openDetail(id);
  },[location.search,openDetail]);
  useEffect(()=>{
    if(!selectedId||typeof window==='undefined')return;
    const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!busy)setSelectedId(null);};
    window.addEventListener('keydown',escape);
    return()=>window.removeEventListener('keydown',escape);
  },[selectedId,busy]);
  const save=async()=>{
    if(!detail||busy)return;
    setBusy(true);setDetailError('');setNotice('');
    try{
      const result=await adminFetch<{success:boolean;version:number}>(
        'admin/inquiries/'+encodeURIComponent(detail.id),{
          method:'PUT',body:JSON.stringify({
            expected_version:detail.version,status:formStatus,
            assignee_id:formAssignee||null,internal_notes:formNotes
          })
        });
      if(result.success!==true)throw Error('未收到确认结果，请刷新详情核对。');
      await openDetail(detail.id);
      await loadList();
      setNotice('已保存询盘状态、负责人及内部备注。');
    }catch(e:any){setDetailError(e?.message||'保存失败，请刷新详情后重试。');}
    finally{setBusy(false);}
  };
  const assigneeName=(id:string|null)=>id?assignees.find(u=>u.id===id)?.username||id:'未分配';
  const historyValue=(event:InquiryHistory,value:string|null)=>{
    if(event.field==='status')return INQUIRY_STATUS_LABELS[value as InquiryStatus]||value||'—';
    return assigneeName(value);
  };
  return <section aria-label="询盘工作台" className="mx-auto max-w-[1500px] space-y-5 pb-12">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="font-serif text-2xl text-stone-900">询盘工作台</h1>
        <p className="mt-2 text-sm text-stone-600">收件、分配、跟进、报价和成交记录。内部备注仅管理员可见。</p></div>
      <button type="button" onClick={()=>void loadList()} disabled={loading}
        className="inline-flex min-h-11 items-center gap-2 rounded border px-4 py-2 text-sm disabled:opacity-50">
        <RefreshCw size={16} aria-hidden="true"/> 刷新
      </button>
    </header>
    {error&&<div role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">
      {error}</div>}
    {notice&&<p role="status" className="rounded border border-green-300 bg-green-50 p-3 text-sm text-green-900">{notice}</p>}
    <div className="flex flex-wrap items-center gap-3 rounded border bg-white px-4 py-3">
      <Inbox size={20} aria-hidden="true"/>
      <span className="text-sm font-semibold">符合筛选条件：{total===null?'未同步':total} 条</span>
      <span className="text-xs text-stone-500">新询盘收到满 24 小时仍未处理，标记“已超时”</span>
    </div>
    <form aria-label="询盘筛选" className="grid gap-3 rounded border bg-white p-4 sm:grid-cols-2 xl:grid-cols-5"
      onSubmit={e=>{e.preventDefault();setQuery(queryInput.trim());setPage(1);}}>
      <label className="text-sm text-stone-700 xl:col-span-2">搜索
        <div className="relative mt-1"><Search size={16} aria-hidden="true" className="absolute left-3 top-3 text-stone-400"/>
          <input type="search" aria-label="搜索询盘" maxLength={120}
            placeholder="姓名、公司、邮箱、SKU" value={queryInput}
            onChange={e=>setQueryInput(e.target.value)}
            className="w-full rounded border border-stone-300 py-2.5 pl-10 pr-3 text-sm"/>
        </div>
      </label>
      <label className="text-sm text-stone-700">状态
        <select aria-label="询盘状态筛选" value={statusFilter}
          onChange={e=>{setStatusFilter(e.target.value);setPage(1);}}
          className="mt-1 w-full rounded border border-stone-300 p-2.5 text-sm">
          <option value="">全部状态</option>
          {statusEntries.map(([value,label])=><option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label className="text-sm text-stone-700">负责人
        <select aria-label="询盘负责人筛选" value={assigneeFilter}
          onChange={e=>{setAssigneeFilter(e.target.value);setPage(1);}}
          className="mt-1 w-full rounded border border-stone-300 p-2.5 text-sm">
          <option value="">全部负责人</option><option value="unassigned">未分配</option>
          {assignees.map(u=><option key={u.id} value={u.id}>{u.username}</option>)}
        </select>
      </label>
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" checked={overdueOnly}
            onChange={e=>{setOverdueOnly(e.target.checked);setPage(1);}}/>只看超时</label>
        <button type="submit" className="min-h-11 rounded bg-stone-900 px-4 text-sm text-white">搜索</button>
      </div>
    </form>
    {loading?<div role="status" aria-label="正在加载询盘列表" className="space-y-2">
      {Array.from({length:4},(_,i)=><div key={i} className="h-20 animate-pulse rounded bg-stone-100"/>)}
    </div>:rows.length===0?<p className="rounded border bg-white p-10 text-center text-sm text-stone-600">
      当前没有符合条件的询盘。</p>:
      <div className="space-y-2" aria-label="询盘列表">
        {rows.map(item=><article key={item.id} className="rounded border border-stone-200 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-stone-900">{readable(item.company)} · {item.name}</span>
                <StatusChip status={item.status}/>
                {item.is_overdue&&<span className="inline-flex items-center gap-1 rounded border border-red-300 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-800">
                  <Clock size={12}/>已超时</span>}
              </div>
              <p className="break-words text-xs text-stone-600">
                收到：{formatDate(item.created_at)} · 国家：{readable(item.country)} ·
                关联 SKU：{readable(item.linked_product_code)} · 负责人：{readable(item.assignee_name||'未分配')}
              </p>
            </div>
            <button type="button" onClick={()=>void openDetail(item.id)}
              className="min-h-11 shrink-0 rounded border border-stone-300 px-4 text-sm font-semibold text-stone-800 hover:bg-stone-50">
              查看与跟进
            </button>
          </div>
        </article>)}
      </div>}
    <nav aria-label="询盘分页" className="flex flex-wrap items-center justify-end gap-3 text-sm">
      <span>第 {page} 页 · 每页 50 条</span>
      <button type="button" disabled={loading||page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}
        className="min-h-11 rounded border px-4 disabled:opacity-40">上一页</button>
      <button type="button" disabled={loading||!hasMore} onClick={()=>setPage(p=>p+1)}
        className="min-h-11 rounded border px-4 disabled:opacity-40">下一页</button>
    </nav>
    {selectedId&&<div role="presentation" className="fixed inset-0 z-[150] flex items-center justify-center bg-stone-950/70 p-3"
      onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)setSelectedId(null);}}>
      <section role="dialog" aria-modal="true" aria-label="询盘跟进详情"
        className="max-h-[94vh] w-full max-w-3xl space-y-4 overflow-y-auto rounded bg-white p-4 shadow-2xl sm:p-6">
        <header className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-xl">询盘详情与跟进</h2>
          <button type="button" aria-label="关闭详情" disabled={busy} onClick={()=>setSelectedId(null)}
            className="rounded p-2 hover:bg-stone-100"><X size={20}/></button>
        </header>
        {detailError&&<div role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          {detailError} <button type="button" disabled={busy} className="underline"
            onClick={()=>void openDetail(selectedId)}>刷新详情</button></div>}
        {detailLoading?<div role="status" className="h-36 animate-pulse rounded bg-stone-100" aria-label="正在加载询盘详情"/>:
          detail&&<div className="space-y-5">
            <dl className="grid gap-3 rounded border border-stone-200 bg-stone-50 p-4 sm:grid-cols-2">
              <DetailField name="客户姓名" value={detail.name}/>
              <DetailField name="公司名称" value={detail.company}/>
              <DetailField name="邮箱" value={detail.email}/>
              <DetailField name="国家 / 地区" value={detail.country}/>
              <DetailField name="关联 SKU" value={detail.linked_product_code}/>
              <DetailField name="咨询类型" value={detail.product_type}/>
              <DetailField name="来源" value={detail.source}/>
              <DetailField name="收到时间" value={formatDate(detail.created_at)}/>
              <DetailField name="首次回复时间" value={formatDate(detail.first_response_at)}/>
              <DetailField name="原始页面" value={detail.website}/>
            </dl>
            <section><h3 className="mb-2 text-sm font-semibold">客户留言</h3>
              <p className="whitespace-pre-wrap break-words rounded border p-4 text-sm leading-6">{readable(detail.message)}</p>
              <a href={'mailto:'+encodeURIComponent(detail.email)}
                className="mt-2 inline-flex items-center gap-2 text-sm font-semibold underline">
                <Mail size={16}/>使用邮箱回复
              </a>
            </section>
            <section className="space-y-3 rounded border border-stone-200 p-4" aria-label="内部跟进">
              <h3 className="text-sm font-semibold">内部跟进 · 管理员可编辑</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">跟进状态
                  <select aria-label="修改询盘状态" value={formStatus} disabled={busy}
                    onChange={e=>setFormStatus(e.target.value as InquiryStatus)}
                    className="mt-1 w-full rounded border p-3">
                    {statusEntries.map(([value,label])=><option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label className="text-sm">分配负责人
                  <select aria-label="修改询盘负责人" value={formAssignee} disabled={busy}
                    onChange={e=>setFormAssignee(e.target.value)}
                    className="mt-1 w-full rounded border p-3">
                    <option value="">未分配</option>
                    {assignees.map(u=><option key={u.id} value={u.id}>{u.username}</option>)}
                  </select>
                </label>
              </div>
              <p className="text-xs text-amber-800">可分配现有账号；询盘详情权限目前仅开放给管理员，不新增业务角色。</p>
              <label className="block text-sm">内部备注（不会显示在公开网站）
                <textarea aria-label="内部备注" value={formNotes} maxLength={5000} rows={4}
                  disabled={busy} onChange={e=>setFormNotes(e.target.value)}
                  className="mt-1 w-full resize-y rounded border p-3"/>
              </label>
              <button type="button" disabled={busy} onClick={()=>void save()}
                className="inline-flex min-h-11 items-center gap-2 rounded bg-stone-900 px-5 text-sm font-semibold text-white disabled:opacity-50">
                <CheckCircle2 size={17}/> {busy?'正在保存…':'保存跟进记录'}
              </button>
            </section>
            <section aria-label="跟进历史"><h3 className="mb-2 text-sm font-semibold">状态与负责人变更历史</h3>
              {!history.length?<p className="text-sm text-stone-500">暂无变更记录。</p>:
                <ol className="space-y-2">{history.map(event=><li key={event.id}
                  className="rounded border border-stone-200 p-3 text-xs text-stone-700">
                  {formatDate(event.created_at)} · {event.actor_name||'系统'} ·
                  {event.field==='status'?'跟进状态':'负责人'}：
                  {historyValue(event,event.old_value)} → {historyValue(event,event.new_value)}
                </li>)}</ol>}
            </section>
          </div>}
      </section>
    </div>}
  </section>;
};
export default InquiryManager;
