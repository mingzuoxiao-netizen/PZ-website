
import React, { useState } from 'react';
import { ProductVariant } from '../../../types';
import { getAssetUrl } from '../../../utils/getAssetUrl';
import { CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';

interface ReviewQueueProps {
  products: ProductVariant[];
  onProcess: (id: string, action: 'approve' | 'reject', note?: string) => void;
}

const ReviewQueue: React.FC<ReviewQueueProps> = ({ products, onProcess }) => {
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  if (products.length === 0) {
      return (
          <div className="bg-white border border-stone-200 p-12 text-center rounded-sm">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} />
              </div>
              <h3 className="font-serif text-xl text-stone-900 mb-2">All Caught Up</h3>
              <p className="text-stone-500">No products are currently pending review.</p>
          </div>
      );
  }

  return (
    <div className="animate-fade-in">
        <div className="bg-amber-50 border border-amber-200 p-6 mb-8 flex items-start">
            <Clock className="text-amber-700 mt-1 mr-4" size={24} />
            <div>
                <h3 className="font-bold text-amber-900 uppercase tracking-widest text-sm mb-1">
                    Pending Review: {products.length} Items
                </h3>
                <p className="text-amber-800/70 text-sm">
                    Items submitted by factory accounts require approval before going live.
                </p>
            </div>
        </div>

        <div className="space-y-6">
            {products.map(product => (
                <div key={product.id} className="bg-white border border-stone-200 shadow-sm flex flex-col md:flex-row overflow-hidden">
                    {/* Image Preview */}
                    <div className="w-full md:w-48 h-48 bg-stone-100 flex-shrink-0 relative">
                        {product.images?.[0] ? (
                            <img src={getAssetUrl(product.images[0])} className="w-full h-full object-cover" alt="" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-stone-400">No Image</div>
                        )}
                    </div>

                    {/* Details */}
                    <div className="p-6 flex-grow">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-serif text-xl text-stone-900">{product.name}</h4>
                                <div className="flex gap-3 mt-2">
                                    <span className="text-xs font-bold bg-stone-100 px-2 py-1 rounded text-stone-500">{product.code}</span>
                                    <span className="text-xs font-bold uppercase tracking-widest text-stone-400 pt-1">{product.category}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">Pending Review</span>
                                <div className="text-[10px] text-stone-400 mt-1">Submitted Today</div>
                            </div>
                        </div>

                        <p className="text-stone-500 text-sm line-clamp-2 mb-6">{product.description}</p>

                        {/* Action Area */}
                        {rejectId === product.id ? (
                            <div className="bg-red-50 p-4 border border-red-100 animate-fade-in">
                                <label className="block text-xs font-bold text-red-700 uppercase mb-2">Reason for Rejection</label>
                                <textarea 
                                    className="w-full border border-red-200 p-2 text-sm text-stone-900 mb-2 focus:outline-none"
                                    placeholder="e.g. Missing dimensions, wrong material..."
                                    value={rejectNote}
                                    onChange={e => setRejectNote(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => {
                                            onProcess(product.id, 'reject', rejectNote);
                                            setRejectId(null);
                                            setRejectNote("");
                                        }}
                                        className="bg-red-600 text-white px-4 py-2 text-xs font-bold uppercase hover:bg-red-700"
                                    >
                                        Confirm Reject
                                    </button>
                                    <button 
                                        onClick={() => setRejectId(null)}
                                        className="bg-white text-stone-500 px-4 py-2 text-xs font-bold uppercase border border-stone-200 hover:bg-stone-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-4 pt-4 border-t border-stone-100">
                                <button 
                                    onClick={() => onProcess(product.id, 'approve')}
                                    className="flex items-center bg-green-600 text-white px-6 py-2 text-xs font-bold uppercase tracking-widest hover:bg-green-700 transition-colors shadow-sm"
                                >
                                    <CheckCircle size={14} className="mr-2" /> Approve & Publish
                                </button>
                                <button 
                                    onClick={() => setRejectId(product.id)}
                                    className="flex items-center bg-white text-red-600 border border-red-200 px-6 py-2 text-xs font-bold uppercase tracking-widest hover:bg-red-50 transition-colors"
                                >
                                    <XCircle size={14} className="mr-2" /> Reject
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
