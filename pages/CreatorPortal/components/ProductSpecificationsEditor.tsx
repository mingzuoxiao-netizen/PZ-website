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
};
const input='w-full min-w-0 rounded-sm border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-stone-900';
const fieldLabel='mb-1.5 block text-xs font-semibold text-stone-700';
const blankCarton=(carton_no:number)=>({carton_no});
const parseNumber=(text:string):number|undefined=>text.trim()===''?undefined:Number(text);

const ProductSpecificationsEditor:React.FC<Props>=({value,onChange,category,lang})=>{
  const specs=readProductSpecifications(value);
  const T=(en:string,zh:string)=>lang==='zh'?zh:en;
  const update=(patch:Partial<ProductSpecifications>)=>onChange({...specs,...patch,schema_version:1});
  const panel=isSurfacePanelCategory(category);
  const attrList=attributesForCategory(category).filter(a=>
    !a.needsEvidence&&
    !['top_thickness','tabletop_thickness','wood_species','finish_type'].includes(a.key));
  const numeric=(en:string,zh:string,v:number|undefined,onValue:(n:number|undefined)=>void,unit:string)=>
    <label className="block min-w-0">
      <span className={fieldLabel}>{T(en,zh)} ({unit})</span>
      <input className={input} type="number" step="any" min="0" max="100000"
        value={v??''} onChange={e=>onValue(parseNumber(e.target.value))}/>
    </label>;
  const sectionTitle=(number:string,en:string,zh:string,helper:string)=>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h4 className="text-sm font-bold text-stone-900">{number} · {T(en,zh)}</h4>
      <span className="text-xs text-stone-500">{helper}</span>
    </div>;

  return <section className="space-y-5" aria-label={T('Product technical specification','产品技术规格')}>
    <div className="space-y-2">
      <h3 className="text-base font-semibold text-stone-900">{T('Product specifications','02 · 规格与结构')}</h3>
      <p className="text-xs leading-5 text-stone-500">{T(
        'Enter dimensions once in cm. The public size text is generated when the draft is saved. Fill only attributes relevant to the selected category.',
        '尺寸只填一次（cm），保存草稿时自动生成网站使用的尺寸文字；只需填写当前品类适用的参数。'
      )}</p>
    </div>

    <div className="rounded border border-stone-200 bg-stone-50 p-5 space-y-5">
      {sectionTitle('A','Product dimensions','产品尺寸','cm')}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {dimensionFieldsForCategory(category).map(f=>
          <React.Fragment key={f.key}>
            {numeric(f.en.replace(/ \(cm\)$/,''),f.zh.replace(/ \(cm\)$/,''),
              specs.dimensions_cm?.[f.key],
              n=>update({dimensions_cm:{...specs.dimensions_cm,[f.key]:n}}),'cm')}
          </React.Fragment>)}
        {!panel&&/table/i.test(category)&&
          numeric('Top thickness','台面厚度',specs.dimensions_cm?.thickness,
            n=>update({dimensions_cm:{...specs.dimensions_cm,thickness:n}}),'cm')}
        {numeric('Product net weight','产品净重',specs.net_weight_kg,
          n=>update({net_weight_kg:n}),'kg')}
      </div>
      {panel&&<p className="text-xs text-stone-500">{T(
        'Panels use length × width × thickness. Other furniture uses height or depth as appropriate.',
        '面板类使用长 × 宽 × 厚；其他家具按品类使用高度或深度。')}</p>}
      {attrList.length>0&&<>
        <div className="border-t border-stone-200 pt-4">
          {sectionTitle('B','Category-specific details','品类专属参数',T('Optional','选填'))}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {attrList.map(attr=>
            <label key={attr.key} className="block min-w-0">
              <span className={fieldLabel}>{T(attr.labelEn,attr.labelZh)}{attr.unit?' ('+attr.unit+')':''}</span>
              <input className={input}
                value={specs.attributes?.[attr.key]||''}
                onChange={e=>update({attributes:{...specs.attributes,[attr.key]:e.target.value}})}/>
            </label>)}
        </div>
      </>}
    </div>

    <details className="rounded border border-stone-200 bg-white p-5">
      <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-bold text-stone-900">
        <span>{T('Additional construction details','补充材料与结构工艺')}</span>
        <span className="text-xs font-normal text-stone-500">{T('Optional • Complex furniture only','选填 · 仅复杂结构产品')}</span>
      </summary>
      <div className="mt-5 space-y-4">
        <p className="text-xs leading-5 text-stone-500">{T(
          'Primary material and surface finish are already entered in Basic information. Only add different components here (e.g., tabletop vs. legs); do not repeat the same material.',
          '主要材料、表面处理已在基本信息填写。仅当不同部件的材质不同（例如台面与桌腿）时再补充，不必重复填写。')}</p>
        <label className="block">
          <span className={fieldLabel}>{T('Construction details (English)','结构工艺说明（英文，选填）')}</span>
          <textarea className={input} rows={3} value={specs.construction_en||''}
            onChange={e=>update({construction_en:e.target.value})}
            placeholder={T('e.g. Mortise-and-tenon frame','例如：榫卯框架结构')}/>
        </label>
        {(specs.materials||[]).map((m,i)=>
          <div key={i} className="rounded border border-stone-200 bg-stone-50 p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold">{T('Component','部件')} {i+1}</span>
              <button type="button" className="text-xs text-red-700"
                onClick={()=>update({materials:(specs.materials||[]).filter((_,j)=>j!==i)})}>{T('Remove','删除')}</button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {([
                ['part','Part','部件部位'],
                ['material','Component material','部件材质'],
                ['construction','Joinery / construction','连接工艺'],
                ['finish','Component finish','部件涂装']
              ] as const).map(([key,en,zh])=>
                <label key={key}><span className={fieldLabel}>{T(en,zh)}</span>
                  <input className={input} value={m[key]||''}
                    onChange={e=>update({materials:(specs.materials||[]).map((x,j)=>j===i?{...x,[key]:e.target.value}:x)})}/>
                </label>)}
            </div>
          </div>)}
        <button type="button" className="rounded border border-stone-300 px-3 py-2 text-xs font-medium"
          onClick={()=>update({materials:[...(specs.materials||[]),{part:'',material:'',construction:'',finish:''}]})}>
          + {T('Add different component','添加不同材质的部件')}
        </button>
      </div>
    </details>

    <details className="rounded border border-stone-200 bg-white p-5">
      <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-bold text-stone-900">
        <span>{T('Factory packing & assembly information','04 · 包装、安装与保养')}</span>
        <span className="text-xs font-normal text-stone-500">{T('Optional • Internal','选填 · 后台内部')}</span>
      </summary>
      <div className="mt-5 space-y-5">
        <p className="text-xs text-stone-500">{T(
          'Carton dimensions and weights are for logistics reference. They are different from the product dimensions above.',
          '包装箱尺寸和毛重仅作物流资料，跟上方产品尺寸不同。无需重复填写产品净重。')}</p>
        <div className="flex items-center justify-between gap-2">
          <strong className="text-xs text-stone-800">{T('Cartons','包装箱')}</strong>
          <button type="button" className="rounded border px-3 py-2 text-xs"
            onClick={()=>update({packaging:[...(specs.packaging||[]),blankCarton((specs.packaging||[]).length+1)]})}>
            + {T('Add carton','添加包装箱')}
          </button>
        </div>
        {(specs.packaging||[]).map((carton,i)=>
          <div key={i} className="space-y-3 rounded border border-stone-200 bg-stone-50 p-3">
            <div className="flex justify-between gap-2">
              <strong className="text-xs text-stone-700">{T('Carton','包装箱')} {i+1}</strong>
              <button type="button" className="text-xs text-red-700"
                onClick={()=>update({packaging:(specs.packaging||[]).filter((_,j)=>j!==i).map((c,j)=>({...c,carton_no:j+1}))})}>
                {T('Remove','删除')}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {([
                ['length_cm','Carton length','箱长','cm'],
                ['width_cm','Carton width','箱宽','cm'],
                ['height_cm','Carton height','箱高','cm'],
                ['gross_weight_kg','Gross weight','包装毛重','kg'],
                ['units','Units / carton','每箱件数','pcs']
              ] as const).map(([key,en,zh,unit])=>
                <React.Fragment key={key}>
                  {numeric(en,zh,carton[key],n=>update({packaging:(specs.packaging||[]).map((x,j)=>j===i?{...x,[key]:n}:x)}),unit)}
                </React.Fragment>)}
            </div>
            <label className="block"><span className={fieldLabel}>{T('Packing method / protection','包装方式与保护要求')}</span>
              <input className={input} value={carton.packing_method||''}
                onChange={e=>update({packaging:(specs.packaging||[]).map((x,j)=>j===i?{...x,packing_method:e.target.value}:x)})}/>
            </label>
          </div>)}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block"><span className={fieldLabel}>{T('Assembly required','是否需要组装')}</span>
            <select className={input} value={specs.assembly?.required===undefined?'':String(specs.assembly.required)}
              onChange={e=>update({assembly:{...specs.assembly,required:e.target.value===''?undefined:e.target.value==='true'}})}>
              <option value="">{T('Not provided','未填写')}</option>
              <option value="true">{T('Yes','需要')}</option>
              <option value="false">{T('No','不需要')}</option>
            </select></label>
          {numeric('Estimated assembly time','预计组装时间',specs.assembly?.minutes,
            n=>update({assembly:{...specs.assembly,minutes:n}}),'min')}
        </div>
        <label className="block"><span className={fieldLabel}>{T('Care instructions (English)','保养说明（英文）')}</span>
          <textarea className={input} rows={2} value={specs.care_en||''}
            onChange={e=>update({care_en:e.target.value})}/>
        </label>
        <label className="block"><span className={fieldLabel}>{T('Important usage warnings','必要的使用警示')}</span>
          <textarea className={input} rows={2} value={specs.warnings_en||''}
            onChange={e=>update({warnings_en:e.target.value})}/>
        </label>
        <p className="rounded bg-stone-100 p-3 text-xs leading-5 text-stone-600">
          {T('Certificates, lab reports and assembly PDFs require a real, permission-controlled document upload workflow. Until then, filenames are no longer requested and nothing is marked public or verified by this form.',
            '检测报告、认证文件、安装 PDF 等资料需要真正的附件上传与审核功能。目前不再要求填写空文件名，也不能在此表单将文件标记为“已认证”或“公开”。')}
        </p>
      </div>
    </details>
  </section>;
};
export default ProductSpecificationsEditor;
