import React from 'react';
import type { ProductSpecifications } from '../../../utils/productSpecifications';
import {attributesForCategory, readProductSpecifications} from '../../../utils/productSpecifications';

type Props={value?:ProductSpecifications;onChange:(next:ProductSpecifications)=>void;category:string;images?:string[];lang:'zh'|'en'};
const inputClass='w-full rounded-sm border border-stone-200 bg-white px-3 py-2 text-sm focus:border-stone-900 outline-none';
const titleClass='block mb-1 text-xs font-semibold text-stone-700';
const groupClass='rounded border border-stone-200 bg-stone-50 px-4 py-4 space-y-4';
const blankMaterial=()=>({part:'',material:'',construction:'',finish:''});
const blankPackage=(carton_no:number)=>({carton_no,length_cm:undefined,width_cm:undefined,height_cm:undefined,gross_weight_kg:undefined,net_weight_kg:undefined,units:undefined});
const numberInput=(v:number|undefined)=>v===undefined?'':String(v);
const optionalNumber=(v:string):number|undefined=>v.trim()===''?undefined:Number(v);

const ProductSpecificationsEditor:React.FC<Props>=({value,onChange,category,images=[],lang})=>{
  const specs=readProductSpecifications(value);
  const T=(en:string,zh:string)=>lang==='zh'?zh:en;
  const update=(patch:Partial<ProductSpecifications>)=>onChange({...specs,...patch,schema_version:1});
  const textField=(key:'series_id'|'color'|'construction_en'|'care_en'|'warnings_en',en:string,zh:string,placeholder='',large=false)=>
    <label className="block" key={key}><span className={titleClass}>{T(en,zh)}</span>
      {large?<textarea className={inputClass} rows={3} value={specs[key]||''} placeholder={placeholder}
        onChange={e=>update({[key]:e.target.value})}/>:
      <input className={inputClass} value={specs[key]||''} placeholder={placeholder}
        onChange={e=>update({[key]:e.target.value})}/>}</label>;
  const numeric=(labelEn:string,labelZh:string,v:number|undefined,onValue:(v:number|undefined)=>void,unit='cm')=>
    <label className="block"><span className={titleClass}>{T(labelEn,labelZh)} ({unit})</span>
      <input className={inputClass} type="number" min="0" max="100000" step="any" value={numberInput(v)}
        onChange={e=>onValue(optionalNumber(e.target.value))}/></label>;
  const attributes=attributesForCategory(category);
  const detailsHeader=(index:string,en:string,zh:string,subtitle:string)=>
    <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-stone-900">
      <span>{index} · {T(en,zh)}</span><span className="text-xs font-normal text-stone-500">{subtitle}</span>
    </summary>;

  return <section className="space-y-5" aria-label={T('Structured technical information','结构化产品技术资料')}>
    <div>
      <h4 className="text-sm font-semibold tracking-wider text-stone-900">{T('Technical data, matching the PZ workbook','产品技术资料 · 对照统一 Excel 模板')}</h4>
      <p className="mt-2 text-xs leading-6 text-stone-500">
        {T('Only fill verified, applicable fields. Values are saved with the draft and captured in V1/V2 review history. They are not automatically published on the website.',
        '只填适用且核实的数据；保存到草稿，提交审核时进入 V1/V2 历史。新增字段不会自动公开到网站。')}
      </p>
    </div>

    <details open className={groupClass}>
      {detailsHeader('03', 'Model, dimensions & key features', '型号、尺寸与产品卖点', 'cm / kg')}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {textField('series_id','Product family ID','产品系列 / 产品族 ID','PZ-MARLOW')}
        {textField('color','Color / finish color','颜色 / 色号','Natural Oak')}
        {(['length','width','height','thickness'] as const).map(key=>
          <React.Fragment key={key}>{numeric(
            ({length:'Length',width:'Width',height:'Height',thickness:'Thickness'})[key],
            ({length:'产品长',width:'产品宽',height:'厚度',thickness:'台面厚度'})[key],
            specs.dimensions_cm?.[key],x=>update({dimensions_cm:{...specs.dimensions_cm,[key]:x}})
          )}</React.Fragment>)}
        {numeric('Net product weight','产品净重',specs.net_weight_kg,
          x=>update({net_weight_kg:x}),'kg')}
      </div>
      <p className="text-xs text-stone-500">{T('The original size field remains available for the existing website display; structured dimensions are the technical record.',
        '现有「产品尺寸」文字栏仍用于网站展示；这里的长宽高用于结构化技术档案。')}</p>
      <div className="grid gap-3">
        {[0,1,2].map(i=><label key={i} className="block"><span className={titleClass}>{T('Product highlight','英文产品卖点')} {i+1}</span>
          <input className={inputClass} value={specs.selling_points_en?.[i]||''}
            onChange={e=>{const next=[...(specs.selling_points_en||['','',''])];next[i]=e.target.value;update({selling_points_en:next});}}
            placeholder="e.g. Solid white oak frame with a durable water-based finish"/></label>)}
      </div>
    </details>

    <details open className={groupClass}>
      {detailsHeader('04','Materials & category-specific details','部件材料、工艺与品类参数','按产品类型')}
      {textField('construction_en','Construction / craftsmanship (English)','产品结构与制作工艺（英文）',
        'e.g. Solid wood frame with mortise-and-tenon joints',true)}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <strong className="text-sm">{T('Component materials','部件材料明细')}</strong>
          <button type="button" className="rounded border border-stone-300 px-3 py-1 text-xs"
            onClick={()=>update({materials:[...(specs.materials||[]),blankMaterial()]})}>
            + {T('Add component','添加部件')}
          </button>
        </div>
        {(specs.materials||[]).map((m,i)=><div className="grid grid-cols-1 md:grid-cols-2 gap-2 rounded border bg-white p-3" key={i}>
          {([['part','部件位置 / Part'],['material','主要材质 / Material'],
             ['construction','拼接 / 连接工艺 / Construction'],['finish','涂装 / Finish']] as const).map(([key,label])=>
            <label key={key}><span className={titleClass}>{label}</span>
              <input className={inputClass} value={m[key]||''}
                onChange={e=>update({materials:(specs.materials||[]).map((row,j)=>j===i?{...row,[key]:e.target.value}:row)})}/></label>)}
          <button type="button" className="text-left text-xs text-red-700" onClick={()=>update({materials:(specs.materials||[]).filter((_,j)=>j!==i)})}>
            {T('Remove component','删除部件')}
          </button>
        </div>)}
      </div>
      <div className="space-y-3 border-t border-stone-200 pt-4">
        <p className="text-sm font-semibold">{T('Relevant attributes for selected category','当前品类对应的技术参数')}</p>
        {attributes.length===0?<p className="text-xs text-stone-500">
          {T('No standard category fields for this product yet; component materials above can still be entered.',
            '此分类暂未定义专属参数，可以先填写上面的材料结构。')}</p>:
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{attributes.map(attr=>
            <label key={attr.key}><span className={titleClass}>
              {T(attr.labelEn,attr.labelZh)}{attr.unit?' ('+attr.unit+')':''}
              {attr.needsEvidence?' · '+T('Evidence required','需要检测证据'):''}
            </span>
              <input className={inputClass} value={specs.attributes?.[attr.key]||''}
                onChange={e=>update({attributes:{...specs.attributes,[attr.key]:e.target.value}})}/></label>)}</div>}
        <p className="text-xs text-amber-700">{T('Do not claim certified load limits or environmental ratings without a report.',
          '承重、认证、环保等级等项目没有证据时不要填写已通过或已认证。')}</p>
      </div>
    </details>

    <details className={groupClass}>
      {detailsHeader('05','Packaging, assembly & care','包装、组装、保养与警示','内部 / 可选公开')}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2"><strong className="text-sm">{T('Cartons','包装箱数据')}</strong>
          <button type="button" className="rounded border border-stone-300 px-3 py-1 text-xs" onClick={()=>
            update({packaging:[...(specs.packaging||[]),blankPackage((specs.packaging||[]).length+1)]})}>
            + {T('Add carton','添加包装箱')}
          </button></div>
        {(specs.packaging||[]).map((box,i)=><div className="rounded border bg-white p-3 space-y-3" key={i}>
          <div className="flex justify-between"><span className="text-xs font-semibold">{T('Carton','包装箱')} {box.carton_no||i+1}</span>
            <button type="button" className="text-xs text-red-700" onClick={()=>
              update({packaging:(specs.packaging||[]).filter((_,j)=>j!==i).map((c,j)=>({...c,carton_no:j+1}))})}>{T('Remove','删除')}</button></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {([
              ['length_cm','箱长','Length','cm'],['width_cm','箱宽','Width','cm'],
              ['height_cm','箱高','Height','cm'],['gross_weight_kg','毛重','Gross','kg'],
              ['net_weight_kg','箱净重','Net','kg'],['units','每箱件数','Units','件']
            ] as const).map(([key,zh,en,unit])=><React.Fragment key={key}>
              {numeric(en,zh,box[key],x=>update({packaging:(specs.packaging||[]).map((c,j)=>j===i?{...c,[key]:x}:c)}),unit)}
            </React.Fragment>)}
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {([['packing_method','包装方式','Packing method'],['protection_notes','包装保护要点','Protection notes']] as const).map(([key,zh,en])=>
              <label key={key}><span className={titleClass}>{T(en,zh)}</span>
                <input className={inputClass} value={box[key]||''} onChange={e=>
                  update({packaging:(specs.packaging||[]).map((c,j)=>j===i?{...c,[key]:e.target.value}:c)})}/></label>)}
          </div></div>)}
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <label><span className={titleClass}>{T('Assembly needed','是否需要组装')}</span>
          <select className={inputClass} value={specs.assembly?.required===undefined?'':String(specs.assembly.required)}
            onChange={e=>update({assembly:{...specs.assembly,required:e.target.value===''?undefined:e.target.value==='true'}})}>
            <option value="">{T('Not supplied','未填写')}</option><option value="true">{T('Yes','需要')}</option><option value="false">{T('No','不需要')}</option></select></label>
        {numeric('Assembly time','预计组装时间',specs.assembly?.minutes,
          x=>update({assembly:{...specs.assembly,minutes:x}}),'min')}
        <label className="md:col-span-2"><span className={titleClass}>{T('Instructions PDF file name','安装说明文件名 / PDF')}</span>
          <input className={inputClass} value={specs.assembly?.instructions_file||''}
            onChange={e=>update({assembly:{...specs.assembly,instructions_file:e.target.value}})}/></label>
        {textField('care_en','Care instructions (English)','保养说明（英文）','Wipe with a soft damp cloth',true)}
        {textField('warnings_en','Warnings / usage limits','安全警示 / 使用限制','',true)}
      </div>
    </details>

    <details className={groupClass}>
      {detailsHeader('06','Attachments & supporting evidence','附件与技术验证证据','文件名 ≠ 已上传')}
      <div className="space-y-2">
        <p className="text-sm font-semibold">{T('Usage of uploaded product photos','已上传图片的用途分类')}</p>
        {!images.length&&<p className="text-xs text-stone-500">{T('Upload images in the manager below first.','请先在下方图片管理器上传产品图片。')}</p>}
        {images.map((url,i)=><div key={url+'-'+i} className="grid grid-cols-[64px_1fr] items-center gap-3 rounded border bg-white p-2">
          <img src={url} alt="" className="h-14 w-14 rounded object-cover" />
          <label className="block"><span className={titleClass}>{T('Photo role','图片用途')} {i+1}{i===0?' · '+T('Main image','主图'):''}</span>
            <select className={inputClass} disabled={i===0} value={i===0?'main':(specs.media_roles?.[url]||'detail')}
              onChange={e=>update({media_roles:{...specs.media_roles,[url]:e.target.value as 'lifestyle'|'detail'|'dimension'|'material'|'packaging'}})}>
              <option value="main">{T('Main image','主图')}</option>
              <option value="lifestyle">{T('Lifestyle','场景图')}</option>
              <option value="detail">{T('Detail','细节图')}</option>
              <option value="dimension">{T('Dimension diagram','尺寸图')}</option>
              <option value="material">{T('Material closeup','材质特写')}</option>
              <option value="packaging">{T('Packaging','包装图')}</option>
            </select>
          </label>
        </div>)}
        <p className="text-xs text-stone-500">{T('Image #1 remains the official main image. Reorder photos in the existing image manager.',
          '第 1 张图仍是官方主图。需要更换主图，请在下方图片管理器调整顺序。')}</p>
      </div>
      <p className="text-xs text-stone-500">{T('Register a filename first. The current image manager below still performs actual R2 image uploads; these records do not upload documents automatically.',
        '先登记文件名。下方原图片管理器仍负责 R2 图片上传；这里登记的文件不会自动上传。')}</p>
      <div className="space-y-2">
        {(specs.attachments||[]).map((a,i)=><div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_130px_120px_auto] gap-2 items-end">
          <label><span className={titleClass}>{T('File name','文件名')}</span><input className={inputClass} value={a.file_name}
            onChange={e=>update({attachments:(specs.attachments||[]).map((x,j)=>j===i?{...x,file_name:e.target.value}:x)})}/></label>
          <label><span className={titleClass}>{T('File type','用途')}</span>
            <select className={inputClass} value={a.type} onChange={e=>update({attachments:(specs.attachments||[]).map((x,j)=>j===i?{...x,type:e.target.value as typeof x.type}:x)})}>
              <option value="dimension">{T('Dimension','尺寸图')}</option><option value="assembly">{T('Assembly','安装文件')}</option>
              <option value="certificate">{T('Certificate','证明文件')}</option><option value="other">{T('Other','其他')}</option></select></label>
          <label><span className={titleClass}>{T('Visibility','可见范围')}</span>
            <select className={inputClass} value={a.visibility} onChange={e=>update({attachments:(specs.attachments||[]).map((x,j)=>j===i?{...x,visibility:e.target.value as typeof x.visibility}:x)})}>
              <option value="internal">{T('Internal','内部')}</option><option value="public">{T('Public candidate','建议公开')}</option></select></label>
          <button type="button" className="p-2 text-xs text-red-700" onClick={()=>update({attachments:(specs.attachments||[]).filter((_,j)=>j!==i)})}>{T('Remove','删除')}</button>
        </div>)}
        <button type="button" className="rounded border border-stone-300 px-3 py-1 text-xs" onClick={()=>update({attachments:[...(specs.attachments||[]),{file_name:'',type:'dimension',visibility:'internal'}]})}>
          + {T('Add attachment','添加附件')}
        </button>
      </div>
      <div className="space-y-3 border-t border-stone-200 pt-4">
        <p className="text-sm font-semibold">{T('Verified technical claims','技术性能与认证核实')}</p>
        {(specs.verification||[]).map((v,i)=><div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_140px_auto] gap-2 items-end">
          <label><span className={titleClass}>{T('Claim','验证项目')}</span><input className={inputClass} value={v.claim}
            onChange={e=>update({verification:(specs.verification||[]).map((x,j)=>j===i?{...x,claim:e.target.value}:x)})}/></label>
          <label><span className={titleClass}>{T('Evidence file','证据文件名')}</span><input className={inputClass} value={v.evidence_file||''}
            onChange={e=>update({verification:(specs.verification||[]).map((x,j)=>j===i?{...x,evidence_file:e.target.value}:x)})}/></label>
          <label><span className={titleClass}>{T('Verification','核实状态')}</span>
            <select className={inputClass} value={v.status} onChange={e=>update({verification:(specs.verification||[]).map((x,j)=>j===i?{...x,status:e.target.value as typeof x.status}:x)})}>
              <option value="unverified">{T('Unverified','待核实')}</option><option value="verified">{T('Verified','有证据')}</option>
              <option value="not_applicable">{T('N/A','不适用')}</option></select></label>
          <button type="button" className="p-2 text-xs text-red-700" onClick={()=>update({verification:(specs.verification||[]).filter((_,j)=>j!==i)})}>{T('Remove','删除')}</button>
        </div>)}
        <button type="button" className="rounded border border-stone-300 px-3 py-1 text-xs" onClick={()=>update({verification:[...(specs.verification||[]),{claim:'',status:'unverified'}]})}>
          + {T('Add verification','添加验证项目')}
        </button>
      </div>
    </details>

    <details className={groupClass}>
      {detailsHeader('07','Source & review ownership','资料来源与复核人','仅后台')}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {([['source_factory','来源工厂','Source factory'],['provider','资料提供人','Data provider'],['reviewer','工厂复核人','Factory reviewer']] as const).map(([key,zh,en])=>
          <label key={key}><span className={titleClass}>{T(en,zh)}</span><input className={inputClass}
            value={specs.provenance?.[key]||''}
            onChange={e=>update({provenance:{...specs.provenance,[key]:e.target.value}})}/></label>)}
      </div>
      <p className="text-xs text-stone-500">{T('Uploader identity and approval actions are logged by the system. These optional source fields do not grant permissions.',
        '上传账号及审批人由系统自动记录，以上仅用于填写原始资料来源，不代表账号权限。')}</p>
    </details>
  </section>;
};

export default ProductSpecificationsEditor;
