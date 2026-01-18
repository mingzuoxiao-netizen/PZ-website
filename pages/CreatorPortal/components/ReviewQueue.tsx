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
      empty: "队列已清空", 
      emptyDesc: "所有提交的产品已处理完毕。",
      title: `待审核项：${products.length} 个`,
      sub: "来自工厂账号的记录需要管理员验证后方可发布。",
      submitted: "待审核申请",
      rejectReason: "拒绝原因",
      confirmReject: "确认拒绝",
      cancel: "取消",
      approve: "批准并发布",
      reject: "驳回申请"
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
                <h3 className="font-bold text-amber-900 text-sm mb-1">
                    {txt.title}
                </h3>
                <p className="text-amber-800/70 text-xs">
                    {txt.sub}
                </p>
            </div>
        </div>

        <div className="space-y-6">
            {products.map(product => (
                <div key={product.id} className="bg-white border border-stone-200 shadow-sm flex flex-col md:flex-row overflow-hidden">
                    {/* 预览图 */}
                    <div className="w-full md:w-48 h-48 bg-stone-100 flex-shrink-0 relative">
                        {product.images?.[0] ? (
                            <img src={resolveImage(product.images[0])} className="w-full h-full object-cover" alt="" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-300 font-bold uppercase tracking-widest">无预览资源</div>
                        )}
                    </div>

                    {/* 详情 */}
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
                                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">待审核中</span>
                                <div className="text-[10px] text-stone-400 mt-1">{txt.submitted}</div>
                            </div>
                        </div>

                        <p className="text-stone-500 text-sm line-clamp-2 mb-6 font-light">{product.description}</p>

                        {/* 操作区 */}
                        {rejectId === product.id ? (
                            <div className="bg-red-50 p-4 border border-red-100 animate-fade-in">
                                <label className="block text-xs font-bold text-red-700 mb-2">{txt.rejectReason}</label>
                                <textarea 
                                    className="w-full border border-red-200 p-2 text-sm text-stone-900 mb-2 focus:outline-none resize-none h-20"
                                    placeholder="请说明驳回此条目的原因..."
                                    value={rejectNote}
                                    onChange={e => setRejectNote(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => {
                                            if (!rejectNote.trim()) { alert("请指定拒绝原因。"); return; }
                                            onProcess(product.id || '', 'reject', rejectNote);
                                            setRejectId(null);
                                            setRejectNote("");
                                        }}
                                        className="bg-red-600 text-white px-4 py-2 text-xs font-bold hover:bg-red-700 transition-colors"
                                    >
                                        {txt.confirmReject}
                                    </button>
                                    <button 
                                        onClick={() => setRejectId(null)}
                                        className="bg-white text-stone-500 px-4 py-2 text-xs font-bold border border-stone-200 hover:bg-stone-50 transition-colors"
                                    >
                                        {txt.cancel}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-4 pt-4 border-t border-stone-100">
                                <button 
                                    onClick={() => onProcess(product.id || '', 'approve')}
                                    className="flex items-center bg-green-600 text-white px-6 py-2 text-xs font-bold hover:bg-green-700 transition-colors shadow-sm"
                                >
                                    <CheckCircle size={14} className="mr-2" /> {txt.approve}
                                </button>
                                <button 
                                    onClick={() => setRejectId(product.id || null)}
                                    className="flex items-center bg-white text-red-600 border border-red-200 px-6 py-2 text-xs font-bold hover:bg-red-50 transition-colors"
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