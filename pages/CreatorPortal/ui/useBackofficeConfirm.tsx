import React,{useCallback,useEffect,useRef,useState} from 'react';
import {ConfirmDialog} from './BackofficeComponents';

type Confirmation={title:string;description:string;danger?:boolean;requiredText?:string;confirmLabel?:string};

/** Promise-based UI confirmation. No browser-native confirm or hidden global handler. */
export function useBackofficeConfirm(){
  const [pending,setPending]=useState<Confirmation|null>(null);
  const settle=useRef<((answer:boolean)=>void)|null>(null);
  useEffect(()=>()=>{settle.current?.(false);settle.current=null;},[]);
  const ask=useCallback((options:Confirmation)=>new Promise<boolean>(resolve=>{
    settle.current?.(false);
    settle.current=resolve;
    setPending(options);
  }),[]);
  const close=useCallback((answer:boolean)=>{
    settle.current?.(answer);
    settle.current=null;
    setPending(null);
  },[]);
  const confirmationDialog=<ConfirmDialog open={!!pending} title={pending?.title||''}
    description={pending?.description||''} danger={pending?.danger}
    requiredText={pending?.requiredText} confirmLabel={pending?.confirmLabel}
    onConfirm={()=>close(true)} onCancel={()=>close(false)}/>;
  return {ask,confirmationDialog};
}
