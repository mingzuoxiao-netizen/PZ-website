import React, { useState, useEffect } from 'react';
import { ProductVariant, Category } from '../../../types';
import PZImageManager from './PZImageManager';
import LivePreview from './LivePreview';
import { extractKeyFromUrl } from '../../../utils/imageResolver';
import { adminFetch } from '../../../utils/adminFetch';
import { Save, X, ArrowLeft, Info, Send, Loader2 } from 'lucide-react';

interface ProductFormProps {
  initialData: Partial<ProductVariant>;
  categories: Category[];
  onSave: (data: any) => void;
  onSubmit?: (id: string) => Promise<void>;
  onCancel: () => void;
  onUpload: (file: File) => Promise<string>;
  fixedCategoryId?: string;
  userRole: 'ADMIN' | 'FACTORY';
  lang: 'en' | 'zh'; 
}

const ProductForm: React.FC<ProductFormProps> = ({ 
  initialData, categories, onSave, onSubmit, onCancel, onUpload, 
  fixedCategoryId, userRole 
}) => {
  const [formData, setFormData] = useState<Partial<ProductVariant>>(initialData);
  const [submitting, setSubmitting] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);

  useEffect(() => {
    if (fixedCategoryId && !initialData.id) {
        setFormData(prev => ({ ...prev, category: fixedCategoryId }));
    }
  }, [fixedCategoryId, initialData.id]);

  const handleChange = (field: keyof ProductVariant, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCloudDelete = async (url: string) => {
      const key = extractKeyFromUrl(url);
      if (!key) return;
      try {
          await adminFetch('admin/delete-image', { method: 'POST', body: JSON.stringify({ key }) });
      } catch (e) { console.warn("资源清理失败", e); }
  };

  const handleLocalSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    if (!formData.name) { alert("必须填写产品名称。"); setSubmitting(false); return; }
    
    // 权限逻辑：
    // 工厂端手动保存始终为草稿。
    let finalStatus = formData.status || 'draft';
    if (userRole === 'FACTORY') {
        finalStatus = 'draft';
    }

    onSave({
        ...formData,
        status: finalStatus,
        is_published: finalStatus === 'published' ? 1 : 0
    });
  };

  const handlePromote = async () => {
      if (!initialData.id || !onSubmit) return;
      if (!confirm("确认将此条目提交至总库审计吗？")) return;
      setIsPromoting(true);
      try {
          await onSubmit(initialData.id);
      } catch (e) {
          // 由父组件处理
      } finally {
          setIsPromoting(false);
      }
  };

  const canPromote = userRole === 'FACTORY' && initialData.id && (formData.status === 'draft' || formData.status === 'rejected');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-fade-in">
       <div className="lg:col-span-2">
          {userRole === 'FACTORY' && (
              <div className="bg-stone-900 border border-stone-800 p-6 mb-6 rounded-sm flex items-start gap-4 shadow-xl">
                  <Info size={20} className="text-safety-700 mt-0.5" />
                  <div className="text-xs text-stone-300 leading-relaxed">
                      <p className="font-bold text-white mb-1 uppercase tracking-widest">操作指令</p>
                      <p>在准备期间，请先保存为 <span className="text-safety-700 font-bold underline">草稿</span>。技术数据完整后，使用 <span className="font-bold text-white underline">提交审核</span> 命令通知管理员。</p>
                  </div>
              </div>
          )}

          <div className="bg-white p-8 border border-stone-200 shadow-sm mb-8 rounded-sm">
             <form onSubmit={handleLocalSave} className="space-y-8">
                <div className="grid grid-cols-1 gap-8">
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-stone-400 mb-3 tracking-widest">1. 归属生产系列</label>
                        <select 
                            value={formData.category || ''} 
                            onChange={e => handleChange('category', e.target.value)} 
                            disabled={!!fixedCategoryId} 
                            className="w-full bg-stone-50 border border-stone-200 p-4 text-sm font-bold focus:border-stone-900 outline-none transition-colors"
                        >
                            <option value="">请选择分类...</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] uppercase font-bold text-stone-400 mb-3 tracking-widest">2. 核心信息</label>
                        <div className="space-y-4">
                            <input 
                                type="text" 
                                value={formData.name || ''} 
                                onChange={e => handleChange('name', e.target.value)} 
                                className="w-full border border-stone-200 p-4 font-serif text-lg outline-none focus:border-safety-700" 
                                placeholder="产品名称 (例如：禅意实木白蜡木桌)" 
                            />
                            <textarea 
                                rows={4} 
                                value={formData.description || ''} 
                                onChange={e => handleChange('description', e.target.value)} 
                                className="w-full border border-stone-200 p-4 text-sm outline-none focus:border-safety-700 resize-none" 
                                placeholder="技术规格、生产笔记或设计属性..." 
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-stone-50 p-6 border border-stone-100 grid grid-cols-1 md:grid-cols-2 gap-6 rounded-sm">
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-stone-400 mb-2">主材类型</label>
                        <input type="text" value={formData.material || ''} onChange={e => handleChange('material', e.target.value)} className="w-full bg-white border border-stone-200 p-3 text-sm focus:border-stone-900 outline-none" placeholder="例如：北美黑胡桃" />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-stone-400 mb-2">工厂 SKU 编号</label>
                        <input type="text" value={formData.code || ''} onChange={e => handleChange('code', e.target.value)} className="w-full bg-white border border-stone-200 p-3 text-sm font-mono uppercase focus:border-stone-900 outline-none" placeholder="PZ-XXX-000" />
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] uppercase font-bold text-stone-400 mb-3 tracking-widest">3. 媒体资产</label>
                    <PZImageManager 
                        label="产品图片"
                        images={formData.images || []}
                        onUpdate={(imgs) => handleChange('images', imgs)}
                        onDelete={handleCloudDelete}
                        onUpload={onUpload}
                        onError={alert}
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-stone-100">
                    <button type="button" onClick={onCancel} className="flex-1 px-8 py-4 border border-stone-200 text-[10px] font-bold uppercase tracking-widest hover:bg-stone-50 flex items-center justify-center gap-2">
                        <ArrowLeft size={14} /> 放弃
                    </button>
                    
                    <button type="submit" disabled={submitting || isPromoting} className="flex-1 bg-white border border-stone-900 text-stone-900 font-bold uppercase tracking-[0.2em] py-4 hover:bg-stone-900 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm">
                        {submitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        保存草稿
                    </button>

                    {canPromote && (
                        <button 
                            type="button" 
                            onClick={handlePromote}
                            disabled={submitting || isPromoting} 
                            className="flex-1 bg-stone-900 text-white font-bold uppercase tracking-[0.2em] py-4 hover:bg-safety-700 transition-colors flex items-center justify-center gap-2 shadow-lg"
                        >
                            {isPromoting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                            提交审核
                        </button>
                    )}
                </div>
             </form>
          </div>
       </div>
       <div className="lg:col-span-1">
          <div className="sticky top-24">
              <div className="bg-stone-900 text-white px-4 py-2 text-[9px] font-bold uppercase tracking-widest rounded-t-sm inline-block">档案快照预检</div>
              <LivePreview formData={formData} />
          </div>
       </div>
    </div>
  );
};

export default ProductForm;
