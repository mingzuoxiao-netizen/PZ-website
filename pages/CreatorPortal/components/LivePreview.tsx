import React, {useEffect, useState} from 'react';
import {Image as ImageIcon, Box, Ruler, Info, Package, ShieldAlert} from 'lucide-react';
import type {ProductVariant} from '../../../types';
import {resolveImage} from '../../../utils/imageResolver';
import {readProductSpecifications, formatDimensionsForDisplay} from '../../../utils/productSpecifications';

interface LivePreviewProps {
  formData:Partial<ProductVariant>;
  lang?:'en'|'zh';
}

const LivePreview:React.FC<LivePreviewProps>=({formData,lang='en'})=>{
  const T=(en:string,zh:string)=>lang==='zh'?zh:en;
  const specs=readProductSpecifications(formData.specifications);
  const [mode,setMode]=useState<'product'|'factory'>('product');
  const [imageIndex,setImageIndex]=useState(0);
  const images=formData.images||[];
  useEffect(()=>setImageIndex(0),[images[0]]);
  const imageUrl=images.length?resolveImage(images[Math.min(imageIndex,images.length-1)]):null;
  const displayedSize=formData.size||formatDimensionsForDisplay(specs,formData.category||'')||'';
  const title=(lang==='zh'?(formData.name_cn||formData.name):formData.name)||T('Product name','产品名称');
  const description=(lang==='zh'?(formData.description_cn||formData.description):formData.description)||'';
  const info=(en:string,zh:string,value:unknown,icon?:React.ReactNode)=>
    (value!==undefined&&value!==null&&String(value).trim()!=='')?
    <div className="min-w-0 space-y-1">
      <div className="flex items-center gap-1.5 text-stone-500">{icon}<span className="text-[10px] font-semibold">{T(en,zh)}</span></div>
      <div className="break-words text-xs font-medium text-stone-900">{String(value)}</div>
    </div>:null;
  const cartons=specs.packaging||[];
  const cartonSize=(c:typeof cartons[number])=>
    [c.length_cm,c.width_cm,c.height_cm].every(v=>v!==undefined)
      ?[c.length_cm,c.width_cm,c.height_cm].join(' × ')+' cm':'';
  const present=Object.entries(specs.attributes||{}).filter(([,v])=>v?.trim());
  return <div className="bg-white">
    <div className="grid grid-cols-2 gap-1 border-b border-stone-200 bg-stone-50 p-2" role="tablist" aria-label={T('Preview sections','预览类型')}>
      <button type="button" role="tab" aria-selected={mode==='product'}
        onClick={()=>setMode('product')}
        className={'rounded px-3 py-2 text-xs font-semibold '+(mode==='product'?'bg-stone-900 text-white':'text-stone-600 hover:bg-stone-200')}>
        {T('Product detail','产品详情预览')}
      </button>
      <button type="button" role="tab" aria-selected={mode==='factory'}
        onClick={()=>setMode('factory')}
        className={'rounded px-3 py-2 text-xs font-semibold '+(mode==='factory'?'bg-stone-900 text-white':'text-stone-600 hover:bg-stone-200')}>
        {T('Internal data','后台资料预览')}
      </button>
    </div>
    <p className="px-4 py-3 text-[11px] leading-4 text-stone-500">
      {mode==='product'
        ?T('Draft product-detail layout, not the current public website. New technical fields will not go live until a separate publication update.',
          '这是新版详情页的草稿预览，不等于当前官网页面。新增技术字段不会自动公开。')
        :T('Private factory reference only. Carton and technical data are not exposed through the public catalog.',
          '工厂内部资料预览。包装和技术档案不会通过公开目录接口展示。')}
    </p>
    <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-stone-100">
      {imageUrl
        ?<img src={imageUrl} alt={title} className="h-full w-full object-cover"/>
        :<div className="flex flex-col items-center gap-3 text-stone-400"><ImageIcon size={36}/><span className="text-xs">{T('Add a product image','请上传产品图片')}</span></div>}
      <span className="absolute left-3 top-3 max-w-[85%] truncate rounded bg-stone-900/85 px-3 py-1.5 text-[10px] font-semibold tracking-wide text-white">
        {formData.code||'SKU'}
      </span>
    </div>
    {images.length>1&&<div className="flex gap-2 overflow-x-auto border-b border-stone-100 p-3">
      {images.map((src,i)=><button type="button" key={src+'-'+i}
        onClick={()=>setImageIndex(i)} aria-label={T('View image ','查看图片 ')+(i+1)}
        className={'h-12 w-12 shrink-0 overflow-hidden rounded border-2 '+(Math.min(imageIndex,images.length-1)===i?'border-stone-900':'border-transparent')}>
        <img alt="" src={resolveImage(src)} className="h-full w-full object-cover"/>
      </button>)}
    </div>}

    <div className="space-y-5 p-5">
      <div className="space-y-2 border-b border-stone-200 pb-4">
        <h4 className="font-serif text-xl leading-snug text-stone-900">{title}</h4>
        {formData.sub_category&&<p className="text-xs text-stone-500">{formData.sub_category}</p>}
        {description&&<p className="text-sm leading-6 text-stone-600">{description}</p>}
      </div>

      {mode==='product'?<>
        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
          {info('Material','主要材料',formData.material,<Box size={13}/>)}
          {info('Dimensions','产品尺寸',displayedSize,<Ruler size={13}/>)}
          {info('Finish','表面处理',formData.finish,<Info size={13}/>)}
          {info('Color','颜色',specs.color)}
        </div>
        {specs.construction_en&&<div className="border-t border-stone-100 pt-4">
          <h5 className="mb-2 text-xs font-bold">{T('Construction','结构工艺')}</h5>
          <p className="whitespace-pre-wrap text-xs leading-5 text-stone-700">{specs.construction_en}</p>
        </div>}
        {specs.care_en&&<div className="border-t border-stone-100 pt-4">
          <h5 className="mb-2 text-xs font-bold">{T('Care','保养说明')}</h5>
          <p className="whitespace-pre-wrap text-xs leading-5 text-stone-700">{specs.care_en}</p>
        </div>}
        {specs.warnings_en&&<div className="border-t border-stone-100 pt-4">
          <h5 className="mb-2 flex items-center gap-2 text-xs font-bold"><ShieldAlert size={14}/>{T('Important information','使用注意事项')}</h5>
          <p className="whitespace-pre-wrap text-xs leading-5 text-stone-700">{specs.warnings_en}</p>
        </div>}
      </>:<>
        <div className="grid grid-cols-2 gap-4">
          {info('SKU','SKU',formData.code)}
          {info('Net product weight','产品净重',specs.net_weight_kg===undefined?'':specs.net_weight_kg+' kg')}
          {info('Assembly required','是否组装',specs.assembly?.required===undefined?'':(specs.assembly.required?T('Yes','需要'):T('No','不需要')))}
          {info('Assembly time','组装时间',specs.assembly?.minutes===undefined?'':specs.assembly.minutes+' min')}
        </div>
        {present.length>0&&<div className="border-t border-stone-100 pt-4">
          <h5 className="mb-3 text-xs font-bold">{T('Category specifications','品类技术参数')}</h5>
          <div className="space-y-2">{present.map(([key,v])=>
            <div key={key} className="flex items-start justify-between gap-3 text-xs">
              <span className="break-words text-stone-500">{key.replaceAll('_',' ')}</span>
              <span className="text-right font-semibold">{v}</span>
            </div>)}</div>
        </div>}
        {cartons.length>0&&<div className="space-y-3 border-t border-stone-100 pt-4">
          <h5 className="flex items-center gap-2 text-xs font-bold"><Package size={14}/>{T('Carton specifications','包装箱资料')}</h5>
          {cartons.map((c,i)=><div key={i} className="rounded bg-stone-50 p-3 text-xs">
            <div className="mb-2 font-semibold">{T('Carton','包装箱')} {i+1}</div>
            <div className="space-y-1 text-stone-700">
              {cartonSize(c)&&<p>{T('Size','尺寸')}：{cartonSize(c)}</p>}
              {c.gross_weight_kg!==undefined&&<p>{T('Gross weight','毛重')}：{c.gross_weight_kg} kg</p>}
              {c.units!==undefined&&<p>{T('Quantity','每箱件数')}：{c.units}</p>}
              {c.packing_method&&<p>{T('Packing method','包装方式')}：{c.packing_method}</p>}
            </div>
          </div>)}
        </div>}
        {(specs.care_en||specs.warnings_en)&&<div className="space-y-3 border-t border-stone-100 pt-4">
          {specs.care_en&&<p className="text-xs"><strong>{T('Care','保养')}：</strong>{specs.care_en}</p>}
          {specs.warnings_en&&<p className="text-xs"><strong>{T('Warnings','警告')}：</strong>{specs.warnings_en}</p>}
        </div>}
      </>}
      <div className="border-t border-stone-100 pt-4 text-[10px] font-semibold tracking-wider text-stone-400">
        {T('LIVE DRAFT PREVIEW · NOT PUBLISHED','实时草稿预览 · 未发布')}
      </div>
    </div>
  </div>;
};

export default LivePreview;
