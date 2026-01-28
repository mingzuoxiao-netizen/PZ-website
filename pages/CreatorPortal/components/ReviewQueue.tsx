import React, { useState } from 'react';
import { ProductVariant, CategoryRequest } from '../../../types';
import { resolveImage } from '../../../utils/imageResolver';
import { CheckCircle, XCircle, Package, LayoutGrid, CheckSquare, Square, RefreshCw } from 'lucide-react';

interface ReviewQueueProps {
  products: ProductVariant[];
  categoryRequests: CategoryRequest[];
  onProcessProduct: (id: string, action: 'approve' | 'reject', note?: string) => Promise<void>;
  onProcessCategory: (id: string, action: 'approve' | 'reject', note?: string) => Promise<void>;
  reloadQueue: () => Promise<void>;
}

const ReviewQueue: React.FC<ReviewQueueProps> = ({ products, categoryRequests, onProcessProduct, onProcessCategory, reloadQueue }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [view, setView] = useState<'products' | 'categories'>('products');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isManualLoading, setIsManualLoading] = useState(false);

  const currentItems = view === 'products' ? products : categoryRequests;

  const handleManualRefresh = async () => {
      setIsManualLoading(true);
      await reloadQueue();
      setIsManualLoading(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === currentItems.length) setSelectedIds([]);
    else setSelectedIds(currentItems.map(i => i.id!));
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    const label = view === 'products' ? 'products' : 'category proposals';
    if (!confirm(`Approve all ${selectedIds.length} selected ${label}? This operation is final.`)) return;

    setIsProcessing(true);
    try {
        const processor = view === 'products' ? onProcessProduct : onProcessCategory;
        await Promise.all(selectedIds.map(id => processor(id, 'approve')));
        setSelectedIds([]);
        await reloadQueue();
        alert(`Successfully approved ${selectedIds.length} items.`);
    } catch (e: any) {
        alert("Batch complete. Verify list for any failed items.");
        await reloadQueue();
    } finally {
        setIsProcessing(false);
    }
  };

  const txt = { 
      empty: "Queue Cleared", 
      emptyDesc: "All pending submissions have been processed.",
      submitted: "Awaiting Action",
      rejectReason: "Reason for Rejection",
      confirmReject: "Confirm Rejection",
      cancel: "Abort",
      approve: "Approve & Publish",
      approvePublish: "APPROVE & PUBLISH",
      reject: "Reject Submission"
  };

  return (
    <div className="animate-fade-in relative">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
            <button 
                onClick={() => { setView('products'); setSelectedIds([]); }}
                className={`flex-1 py-4 flex items-center justify-center gap-3 border rounded-sm transition-all font-bold text-[10px] uppercase tracking-widest
                    ${view === 'products' ? 'bg-stone-900 text-white border-stone-900 shadow-lg' : 'bg-white text-stone-400 border-stone-200 hover:border-stone-900'}
                `}
            >
                <Package size={16} /> Pending Products ({products.length})
            </button>
            <button 
                onClick={() => { setView('categories'); setSelectedIds([]); }}
                className={`flex-1 py-4 flex items-center justify-center gap-3 border rounded-sm transition-all font-bold text-[10px] uppercase tracking-widest
                    ${view === 'categories' ? 'bg-stone-900 text-white border-stone-900 shadow-lg' : 'bg-white text-stone-400 border-stone-200 hover:border-stone-900'}
                `}
            >
                <LayoutGrid size={16} /> Category Proposals ({categoryRequests.length})
            </button>
            
            <button 
                onClick={handleManualRefresh}
                disabled={isManualLoading}
                className="bg-white border border-stone-200 text-stone-400 hover:text-stone-900 px-6 py-4 rounded-sm transition-all"
                title="Refresh Queue"
            >
                <RefreshCw size={16} className={isManualLoading ? 'animate-spin' : ''} />
            </button>
        </div>

        {currentItems.length > 0 && (
            <div className="bg-stone-100 border border-stone-200 border-b-0 px-6 py-4 flex items-center justify-between">
                <button onClick={toggleSelectAll} className="text-stone-400 hover:text-stone-900 transition-colors flex items-center gap-2">
                    {selectedIds.length > 0 && selectedIds.length === currentItems.length ? <CheckSquare size={18} className="text-safety-700"/> : <Square size={18}/>}
                    <span className="text-[10px] font-bold uppercase tracking-widest font-mono">Select All ({currentItems.length})</span>
                </button>

                {selectedIds.length > 0 && (
                    <button 
                        disabled={isProcessing}
                        onClick={handleBulkApprove}
                        className="bg-stone-900 text-white px-6 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-green-700 transition-all flex items-center gap-2 rounded-sm"
                    >
                        {isProcessing ? <RefreshCw className="animate-spin" size={14}/> : <CheckCircle size={14}/>}
                        Approve Selected
                    </button>
                )}
            </div>
        )}

        {currentItems.length === 0 ? (
            <div className="bg-white border border-stone-200 p-24 text-center rounded-sm animate-fade-in">
                <CheckCircle size={40} className="mx-auto mb-6 text-green-600" />
                <h3 className="font-serif text-2xl text-stone-900 mb-2">{txt.empty}</h3>
                <p className="text-stone-500 font-light text-sm">{txt.emptyDesc}</p>
                <button 
                    onClick={handleManualRefresh} 
                    className="mt-8 text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 underline flex items-center gap-2 mx-auto"
                >
                    <RefreshCw size={12} className={isManualLoading ? 'animate-spin' : ''} /> Check for new submissions
                </button>
            </div>
        ) : (
            <div className="space-y-4">
                {currentItems.map(item => {
                    const isSelected = selectedIds.includes(item.id!);
                    return (
                        <div 
                            key={item.id} 
                            className={`bg-white border transition-all flex flex-col md:flex-row overflow-hidden group
                                ${isSelected ? 'border-safety-700 shadow-md' : 'border-stone-200 hover:border-stone-400 shadow-sm'}
                            `}
                        >
                            <div className="md:w-12 bg-stone-50 border-r border-stone-100 flex items-center justify-center flex-shrink-0">
                                <button onClick={() => toggleSelect(item.id!)} className="text-stone-300">
                                    {isSelected ? <CheckSquare size={20} className="text-safety-700"/> : <Square size={20}/>}
                                </button>
                            </div>

                            <div className="w-full md:w-48 h-48 bg-stone-100 flex-shrink-0 relative">
                                {('images' in item ? item.images?.[0] : item.image) ? (
                                    <img src={resolveImage('images' in item ? item.images[0] : item.image)} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-300 font-mono">NO_PREVIEW</div>
                                )}
                            </div>

                            <div className="p-6 flex-grow">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="font-serif text-xl text-stone-900">{('name' in item ? item.name : item.title)}</h4>
                                        <div className="flex gap-3 mt-1">
                                            {'code' in item && <span className="text-[9px] font-bold bg-stone-100 px-2 py-0.5 rounded text-stone-500 font-mono">ID: {item.code}</span>}
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400 font-mono pt-0.5">
                                                {'category' in item ? item.category : 'NEW_SERIES'}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-[8px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">Pending Review</span>
                                </div>

                                <p className="text-stone-500 text-xs line-clamp-2 mb-6 font-light">{item.description || 'No technical notes provided.'}</p>

                                {rejectId === item.id ? (
                                    <div className="bg-red-50 p-4 border border-red-100 animate-fade-in rounded-sm">
                                        <textarea 
                                            className="w-full border border-red-200 p-3 text-xs mb-3 focus:outline-none resize-none h-20"
                                            placeholder="Reason for rejection..."
                                            value={rejectNote}
                                            onChange={e => setRejectNote(e.target.value)}
                                        />
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => {
                                                    if (!rejectNote.trim()) { alert("Notes required."); return; }
                                                    view === 'products' ? onProcessProduct(item.id!, 'reject', rejectNote) : onProcessCategory(item.id!, 'reject', rejectNote);
                                                    setRejectId(null); setRejectNote("");
                                                }}
                                                className="bg-red-600 text-white px-4 py-2 text-[9px] font-bold uppercase tracking-widest"
                                            >Confirm Reject</button>
                                            <button onClick={() => setRejectId(null)} className="bg-white text-stone-500 px-4 py-2 text-[9px] font-bold uppercase border border-stone-200">Abort</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-4 pt-4 border-t border-stone-50 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => view === 'products' ? onProcessProduct(item.id!, 'approve') : onProcessCategory(item.id!, 'approve')}
                                            className="flex items-center bg-stone-900 text-white px-5 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-green-700 transition-all"
                                        >
                                            <CheckCircle size={12} className="mr-2" /> {view === 'products' ? txt.approve : txt.approvePublish}
                                        </button>
                                        <button 
                                            onClick={() => setRejectId(item.id || null)}
                                            className="flex items-center bg-white text-red-600 border border-red-200 px-5 py-2 text-[10px] font-bold uppercase tracking-widest"
                                        >
                                            <XCircle size={12} className="mr-2" /> Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
    </div>
  );
};

export default ReviewQueue;