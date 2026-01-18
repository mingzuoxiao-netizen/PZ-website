import React, { useState } from 'react';
import { ProductVariant } from '../../../types';
import { resolveImage } from '../../../utils/imageResolver';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface ReviewQueueProps {
  products: ProductVariant[];
  onProcess: (id: string, action: 'approve' | 'reject', note?: string) => void;
  lang?: string; // Kept for compatibility but ignored
}

const ReviewQueue: React.FC<ReviewQueueProps> = ({ products, onProcess }) => {
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const txt = { 
      empty: "Queue Clear", 
      emptyDesc: "All submitted products have been processed.",
      title: `Pending Audit: ${products.length} Items`,
      sub: "Entries from factory accounts require administrative verification.",
      submitted: "Recent Submission",
      rejectReason: "Reason for Rejection",
      confirmReject: "Commit Rejection",
      cancel: "Abort",
      approve: "Approve & Publish",
      reject: "Reject Entry"
  };

  if (products.length === 0) {
      return (
          <div className="bg-white border border-stone-200 p-12 text-center rounded-sm">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} />
              </div>
              <h3 className="font-serif text-xl text-stone-900 mb-2">{txt.empty}</h3>
              <p className="text-stone-500 font-light">{txt.emptyDesc}</p>
          </div>
      );
  }

  return (
    <div className="animate-fade-in">
        <div className="bg-amber-50 border border-amber-200 p-6 mb-8 flex items-start">
            <Clock className="text-amber-700 mt-1 mr-4" size={24} />
            <div>
                <h3 className="font-bold text-amber-900 uppercase tracking-widest text-sm mb-1 font-mono">
                    {txt.title}
                </h3>
                <p className="text-amber-800/70 text-sm">
                    {txt.sub}
                </p>
            </div>
        </div>

        <div className="space-y-6">
            {products.map(product => (
                <div key={product.id} className="bg-white border border-stone-200 shadow-sm flex flex-col md:flex-row overflow-hidden">
                    {/* Image Preview */}
                    <div className="w-full md:w-48 h-48 bg-stone-100 flex-shrink-0 relative">
                        {product.images?.[0] ? (
                            <img src={resolveImage(product.images[0])} className="w-full h-full object-cover" alt="" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-300 font-bold uppercase tracking-widest">No Asset</div>
                        )}
                    </div>

                    {/* Details */}
                    <div className="p-6 flex-grow">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-serif text-xl text-stone-900">{product.name}</h4>
                                <div className="flex gap-3 mt-2">
                                    <span className="text-[10px] font-bold bg-stone-100 px-2 py-1 rounded text-stone-500 font-mono">{product.code}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 pt-1 font-mono">{product.category}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100 font-mono">Awaiting Audit</span>
                                <div className="text-[10px] text-stone-400 mt-1 font-mono">{txt.submitted}</div>
                            </div>
                        </div>

                        <p className="text-stone-500 text-sm line-clamp-2 mb-6 font-light">{product.description}</p>

                        {/* Action Area */}
                        {rejectId === product.id ? (
                            <div className="bg-red-50 p-4 border border-red-100 animate-fade-in">
                                <label className="block text-[10px] font-bold text-red-700 uppercase tracking-widest mb-2 font-mono">{txt.rejectReason}</label>
                                <textarea 
                                    className="w-full border border-red-200 p-2 text-sm text-stone-900 mb-2 focus:outline-none resize-none h-20"
                                    placeholder="Explain why this entry was rejected..."
                                    value={rejectNote}
                                    onChange={e => setRejectNote(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => {
                                            if (!rejectNote.trim()) { alert("Please specify rejection reason."); return; }
                                            onProcess(product.id || '', 'reject', rejectNote);
                                            setRejectId(null);
                                            setRejectNote("");
                                        }}
                                        className="bg-red-600 text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 transition-colors"
                                    >
                                        {txt.confirmReject}
                                    </button>
                                    <button 
                                        onClick={() => setRejectId(null)}
                                        className="bg-white text-stone-500 px-4 py-2 text-[10px] font-bold uppercase tracking-widest border border-stone-200 hover:bg-stone-50 transition-colors"
                                    >
                                        {txt.cancel}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-4 pt-4 border-t border-stone-100">
                                <button 
                                    onClick={() => onProcess(product.id || '', 'approve')}
                                    className="flex items-center bg-green-600 text-white px-6 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-green-700 transition-colors shadow-sm"
                                >
                                    <CheckCircle size={14} className="mr-2" /> {txt.approve}
                                </button>
                                <button 
                                    onClick={() => setRejectId(product.id || null)}
                                    className="flex items-center bg-white text-red-600 border border-red-200 px-6 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 transition-colors"
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