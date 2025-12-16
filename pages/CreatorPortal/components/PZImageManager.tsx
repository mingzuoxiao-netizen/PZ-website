
// ============================================================
//  PZImageManager — Enterprise Image & File Upload Manager
// ============================================================

import React, { useRef, useState } from 'react';
import { Upload, X, Loader2, Star, ArrowLeft, ArrowRight, RefreshCw, Crop, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { processImage } from '../../../utils/imageHelpers';
import { getAssetUrl } from '../../../utils/getAssetUrl';

interface PZImageManagerProps {
  images: string[];
  onUpdate: (images: string[]) => void;
  onError: (msg: string) => void;
  // New Prop: Decoupled Upload Function
  onUpload: (file: File) => Promise<string>;
  // Optional Delete Handler (for cleanup)
  onDelete?: (url: string) => Promise<void>; 
  label?: string;
  maxImages?: number;
  className?: string;
  aspectRatio?: number; // Optional: Enforce aspect ratio (e.g., 4/3) - Images only
  accept?: string; // e.g. "image/*" or "application/pdf"
  allowPhysicalDeletion?: boolean;
}

interface FileStatus {
    id: string;
    name: string;
    status: 'pending' | 'uploading' | 'success' | 'error';
    errorMsg?: string;
}

const PZImageManager: React.FC<PZImageManagerProps> = ({
  images = [],
  onUpdate,
  onError,
  onUpload,
  onDelete,
  label,
  maxImages = Infinity,
  className,
  aspectRatio,
  accept = "image/*",
  allowPhysicalDeletion = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<FileStatus[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const isSingleMode = maxImages === 1;

  const isPdf = (url: string) => url.toLowerCase().endsWith('.pdf');

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return;

    if (!isSingleMode && images.length + fileList.length > maxImages) {
      onError(`Max ${maxImages} files allowed`);
      return;
    }

    setIsUploading(true);

    const newQueue: FileStatus[] = Array.from(fileList).map(f => ({
        id: Math.random().toString(36).substring(7),
        name: f.name,
        status: 'pending'
    }));
    setUploadQueue(newQueue);

    const uploadPromises = Array.from(fileList).map(async (originalFile, index) => {
        const queueId = newQueue[index].id;
        setUploadQueue(prev => prev.map(item => item.id === queueId ? { ...item, status: 'uploading' } : item));

        let file = originalFile;

        // Auto-Crop / Resize
        if (aspectRatio && file.type.startsWith('image/')) {
            try {
                file = await processImage(file, aspectRatio);
            } catch (e) {
                console.warn("Auto-crop failed, using original", e);
            }
        }

        if (file.size > 20 * 1024 * 1024) {
            setUploadQueue(prev => prev.map(item => item.id === queueId ? { ...item, status: 'error', errorMsg: 'File too large (>20MB)' } : item));
            return null;
        }

        try {
            // Use injected upload function
            const url = await onUpload(file);

            setUploadQueue(prev => prev.map(item => item.id === queueId ? { ...item, status: 'success' } : item));
            return url;

        } catch (err: any) {
            console.error('Upload error:', err);
            setUploadQueue(prev => prev.map(item => item.id === queueId ? { ...item, status: 'error', errorMsg: err.message || 'Server error' } : item));
            return null;
        }
    });

    const results = await Promise.all(uploadPromises);
    const successfulUrls = results.filter((url): url is string => typeof url === 'string' && url.length > 0);

    if (successfulUrls.length > 0) {
      let updatedList: string[];
      if (isSingleMode) {
        // Just replace the list, do NOT auto-delete the old one.
        updatedList = [successfulUrls[0]];
      } else {
        updatedList = [...images, ...successfulUrls];
      }
      onUpdate(updatedList);
    }

    setIsUploading(false);
    setTimeout(() => { setUploadQueue([]); }, 4000);
  };

  const removeImage = async (index: number) => {
    const urlToRemove = images[index];
    
    // UI Update First
    const updatedList = images.filter((_, i) => i !== index);
    onUpdate(updatedList);

    // Backend Cleanup (if handler provided)
    if (onDelete && urlToRemove) {
        try {
            await onDelete(urlToRemove);
        } catch (e) {
            console.warn("Server delete failed for", urlToRemove, e);
            // Optionally revert UI here if strict consistency is needed
        }
    }
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
    const item = list.splice(index, 1)[0];
    list.unshift(item);
    onUpdate(list);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-xs uppercase tracking-wider text-stone-500 font-bold mb-2 flex justify-between">
          <span>{label} {!isSingleMode && <span className="text-stone-400">({images.length})</span>}</span>
          {aspectRatio && accept.startsWith('image') && (
              <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded flex items-center">
                  <Crop size={10} className="mr-1"/> Auto-Crop Active
              </span>
          )}
        </label>
      )}

      <input
        type="file"
        accept={accept}
        multiple={!isSingleMode}
        ref={fileInputRef}
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      {uploadQueue.length > 0 && (
          <div className="mb-4 bg-stone-50 border border-stone-200 rounded-sm p-3 max-h-40 overflow-y-auto">
              <p className="text-[10px] font-bold uppercase text-stone-400 mb-2">Upload Queue</p>
              <div className="space-y-2">
                  {uploadQueue.map(item => (
                      <div key={item.id} className="relative overflow-hidden bg-white p-2 rounded shadow-sm border border-stone-100">
                          <div className="flex items-center justify-between text-xs relative z-10">
                              <span className="truncate max-w-[200px] text-stone-600 font-mono">{item.name}</span>
                              <div className="flex items-center">
                                  {item.status === 'uploading' && (
                                      <span className="flex items-center text-amber-600 font-bold text-[10px] uppercase">
                                          <Loader2 size={12} className="animate-spin mr-1"/> Uploading
                                      </span>
                                  )}
                                  {item.status === 'success' && (
                                      <span className="flex items-center text-green-600 font-bold text-[10px] uppercase">
                                          <CheckCircle size={12} className="mr-1"/> Done
                                      </span>
                                  )}
                                  {item.status === 'error' && (
                                      <span className="flex items-center text-red-600 font-bold text-[10px] uppercase">
                                          <AlertTriangle size={12} className="mr-1"/> {item.errorMsg || 'Failed'}
                                      </span>
                                  )}
                                  {item.status === 'pending' && <span className="text-stone-300">...</span>}
                              </div>
                          </div>
                          {item.status === 'uploading' && (
                              <div className="absolute bottom-0 left-0 h-0.5 bg-amber-50 animate-[pulse_1s_ease-in-out_infinite] w-full origin-left"></div>
                          )}
                      </div>
                  ))}
              </div>
          </div>
      )}

      {isSingleMode && images.length > 0 ? (
        <div className="relative group border border-stone-200 rounded-sm overflow-hidden min-h-[100px] h-full bg-stone-50">
          
          {isPdf(images[0]) ? (
             <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-stone-100 text-stone-500">
                <FileText size={48} className="mb-2 text-amber-700"/>
                <span className="text-xs font-mono break-all px-4 text-center">
                    PDF Document
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest mt-2 bg-amber-100 text-amber-800 px-2 py-1 rounded">View PDF</span>
             </div>
          ) : (
             <img src={getAssetUrl(images[0])} className="w-full h-full object-cover" alt="Uploaded" />
          )}

          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center space-x-4">
            <button onClick={() => fileInputRef.current?.click()} className="bg-white px-4 py-2 text-xs font-bold uppercase hover:bg-amber-200">
              <RefreshCw size={14} className="inline-block mr-2" /> Replace
            </button>
            <button onClick={() => removeImage(0)} className="bg-red-600 text-white px-4 py-2 text-xs font-bold uppercase hover:bg-red-700">
              <X size={14} className="inline-block mr-2" /> Remove
            </button>
          </div>

          {isUploading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <Loader2 size={32} className="animate-spin text-[#a16207]" />
            </div>
          )}
        </div>
      ) : (
        <>
          <div
            className={`border-2 border-dashed rounded-sm p-6 text-center cursor-pointer transition ${
              isDragging ? 'border-amber-600 bg-amber-50' : 'border-stone-300 bg-stone-50 hover:border-amber-600'
            }`}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <>
                <Loader2 size={28} className="animate-spin mx-auto text-amber-600" />
                <p className="text-xs mt-2 text-stone-500 font-bold">Processing Files...</p>
              </>
            ) : (
              <>
                <Upload size={28} className="mx-auto text-stone-400" />
                <p className="text-xs text-stone-500 font-bold mt-2">Click or Drag to Upload</p>
                {aspectRatio && accept.startsWith('image') && <p className="text-[10px] text-stone-400 mt-1 italic">Images auto-cropped</p>}
                {!accept.startsWith('image') && <p className="text-[10px] text-stone-400 mt-1 italic">PDF supported</p>}
              </>
            )}
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
              {images.map((url, idx) => (
                <div key={url + idx} className={`relative aspect-square border-2 rounded-sm overflow-hidden group ${idx === 0 ? 'border-amber-600 ring-2 ring-amber-600/30' : 'border-stone-200'}`}>
                  {isPdf(url) ? (
                     <div className="w-full h-full flex flex-col items-center justify-center bg-stone-100 text-stone-500 p-2">
                        <FileText size={32} className="mb-2"/>
                        <span className="text-[9px] font-mono break-all text-center leading-tight">PDF</span>
                     </div>
                  ) : (
                     <img src={getAssetUrl(url)} className="w-full h-full object-cover" alt="Uploaded" />
                  )}
                  {idx === 0 && <div className="absolute top-0 left-0 bg-amber-600 text-white text-[10px] px-2 py-1 uppercase">Main</div>}
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
