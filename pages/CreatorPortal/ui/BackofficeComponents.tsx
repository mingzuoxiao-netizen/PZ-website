import React from 'react';
import {AlertTriangle,Inbox,Loader2,X} from 'lucide-react';

type Variant='primary'|'secondary'|'danger'|'ghost';
const buttonClasses:Record<Variant,string>={
  primary:'border-[#385575] bg-[#385575] text-white hover:bg-[#29435f]',
  secondary:'border-stone-300 bg-white text-stone-800 hover:bg-stone-50',
  danger:'border-red-700 bg-red-700 text-white hover:bg-red-800',
  ghost:'border-transparent bg-transparent text-stone-800 hover:bg-stone-100'
};
export type BackofficeButtonProps=React.ButtonHTMLAttributes<HTMLButtonElement>&{
  variant?:Variant;size?:'sm'|'md';loading?:boolean;
};
export const Button:React.FC<BackofficeButtonProps>=({
  variant='secondary',size='md',loading=false,className='',disabled,children,...props
})=><button {...props} disabled={disabled||loading}
  className={'inline-flex min-h-11 items-center justify-center gap-2 rounded border font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#385575] disabled:cursor-not-allowed disabled:opacity-50 '+(size==='sm'?'px-3 py-2 text-sm':'px-4 py-2.5 text-sm')+' '+buttonClasses[variant]+' '+className}>
  {loading&&<Loader2 size={16} className="animate-spin" aria-hidden="true"/>}{children}
</button>;

export const FormField:React.FC<{
  label:string;htmlFor?:string;hint?:string;error?:string;children:React.ReactNode;className?:string;
}>=({label,htmlFor,hint,error,children,className=''})=><div className={'space-y-1.5 '+className}>
  <label htmlFor={htmlFor} className="block text-sm font-semibold text-stone-800">{label}</label>
  {children}
  {hint&&<p className="text-sm text-stone-600">{hint}</p>}
  {error&&<p role="alert" className="text-sm text-red-800">{error}</p>}
</div>;

export const EmptyState:React.FC<{
  message:string;icon?:React.ReactNode;action?:React.ReactNode;
}>=({message,icon,action})=><div className="flex flex-col items-center gap-3 rounded border border-stone-200 bg-white px-4 py-10 text-center text-sm text-stone-600">
  {icon||<Inbox size={26} aria-hidden="true"/>}<p>{message}</p>{action}
</div>;

export const ListSkeleton:React.FC<{rows?:number}>=({rows=4})=><div role="status" aria-label="正在加载列表" className="space-y-2" aria-busy="true">
  {Array.from({length:rows},(_,i)=><div key={i} className="h-16 animate-pulse rounded border border-stone-200 bg-stone-100"/>)}
  <span className="sr-only">正在加载列表…</span>
</div>;
export const FormSkeleton:React.FC=()=><div role="status" aria-label="正在加载表单" aria-busy="true" className="space-y-4">
  {[1,2,3].map(i=><div key={i} className="h-14 animate-pulse rounded bg-stone-100"/>)}
</div>;

export const Toast:React.FC<{message:string;variant?:'success'|'error';onClose?:()=>void}>=({message,variant='success',onClose})=>
  <div className={'flex items-start justify-between gap-3 rounded border px-3 py-2 text-sm '+(variant==='error'?'border-red-300 bg-red-50 text-red-900':'border-green-300 bg-green-50 text-green-900')}>
    <p role={variant==='error'?'alert':'status'}>{message}</p>
    {onClose&&<button type="button" aria-label="关闭提示" onClick={onClose} className="rounded focus-visible:outline focus-visible:outline-2"><X size={16}/></button>}
  </div>;

export const ConfirmDialog:React.FC<{
  open:boolean;title:string;description:string;onConfirm:()=>void;onCancel:()=>void;
  confirmLabel?:string;danger?:boolean;requiredText?:string;busy?:boolean;
}>=({open,title,description,onConfirm,onCancel,confirmLabel='确认',danger=false,requiredText,busy=false})=>{
  const [typed,setTyped]=React.useState('');
  React.useEffect(()=>{if(!open)setTyped('');},[open]);
  if(!open)return null;
  return <div role="presentation" className="fixed inset-0 z-[120] flex items-center justify-center bg-stone-950/65 p-4">
    <div role="alertdialog" aria-modal="true" aria-label={title} aria-describedby="pz-confirm-desc"
      className="w-full max-w-md space-y-4 rounded bg-white p-5 shadow-2xl">
      <div className="flex items-center gap-2 text-lg font-semibold text-stone-900">
        {danger&&<AlertTriangle size={19} className="text-red-700"/>}{title}
      </div>
      <p id="pz-confirm-desc" className="text-sm leading-6 text-stone-700">{description}</p>
      {requiredText&&<FormField label={'请输入“'+requiredText+'”以确认'}>
        <input value={typed} onChange={e=>setTyped(e.target.value)} autoFocus
          className="w-full rounded border border-stone-400 p-3 text-sm"/>
      </FormField>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button onClick={onCancel} disabled={busy}>取消</Button>
        <Button variant={danger?'danger':'primary'} disabled={busy||!!requiredText&&typed!==requiredText}
          loading={busy} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </div>
  </div>;
};

export const ListShell:React.FC<{
  label:string;filters?:React.ReactNode;bulkBar?:React.ReactNode;children:React.ReactNode;
  loading?:boolean;empty?:boolean;emptyMessage?:string;
  page?:number;hasMore?:boolean;onPageChange?:(page:number)=>void;
}>=({label,filters,bulkBar,children,loading=false,empty=false,emptyMessage='暂无记录',page,hasMore,onPageChange})=>
  <section aria-label={label} className="min-w-0 space-y-3">
    {filters&&<div className="min-w-0">{filters}</div>}
    {bulkBar}
    {loading?<ListSkeleton/>:empty?<EmptyState message={emptyMessage}/>:children}
    {typeof page==='number'&&onPageChange&&<nav aria-label={label+'分页'} className="flex items-center justify-end gap-2">
      <Button size="sm" disabled={page<=1||loading} onClick={()=>onPageChange(Math.max(1,page-1))}>上一页</Button>
      <span className="text-sm text-stone-700">第 {page} 页</span>
      <Button size="sm" disabled={!hasMore||loading} onClick={()=>onPageChange(page+1)}>下一页</Button>
    </nav>}
  </section>;
