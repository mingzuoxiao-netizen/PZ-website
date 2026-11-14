import React from 'react';
import {resolveImage} from '../../../utils/imageResolver';
import {preflightProduct} from '../../../utils/productPreflight.js';

type ProductSnapshot=Record<string,unknown>;
type PreflightWarning={field?:string;code?:string;zh?:string;en?:string};

const stringValue=(value:unknown):string=>typeof value==='string'?value.trim():'';
const parseValue=(value:unknown):unknown=>{
  if(typeof value!=='string')return value;
  try{return JSON.parse(value);}catch{return value;}
};
export const reviewSizeLabel=(size:unknown,rawDimensions:unknown):string=>{
  const value=stringValue(size);
  if(value)return value;
  const parsed=parseValue(rawDimensions);
  const dimensions=parsed&&typeof parsed==='object'&&!Array.isArray(parsed)
    ?parsed as Record<string,unknown>:{};
  const parts=['length','width','thickness' in dimensions?'thickness':'height']
    .map(key=>dimensions[key]);
  return parts.every(n=>typeof n==='number'&&Number.isFinite(n)&&n>0)
    ?parts.join(' × ')+' cm':'未填写';
};

export const supervisorReviewFacts=(snapshot:ProductSnapshot)=>{
  const specifications=parseValue(snapshot.specifications||snapshot.specs_json||{});
  const specs=specifications&&typeof specifications==='object'&&!Array.isArray(specifications)
    ?specifications as Record<string,unknown>:{};
  const dimensions=specs.dimensions_cm&&typeof specs.dimensions_cm==='object'
    ?specs.dimensions_cm as Record<string,unknown>:{};
  const imageValue=parseValue(snapshot.images);
  const images=Array.isArray(imageValue)?imageValue.filter((url):url is string=>typeof url==='string'&&!!url.trim()):[];
  const siteValue=parseValue(snapshot.production_sites);
  const rawSites=Array.isArray(siteValue)?siteValue:typeof siteValue==='string'&&siteValue?siteValue.split(','):[];
  const sites=rawSites.map(site=>String(site).trim()).filter(Boolean)
    .map(site=>site==='zhaoqing'?'肇庆':site==='cambodia'?'柬埔寨':site);
  const confirmed=Array.isArray(snapshot.preflight_warnings)?snapshot.preflight_warnings as PreflightWarning[]:[];
  // The same shared rules already run in the editor and the Worker. This is a
  // read-only display of the submitted snapshot, not a second approval gate.
  const preflight=preflightProduct({...snapshot,images,specifications:specs});
  return {
    category:stringValue(snapshot.category)||'未填写',
    material:stringValue(snapshot.material)||'未填写',
    size:reviewSizeLabel(snapshot.size,dimensions),
    finish:stringValue(snapshot.finish)||'未填写',
    sites:sites.filter(Boolean).join('、')||'未填写',
    images,
    errors:preflight.errors,
    warnings:preflight.warnings,
    reviewFlags:sites.length?[]:['生产基地未填写，请确认工厂归属'],
    confirmed
  };
};

const SupervisorReviewSummary:React.FC<{snapshot:ProductSnapshot;isFirstSubmission:boolean}>=
  ({snapshot,isFirstSubmission})=>{
  const facts=supervisorReviewFacts(snapshot);
  const issues=facts.errors.concat(facts.warnings);
  const needsAttention=issues.length+facts.reviewFlags.length;
  return <section aria-label="主管审核摘要" className="rounded border border-sky-200 bg-sky-50/40 p-3 sm:p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h4 className="text-sm font-semibold text-stone-900">主管审核摘要</h4>
      <span className="rounded bg-white px-2 py-1 text-xs text-stone-600">{isFirstSubmission?'首次提交':'修改 / 复检'}</span>
    </div>
    <p className="mt-1 text-xs leading-5 text-stone-600">先核对关键规格和图片；完整字段、技术附件及历史记录仍可展开查看。</p>
    <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
        {([
          ['分类',facts.category],['材质',facts.material],['尺寸',facts.size],
          ['生产基地',facts.sites],['表面处理',facts.finish],['图片',facts.images.length+' 张']
        ] as [string,string][]).map(([label,value])=><div key={label} className="min-w-0">
          <dt className="text-xs text-stone-500">{label}</dt>
          <dd className="mt-1 break-words font-medium text-stone-900">{value}</dd>
        </div>)}
      </dl>
      {facts.images.length>0&&<div aria-label="审核图片预览" className="flex max-w-[160px] flex-wrap content-start gap-1">
        {facts.images.slice(0,4).map((url,index)=><a key={url+'-'+index} href={resolveImage(url)} target="_blank" rel="noopener noreferrer"
          title={'查看第 '+(index+1)+' 张原图'} aria-label={'审核图片 '+(index+1)}
          className="block h-[72px] w-[72px] overflow-hidden rounded border border-stone-300 bg-white">
          <img src={resolveImage(url)} alt={'产品审核图片 '+(index+1)} loading="lazy" className="h-full w-full object-cover"/>
        </a>)}
        {facts.images.length>4&&<span className="text-[11px] text-stone-500">还有 {facts.images.length-4} 张，展开详情核对</span>}
      </div>}
    </div>
    <div className={'mt-3 rounded border p-3 text-xs '+(facts.errors.length?'border-red-300 bg-red-50 text-red-900':
      needsAttention?'border-amber-300 bg-amber-50 text-amber-900':'border-green-200 bg-green-50 text-green-900')}>
      <strong>{facts.errors.length?`辅助预检发现 ${facts.errors.length} 项待修正问题`:
        needsAttention?`辅助预检提示 ${needsAttention} 项需人工核对`:'基础字段规则检查未发现问题'}</strong>
      {needsAttention>0&&<ul className="mt-2 list-disc space-y-1 pl-4">
        {issues.slice(0,4).map((issue,index)=><li key={issue.code+'-'+issue.field+'-'+index}>{issue.zh}</li>)}
        {facts.reviewFlags.map(flag=><li key={flag}>{flag}</li>)}
        {issues.length>4&&<li>另有 {issues.length-4} 项，请展开完整资料检查。</li>}
      </ul>}
      {facts.confirmed.length>0&&<p className="mt-2">员工已确认的预检提醒：{facts.confirmed.map(w=>w.zh||w.code||w.field).join('；')}</p>}
      <p className="mt-2 opacity-80">此处只辅助定位异常，不会自动通过审核；材质、尺寸和图片真实性仍由主管确认。</p>
    </div>
  </section>;
};

export default SupervisorReviewSummary;
