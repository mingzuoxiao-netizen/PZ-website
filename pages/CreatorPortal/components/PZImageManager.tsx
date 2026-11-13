import React, { useRef, useState } from 'react';
import { Upload, X, Loader2, Star, ArrowLeft, ArrowRight, Plus } from 'lucide-react';
import { processImage } from '../../../utils/imageHelpers';
import { resolveImage } from '../../../utils/imageResolver';

interface PZImageManagerProps {
  images: string[];
  lang?: 'en' | 'zh';
  onUpdate: (images: string[]) => void;
  onError: (msg: string) => void;
  onUpload: (file: File) => Promise<string>;
  onDelete?: (url: string) => Promise<void>; 
  onSetMain?: (index: number) => void;
  label?: string;
  maxImages?: number;
  className?: string;
  aspectRatio?: number; 
  accept?: string; 
}

const PZImageManager: React.FC<PZImageManagerProps> = ({
  images = [], lang = 'en', onUpdate, onError, onUpload, onDelete, onSetMain, label, maxImages = Infinity, className, aspectRatio, accept = "image/*"
}) => {
  const T = (en: string, zh: string) => lang === 'zh' ? zh : en;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const isSingleMode = maxImages === 1;
  type UploadEntry={id:string;file:File;name:string;status:'pending'|'processing'|'uploading'|'done'|'failed';progress:number;error?:string};
  const [uploads,setUploads]=useState<UploadEntry[]>([]);
  const latestImages=useRef(images);
  latestImages.current=images;
  const nextId=useRef(0);
  const updateEntry=(id:string,patch:Partial<UploadEntry>)=>
    setUploads(prev=>prev.map(entry=>entry.id===id?{...entry,...patch}:entry));
  // The existing image pipeline exposes no byte-level transfer progress.
  // Progress is therefore explicitly a STAGE indicator, not a fake network %.
  const processOne=async(entry:UploadEntry)=>{
    try{
      updateEntry(entry.id,{status:'processing',progress:25,error:undefined});
      let file=entry.file;
      if(aspectRatio&&file.type.startsWith('image/'))
        file=await processImage(file,aspectRatio);
      updateEntry(entry.id,{status:'uploading',progress:65});
      const url=await onUpload(file); // existing authenticated R2 upload path
      if(typeof url!=='string'||!url.trim())throw Error('没有收到图片地址');
      const current=latestImages.current;
      const next=isSingleMode?[url]:[...current,url];
      latestImages.current=next;
      onUpdate(next); // commit successes even when another image fails
      updateEntry(entry.id,{status:'done',progress:100});
    }catch(err:any){
      const message=err?.message||'上传失败';
      updateEntry(entry.id,{status:'failed',progress:0,error:message});
      onError('图片 '+entry.name+' 上传失败：'+message);
    }
  };
  const handleFiles=async(fileList:FileList|null)=>{
    if(!fileList?.length||isUploading)return;
    const files=Array.from(fileList);
    if(!isSingleMode&&latestImages.current.length+files.length>maxImages){
      onError('最多可上传 '+maxImages+' 张图片。');return;
    }
    if(files.some(file=>!file.type.startsWith('image/'))){
      onError('仅接受图片格式（image/*）。');return;
    }
    const batch=files.map(file=>({
      id:'image-'+(++nextId.current),file,name:file.name,
      status:'pending' as const,progress:0
    }));
    setUploads(prev=>[...prev.filter(item=>item.status==='failed'),...batch].slice(-20));
    setIsUploading(true);
    try{
      // Serial by default: preserves source order, avoids cell-network spikes,
      // and prevents partial failures from discarding successful images.
      for(const entry of batch)await processOne(entry);
    }finally{
      setIsUploading(false);
      if(fileInputRef.current)fileInputRef.current.value='';
    }
  };
  const retryFailed=async(entry:UploadEntry)=>{
    if(isUploading)return;
    setIsUploading(true);
    try{await processOne(entry);}finally{setIsUploading(false);}
  };

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeImage = async (index: number) => {
    const urlToRemove = images[index];
    if (onDelete) {
        try { await onDelete(urlToRemove); } catch (e) { console.warn("仅移除图片引用"); }
    } else {
        onUpdate(images.filter((_, i) => i !== index));
    }
  };

  const moveImage = (index: number, dir: 'left' | 'right') => {
    const newArr = [...images];
    const newIndex = dir === 'left' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newArr.length) return;
    [newArr[index], newArr[newIndex]] = [newArr[newIndex], newArr[index]];
    onUpdate(newArr);
  };

  return (
    <div className={`${className} font-sans`}>
      {label && (
        <div className="flex justify-between items-end mb-3">
          <label className="text-[10px] uppercase font-bold text-stone-400 tracking-widest">{label}</label>
          {!isSingleMode && <span className="text-[10px] font-mono text-stone-300">{images.length} / {maxImages === Infinity ? '∞' : maxImages} {T('Images','张')}</span>}
        </div>
      )}

      <div
        role="button"
        tabIndex={isUploading ? -1 : 0}
        aria-label={T('Upload product or website images','上传产品或网站图片')}
        aria-disabled={isUploading}
        onKeyDown={(event) => {
          if (!isUploading && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`
          relative border-2 border-dashed rounded-sm transition-all duration-300 flex flex-col items-center justify-center p-8
          ${isDragging ? 'border-safety-700 bg-safety-50/50' : 'border-stone-200 bg-stone-50 hover:border-stone-400'}
          ${isUploading ? 'pointer-events-none' : 'cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#805036]'}
        `}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input type="file" accept={accept} multiple={!isSingleMode} ref={fileInputRef} onChange={e => { void handleFiles(e.target.files); }} className="hidden" />
        
        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-safety-700" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">{T('Uploading images...','正在上传图片…')}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload size={24} className={isDragging ? 'text-safety-700' : 'text-stone-300'} />
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
              {isDragging ? T('Release to upload','松开即可上传') : T('Drop an image here or choose a file','拖拽图片到此处，或点击选择文件')}
            </p>
          </div>
        )}
      </div>

      {uploads.length>0&&<section aria-label="逐张图片上传状态"
        className="mt-3 space-y-2 rounded border border-stone-200 bg-white p-3">
        <h4 className="text-sm font-semibold">图片上传进度（处理与上传阶段）</h4>
        <p className="text-xs text-stone-500">阶段指示，不是网络传输字节百分比；失败图片可单独重试。</p>
        {uploads.map(item=><div key={item.id} className="flex min-w-0 flex-wrap items-center gap-2 rounded border p-2 text-sm">
          <span className="min-w-0 flex-1 truncate" title={item.name}>{item.name}</span>
          <span role="status" className="text-xs" aria-label={item.name+' 上传进度'}>
            {item.status==='pending'?'等待处理':
             item.status==='processing'?'处理图片中':
             item.status==='uploading'?'上传中':
             item.status==='done'?'上传完成':'上传失败'} · {item.progress}%
          </span>
          {item.status==='failed'&&<button type="button" disabled={isUploading}
            onClick={e=>{e.stopPropagation();void retryFailed(item);}}
            className="min-h-11 rounded border border-red-500 px-3 text-xs font-semibold text-red-800 disabled:opacity-40">
            重试此图
          </button>}
          {item.error&&<p role="alert" className="w-full break-words text-xs text-red-800">{item.error}</p>}
        </div>)}
      </section>}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
          {images.map((url, idx) => (
            <div key={url + idx} className="relative aspect-square bg-white border border-stone-200 group overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <img src={resolveImage(url)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={T('Uploaded image ', '已上传图片 ') + (idx + 1)} />
              <div className="absolute top-2 left-2 flex gap-1">
                {idx === 0 && (
                  <span className="bg-safety-700 text-white text-[8px] font-bold uppercase px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                    <Star size={8} fill="currentColor" /> {T('Primary','主图')}
                  </span>
                )}
              </div>
              <div className="absolute inset-0 bg-stone-900/60 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <div className="flex justify-between items-start">
                   {onSetMain && idx !== 0 ? (
                       <button type="button" onClick={(e) => { e.stopPropagation(); onSetMain(idx); }} className="min-h-11 min-w-11 p-2 bg-safety-700 text-white rounded-sm hover:bg-safety-600 shadow-sm" title="设为主图">
                         <Star size={12} />
                       </button>
                   ) : <div></div>}
                   <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(idx); }} className="min-h-11 min-w-11 p-2 bg-red-600 text-white rounded-sm hover:bg-red-700 shadow-sm" title={T('Remove image','移除图片')} aria-label={T('Remove image','移除图片')}>
                     <X size={12} />
                   </button>
                </div>
                <div className="flex justify-center gap-2">
                  {idx > 0 && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); moveImage(idx, 'left'); }} className="min-h-11 min-w-11 p-2 bg-white/20 hover:bg-white text-white hover:text-stone-900 rounded-sm backdrop-blur-md transition-colors">
                      <ArrowLeft size={14} />
                    </button>
                  )}
                  {idx < images.length - 1 && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); moveImage(idx, 'right'); }} className="p-2 bg-white/20 hover:bg-white text-white hover:text-stone-900 rounded-sm backdrop-blur-md transition-colors">
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {!isSingleMode && images.length < maxImages && (
             <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-11 min-w-11 aspect-square border-2 border-dashed border-stone-200 rounded-sm flex flex-col items-center justify-center text-stone-300 hover:border-stone-400 hover:text-stone-500 transition-all"
             >
                <Plus size={24} />
                <span className="text-[9px] font-bold uppercase mt-2">{T('Add More','继续添加')}</span>
             </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PZImageManager;