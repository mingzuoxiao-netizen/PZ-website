import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, CheckCircle, AlertCircle, Save, Layers } from 'lucide-react';
import { Category } from '../../../types';
import { resolveImage } from '../../../utils/imageResolver';

interface BatchCreatorProps {
  categories: Category[];
  onSave: (products: any[]) => Promise<void>;
  onCancel: () => void;
  onUpload: (file: File) => Promise<string>;
}

const BatchCreator: React.FC<BatchCreatorProps> = ({ categories, onSave, onCancel, onUpload }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [files, setFiles] = useState<{ file: File; status: 'idle' | 'uploading' | 'success' | 'error'; url?: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files).map(f => ({ file: f, status: 'idle' as const }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const startBatchInduction = async () => {
    if (!selectedCategory) { alert("Please select a target category first."); return; }
    if (files.length === 0) return;

    setIsProcessing(true);
    const uploadedProducts = [];

    for (let i = 0; i < files.length; i++) {
      const item = files[i];
      if (item.status === 'success') continue;

      try {
        setFiles(prev => {
          const next = [...prev];
          next[i].status = 'uploading';
          return next;
        });

        const url = await onUpload(item.file);
        
        setFiles(prev => {
          const next = [...prev];
          next[i].status = 'success';
          next[i].url = url;
          return next;
        });

        // ✅ Batch creates as 'draft'
        uploadedProducts.push({
          name: item.file.name.replace(/\.[^/.]+$/, ""),
          category: selectedCategory,
          images: [url],
          status: 'draft',
          is_published: 0
        });

      } catch (e) {
        setFiles(prev => {
          const next = [...prev];
          next[i].status = 'error';
          return next;
        });
      }
    }

    if (uploadedProducts.length > 0) {
        await onSave(uploadedProducts);
    }
    setIsProcessing(false);
  };

  return (
    <div className="bg-white border border-stone-200 shadow-2xl animate-fade-in-up max-w-5xl mx-auto rounded-sm overflow-hidden">
      <div className="bg-stone-900 p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
              <Layers size={20} className="text-safety-700" />
              <h3 className="text-xs font-bold uppercase tracking-[0.2em]">High-Velocity Batch Induction</h3>
          </div>
          <button onClick={onCancel} className="text-stone-500 hover:text-white transition-colors"><X size={20} /></button>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1 space-y-6">
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">1. Target Series</label>
                    <select 
                        value={selectedCategory}
                        onChange={e => setSelectedCategory(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 p-3 text-xs font-bold focus:border-stone-900 outline-none"
                    >
                        <option value="">Select Category...</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">2. Upload Source</label>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-8 border-2 border-dashed border-stone-200 rounded-sm hover:border-safety-700 hover:bg-stone-50 transition-all flex flex-col items-center justify-center gap-2"
                    >
                        <Upload size={24} className="text-stone-300" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Select Images</span>
                    </button>
                    <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                </div>

                <div className="pt-6 border-t border-stone-100">
                    <button 
                        disabled={isProcessing || files.length === 0}
                        onClick={startBatchInduction}
                        className="w-full bg-stone-900 text-white py-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-safety-700 disabled:bg-stone-100 disabled:text-stone-300 transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                        {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Process Batch
                    </button>
                </div>
            </div>

            <div className="md:col-span-3 border-l border-stone-100 pl-8">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Queue: {files.length} Assets</h4>
                    {files.length > 0 && <button onClick={() => setFiles([])} className="text-[10px] font-bold text-red-500 uppercase">Clear All</button>}
                </div>

                {files.length === 0 ? (
                    <div className="h-64 border border-dashed border-stone-100 flex flex-col items-center justify-center text-stone-300 gap-3">
                        <ImageIcon size={48} className="opacity-10" />
                        <p className="text-[10px] font-mono uppercase tracking-widest">Queue Empty</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {files.map((item, idx) => (
                            <div key={idx} className="relative aspect-square bg-stone-50 border border-stone-200 group">
                                <img 
                                    src={URL.createObjectURL(item.file)} 
                                    className={`w-full h-full object-cover ${item.status === 'uploading' ? 'opacity-30' : ''}`} 
                                    alt="" 
                                />
                                {item.status === 'uploading' && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white/20">
                                        <Loader2 size={16} className="animate-spin text-stone-900" />
                                    </div>
                                )}
                                {item.status === 'success' && (
                                    <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full p-0.5">
                                        <CheckCircle size={10} />
                                    </div>
                                )}
                                {item.status === 'error' && (
                                    <div className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5">
                                        <AlertCircle size={10} />
                                    </div>
                                )}
                                <button 
                                    onClick={() => removeFile(idx)}
                                    className="absolute inset-0 bg-red-600/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="mt-6 p-4 bg-amber-50 text-[10px] text-amber-700 leading-relaxed rounded-sm border border-amber-100">
                    <p className="font-bold mb-1 uppercase tracking-widest">Efficiency Tip:</p>
                    <p>Filenames will automatically be used as Product Names. You can edit them later in the Master Inventory.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default BatchCreator;