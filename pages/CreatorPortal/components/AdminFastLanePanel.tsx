import React,{useCallback,useEffect,useState} from 'react';
import {adminFetch} from '../../../utils/adminFetch';

type Operator={
  id:string;username:string;is_active:number;trusted:number;updated_at?:string|null
};
type State={
  worker_enabled:boolean;enabled:boolean;operators:Operator[];
  settings_updated_by?:string|null;settings_updated_at?:string|null;
};
type Sample={
  id:string;review_id:string;product_id:string;operator_id:string;supervisor_id:string;
  name:string;name_cn?:string;code:string;operator_name:string;supervisor_name?:string;
  published_at:string;reviewed_at?:string|null;reviewed_by?:string|null;
  status:'published'|'sampled_ok'|'unpublished';
  catalog_synced:number;unpublish_reason?:string|null
};
const reasonOK=(text:string)=>text.trim().length>=5&&text.trim().length<=2000;

const AdminFastLanePanel:React.FC=()=>{
  const [config,setConfig]=useState<State|null>(null);
  const [samples,setSamples]=useState<Sample[]>([]);
  const [page,setPage]=useState(1);
  const [total,setTotal]=useState(0);
  const [filter,setFilter]=useState('pending');
  const [reason,setReason]=useState('');
  const [search,setSearch]=useState('');
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const load=useCallback(async()=>{
    setLoading(true);setError('');
    try{
      const [state,queue]=await Promise.all([
        adminFetch<State>('admin/fast-lane/state'),
        adminFetch<{items:Sample[];total:number}>(
          'admin/fast-lane/samples?page='+page+'&status='+filter)
      ]);
      setConfig(state);setSamples(queue.items||[]);setTotal(queue.total||0);
    }catch(e:any){
      setError('快速通道数据读取失败：'+(e?.message||'请确认 Staging 已执行迁移 018 且 Worker 已部署'));
      setConfig(null);setSamples([]);
    }finally{setLoading(false);}
  },[page,filter]);
  useEffect(()=>{void load();},[load]);
  const run=async<T,>(task:()=>Promise<T>,message:string)=>{
    if(busy)return;
    setBusy(true);setError('');setNotice('');
    try{await task();setNotice(message);await load();setReason('');}
    catch(e:any){setError('操作未完成：'+(e?.message||'请刷新后重查状态'));}
    finally{setBusy(false);}
  };
  const updateConfig=(enabled:boolean)=>{
    if(!config||!reasonOK(reason))return;
    if(enabled&&!window.confirm('启用可信操作员快速发布？符合条件的产品将由主管直接发布，并进入 Admin 发布后抽检。'))return;
    void run(()=>adminFetch('admin/fast-lane/settings',{
      method:'POST',body:JSON.stringify({enabled,reason:reason.trim()})
    }),enabled?'快速通道已开启，可随时关闭':'已关闭快速通道，下一次审核恢复两级审核');
  };
  const setTrusted=(operator:Operator,trusted:boolean)=>{
    if(!reasonOK(reason))return;
    if(trusted&&!window.confirm('授予 '+operator.username+' 可信标记？发布历史与产品风险仍由 Worker 独立校验。'))return;
    void run(()=>adminFetch('admin/fast-lane/operators/'+encodeURIComponent(operator.id)+'/trust',{
      method:'POST',body:JSON.stringify({trusted,reason:reason.trim()})
    }),trusted?'已授予可信标记':'已撤销可信标记，下一次审核立即按两级流程');
  };
  const sampleAction=(sample:Sample,action:'accept'|'unpublish'|'sync-catalog')=>{
    if(action==='unpublish'&&!reasonOK(reason))return;
    if(action==='unpublish'&&!window.confirm('将 '+(sample.code||sample.name)+' 从公开网站下架并记录原因？两次抽检下架会自动撤销该操作员的可信标记。'))return;
    void run(()=>adminFetch('admin/fast-lane/samples/'+encodeURIComponent(sample.id)+'/'+action,{
      method:'POST',body:JSON.stringify({reason:reason.trim()})
    }),action==='accept'?'已记录抽检通过':action==='unpublish'?'已记录抽检下架；请核对可信标记':'已重新同步公开产品目录');
  };
  const filtered=(config?.operators||[]).filter(o=>o.username.toLowerCase().includes(search.toLowerCase()));
  return <section className="space-y-5" aria-label="发布后抽检及可信操作员">
    <header className="rounded border border-stone-200 bg-white p-4">
      <h3 className="font-serif text-xl font-semibold">可信操作员 · 发布后抽检</h3>
      <p className="mt-1 text-sm text-stone-600">低风险产品在主管初审通过后直接发布，随后由 Admin 抽检。此功能必须由 Worker 环境开关和 Admin 开关同时放行。</p>
      <p className="mt-2 text-xs text-amber-900">默认关闭。只有 Admin 明确授权、满足历史合格记录、曾发布过该分类、且不存在承重/检测/认证声明的产品才可进入快捷通道。所有操作留痕，可即时撤销。</p>
    </header>
    {error&&<p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">{error}</p>}
    {notice&&<p role="status" className="rounded border border-green-200 bg-green-50 p-3 text-sm">{notice}</p>}
    <div className="rounded border border-stone-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h4 className="text-sm font-semibold">全局发布开关</h4>
          <p className="mt-1 text-xs text-stone-600">
            Worker：{config?.worker_enabled?'已允许':'已关闭'} · Admin：{config?.enabled?'已开启':'已关闭'}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" disabled={busy||loading||!config?.enabled||!reasonOK(reason)}
            onClick={()=>updateConfig(false)}
            className="rounded border border-red-300 px-3 py-2 text-sm text-red-800 disabled:opacity-50">立即关闭</button>
          <button type="button" disabled={busy||loading||!config?.worker_enabled||config?.enabled||!reasonOK(reason)}
            onClick={()=>updateConfig(true)}
            className="rounded bg-stone-900 px-3 py-2 text-sm text-white disabled:opacity-50">开启快速通道</button>
        </div>
      </div>
      <label className="mt-4 block text-xs font-semibold">操作原因（所有授权、撤销、下架及开关操作必须填写至少5字）
        <textarea value={reason} maxLength={2000} rows={2} onChange={e=>setReason(e.target.value)}
          placeholder="例如：批准试运行，完成风险和历史记录核查" className="mt-1 w-full rounded border p-2 text-sm"/>
      </label>
    </div>
    <div className="rounded border border-stone-200 bg-white p-4">
      <h4 className="font-semibold">操作员可信标记</h4>
      <p className="mt-1 text-xs text-stone-500">此标记不是自动免审许可；若历史记录不足10条，或属于新分类/含检验声明，仍走原两级审核。对于缺失历史审计的老产品，Worker 会显示并记录管理员授权的历史回退模式。</p>
      <input aria-label="搜索操作员" value={search} onChange={e=>setSearch(e.target.value)}
        placeholder="搜索账号" className="mt-3 w-full rounded border p-2 text-sm"/>
      <div className="mt-3 max-h-80 space-y-2 overflow-auto">
        {filtered.map(o=><div key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded border p-2">
          <span className="text-sm">{o.username} · {Number(o.trusted)===1?'已授权':'未授权'} · {Number(o.is_active)===1?'在职':'停用'}</span>
          <button type="button" disabled={busy||!reasonOK(reason)||Number(o.is_active)!==1}
            onClick={()=>setTrusted(o,Number(o.trusted)!==1)}
            className="rounded border border-stone-300 px-3 py-1.5 text-xs disabled:opacity-40">
            {Number(o.trusted)===1?'撤销可信':'授予可信'}</button>
        </div>)}
        {!filtered.length&&!loading&&<p className="text-xs text-stone-500">没有匹配的操作员账号。</p>}
      </div>
    </div>
    <div className="rounded border border-stone-200 bg-white p-4">
      <div className="flex flex-wrap justify-between gap-3"><h4 className="font-semibold">发布后抽检（{total}）</h4>
        <button className="rounded border px-3 py-1 text-xs" type="button" onClick={()=>void load()}>刷新</button>
      </div>
      <label className="mt-3 block text-xs">筛选状态
        <select aria-label="筛选抽检状态" value={filter} onChange={e=>{setFilter(e.target.value);setPage(1);}}
          className="mt-1 w-full rounded border p-2 text-sm">
          <option value="pending">待抽检</option><option value="accepted">已通过</option>
          <option value="unpublished">已下架</option><option value="all">全部</option>
        </select>
      </label>
      <div className="mt-3 space-y-2">{samples.map(item=><article key={item.id} className="rounded border p-3 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <strong>{item.name_cn||item.name} · {item.code}</strong>
          <span className="text-xs text-stone-500">{item.status==='published'?'待抽检':item.status==='sampled_ok'?'抽检通过':'已下架'} · {item.catalog_synced?'已同步官网':'官网同步待核对'}</span>
        </div>
        <p className="mt-1 text-xs text-stone-600">操作员：{item.operator_name} · 初审主管：{item.supervisor_name||item.supervisor_id} · 发布：{item.published_at}</p>
        {!!item.unpublish_reason&&<p className="mt-2 text-xs text-amber-900">下架原因：{item.unpublish_reason}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {item.status==='published'&&<>
            <button type="button" onClick={()=>sampleAction(item,'accept')} disabled={busy}
              className="rounded border px-3 py-2 text-xs disabled:opacity-40">抽检通过</button>
            <button type="button" onClick={()=>sampleAction(item,'unpublish')} disabled={busy||!reasonOK(reason)}
              className="rounded border border-red-400 px-3 py-2 text-xs text-red-800 disabled:opacity-40">下架并记录原因</button>
          </>}
          {!Number(item.catalog_synced)&&<button type="button" onClick={()=>sampleAction(item,'sync-catalog')}
            disabled={busy} className="rounded border px-3 py-2 text-xs">重试目录同步</button>}
        </div>
      </article>)}
      {!samples.length&&!loading&&<p className="p-3 text-xs text-stone-500">当前没有符合条件的抽检记录。</p>}
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        <button type="button" disabled={page<=1||busy} onClick={()=>setPage(p=>p-1)} className="rounded border px-3 py-1.5 disabled:opacity-40">上一页</button>
        <span>第 {page} 页 / 共 {Math.max(1,Math.ceil(total/50))} 页</span>
        <button type="button" disabled={page*50>=total||busy} onClick={()=>setPage(p=>p+1)} className="rounded border px-3 py-1.5 disabled:opacity-40">下一页</button>
      </div>
    </div>
  </section>;
};
export default AdminFastLanePanel;
