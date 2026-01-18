import React, { useState } from 'react';
import { Edit, Trash2, Search, PackageX, X, CheckSquare, Square, CheckCircle, Ban, Send, Loader2 } from 'lucide-react';
import { ProductVariant, Category } from '../../../types';
import { resolveImage } from '../../../utils/imageResolver';
import { factoryFetch } from '../../../utils/factoryFetch';

interface ProductListProps {
  items: ProductVariant[];
  categories: Category[];
  categoryTitle?: string;
  onEdit: (item: ProductVariant) => void;
  onDelete?: (id: string) => void;
  onBulkStatusChange?: (ids: string[], newStatus: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onRefresh?: () => void;
  onCreate: () => void;
  onBack: () => void;
  lang: 'en' | 'zh';
}

const ProductList: React.FC<ProductListProps> = ({ 
    items, categories, onEdit, onDelete, onBulkStatusChange, onBulkDelete, onRefresh
}) => {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [submittingIds, setSubmittingIds] = useState<string[]>([]);

  const userRole = sessionStorage.getItem("pz_user_role") || "FACTORY";
  const isFactory = userRole === "FACTORY";

  const statusMap: Record<string, { label: string, color: string }> = {
    all: { label: '全部状态', color: '' },
    published: { label: '已发布', color: 'bg-green-100 text-green-700' },
    pending: { label: '待审核', color: 'bg-amber-100 text-amber-700' },
    draft: { label: '草稿', color: 'bg-stone-100 text-stone-500' },
    rejected: { label: '未通过', color: 'bg-red-100 text-red-700' }
  };

  const filteredItems = Array.isArray(items) ? items.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase()) || 
                         (i.code && i.code.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) : [];

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map(i => i.id!).filter(Boolean));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSubmitForReview = async (id: string) => {
      if (!confirm("确定要将此项目提交给管理员审核吗？")) return;
      setSubmittingIds(prev => [...prev, id]);
      try {
          await factoryFetch(`factory/products/${id}/submit`, { method: 'POST' });
          alert("已成功提交审核。");
          if (onRefresh) onRefresh();
      } catch (e: any) {
          alert(`提交失败: ${e.message}`);
      } finally {
          setSubmittingIds(prev => prev.filter(i => i !== id));
      }
  };

  return (
    <div className="animate-fade-in relative">
       {/* 过滤器与搜索 */}
       <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
             <div className="relative group max-w-sm w-full">
                <div className="flex items-center bg-white border border-stone-200 rounded-sm shadow-sm focus-within:border-stone-900 transition-all px-4 py-3">
                    <Search size={16} className="text-stone-400" />
                    <input 
                        type="text" 
                        placeholder="搜索 SKU 或名称..." 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                        className="ml-3 w-full text-xs focus:outline-none font-sans" 
                    />
                </div>
             </div>
             <select 
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-white border border-stone-200 px-4 py-3 text-xs font-bold text-stone-600 outline-none"
             >
                <option value="all">所有状态</option>
                <option value="published">已发布</option>
                <option value="draft">草稿箱</option>
                <option value="pending">待审核</option>
                <option value="rejected">未通过</option>
             </select>
          </div>
          
          <div className="text-xs font-mono text-stone-400 font-bold uppercase tracking-widest">
            找到 {filteredItems.length} 条记录
          </div>
       </div>

       {/* 列表头部 */}
       <div className="bg-stone-100 border border-stone-200 border-b-0 px-6 py-3 flex items-center gap-6">
            <button onClick={toggleSelectAll} className="text-stone-400 hover:text-stone-900 transition-colors">
                {selectedIds.length > 0 && selectedIds.length === filteredItems.length ? <CheckSquare size={18} className="text-safety-700"/> : <Square size={18}/>}
            </button>
            <div className="text-[10px] font-bold uppercase text-stone-500 tracking-widest">注册表摘要</div>
       </div>

       {/* 列表主体 */}
       <div className="bg-white border border-stone-200 shadow-sm rounded-sm">
            <div className="divide-y divide-stone-100">
              {filteredItems.length === 0 ? (
                  <div className="py-32 flex flex-col items-center justify-center text-stone-400">
                      <PackageX size={48} strokeWidth={1} className="mb-4 opacity-20" />
                      <p className="text-xs font-bold">未找到匹配记录。</p>
                  </div>
              ) : (
                filteredItems.map((item) => {
                    const isSelected = selectedIds.includes(item.id!);
                    const isSubmitting = submittingIds.includes(item.id!);
                    const imageUrl = resolveImage(item.images[0]);
                    const category = categories.find(c => c.id === item.category);
                    const statusInfo = statusMap[item.status || 'draft'] || statusMap.draft;
                    
                    return (
                    <div 
                        key={item.id} 
                        className={`p-4 transition-colors flex items-center gap-6 group
                            ${isSelected ? 'bg-safety-50' : 'hover:bg-stone-50'}
                        `}
                    >
                        <button onClick={() => toggleSelect(item.id!)} className="text-stone-300 hover:text-safety-700">
                            {isSelected ? <CheckSquare size={18} className="text-safety-700"/> : <Square size={18}/>}
                        </button>

                        <div className="w-14 h-14 bg-stone-100 flex-shrink-0 border border-stone-200 overflow-hidden relative rounded-sm">
                            {imageUrl ? <img src={imageUrl} alt="" className="w-full h-full object-cover mix-blend-multiply" /> : <div className="w-full h-full flex items-center justify-center text-stone-300 text-[8px]">无图</div>}
                        </div>
                        
                        <div className="flex-grow min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                                <h4 className="font-bold text-stone-900 text-sm truncate">{item.name}</h4>
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border-none ${statusInfo.color}`}>
                                    {statusInfo.label}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 font-mono text-[10px]">
                                <span className="text-stone-400 font-bold">{item.code || "无编号"}</span>
                                <span className="text-stone-300">/</span>
                                <span className="text-stone-500 uppercase tracking-tight">{category?.title || '未指定系列'}</span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            {isFactory && (item.status === 'draft' || item.status === 'rejected') && (
                                <button 
                                    onClick={() => item.id && handleSubmitForReview(item.id)}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 bg-stone-900 text-white px-4 py-2 text-xs font-bold hover:bg-safety-700 transition-colors rounded-sm"
                                >
                                    {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                    提交审核
                                </button>
                            )}
                            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => onEdit(item)} className="p-2 text-stone-400 hover:text-stone-900 hover:bg-white border border-transparent hover:border-stone-200 transition-all rounded-sm"><Edit size={16} /></button>
                                {!isFactory && onDelete && <button onClick={() => item.id && onDelete(item.id)} className="p-2 text-stone-400 hover:text-red-600 hover:bg-white border border-transparent hover:border-stone-200 transition-all rounded-sm"><Trash2 size={16} /></button>}
                            </div>
                        </div>
                    </div>
                    );
                })
              )}
            </div>
       </div>

       {/* 批量操作栏（仅管理员） */}
       {!isFactory && selectedIds.length > 0 && (
           <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] animate-fade-in-up">
               <div className="bg-stone-900 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-8 border border-white/10 backdrop-blur-md">
                   <div className="flex items-center gap-3 pr-8 border-r border-white/10">
                       <span className="text-xs font-mono font-bold text-safety-700 bg-safety-700/10 px-2 py-1 rounded">{selectedIds.length}</span>
                       <span className="text-xs font-bold">已选择项目</span>
                   </div>
                   
                   <div className="flex items-center gap-4">
                       <button 
                            onClick={() => { onBulkStatusChange?.(selectedIds, 'published'); setSelectedIds([]); }}
                            className="flex items-center gap-2 text-xs font-bold text-green-400 hover:text-green-300 transition-colors"
                       >
                           <CheckCircle size={14} /> 批量发布
                       </button>
                       <button 
                            onClick={() => { onBulkStatusChange?.(selectedIds, 'draft'); setSelectedIds([]); }}
                            className="flex items-center gap-2 text-xs font-bold text-stone-400 hover:text-white transition-colors"
                       >
                           <Ban size={14} /> 转为草稿
                       </button>
                       <div className="w-px h-4 bg-white/10"></div>
                       <button 
                            onClick={() => { if(confirm("确定要永久删除选中的项目吗？")) onBulkDelete?.(selectedIds); setSelectedIds([]); }}
                            className="flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-400 transition-colors"
                       >
                           <Trash2 size={14} /> 批量删除
                       </button>
                   </div>
                   
                   <button onClick={() => setSelectedIds([])} className="text-white/40 hover:text-white ml-4">
                       <X size={16} />
                   </button>
               </div>
           </div>
       )}
    </div>
  );
};

export default ProductList;