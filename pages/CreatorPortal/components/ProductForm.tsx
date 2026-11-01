import React, { useState, useEffect } from 'react';
import { ProductVariant, Category, ProductionSite } from '../../../types';
import PZImageManager from './PZImageManager';
import LivePreview from './LivePreview';
import { useProductImageActions } from '../../../hooks/useProductImageActions';
import { Save, ArrowLeft, Info, Send, Loader2, Database, ClipboardList } from 'lucide-react';

interface ProductFormProps {
  initialData: Partial<ProductVariant>;
  categories: Category[];
  onSave: (data: any) => void | Promise<void>;
  onSubmit?: (id: string) => Promise<void>;
  onCancel: () => void;
  onUpload?: (file: File) => Promise<string>; 
  fixedCategoryId?: string;
  userRole: 'ADMIN' | 'FACTORY';
  lang: 'en' | 'zh'; 
}

const ProductForm: React.FC<ProductFormProps> = ({ 
  initialData, categories, onSave, onSubmit, onCancel, 
  fixedCategoryId, userRole, lang = "en"
}) => {
  const T = (en: string, zh: string) => lang === 'zh' ? zh : en;
  const [formData, setFormData] = useState<Partial<ProductVariant>>(initialData);
  const [submitting, setSubmitting] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);

  const { removeImage, reorderImages, setMainImage, uploadImage } = useProductImageActions({
      productId: formData.id,
      images: formData.images || [],
      setImages: (imgs) => handleChange('images', imgs),
      role: userRole
  });

  useEffect(() => {
    if (fixedCategoryId && !initialData.id) {
        setFormData(prev => ({ ...prev, category: fixedCategoryId }));
    }
  }, [fixedCategoryId, initialData.id]);

  const handleChange = (field: keyof ProductVariant, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleProductionSite = (site: ProductionSite) => {
    setFormData(prev => {
      const selected = prev.production_sites || [];
      return {
        ...prev,
        production_sites: selected.includes(site)
          ? selected.filter(value => value !== site)
          : [...selected, site]
      };
    });
  };

  const handleLocalSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const code = String(formData.code || '').trim().toUpperCase();
    const categoryId = fixedCategoryId || formData.category || '';
    if (!formData.id && (!categoryId || !categories.some(c => c.id === categoryId))) {
      alert(T('Select a valid product category.', '请选择有效的产品分类。'));
      return;
    }
    if (!String(formData.name || '').trim()) {
      alert(T('Product name is required.','请输入产品名称。'));
      return;
    }
    if (!formData.id && !code) {
      alert(T('SKU is required for new products (e.g. PZ-BIRCH-001).','新建产品必须填写 SKU（例如 PZ-BIRCH-001）。'));
      return;
    }
    if (code && !/^PZ-[A-Z0-9][A-Z0-9_-]{1,39}$/.test(code)) {
      alert(T('Invalid SKU. Use PZ- followed by 2–40 letters, numbers, hyphens or underscores.','SKU 格式错误，请使用 PZ- 开头，后面输入 2–40 位字母、数字或连接符。'));
      return;
    }
    setSubmitting(true);
    try {
      const finalStatus = formData.status || 'draft';
      await onSave({
        ...formData,
        category: categoryId,
        code,
        status: finalStatus,
        is_published: finalStatus === 'published' ? 1 : 0
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePromote = async () => {
      if (!formData.id || !onSubmit) return;
      if (!confirm(T("Proceed with submitting this SKU to the master registry audit?","确认将该 SKU 提交审核吗？"))) return;
      setIsPromoting(true);
      try {
          await onSubmit(formData.id);
      } catch (e) { /* Error reported by parent */ }
      finally { setIsPromoting(false); }
  };

  const canPromote = userRole === 'FACTORY' && !!formData.id && (formData.status === 'draft' || formData.status === 'rejected');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-fade-in pb-20">
       <div className="lg:col-span-8">
          <div className="bg-white border border-stone-200 shadow-xl rounded-sm overflow-hidden relative">
             <div className="bg-stone-900 px-8 py-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-3">
                   <ClipboardList size={18} className="text-safety-700" />
                   <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">{T("Product Induction Protocol","产品资料录入")}</h3>
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-[9px] font-mono opacity-40 uppercase">{T("Revision v1.3","表单版本 1.3")}</span>
                </div>
             </div>

             <form onSubmit={handleLocalSave} className="p-8 space-y-12">
                <section>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-900 text-xs font-bold font-mono">01</div>
                        <h4 className="text-[11px] font-bold uppercase tracking-widest text-stone-900">{T("Identification & Classification","产品分类与编号")}</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-stone-400 mb-2">{T("Production Series","产品系列")}</label>
                            {fixedCategoryId ? (
                                <div className="w-full bg-stone-100 border border-stone-200 p-4 text-sm font-bold text-stone-800" aria-label={T('Selected product category','当前产品分类')}>
                                    {(() => {
                                      const selected = categories.find(c => c.id === fixedCategoryId);
                                      return selected
                                        ? (lang === 'zh' ? (selected.title_cn || selected.title_zh || selected.title) : selected.title)
                                        : T('Category unavailable','分类不存在');
                                    })()}
                                    <span className="ml-3 text-xs font-normal text-stone-500">{T('Inherited from the current category','已自动关联当前分类')}</span>
                                </div>
                            ) : (
                                <select
                                    value={formData.category || ''}
                                    onChange={e => handleChange('category', e.target.value)}
                                    className="w-full bg-stone-50 border border-stone-200 p-4 text-sm font-bold focus:border-stone-900 outline-none transition-colors appearance-none"
                                >
                                    <option value="">{T("Select Target Category...","请选择产品分类…")}</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{lang === 'zh' ? (c.title_cn || c.title_zh || c.title) : c.title}</option>)}
                                </select>
                            )}
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-stone-400 mb-2">{T("Sub-Collection (Optional)","子分类（选填）")}</label>
                            <input 
                                type="text" 
                                value={formData.sub_category || ''} 
                                onChange={e => handleChange('sub_category', e.target.value)} 
                                className="w-full bg-stone-50 border border-stone-200 p-4 text-sm focus:border-stone-900 outline-none transition-colors" 
                                placeholder={T("e.g. Minimalist Series","例如：餐桌系列")} 
                            />
                        </div>
                    </div>
                    <fieldset className="mt-8 rounded-sm border border-stone-200 bg-stone-50 p-5">
                        <legend className="px-2 text-[10px] font-bold uppercase tracking-widest text-stone-700">{T("Production Sites / 生产基地","生产基地")}</legend>
                        <p className="mb-4 text-xs text-stone-500">{T("Select all locations that can manufacture this product. This does not change staff permissions.","选择能够生产该产品的工厂，不影响员工账号权限。")}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {([
                                ['zhaoqing', 'Zhaoqing · China / 肇庆'],
                                ['cambodia', 'Kandal · Cambodia / 柬埔寨']
                            ] as const).map(([site, label]) => (
                                <label key={site} className="flex items-center gap-3 cursor-pointer rounded-sm border border-stone-200 bg-white p-4 text-sm text-stone-800">
                                    <input type="checkbox" className="h-4 w-4 accent-stone-900" checked={(formData.production_sites || []).includes(site)} onChange={() => toggleProductionSite(site)} />
                                    <span>{label}</span>
                                </label>
                            ))}
                        </div>
                    </fieldset>
                </section>

                <section>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-900 text-xs font-bold font-mono">02</div>
                        <h4 className="text-[11px] font-bold uppercase tracking-widest text-stone-900">{T("Product Specification","产品规格")}</h4>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-stone-400 mb-2">{T("Display Name (English)","产品名称（英文）")}</label>
                            <input 
                                type="text" 
                                required
                                value={formData.name || ''} 
                                onChange={e => handleChange('name', e.target.value)} 
                                className="w-full border-b-2 border-stone-100 p-4 font-serif text-2xl outline-none focus:border-safety-700 transition-colors" 
                                placeholder={T("English product name","请输入英文产品名称")} 
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-stone-400 mb-2">{T("Display Name (Chinese)","产品名称（中文）")}</label>
                            <input
                                type="text"
                                value={formData.name_cn || ''}
                                onChange={e => handleChange('name_cn', e.target.value)}
                                className="w-full border-b-2 border-stone-100 p-4 font-serif text-xl outline-none focus:border-safety-700 transition-colors"
                                placeholder={T("Chinese product name (optional)","请输入中文产品名称（选填）")}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-stone-400 mb-2">{T("Product Description (English)","产品说明（英文）")}</label>
                            <textarea 
                                rows={4} 
                                value={formData.description || ''} 
                                onChange={e => handleChange('description', e.target.value)} 
                                className="w-full bg-stone-50 border border-stone-200 p-4 text-sm outline-none focus:border-stone-900 resize-none leading-relaxed" 
                                placeholder={T("Describe product construction, design and features...","用英文填写结构、设计及产品特点…")} 
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-stone-400 mb-2">{T("Product Description (Chinese)","产品说明（中文）")}</label>
                            <textarea
                                rows={4}
                                value={formData.description_cn || ''}
                                onChange={e => handleChange('description_cn', e.target.value)}
                                className="w-full bg-stone-50 border border-stone-200 p-4 text-sm outline-none focus:border-stone-900 resize-none leading-relaxed"
                                placeholder={T("Chinese description (optional)","填写中文产品说明（选填）")}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-stone-400 mb-2">{T("Primary Material","主要材料")}</label>
                            <input type="text" value={formData.material || ''} onChange={e => handleChange('material', e.target.value)} className="w-full border border-stone-200 p-4 text-sm focus:border-stone-900 outline-none" placeholder={T("e.g. Solid North American Oak","例如：北美白橡木")} />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-stone-400 mb-2">{T("Dimensions (L × W × T)","产品尺寸（长 × 宽 × 厚）")}</label>
                            <input type="text" value={formData.size || ''} onChange={e => handleChange('size', e.target.value)} className="w-full border border-stone-200 p-4 text-sm focus:border-stone-900 outline-none" placeholder={T("e.g. 72 × 25 × 1.5 in","例如：72 × 25 × 1.5 英寸")} />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-stone-400 mb-2">{T("Surface Finish","表面处理")}</label>
                            <input type="text" value={formData.finish || ''} onChange={e => handleChange('finish', e.target.value)} className="w-full border border-stone-200 p-4 text-sm focus:border-stone-900 outline-none" placeholder={T("e.g. Unfinished / PU / UV","例如：未涂装 / PU / UV")} />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-stone-400 mb-2">{T("SKU suffix (PZ- added automatically)","SKU 后缀（系统自动加 PZ-）")}</label>
                            <div className="flex">
                                <span className="bg-stone-100 border border-r-0 border-stone-200 px-4 flex items-center text-stone-400 font-mono text-xs font-bold">PZ-</span>
                                <input 
                                    type="text" 
                                    value={(formData.code || '').replace(/^PZ-/, '')} 
                                    onChange={e => handleChange('code', `PZ-${e.target.value.toUpperCase()}`)} 
                                    className="w-full border border-stone-200 p-4 text-sm font-mono focus:border-stone-900 outline-none uppercase" 
                                    placeholder="BIRCH-001" 
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <section>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-900 text-xs font-bold font-mono">03</div>
                        <h4 className="text-[11px] font-bold uppercase tracking-widest text-stone-900">{T("Digital Asset Management","产品图片管理")}</h4>
                    </div>
                    <PZImageManager 
                        lang={lang}
                        images={formData.images || []}
                        onUpdate={reorderImages}
                        onDelete={removeImage}
                        onUpload={uploadImage}
                        onSetMain={setMainImage}
                        onError={alert}
                    />
                </section>

                <div className="flex flex-col sm:flex-row gap-4 pt-12 border-t border-stone-100">
                    <button type="button" onClick={onCancel} className="px-10 py-5 border border-stone-200 text-[10px] font-bold uppercase tracking-widest hover:bg-stone-50 transition-colors flex items-center justify-center gap-3 group">
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> {T("Discard","取消返回")}
                    </button>
                    
                    <button type="submit" disabled={submitting || isPromoting} className="flex-grow bg-white border-2 border-stone-900 text-stone-900 font-bold uppercase tracking-[0.2em] py-5 hover:bg-stone-900 hover:text-white transition-all flex items-center justify-center gap-3 shadow-lg">
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {T("Store Draft","保存草稿")}
                    </button>

                    {canPromote && (
                        <button 
                            type="button" 
                            onClick={handlePromote}
                            disabled={submitting || isPromoting} 
                            className="flex-grow bg-safety-700 text-white font-bold uppercase tracking-[0.2em] py-5 hover:bg-safety-600 transition-all flex items-center justify-center gap-3 shadow-xl"
                        >
                            {isPromoting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            {T("Submit for Review","提交审核")}
                        </button>
                    )}
                </div>
             </form>
          </div>
       </div>

       <div className="lg:col-span-4">
          <div className="sticky top-24">
              <div className="bg-stone-900 text-white px-5 py-3 flex items-center gap-2 rounded-t-sm">
                  <Database size={14} className="text-safety-700" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{T("Registry Insight Preview","产品预览")}</span>
              </div>
              <div className="border border-t-0 border-stone-200 p-1 bg-stone-50 shadow-2xl">
                 <LivePreview formData={formData} lang={lang} />
              </div>
              <div className="mt-8 p-6 bg-amber-50 border border-amber-200 rounded-sm">
                  <div className="flex items-start gap-3">
                      <Info size={18} className="text-amber-700 flex-shrink-0 mt-0.5" />
                      <div className="text-[10px] text-amber-800 leading-relaxed uppercase tracking-widest font-bold">
                          <p className="mb-2">{T("Induction Note:","录入提示：")}</p>
                          <p className="font-normal normal-case text-amber-600">{T("Image deletion removes references; cloud files are retained to protect shared assets.","删除图片仅移除产品引用，云端原始文件会保留，以免影响其他产品。")}</p>
                      </div>
                  </div>
              </div>
          </div>
       </div>
    </div>
  );
};

export default ProductForm;