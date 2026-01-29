import React, { useRef, useState } from 'react';
import { Upload, X, Loader2, Star, ArrowLeft, ArrowRight, FileText, Image as ImageIcon, Plus } from 'lucide-react';
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

const PZImageManager: React.FC<PZImageManagerProps> = ({
  images = [], onUpdate, onError, onUpload, onDelete, label, maxImages = Infinity, className, aspectRatio, accept = "image/*"
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const isSingleMode = maxImages === 1;

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    if (!isSingleMode && images.length + fileList.length > maxImages) { 
        onError(`Registry Limit: Maximum ${maxImages} assets allowed.`); 
        return; 
    }

    setIsUploading(true);
    try {
        const results = await Promise.all(Array.from(fileList).map(async (originalFile) => {
            let file = originalFile;
            if (aspectRatio && file.type.startsWith('image/')) {
                try { file = await processImage(file, aspectRatio); } catch (e) { console.warn("Auto-crop bypass", e); }
            }
            return await onUpload(file);
        }));

        const successfulUrls = results.filter(Boolean);
        onUpdate(isSingleMode ? [successfulUrls[0]] : [...images, ...successfulUrls]);
    } catch (err: any) {
        onError(`Upload Protocol Error: ${err.message}`);
    } finally {
        setIsUploading(false);
    }
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
        try { await onDelete(urlToRemove); } catch (e) { console.warn("Reference removal only"); }
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

  return (
    <div className={`${className} font-sans`}>
      {label && (
        <div className="flex justify-between items-end mb-3">
          <label className="text-[10px] uppercase font-bold text-stone-400 tracking-widest">{label}</label>
          {!isSingleMode && <span className="text-[10px] font-mono text-stone-300">{images.length} / {maxImages === Infinity ? '∞' : maxImages} Units</span>}
        </div>
      )}

      <div 
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`
          relative border-2 border-dashed rounded-sm transition-all duration-300 flex flex-col items-center justify-center p-8
          ${isDragging ? 'border-safety-700 bg-safety-50/50' : 'border-stone-200 bg-stone-50 hover:border-stone-400'}
          ${isUploading ? 'pointer-events-none' : 'cursor-pointer'}
        `}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input type="file" accept={accept} multiple={!isSingleMode} ref={fileInputRef} onChange={(e) => handleFiles(e.target.files)} className="hidden" />
        
        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-safety-700" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Indexing Assets...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload size={24} className={isDragging ? 'text-safety-700' : 'text-stone-300'} />
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
              {isDragging ? 'Release to Upload' : 'Drag assets or click to browse'}
            </p>
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
          {images.map((url, idx) => (
            <div key={url + idx} className="relative aspect-square bg-white border border-stone-200 group overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <img src={resolveImage(url)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="" />
              
              {/* Status Badges */}
              <div className="absolute top-2 left-2 flex gap-1">
                {idx === 0 && (
                  <span className="bg-safety-700 text-white text-[8px] font-bold uppercase px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                    <Star size={8} fill="currentColor" /> Primary
                  </span>
                )}
              </div>

              {/* Action Overlay */}
              <div className="absolute inset-0 bg-stone-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); removeImage(idx); }} 
                  className="self-end p-1.5 bg-red-600 text-white rounded-sm hover:bg-red-700"
                >
                  <X size={12} />
                </button>
                
                <div className="flex justify-center gap-2">
                  {idx > 0 && (
                    <button onClick={(e) => { e.stopPropagation(); moveImage(idx, 'left'); }} className="p-2 bg-white/20 hover:bg-white text-white hover:text-stone-900 rounded-sm backdrop-blur-md transition-colors">
                      <ArrowLeft size={14} />
                    </button>
                  )}
                  {idx < images.length - 1 && (
                    <button onClick={(e) => { e.stopPropagation(); moveImage(idx, 'right'); }} className="p-2 bg-white/20 hover:bg-white text-white hover:text-stone-900 rounded-sm backdrop-blur-md transition-colors">
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {!isSingleMode && images.length < maxImages && (
             <button 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square border-2 border-dashed border-stone-200 rounded-sm flex flex-col items-center justify-center text-stone-300 hover:border-stone-400 hover:text-stone-500 transition-all"
             >
                <Plus size={24} />
                <span className="text-[9px] font-bold uppercase mt-2">Add More</span>
             </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PZImageManager;