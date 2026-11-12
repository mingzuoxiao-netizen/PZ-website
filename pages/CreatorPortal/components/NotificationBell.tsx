import React,{useCallback,useEffect,useRef,useState} from 'react';
import {Bell,Mail,Check,RefreshCw,X} from 'lucide-react';
import {useLocation} from 'react-router-dom';
import {adminFetch,ADMIN_SESSION_KEY} from '../../../utils/adminFetch';

type Role='ADMIN'|'SUPERVISOR'|'FACTORY';
type Notice={id:string;title:string;message:string;event_type:string;
  entity_type:string;entity_id:string;created_at:string;read_at:string|null;
  email_state:string};
type Pref={email:string;email_masked:string;verified:boolean;enabled:boolean;provider_configured:boolean};
type ReviewInfo={id:string;product_id?:string;name?:string;name_cn?:string;code?:string;
  status?:string;category?:string;return_reason?:string|null;
  versions?:{snapshot?:{name?:string;name_cn?:string;code?:string;description?:string}}[]};
const blank:Pref={email:'',email_masked:'',verified:false,enabled:false,provider_configured:false};

const NotificationBell:React.FC<{role:Role}>=({role})=>{
  const location=useLocation();
  const [opened,setOpened]=useState(false);
  const [focused,setFocused]=useState<{kind:string;id:string;detail:ReviewInfo|null}|null>(null);
  const [focusBusy,setFocusBusy]=useState(false);
  const [focusError,setFocusError]=useState('');
  const [settings,setSettings]=useState(false);
  const [items,setItems]=useState<Notice[]>([]);
  const [unread,setUnread]=useState(0);
  const [pref,setPref]=useState<Pref>(blank);
  const [email,setEmail]=useState('');
  const [code,setCode]=useState('');
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const alive=useRef(true);
  const refresh=useCallback(async(full=false)=>{
    if(typeof sessionStorage==='undefined'||!sessionStorage.getItem(ADMIN_SESSION_KEY))return;
    try{
      if(full){
        const result=await adminFetch<{items:Notice[];unread_count:number}>('notifications?limit=40');
        if(!alive.current)return;
        setItems(result.items||[]);setUnread(result.unread_count||0);
      }else{
        const count=await adminFetch<{unread_count:number}>('notifications/unread-count');
        if(alive.current)setUnread(count.unread_count||0);
      }
    }catch{ /* Do not break authenticated admin screens if Worker migration is pending. */ }
  },[]);
  useEffect(()=>{
    // React test renderers and non-browser prerenderers may not expose timers
    // or sessionStorage. Notifications are optional UI, never a crash source.
    if(typeof window==='undefined'||typeof document==='undefined'||
       typeof sessionStorage==='undefined'||typeof window.setInterval!=='function'||
       typeof window.addEventListener!=='function')return;
    alive.current=true;
    void refresh(false);
    const poll=()=>{if(document.visibilityState!=='hidden')void refresh(false);};
    const interval=window.setInterval(poll,60000);
    window.addEventListener('focus',poll);
    return()=>{alive.current=false;window.clearInterval(interval);window.removeEventListener('focus',poll);};
  },[refresh]);
  const open=()=>{
    const next=!opened;setOpened(next);setError('');setNotice('');
    if(next){void refresh(true);void readPreferences();}
  };
  const readPreferences=async()=>{
    try{
      const p=await adminFetch<Pref>('notifications/email/preferences');
      setPref(p);setEmail(p.email||'');
    }catch{ /* current Worker may not have the notification migration yet */ }
  };
  const change=async(task:()=>Promise<unknown>,message:string)=>{
    if(busy)return;
    setBusy(true);setError('');setNotice('');
    try{await task();setNotice(message);await readPreferences();await refresh(true);}
    catch(e:any){setError(e?.message||'操作未完成，请重试');}
    finally{setBusy(false);}
  };
  const showReview=async(kind:string,id:string)=>{
    if(!['review','revision','product'].includes(kind)||!id||id.length>120)return;
    setSettings(false);setFocused({kind,id,detail:null});setFocusError('');setFocusBusy(true);
    try{
      if(kind==='product'){
        // Sampling-unpublish events link to a product ID, rather than a review.
        setFocusError('已下架产品可在产品管理里按通知中的 SKU 查询。');
        return;
      }
      const scope=role==='ADMIN'?'admin':role==='SUPERVISOR'?'supervisor':'factory';
      const detail=await adminFetch<ReviewInfo>(scope+'/'+(kind==='revision'?'revisions':'reviews')+
        '/'+encodeURIComponent(id));
      setFocused({kind,id,detail});
    }catch(e:any){setFocusError('审核详情读取失败：'+(e?.message||'请打开对应待审列表核对'));}
    finally{setFocusBusy(false);}
  };
  useEffect(()=>{
    const query=new URLSearchParams(location.search);
    const kind=query.get('noticeType')||'',id=query.get('noticeId')||'';
    if(!['review','revision','product'].includes(kind)||!id||id.length>120)return;
    setOpened(true);
    void showReview(kind,id);
    void refresh(true);
  },[location.search,role]);
  const read=async(item:Notice)=>{
    if(!item.read_at){
      try{await adminFetch('notifications/'+encodeURIComponent(item.id)+'/read',{method:'POST'});}
      catch{ /* viewing the item is still possible without read receipt */ }
    }
    await refresh(true);
    await showReview(item.entity_type,item.entity_id);
  };
  const readAll=()=>void change(()=>adminFetch('notifications/read-all',{method:'POST'}),
    '全部通知已标记为已读');
  return <div className="relative" aria-label="审核通知">
    <button type="button" aria-label={'审核通知，未读 '+unread+' 条'} aria-expanded={opened}
      onClick={open}
      className="relative rounded border border-stone-200 px-3 py-2 text-sm text-stone-700 hover:border-stone-500">
      <Bell size={18} aria-hidden="true"/>
      {unread>0&&<span className="absolute -right-2 -top-2 min-w-5 rounded-full bg-red-700 px-1 text-center text-[11px] font-semibold text-white">
        {unread>99?'99+':unread}
      </span>}
    </button>
    {opened&&<div role="dialog" aria-label="审核通知与邮件设置"
      className="absolute right-0 top-12 z-50 w-[min(90vw,420px)] rounded border border-stone-200 bg-white p-4 shadow-2xl">
      <header className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">审核通知 · {unread} 条未读</h3>
        <button type="button" aria-label="关闭通知" onClick={()=>setOpened(false)}><X size={17}/></button>
      </header>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={()=>void refresh(true)} className="flex items-center gap-1 rounded border px-2 py-1 text-xs"><RefreshCw size={13}/>刷新</button>
        <button type="button" onClick={readAll} disabled={busy||unread===0}
          className="flex items-center gap-1 rounded border px-2 py-1 text-xs disabled:opacity-40"><Check size={13}/>全部已读</button>
        <button type="button" onClick={()=>setSettings(v=>!v)} className="flex items-center gap-1 rounded border px-2 py-1 text-xs"><Mail size={13}/>邮件设置</button>
      </div>
      {error&&<p role="alert" className="mt-3 rounded bg-red-50 p-2 text-xs text-red-700">{error}</p>}
      {notice&&<p role="status" className="mt-3 rounded bg-green-50 p-2 text-xs text-green-800">{notice}</p>}
      {focused&&<section aria-label="审核产品详情" className="mt-3 rounded border border-amber-300 bg-amber-50 p-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-semibold">审核记录 · {focused.kind==='revision'?'产品修订':'新品'}</h4>
          <button type="button" className="text-xs underline" onClick={()=>setFocused(null)}>返回通知列表</button>
        </div>
        {focusBusy&&<p className="mt-2 text-xs">正在加载审核详情…</p>}
        {focusError&&<p role="alert" className="mt-2 text-xs text-amber-900">{focusError}</p>}
        {focused.detail&&<div className="mt-2 space-y-1 text-xs">
          <p><strong>{focused.detail.name_cn||focused.detail.versions?.at(-1)?.snapshot?.name_cn||
            focused.detail.name||focused.detail.versions?.at(-1)?.snapshot?.name||'产品'}</strong></p>
          <p>SKU：{focused.detail.code||focused.detail.versions?.at(-1)?.snapshot?.code||'待核对'}</p>
          <p>审核状态：{focused.detail.status||'未同步'}</p>
          {!!focused.detail.return_reason&&<p>退回原因：{focused.detail.return_reason}</p>}
        </div>}
      </section>}
      {settings&&<section className="mt-3 space-y-3 rounded border border-stone-200 bg-stone-50 p-3" aria-label="邮件通知设置">
        <h4 className="text-sm font-semibold">审核邮件通知</h4>
        <p className="text-xs text-stone-600">账号没有自动绑定邮箱。请填写您本人可收信的邮箱，收到验证码后进行验证。只有完成验证并开启邮件通知，才会收到审核提醒。</p>
        <label className="block text-xs">收件邮箱
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="work@example.com"
            className="mt-1 w-full rounded border bg-white p-2 text-sm"/>
        </label>
        <button type="button" disabled={busy||!pref.provider_configured||!email.includes('@')}
          onClick={()=>void change(()=>adminFetch('notifications/email/request-code',{
            method:'POST',body:JSON.stringify({email:email.trim()})
          }),'验证码已发送，有效期 15 分钟')}
          className="rounded border px-3 py-2 text-xs disabled:opacity-40">发送邮箱验证码</button>
        <label className="block text-xs">六位验证码
          <input inputMode="numeric" maxLength={6} value={code}
            onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))}
            className="mt-1 w-full rounded border bg-white p-2 text-sm"/>
        </label>
        <button type="button" disabled={busy||code.length!==6}
          onClick={()=>void change(()=>adminFetch('notifications/email/verify',{
            method:'POST',body:JSON.stringify({code})
          }),'邮箱已验证，审核邮件通知已开启')}
          className="rounded border px-3 py-2 text-xs disabled:opacity-40">验证邮箱并开启通知</button>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs">{pref.verified?'已验证：'+pref.email_masked:'未验证邮箱'} · {pref.enabled?'邮件已开启':'邮件关闭'}</span>
          {pref.verified&&<button type="button" disabled={busy}
            onClick={()=>void change(()=>adminFetch('notifications/email/preferences',{
              method:'POST',body:JSON.stringify({enabled:!pref.enabled})
            }),!pref.enabled?'邮件通知已开启':'邮件通知已关闭')}
            className="rounded border px-3 py-1.5 text-xs">{pref.enabled?'关闭邮件':'开启邮件'}</button>}
        </div>
        {!pref.provider_configured&&<p className="text-xs text-amber-900">当前 Worker 尚未配置邮件服务；站内通知不受影响。</p>}
      </section>}
      <div className="mt-3 max-h-[min(52vh,410px)] space-y-2 overflow-y-auto">
        {items.map(item=><button key={item.id} type="button" onClick={()=>void read(item)}
          className={'block w-full rounded border p-3 text-left text-sm hover:border-stone-500 '+(!item.read_at?'border-amber-400 bg-amber-50':'border-stone-200 bg-white')}>
          <div className="flex items-center justify-between gap-2"><strong>{item.title}</strong>{!item.read_at&&<span className="h-2 w-2 rounded-full bg-amber-600"/>}</div>
          <p className="mt-1 whitespace-pre-wrap text-xs text-stone-600">{item.message}</p>
          <p className="mt-1 text-[11px] text-stone-500">{item.created_at}</p>
        </button>)}
        {!items.length&&<p className="p-3 text-center text-xs text-stone-500">暂无审核通知。</p>}
      </div>
    </div>}
  </div>;
};
export default NotificationBell;
