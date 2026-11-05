import React from 'react';
import type {ProductSpecifications} from '../../../utils/productSpecifications';
import {
  attributesForCategory, dimensionFieldsForCategory,
  isSurfacePanelCategory, readProductSpecifications
} from '../../../utils/productSpecifications';

type Props={
  value?:ProductSpecifications;
  onChange:(value:ProductSpecifications)=>void;
  category:string;
  lang:'zh'|'en';
  mode?:'technical'|'factory';
};
const inputClass='w-full min-w-0 rounded border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-stone-900';
const labelClass='mb-1.5 block text-xs font-semibold text-stone-700';
const optionalNumber=(raw:string):number|undefined=>raw.trim()===''?undefined:Number(raw);
type Carton=NonNullable<ProductSpecifications['packaging']>[number];
const blankCarton=(carton_no:number):Carton=>({carton_no});

const ProductSpecificationsEditor:React.FC<Props>=({
  value,onChange,category,lang,mode='technical'
})=>{
  const spec=readProductSpecifications(value);
  const T=(en:string,zh:string)=>lang==='zh'?zh:en;
  const update=(patch:Partial<ProductSpecifications>)=>onChange({...spec,...patch,schema_version:1});
  const panel=isSurfacePanelCategory(category);
  const attributes=attributesForCategory(category).filter(x=>
    !x.needsEvidence&&!['top_thickness','tabletop_thickness','wood_species','finish_type'].includes(x.key));
  const cartons=spec.packaging?.length?spec.packaging:[blankCarton(1)];
  const updateCarton=(i:number,patch:Partial<Carton>)=>{
    update({packaging:cartons.map((c,j)=>j===i?{...c,...patch}:c)});
  };
  const numeric=(en:string,zh:string,value:number|undefined,
    change:(value:number|undefined)=>void,unit:string)=>
    <label className="min-w-0">
      <span className={labelClass}>{T(en,zh)} ({unit})</span>
      <input className={inputClass} type="number" min="0" max="100000" step="any"
        value={value??''} onChange={e=>change(optionalNumber(e.target.value))}/>
    </label>;
  const heading=(en:string,zh:string)=>
    <h4 className="text-sm font-bold text-stone-900">{T(en,zh)}</h4>;

  if(mode==='factory'){
    return <section className="space-y-5" aria-label={T('Packing, assembly and product care','包装、组装与使用说明')}>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-stone-900">{T('04 · Packing, assembly & care','04 · 包装、组装与保养')}</h3>
        <p className="text-xs leading-5 text-stone-500">
          {T('Enter known carton measurements and warnings here. Unfilled fields do not prevent saving a draft.',
            '请按工厂实际资料填写包装尺寸、重量和必要的使用警告。暂时不知道的数据可后续补充，不影响保存草稿。')}
        </p>
      </div>
      <div className="space-y-4 rounded border border-stone-200 bg-stone-50 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {heading('Carton specifications','包装箱资料')}
          <button type="button" className="rounded border border-stone-300 bg-white px-3 py-2 text-xs font-semibold"
            onClick={()=>update({packaging:[...cartons,blankCarton(cartons.length+1)]})}>
            + {T('Add carton','添加包装箱')}
          </button>
        </div>
        {cartons.map((carton,i)=>
          <div className="space-y-4 rounded border border-stone-200 bg-white p-4" key={i}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold">{T('Carton','包装箱')} {i+1}</span>
              {cartons.length>1&&<button type="button" className="text-xs text-red-700"
                onClick={()=>update({packaging:cartons.filter((_,j)=>j!==i).map((c,j)=>({...c,carton_no:j+1}))})}>
                {T('Remove','删除')}
              </button>}
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {numeric('Carton length','箱长',carton.length_cm,n=>updateCarton(i,{length_cm:n}),'cm')}
              {numeric('Carton width','箱宽',carton.width_cm,n=>updateCarton(i,{width_cm:n}),'cm')}
              {numeric('Carton height','箱高',carton.height_cm,n=>updateCarton(i,{height_cm:n}),'cm')}
              {numeric('Gross weight','包装毛重',carton.gross_weight_kg,n=>updateCarton(i,{gross_weight_kg:n}),'kg')}
              {numeric('Units per carton','每箱件数',carton.units,n=>updateCarton(i,{units:n}),'pcs')}
            </div>
            <label className="block">
              <span className={labelClass}>{T('Packing method','包装方式与保护要求')}</span>
              <input className={inputClass} value={carton.packing_method||''}
                onChange={e=>updateCarton(i,{packing_method:e.target.value})}
                placeholder={T('e.g. Foam corner guards, double-wall carton','例如：护角、珍珠棉、双瓦楞纸箱')}/>
            </label>
          </div>)}
      </div>
      <div className="space-y-4 rounded border border-stone-200 bg-white p-4 sm:p-5">
        {heading('Assembly & care','组装与保养')}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label>
            <span className={labelClass}>{T('Assembly required','是否需要组装')}</span>
            <select className={inputClass} value={spec.assembly?.required===undefined?'':String(spec.assembly.required)}
              onChange={e=>update({assembly:{...spec.assembly,required:e.target.value===''?undefined:e.target.value==='true'}})}>
              <option value="">{T('Select','请选择')}</option>
              <option value="true">{T('Yes','需要')}</option>
              <option value="false">{T('No','不需要')}</option>
            </select>
          </label>
          {numeric('Assembly time','预计组装时间',spec.assembly?.minutes,
            n=>update({assembly:{...spec.assembly,minutes:n}}),'min')}
        </div>
        <label className="block">
          <span className={labelClass}>{T('Care instructions (English)','保养说明（英文）')}</span>
          <textarea className={inputClass} rows={3} value={spec.care_en||''}
            onChange={e=>update({care_en:e.target.value})}
            placeholder={T('e.g. Clean with a damp cloth. Avoid prolonged water exposure.','例如：用湿布擦拭，避免长时间浸水。')}/>
        </label>
        <label className="block">
          <span className={labelClass}>{T('Safety warnings / usage limits','使用警告 / 使用限制')}</span>
          <textarea className={inputClass} rows={3} value={spec.warnings_en||''}
            onChange={e=>update({warnings_en:e.target.value})}
            placeholder={T('Record relevant safety instructions; leave empty if not applicable.','填写需要告知客户的使用注意事项。')}/>
        </label>
      </div>
    </section>;
  }

  return <section className="space-y-4" aria-label={T('Product specifications','产品尺寸与结构')}>
    <div className="space-y-1">
      <h3 className="text-base font-semibold text-stone-900">{T('02 · Product dimensions & construction','02 · 产品规格与结构')}</h3>
      <p className="text-xs leading-5 text-stone-500">{T(
        'Enter dimensions only once in cm. The site size label will be generated automatically.',
        '产品尺寸只填写一次（cm），网站展示的尺寸文字会自动生成。')}</p>
    </div>
    <div className="space-y-5 rounded border border-stone-200 bg-stone-50 p-4 sm:p-5">
      {heading('Product dimensions','产品尺寸')}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {dimensionFieldsForCategory(category).map(f=>
          <React.Fragment key={f.key}>
            {numeric(f.en.replace(/ \(cm\)$/,''),f.zh.replace(/ \(cm\)$/,''),
              spec.dimensions_cm?.[f.key],
              n=>update({dimensions_cm:{...spec.dimensions_cm,[f.key]:n}}),'cm')}
          </React.Fragment>)}
        {!panel&&/table/i.test(category)&&numeric('Top thickness','台面厚度',
          spec.dimensions_cm?.thickness,
          n=>update({dimensions_cm:{...spec.dimensions_cm,thickness:n}}),'cm')}
        {numeric('Net weight','产品净重',spec.net_weight_kg,n=>update({net_weight_kg:n}),'kg')}
      </div>
      {attributes.length>0&&<>
        <div className="border-t border-stone-200 pt-4">{heading('Category-specific specifications','品类专属参数')}</div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {attributes.map(a=>
            <label key={a.key}>
              <span className={labelClass}>{T(a.labelEn,a.labelZh)}{a.unit?' ('+a.unit+')':''}</span>
              <input className={inputClass} value={spec.attributes?.[a.key]||''}
                onChange={e=>update({attributes:{...spec.attributes,[a.key]:e.target.value}})}/>
            </label>)}
        </div>
      </>}
    </div>
    <details className="rounded border border-stone-200 bg-white p-4 sm:p-5">
      <summary className="cursor-pointer text-sm font-semibold text-stone-900">
        {T('Component materials & manufacturing details','补充部件材料与制造工艺')}
      </summary>
      <div className="mt-4 space-y-4">
        <p className="text-xs text-stone-500">{T(
          'The primary material and finish are already recorded above. Add components only when they differ.',
          '主要材质和涂装已在基本资料填写，只有不同部件的材质或结构不同时才补充。')}</p>
        <label className="block">
          <span className={labelClass}>{T('Construction / joinery (English)','结构工艺（英文）')}</span>
          <textarea className={inputClass} rows={3} value={spec.construction_en||''}
            onChange={e=>update({construction_en:e.target.value})}/>
        </label>
        {(spec.materials||[]).map((m,i)=>
          <div key={i} className="space-y-3 rounded border border-stone-200 bg-stone-50 p-3">
            <div className="flex justify-between">
              <strong className="text-xs">{T('Part','部件')} {i+1}</strong>
              <button type="button" className="text-xs text-red-700"
                onClick={()=>update({materials:(spec.materials||[]).filter((_,j)=>j!==i)})}>
                {T('Remove','删除')}
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {([
                ['part','Component','部件'],
                ['material','Material','材质'],
                ['construction','Construction','结构工艺'],
                ['finish','Finish','表面处理']
              ] as const).map(([key,en,zh])=>
                <label key={key}>
                  <span className={labelClass}>{T(en,zh)}</span>
                  <input className={inputClass} value={m[key]||''}
                    onChange={e=>update({materials:(spec.materials||[]).map((v,j)=>j===i?{...v,[key]:e.target.value}:v)})}/>
                </label>)}
            </div>
          </div>)}
        <button type="button" className="rounded border border-stone-300 px-3 py-2 text-xs font-medium"
          onClick={()=>update({materials:[...(spec.materials||[]),{part:'',material:'',construction:'',finish:''}]})}>
          + {T('Add component','添加部件')}
        </button>
      </div>
    </details>
  </section>;
};

export default ProductSpecificationsEditor;
