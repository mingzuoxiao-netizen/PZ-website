import React, { useState } from 'react';
import { ProductVariant } from '../../../types';
import { resolveImage } from '../../../utils/imageResolver';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface ReviewQueueProps {
  products: ProductVariant[];
  onProcess: (id: string, action: 'approve' | 'reject', note?: string) => void;
  lang?: string; 
}

const ReviewQueue: React.FC<ReviewQueueProps> = ({ products, onProcess }) => {
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const txt = { 
      empty: "Queue Cleared", 
      emptyDesc: "All pending submissions have been processed.",
      title: `Pending Audit: ${products.length} Items`,
      sub: "Entries from Factory accounts require validation before publication.",
      submitted: "Awaiting Action",
      rejectReason: "Reason for Rejection",
      confirmReject: "Confirm Rejection",
      cancel: "Abort",
      approve: "Approve & Publish",
      reject: "Reject Submission"
  };

  if (products.length === 0) {
      return (
          <div className="bg-white border border-stone-200 p-24 text-center rounded-sm animate-fade-in">
              <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={40} />
              </div>
              <h3 className="font-serif text-2xl text-stone-900 mb-2">{txt.empty}</h3>
              <p className="text-stone-500 font-light text-sm">{txt.emptyDesc}</p>
          </div>
      );
  }

  return (
    <div className="animate-fade-in">
        <div className="bg-amber-50 border border-amber-200 p-6 mb-8 flex items-start">
            <Clock className="text-amber-700 mt-1 mr-4" size={24} />
            <div>
                <h3 className="font-bold text-amber-900 text-[11px] uppercase tracking-widest mb-1">
                    {txt.title}
                </h3>
                <p className="text-amber-800/70 text-xs">
                    {txt.sub}
                </p>
            </div>
        </div>

        <div className="space-y-8">
            {products.map(product => (
                <div key={product.id} className="bg-white border border-stone-200 shadow-sm flex flex-col md:flex-row overflow-hidden hover:border-stone-900 transition-colors group">
                    <div className="w-full md:w-56 h-56 bg-stone-100 flex-shrink-0 relative overflow-hidden">
                        {product.images?.[0] ? (
                            <img src={resolveImage(product.images[0])} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-300 font-bold uppercase tracking-widest font-mono">NO_PREVIEW_ASSET</div>
                        )}
                    </div>

                    <div className="p-8 flex-grow">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h4 className="font-serif text-2xl text-stone-900">{product.name}</h4>
                                <div className="flex gap-3 mt-2">
                                    <span className="text-[10px] font-bold bg-stone-100 px-2 py-1 rounded text-stone-500 font-mono">SKU: {product.code}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 pt-1 font-mono">{product.category}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded border border-amber-100 animate-pulse">Pending Audit</span>
                                <div className="text-[9px] font-mono text-stone-400 mt-2 uppercase tracking-widest">{txt.submitted}</div>
                            </div>
                        </div>

                        <p className="text-stone-500 text-sm line-clamp-2 mb-8 font-light leading-relaxed">{product.description}</p>

                        {rejectId === product.id ? (
                            <div className="bg-red-50 p-6 border border-red-100 animate-fade-in">
                                <label className="block text-[10px] font-bold text-red-700 mb-3 uppercase tracking-widest">{txt.rejectReason}</label>
                                <textarea 
                                    className="w-full border border-red-200 p-4 text-sm text-stone-900 mb-4 focus:outline-none resize-none h-24 font-sans"
                                    placeholder="Explain technical deficiencies or missing metadata..."
                                    value={rejectNote}
                                    onChange={e => setRejectNote(e.target.value)}
                                />
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => {
                                            if (!rejectNote.trim()) { alert("Rejection reason is required."); return; }
                                            onProcess(product.id || '', 'reject', rejectNote);
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
                                    onClick={() => onProcess(product.id || '', 'approve')}
                                    className="flex items-center bg-stone-900 text-white px-8 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg"
                                >
                                    <CheckCircle size={14} className="mr-2" /> {txt.approve}
                                </button>
                                <button 
                                    onClick={() => setRejectId(product.id || null)}
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
    </div>
  );
};

export default ReviewQueue;