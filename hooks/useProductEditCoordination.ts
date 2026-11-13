import {useCallback,useEffect,useRef,useState} from 'react';
import {adminFetch} from '../utils/adminFetch';
import type {ProductVariant} from '../types';

export type EditingPeer={id:string;name:string;started_at:string};
export type EditSnapshot={product:ProductVariant;updated_at:string;edit_revision:number;
  last_editor_name:string|null;others:EditingPeer[]};
export type AutosaveOutcome={success:true;updated_at:string;edit_revision:number};
export type DraftSyncState='idle'|'dirty'|'saving'|'saved'|'conflict'|'error';
type Params={
  productId?:string;status?:string;initialUpdatedAt?:string|null;initialRevision?:number;
  enabled:boolean;dirty:boolean;busy:boolean;
  getDraft:()=>Record<string,unknown>;
  saveDraft:(data:Record<string,unknown>)=>Promise<AutosaveOutcome>;
  onSaved:(result:AutosaveOutcome,stillDirty:boolean)=>void;
};
const editableStatus=(value?:string)=>['draft','rejected','returned_to_uploader'].includes(value||'');
export const isEditConflict=(error:unknown)=>{
  const text=String((error as Error)?.message||error||'');
  return text.includes('PRODUCT_EDIT_CONFLICT')||text.includes('已被 ')||
    text.includes('编辑版本信息')||text.includes('(HTTP 409)');
};
const formatClock=(raw:string)=>new Date(raw).toLocaleTimeString('zh-CN',{
  hour:'2-digit',minute:'2-digit',second:'2-digit'
});

export function useProductEditCoordination(params:Params){
  const [status,setStatus]=useState<DraftSyncState>('idle');
  const [savedAt,setSavedAt]=useState(params.initialUpdatedAt||'');
  const [error,setError]=useState('');
  const [peers,setPeers]=useState<EditingPeer[]>([]);
  const [latest,setLatest]=useState<EditSnapshot|null>(null);
  const [conflict,setConflict]=useState('');
  const [loadingLatest,setLoadingLatest]=useState(false);
  const revisionRef=useRef({timestamp:params.initialUpdatedAt||'',revision:params.initialRevision||0});
  const paramsRef=useRef(params);paramsRef.current=params;
  const busyRef=useRef(false),hasConflict=useRef(false),mounted=useRef(true);
  const sessionRef=useRef<string>('');
  if(!sessionRef.current)sessionRef.current=
    typeof crypto!=='undefined'&&'randomUUID' in crypto
      ?crypto.randomUUID():('pzedit'+Date.now().toString(36)+Math.random().toString(36).slice(2));
  useEffect(()=>{
    revisionRef.current={timestamp:params.initialUpdatedAt||'',revision:params.initialRevision||0};
    hasConflict.current=false;setConflict('');setLatest(null);
    setStatus('idle');setError('');setSavedAt(params.initialUpdatedAt||'');
  },[params.productId]);

  const readLatest=useCallback(async()=>{
    const id=paramsRef.current.productId;if(!id)return null;
    setLoadingLatest(true);
    try{
      const data=await adminFetch<EditSnapshot>(
        'factory/products/'+encodeURIComponent(id)+'/edit-state');
      if(!data.product||!Number.isSafeInteger(data.edit_revision))
        throw Error('服务器返回的产品编辑版本不完整。');
      setLatest(data);setPeers(data.others||[]);
      return data;
    }catch(err:any){setError(err?.message||'读取最新产品失败。');return null;}
    finally{setLoadingLatest(false);}
  },[]);

  const autosave=useCallback(async()=>{
    const p=paramsRef.current;
    if(!p.enabled||!p.productId||!editableStatus(p.status)||!p.dirty||
      p.busy||busyRef.current||hasConflict.current)return;
    if(!revisionRef.current.timestamp)return;
    const snapshot=p.getDraft();
    const serialized=JSON.stringify(snapshot);
    const token=revisionRef.current;
    busyRef.current=true;setStatus('saving');setError('');
    try{
      const result=await p.saveDraft({...snapshot,
        expected_updated_at:token.timestamp,expected_revision:token.revision});
      if(result?.success!==true||!result.updated_at||!Number.isSafeInteger(result.edit_revision))
        throw Error('自动保存结果未确认，请刷新产品状态核对。');
      revisionRef.current={timestamp:result.updated_at,revision:result.edit_revision};
      const unchanged=JSON.stringify(paramsRef.current.getDraft())===serialized;
      paramsRef.current.onSaved(result,!unchanged);
      setStatus(unchanged?'saved':'dirty');
      setSavedAt(new Date().toISOString());
    }catch(err:any){
      const message=err?.message||'自动保存失败，当前输入仍保留在页面。';
      if(isEditConflict(err)){
        hasConflict.current=true;setStatus('conflict');setConflict(message);
        void readLatest();
      }else{
        setStatus('error');setError(message);
      }
    }finally{busyRef.current=false;}
  },[readLatest]);

  useEffect(()=>{
    if(params.dirty&&status!=='conflict'&&status!=='saving'&&status!=='error')
      setStatus('dirty');
  },[params.dirty]);
  useEffect(()=>{
    mounted.current=true;
    if(!params.productId||!params.enabled)return;
    const id=params.productId,session_id=sessionRef.current;
    const path='factory/products/'+encodeURIComponent(id)+'/presence';
    let active=true;
    const heartbeat=async()=>{
      try{
        const result=await adminFetch<{success:boolean;others:EditingPeer[]}>
          (path,{method:'POST',body:JSON.stringify({session_id})});
        if(active&&result.success)setPeers(result.others||[]);
      }catch(err:any){if(active)setError('协作提示暂不可用；版本校验仍然有效。');}
    };
    void readLatest().then(result=>{
      if(!result||!active)return;
      const loaded=revisionRef.current;
      if(result.updated_at!==loaded.timestamp||
         result.edit_revision!==loaded.revision){
        hasConflict.current=true;
        setConflict('产品已经被其他会话更新，请先比较服务器版本，再决定如何处理本地更改。');
        setStatus('conflict');
      }
    });
    void heartbeat();
    const heartbeatTimer=setInterval(()=>void heartbeat(),30000);
    const autosaveTimer=setInterval(()=>void autosave(),20000);
    return ()=>{
      active=false;clearInterval(heartbeatTimer);clearInterval(autosaveTimer);
      // Normal unmount cleans presence; a killed tab is naturally expired by D1 at 90s.
      void adminFetch(path,{method:'DELETE',body:JSON.stringify({session_id})}).catch(()=>{});
    };
  },[params.productId,params.enabled,readLatest,autosave]);

  const blurTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const onBlur=useCallback(()=>{
    if(blurTimer.current)clearTimeout(blurTimer.current);
    blurTimer.current=setTimeout(()=>void autosave(),1300);
  },[autosave]);
  useEffect(()=>()=>{if(blurTimer.current)clearTimeout(blurTimer.current);},[]);

  const reloadLatest=useCallback(()=>{
    const data=latest;
    if(!data)return null;
    revisionRef.current={timestamp:data.updated_at,revision:data.edit_revision};
    hasConflict.current=false;setConflict('');setStatus('idle');
    setError('');setSavedAt('');
    return data.product;
  },[latest]);

  const markConflict=useCallback((reason:string)=>{
    hasConflict.current=true;setConflict(reason);setStatus('conflict');
    void readLatest();
  },[readLatest]);

  const pending=(params.dirty&&!savedAt)||status==='dirty';
  return {status,savedAt,error,peers,latest,conflict,loadingLatest,
    pending,busy:busyRef.current,onBlur,autosave,readLatest,reloadLatest,markConflict,
    timestamp:revisionRef.current.timestamp,revision:revisionRef.current.revision,
    displayStatus:status==='saving'?'保存中…':
      status==='saved'&&savedAt?'已自动保存 '+formatClock(savedAt):
      status==='idle'&&savedAt?'上次保存 '+formatClock(savedAt):
      status==='conflict'?'编辑冲突，未覆盖任何资料':
      status==='error'?'自动保存失败，输入仍在页面':
      pending?'尚有未保存修改':'已同步'};
}
