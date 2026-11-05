import React, {useState} from 'react';
import {Package, ShieldAlert} from 'lucide-react';
import type {ProductVariant} from '../../../types';
import ProductDetailModal from '../../../components/catalog/ProductDetailModal';
import {
  readProductSpecifications, formatDimensionsForDisplay
} from '../../../utils/productSpecifications';

interface LivePreviewProps {
  formData:Partial<ProductVariant>;
  lang?:'en'|'zh';
}

/**
 * The public tab deliberately renders the SAME product detail component as
 * the actual catalog. It reads only public-safe fields. Internal specs stay in
 * the separate factory tab and are never sent to the public catalog.
 */
const LivePreview:React.FC<LivePreviewProps>=({formData,lang='en'})=>{
  const T=(en:string,zh:string)=>lang==='zh'?zh:en;
  const specs=readProductSpecifications(formData.specifications);
  const [mode,setMode]=useState<'product'|'factory'>('product');
  const displayedSize=formData.size||formatDimensionsForDisplay(specs,formData.category||'')||'';
  const title=(lang==='zh'?(formData.name_cn||formData.name):formData.name)||T('Product name','产品名称');
  const previewProduct={...formData,size:displayedSize,images:formData.images||[],
    name:formData.name||''} as ProductVariant;
  const info=(en:string,zh:string,value:unknown)=>
    value!==undefined&&value!==null&&String(value).trim()!==''?
    <div className="min-w-0 space-y-1">
      <dt className="text-[10px] font-semibold text-stone-500">{T(en,zh)}</dt>
      <dd className="break-words text-xs font-medium text-stone-900">{String(value)}</dd>
    </div>:null;
  const cartons=specs.packaging||[];
  const cartonSize=(c:typeof cartons[number])=>
    [c.length_cm,c.width_cm,c.height_cm].every(v=>v!==undefined)
      ?[c.length_cm,c.width_cm,c.height_cm].join(' × ')+' cm':'';
  const attributes=Object.entries(specs.attributes||{}).filter(([,v])=>typeof v==='string'&&v.trim());

  return <div className="bg-white">
    <div className="grid grid-cols-2 gap-1 border-b border-stone-200 bg-stone-50 p-2"
      role="tablist" aria-label={T('Preview sections','预览类型')}>
      <button type="button" role="tab" aria-selected={mode==='product'}
        onClick={()=>setMode('product')}
        className={'rounded px-3 py-2 text-xs font-semibold '+(mode==='product'?'bg-stone-900 text-white':'text-stone-600 hover:bg-stone-200')}>
        {T('Website detail','官网产品详情')}
      </button>
      <button type="button" role="tab" aria-selected={mode==='factory'}
        onClick={()=>setMode('factory')}
        className={'rounded px-3 py-2 text-xs font-semibold '+(mode==='factory'?'bg-stone-900 text-white':'text-stone-600 hover:bg-stone-200')}>
        {T('Internal data','后台资料预览')}
      </button>
    </div>
    <p className="px-4 py-3 text-[11px] leading-5 text-stone-500">
      {mode==='product'
        ?T('Uses the live website product-detail component and its public fields. This is an unpublished draft: the actual catalog changes only after approval and publishing.',
          '使用与官网相同的产品详情组件及公开字段。这里只是未发布草稿；审核并正式发布后才会影响官网。')
        :T('Private factory-only technical and packing data. These fields are not returned by the public catalog.',
          '仅供后台查看的技术及包装资料，不会通过公开产品接口展示。')}
    </p>

    {mode==='product'
      ? <div role="tabpanel" aria-label={T('Public product preview','官网产品预览')}>
          <ProductDetailModal product={previewProduct} language={lang} displayMode="inline" onClose={()=>{}} />
        </div>
      : <section role="tabpanel" aria-label={T('Internal product data','产品内部资料')}
          className="space-y-5 p-5">
          <div className="space-y-2 border-b border-stone-200 pb-4">
            <h4 className="font-serif text-lg leading-snug text-stone-900">{title}</h4>
            <p className="font-mono text-xs text-stone-500">{formData.code||'SKU'}</p>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
            {info('Net product weight','产品净重',specs.net_weight_kg===undefined?'':specs.net_weight_kg+' kg')}
            {info('Assembly required','是否组装',specs.assembly?.required===undefined?'':(specs.assembly.required?T('Yes','需要'):T('No','不需要')))}
            {info('Assembly time','组装时间',specs.assembly?.minutes===undefined?'':specs.assembly.minutes+' min')}
            {info('Color','颜色',specs.color)}
          </dl>
          {attributes.length>0&&<div className="border-t border-stone-100 pt-4">
            <h5 className="mb-3 text-xs font-bold">{T('Technical attributes','技术参数')}</h5>
            <dl className="space-y-2">{attributes.map(([key,value])=>
              <div key={key} className="flex items-start justify-between gap-3 text-xs">
                <dt className="break-words text-stone-500">{key.replaceAll('_',' ')}</dt>
                <dd className="text-right font-semibold">{value}</dd>
              </div>)}</dl>
          </div>}
          {specs.construction_en&&<div className="border-t border-stone-100 pt-4">
            <h5 className="mb-2 text-xs font-bold">{T('Construction','结构工艺')}</h5>
            <p className="whitespace-pre-wrap text-xs text-stone-700">{specs.construction_en}</p>
          </div>}
          {cartons.length>0&&<div className="space-y-3 border-t border-stone-100 pt-4">
            <h5 className="flex items-center gap-2 text-xs font-bold">
              <Package size={14}/>{T('Carton specifications','包装箱资料')}</h5>
            {cartons.map((carton,i)=><div key={i} className="rounded bg-stone-50 p-3 text-xs">
              <div className="mb-2 font-semibold">{T('Carton','包装箱')} {i+1}</div>
              <div className="space-y-1 text-stone-700">
                {cartonSize(carton)&&<p>{T('Size','尺寸')}：{cartonSize(carton)}</p>}
                {carton.gross_weight_kg!==undefined&&<p>{T('Gross weight','毛重')}：{carton.gross_weight_kg} kg</p>}
                {carton.units!==undefined&&<p>{T('Quantity','每箱件数')}：{carton.units}</p>}
                {carton.packing_method&&<p>{T('Packing method','包装方式')}：{carton.packing_method}</p>}
              </div>
            </div>)}
          </div>}
          {(specs.care_en||specs.warnings_en)&&<div className="space-y-3 border-t border-stone-100 pt-4">
            {specs.care_en&&<p className="text-xs"><strong>{T('Care','保养')}：</strong>{specs.care_en}</p>}
            {specs.warnings_en&&<p className="text-xs"><strong className="inline-flex items-center gap-1">
              <ShieldAlert size={13}/>{T('Warnings','警告')}：</strong>{specs.warnings_en}</p>}
          </div>}
        </section>}
    <div className="border-t border-stone-100 px-5 py-4 text-[10px] font-semibold tracking-wider text-stone-400">
      {T('DRAFT PREVIEW · NOT PUBLISHED','草稿预览 · 尚未发布')}
    </div>
  </div>;
};
export default LivePreview;
