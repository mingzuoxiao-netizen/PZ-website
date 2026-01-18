import React, { useState } from 'react';
import { ProductVariant, CategoryRequest } from '../../../types';
import { resolveImage } from '../../../utils/imageResolver';
import { CheckCircle, XCircle, Clock, Package, LayoutGrid } from 'lucide-react';

interface ReviewQueueProps {
  products: ProductVariant[];
  categoryRequests: CategoryRequest[];
  onProcessProduct: (id: string, action: 'approve' | 'reject', note?: string) => void;
  onProcessCategory: (id: string, action: 'approve' | 'reject', note?: string) => void;
}

const ReviewQueue: React.FC<ReviewQueueProps> = ({ products, categoryRequests, onProcessProduct, onProcessCategory }) => {
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [view, setView] = useState<'products' | 'categories'>('products');

  const txt = { 
      empty: "Queue Cleared", 
      emptyDesc: "All pending submissions have been processed.",
      submitted: "Awaiting Action",
      rejectReason: "Reason for Rejection",
      confirmReject: "Confirm Rejection",
      cancel: "Abort",
      approve: "Approve & Process",
      reject: "Reject Submission"
  };

  const currentItems = view === 'products' ? products : categoryRequests;

  return (
    <div className="animate-fade-in">
        <div className="flex gap-4 mb-8">
            <button 
                onClick={() => setView('products')}
                className={`flex-1 py-4 flex items-center justify-center gap-3 border rounded-sm transition-all font-bold text-[10px] uppercase tracking-widest
                    ${view === 'products' ? 'bg-stone-900 text-white border-stone-900 shadow-lg' : 'bg-white text-stone-400 border-stone-200 hover:border-stone-900'}
                `}
            >
                <Package size={16} /> Product Registry ({products.length})
            </button>
            <button 
                onClick={() => setView('categories')}
                className={`flex-1 py-4 flex items-center justify-center gap-3 border rounded-sm transition-all font-bold text-[10px] uppercase tracking-widest
                    ${view === 'categories' ? 'bg-stone-900 text-white border-stone-900 shadow-lg' : 'bg-white text-stone-400 border-stone-200 hover:border-stone-900'}
                `}
            >
                <LayoutGrid size={16} /> Category Proposals ({categoryRequests.length})
            </button>
        </div>

        {currentItems.length === 0 ? (
            <div className="bg-white border border-stone-200 p-24 text-center rounded-sm animate-fade-in">
                <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={40} />
                </div>
                <h3 className="font-serif text-2xl text-stone-900 mb-2">{txt.empty}</h3>
                <p className="text-stone-500 font-light text-sm">{txt.emptyDesc}</p>
            </div>
        ) : (
            <div className="space-y-8">
                {currentItems.map(item => (
                    <div key={item.id} className="bg-white border border-stone-200 shadow-sm flex flex-col md:flex-row overflow-hidden hover:border-stone-900 transition-colors group">
                        <div className="w-full md:w-56 h-56 bg-stone-100 flex-shrink-0 relative overflow-hidden">
                            {('images' in item ? item.images?.[0] : item.image) ? (
                                <img 
                                    src={resolveImage('images' in item ? item.images[0] : item.image)} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                                    alt="" 
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-300 font-bold uppercase tracking-widest font-mono">NO_PREVIEW_ASSET</div>
                            )}
                        </div>

                        <div className="p-8 flex-grow">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h4 className="font-serif text-2xl text-stone-900">{('name' in item ? item.name : item.title)}</h4>
                                    <div className="flex gap-3 mt-2">
                                        {'code' in item && <span className="text-[10px] font-bold bg-stone-100 px-2 py-1 rounded text-stone-500 font-mono">SKU: {item.code}</span>}
                                        {'subtitle' in item && <span className="text-[10px] font-bold bg-amber-50 px-2 py-1 rounded text-amber-700 font-mono italic">{item.subtitle}</span>}
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 pt-1 font-mono">
                                            {'category' in item ? item.category : 'NEW_CATEGORY'}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded border border-amber-100 animate-pulse">Pending Audit</span>
                                    <div className="text-[9px] font-mono text-stone-400 mt-2 uppercase tracking-widest">{txt.submitted}</div>
                                </div>
                            </div>

                            <p className="text-stone-500 text-sm line-clamp-2 mb-8 font-light leading-relaxed">{item.description}</p>

                            {rejectId === item.id ? (
                                <div className="bg-red-50 p-6 border border-red-100 animate-fade-in">
                                    <label className="block text-[10px] font-bold text-red-700 mb-3 uppercase tracking-widest">{txt.rejectReason}</label>
                                    <textarea 
                                        className="w-full border border-red-200 p-4 text-sm text-stone-900 mb-4 focus:outline-none resize-none h-24 font-sans"
                                        placeholder="Explain deficiencies..."
                                        value={rejectNote}
                                        onChange={e => setRejectNote(e.target.value)}
                                    />
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => {
                                                if (!rejectNote.trim()) { alert("Rejection reason is required."); return; }
                                                view === 'products' ? onProcessProduct(item.id!, 'reject', rejectNote) : onProcessCategory(item.id!, 'reject', rejectNote);
                                                setRejectId(null);
                                                setRejectNote("");
                                            }}
                                            className="bg-red-600 text-white px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 transition-all shadow-md"
                                        >
                                            {txt.confirmReject}
                                        </button>
                                        <button 
                                            onClick={() => setRejectId(null)}
                                            className="bg-white text-stone-500 px-6 py-3 text-[10px] font-bold uppercase tracking-widest border border-stone-200 hover:bg-stone-50 transition-colors"
                                        >
                                            {txt.cancel}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-6 pt-6 border-t border-stone-100">
                                    <button 
                                        onClick={() => view === 'products' ? onProcessProduct(item.id!, 'approve') : onProcessCategory(item.id!, 'approve')}
                                        className="flex items-center bg-stone-900 text-white px-8 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg"
                                    >
                                        <CheckCircle size={14} className="mr-2" /> {txt.approve}
                                    </button>
                                    <button 
                                        onClick={() => setRejectId(item.id || null)}
                                        className="flex items-center bg-white text-red-600 border border-red-200 px-8 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 transition-all"
                                    >
                                        <XCircle size={14} className="mr-2" /> {txt.reject}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};

export default ReviewQueue;