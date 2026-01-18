import React, { useState, useEffect } from 'react';
import { ProductVariant, Category } from '../../../types';
import PZImageManager from './PZImageManager';
import LivePreview from './LivePreview';
import { extractKeyFromUrl } from '../../../utils/imageResolver';
import { adminFetch } from '../../../utils/adminFetch';
import { Save, X, ArrowLeft, Info } from 'lucide-react';

interface ProductFormProps {
  initialData: Partial<ProductVariant>;
  categories: Category[];
  onSave: (data: any) => void;
  onCancel: () => void;
  onUpload: (file: File) => Promise<string>;
  fixedCategoryId?: string;
  userRole: 'ADMIN' | 'FACTORY';
  lang: 'en' | 'zh'; 
}

const ProductForm: React.FC<ProductFormProps> = ({ 
  initialData, categories, onSave, onCancel, onUpload, 
  fixedCategoryId, userRole 
}) => {
  const [formData, setFormData] = useState<Partial<ProductVariant>>(initialData);
  const [submitting, setSubmitting] = useState(false);

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
      } catch (e) { console.warn("资源删除失败", e); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    if (!formData.name) { alert("产品名称为必填项"); setSubmitting(false); return; }
    
    let finalStatus = formData.status || 'draft';
    // 工厂账号提交时，强制进入待审核状态
    if (userRole === 'FACTORY' && (finalStatus === 'published' || finalStatus === 'draft')) finalStatus = 'pending';

    onSave({
        ...formData,
        status: finalStatus,
        is_published: finalStatus === 'published' ? 1 : 0
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-fade-in">
       <div className="lg:col-span-2">
          {/* 工厂角色提示 */}
          {userRole === 'FACTORY' && (
              <div className="bg-amber-50 border border-amber-200 p-4 mb-6 rounded-sm flex items-start gap-3">
                  <Info size={18} className="text-amber-700 mt-0.5" />
                  <div className="text-xs text-amber-800 leading-relaxed">
                      <p className="font-bold mb-1">正在以工厂身份录入</p>
                      <p>您保存的所有条目将自动进入 <span className="font-bold underline">“待审核”</span> 状态。管理员批准后，产品才会出现在公共展示页中。</p>
                  </div>
              </div>
          )}

          <div className="bg-white p-8 border border-stone-200 shadow-sm mb-8 rounded-sm">
             <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 gap-8">
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-stone-400 mb-3 tracking-widest">1. 分类归属</label>
                        <select 
                            value={formData.category || ''} 
                            onChange={e => handleChange('category', e.target.value)} 
                            disabled={!!fixedCategoryId} 
                            className="w-full bg-stone-50 border border-stone-200 p-4 text-sm font-bold focus:border-stone-900 outline-none transition-colors disabled:bg-stone-100 disabled:text-stone-400"
                        >
                            <option value="">请选择生产系列...</option>
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
                                placeholder="产品名称 (例如: Zen Solid Ash Desk)" 
                            />
                            <textarea 
                                rows={4} 
                                value={formData.description || ''} 
                                onChange={e => handleChange('description', e.target.value)} 
                                className="w-full border border-stone-200 p-4 text-sm outline-none focus:border-safety-700 resize-none" 
                                placeholder="技术细节、生产说明或设计特点..." 
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-stone-50 p-6 border border-stone-100 grid grid-cols-1 md:grid-cols-2 gap-6 rounded-sm">
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-stone-400 mb-2">主材材质</label>
                        <input type="text" value={formData.material || ''} onChange={e => handleChange('material', e.target.value)} className="w-full bg-white border border-stone-200 p-3 text-sm focus:border-stone-900 outline-none" placeholder="例如：北美黑胡桃木" />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-stone-400 mb-2">出厂 SKU 编号</label>
                        <input type="text" value={formData.code || ''} onChange={e => handleChange('code', e.target.value)} className="w-full bg-white border border-stone-200 p-3 text-sm font-mono uppercase focus:border-stone-900 outline-none" placeholder="PZ-XXX-000" />
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] uppercase font-bold text-stone-400 mb-3 tracking-widest">3. 媒体资源</label>
                    <PZImageManager 
                        label="产品展示图"
                        images={formData.images || []}
                        onUpdate={(imgs) => handleChange('images', imgs)}
                        onDelete={handleCloudDelete}
                        onUpload={onUpload}
                        onError={alert}
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-stone-100">
                    <button 
                        type="button" 
                        onClick={onCancel} 
                        className="flex-1 px-8 py-4 border border-stone-200 text-[10px] font-bold uppercase tracking-widest hover:bg-stone-50 flex items-center justify-center gap-2"
                    >
                        <ArrowLeft size={14} /> 返回列表
                    </button>
                    <button 
                        type="submit" 
                        disabled={submitting} 
                        className="flex-[2] bg-stone-900 text-white font-bold uppercase tracking-[0.2em] py-4 hover:bg-safety-700 transition-colors flex items-center justify-center gap-2 shadow-lg"
                    >
                        {submitting ? "正在提交..." : (
                            <>
                                <Save size={16} /> 
                                {userRole === 'ADMIN' ? "保存并同步" : "提交生产审核"}
                            </>
                        )}
                    </button>
                </div>
             </form>
          </div>
       </div>
       <div className="lg:col-span-1">
          <div className="sticky top-24">
              <div className="bg-stone-900 text-white px-4 py-2 text-[9px] font-bold uppercase tracking-widest rounded-t-sm inline-block">
                  前端渲染预览
              </div>
              <LivePreview formData={formData} />
          </div>
       </div>
    </div>
  );
};

export default ProductForm;