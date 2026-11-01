import React from 'react';
import { Image as ImageIcon, Box, Ruler, Info } from 'lucide-react';
import { ProductVariant } from '../../../types';
import { resolveImage } from '../../../utils/imageResolver';

interface LivePreviewProps {
    formData: Partial<ProductVariant>;
    lang?: 'en' | 'zh';
}

const LivePreview: React.FC<LivePreviewProps> = ({ formData, lang = 'en' }) => {
    const T = (en: string, zh: string) => lang === 'zh' ? zh : en;
    const imageUrl =
        formData.images &&
        formData.images.length > 0
            ? resolveImage(formData.images[0])
            : null;

    return (
        <div className="bg-white group">
            {/* Professional Imagery Section */}
            <div className="aspect-[4/5] w-full bg-stone-100 relative overflow-hidden flex items-center justify-center">
                {imageUrl ? (
                    <img 
                        src={imageUrl} 
                        alt={T("Product preview","产品预览")} 
                        className="w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110" 
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-stone-200 gap-4">
                        <ImageIcon size={64} strokeWidth={1} className="opacity-20" />
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">{T('Image required','请上传产品图片')}</span>
                    </div>
                )}
                
                {/* Technical Overlay */}
                <div className="absolute top-4 left-4 bg-stone-900/80 backdrop-blur-md px-3 py-1.5 border-l-2 border-safety-700">
                    <span className="text-white font-mono text-[9px] font-bold tracking-[0.2em] uppercase">
                        {formData.code || T('SKU pending','待填写 SKU')}
                    </span>
                </div>
            </div>

            {/* Technical Meta Section */}
            <div className="p-8">
                <div className="mb-6 pb-6 border-b border-stone-100">
                    <h4 className="font-serif text-2xl text-stone-900 mb-2 leading-tight">
                        {(lang === 'zh' ? (formData.name_cn || formData.name) : formData.name) || T('Product name','产品名称')}
                    </h4>
                    <p className="text-stone-400 text-[10px] uppercase font-bold tracking-widest">
                        {formData.sub_category || T('Uncategorized series','未设置子分类')}
                    </p>
                </div>

                <p className="text-stone-600 text-sm leading-relaxed line-clamp-3 mb-8 italic">
                    {(lang === 'zh' ? (formData.description_cn || formData.description) : formData.description) || T('Product description will appear here.','产品说明将在此显示。')}
                </p>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-stone-400 mb-1">
                            <Box size={12} />
                            <span className="text-[9px] font-bold uppercase tracking-widest">{T('Core Material','主要材料')}</span>
                        </div>
                        <span className="text-[10px] font-bold text-stone-900 uppercase">
                            {formData.material || T('NOT SPECIFIED','未填写')}
                        </span>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-stone-400 mb-1">
                            <Ruler size={12} />
                            <span className="text-[9px] font-bold uppercase tracking-widest">{T('Dimensions','产品尺寸')}</span>
                        </div>
                        <span className="text-[10px] font-bold text-stone-900 uppercase">
                            {formData.size || T('NOT SPECIFIED','未填写')}
                        </span>
                    </div>
                    <div className="space-y-1 col-span-2">
                        <div className="flex items-center gap-2 text-stone-400 mb-1">
                            <Info size={12} />
                            <span className="text-[9px] font-bold uppercase tracking-widest">{T('Surface Finish','表面处理')}</span>
                        </div>
                        <span className="text-[10px] font-bold text-stone-900">
                            {formData.finish || T('NOT SPECIFIED','未填写')}
                        </span>
                    </div>
                </div>

                <div className="mt-10 pt-6 border-t border-stone-100 flex justify-between items-center opacity-30 grayscale">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-stone-900 rounded-full"></div>
                        <span className="text-[8px] font-mono font-bold uppercase tracking-widest">{T('PREVIEW ONLY','仅供预览')}</span>
                    </div>
                    <span className="text-[8px] font-mono font-bold">{T('PRODUCT DATA','产品资料')}</span>
                </div>
            </div>
        </div>
    );
};

export default LivePreview;