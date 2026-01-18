import React, { useRef, useState } from 'react';
import { Upload, X, Loader2, Star, ArrowLeft, ArrowRight, RefreshCw, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { processImage } from '../../../utils/imageHelpers';
import { resolveImage } from '../../../utils/imageResolver';

interface PZImageManagerProps {
  images: string[];
  onUpdate: (images: string[]) => void;
  onError: (msg: string) => void;
  onUpload: (file: File) => Promise<string>;
  onDelete?: (url: string) => Promise<void>; 
  label?: string;
  maxImages?: number;
  className?: string;
  aspectRatio?: number; 
  accept?: string; 
}

interface FileStatus {
    id: string;
    name: string;
    status: 'pending' | 'uploading' | 'success' | 'error';
    errorMsg?: string;
}

const PZImageManager: React.FC<PZImageManagerProps> = ({
  images = [], onUpdate, onError, onUpload, onDelete, label, maxImages = Infinity, className, aspectRatio, accept = "image/*"
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<FileStatus[]>([]);
  const isSingleMode = maxImages === 1;
  const isPdf = (url: string) => url.toLowerCase().endsWith('.pdf');

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    if (!isSingleMode && images.length + fileList.length > maxImages) { onError(`Max ${maxImages} files allowed`); return; }
    setIsUploading(true);
    const newQueue: FileStatus[] = Array.from(fileList).map(f => ({ id: Math.random().toString(36).substring(7), name: f.name, status: 'pending' }));
    setUploadQueue(newQueue);
    const results = await Promise.all(Array.from(fileList).map(async (originalFile, index) => {
        const queueId = newQueue[index].id;
        setUploadQueue(prev => prev.map(item => item.id === queueId ? { ...item, status: 'uploading' } : item));
        let file = originalFile;
        if (aspectRatio && file.type.startsWith('image/')) {
            try { file = await processImage(file, aspectRatio); } catch (e) { console.warn("Auto-crop failed", e); }
        }
        try { 
            const url = await onUpload(file); 
            setUploadQueue(prev => prev.map(item => item.id === queueId ? { ...item, status: 'success' } : item)); 
            return url; 
        } catch (err: any) {
            setUploadQueue(prev => prev.map(item => item.id === queueId ? { ...item, status: 'error', errorMsg: err.message || 'Server error' } : item)); 
            return null;
        }
    }));
    const successfulUrls = results.filter((url): url is string => typeof url === 'string' && url.length > 0);
    if (successfulUrls.length > 0) onUpdate(isSingleMode ? [successfulUrls[0]] : [...images, ...successfulUrls]);
    setIsUploading(false);
    setTimeout(() => { setUploadQueue([]); }, 4000);
  };

  const removeImage = async (index: number) => {
    const urlToRemove = images[index];
    if (onDelete && urlToRemove) {
        if (!confirm("This will permanently delete the image from the cloud. Proceed?")) return;
        try {
            await onDelete(urlToRemove);
        } catch (e) {
            console.warn("Server delete failed, removing from local state anyway.", e);
        }
    }
    onUpdate(images.filter((_, i) => i !== index));
  };

  const moveImage = (index: number, dir: 'left' | 'right') => {
    const newArr = [...images];
    const newIndex = dir === 'left' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newArr.length) return;
    [newArr[index], newArr[newIndex]] = [newArr[newIndex], newArr[index]];
    onUpdate(newArr);
  };

  const setAsMain = (index: number) => {
    if (index === 0) return;
    const list = [...images];
    list.unshift(list.splice(index, 1)[0]);
    onUpdate(list);
  };

  return (
    <div className={className}>
      {label && ( <label className="block text-xs uppercase tracking-wider text-stone-500 font-bold mb-2 flex justify-between"><span>{label} {!isSingleMode && <span className="text-stone-400">({images.length})</span>}</span></label> )}
      <input type="file" accept={accept} multiple={!isSingleMode} ref={fileInputRef} onChange={(e) => handleFiles(e.target.files)} className="hidden" />
      
      {isSingleMode && images.length > 0 ? (
        <div className="relative group border border-stone-200 rounded-sm overflow-hidden h-full bg-stone-50">
          {isPdf(images[0]) ? ( <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-stone-100 text-stone-500"><FileText size={48} className="mb-2 text-amber-700"/><span className="text-xs font-mono break-all px-4 text-center">PDF</span></div>
          ) : ( <img src={resolveImage(images[0])} className="w-full h-full object-cover" alt="" /> )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center space-x-4">
              <button onClick={() => fileInputRef.current?.click()} className="bg-white px-4 py-2 text-[10px] font-bold uppercase hover:bg-amber-200">Replace</button>
              <button onClick={() => removeImage(0)} className="bg-red-600 text-white px-4 py-2 text-[10px] font-bold uppercase hover:bg-red-700">Delete</button>
          </div>
        </div>
      ) : (
        <>
          <div className="border-2 border-dashed border-stone-300 rounded-sm p-6 text-center cursor-pointer hover:border-amber-600 transition" onClick={() => !isUploading && fileInputRef.current?.click()}>
            {isUploading ? <Loader2 size={24} className="animate-spin mx-auto text-amber-600" /> : <Upload size={24} className="mx-auto text-stone-400" />}
            <p className="text-[10px] text-stone-500 font-bold mt-2 uppercase tracking-widest">Select Files</p>
          </div>
          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {images.map((url, idx) => (
                <div key={url + idx} className={`relative aspect-square border-2 rounded-sm overflow-hidden group ${idx === 0 ? 'border-amber-600 shadow-md' : 'border-stone-200'}`}>
                  {isPdf(url) ? <FileText size={32} className="mx-auto mt-8 text-stone-300" /> : <img src={resolveImage(url)} className="w-full h-full object-cover" alt="" />}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition p-2 flex flex-col justify-between">
                    <button onClick={() => removeImage(idx)} className="self-end p-1.5 bg-red-500 text-white rounded hover:bg-red-600"><X size={12} /></button>
                    <div className="flex justify-between items-center">
                        {idx > 0 && <button onClick={() => moveImage(idx, 'left')} className="p-1.5 bg-white rounded hover:bg-amber-400"><ArrowLeft size={12} /></button>}
                        {idx < images.length - 1 && <button onClick={() => moveImage(idx, 'right')} className="p-1.5 bg-white rounded hover:bg-amber-400"><ArrowRight size={12} /></button>}
                        {idx !== 0 && <button onClick={() => setAsMain(idx)} className="p-1.5 bg-stone-200 rounded hover:bg-amber-600 hover:text-white"><Star size={12} /></button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PZImageManager;