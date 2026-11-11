import React from 'react';
import {resolveImage} from '../../../utils/imageResolver';

const fields:[string,string][]=[['code','SKU'],['name','英文名称'],['name_cn','中文名称'],
  ['category','分类'],['sub_category','产品系列'],['material','材质'],['size','尺寸'],
  ['finish','表面处理'],['description','英文描述'],['description_cn','中文描述'],
  ['images','产品图片'],['production_sites','生产基地']];
export const renderProductValue=(key:string,input:unknown):React.ReactNode=>{
  let parsed=input;
  if(['images','production_sites'].includes(key)&&typeof input==='string'){
    try{parsed=JSON.parse(input);}catch{parsed=input;}
  }
  if(key==='images'&&Array.isArray(parsed))return <div className="flex flex-wrap gap-2">
    {parsed.filter((x):x is string=>typeof x==='string'&&!!x).map((url,index)=><a key={index}
      href={resolveImage(url)} target="_blank" rel="noopener noreferrer" aria-label={'查看产品图片 '+(index+1)}>
      <img src={resolveImage(url)} alt={'产品图片 '+(index+1)} loading="lazy" className="h-20 w-20 rounded border object-cover"/>
    </a>)}
    {!parsed.length&&<span>暂无图片</span>}
  </div>;
  if(key==='production_sites'&&Array.isArray(parsed))return parsed.map(site=>site==='zhaoqing'?'肇庆':site==='cambodia'?'柬埔寨':String(site)).join('、')||'未填写';
  return <span className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
    {parsed===undefined||parsed===null||parsed===''?'未填写':typeof parsed==='object'?JSON.stringify(parsed):String(parsed)}
  </span>;
};

const ProductChangeSummary:React.FC<{original:Record<string,unknown>;proposed:Record<string,unknown>;isNew?:boolean}>=
  ({original,proposed,isNew=false})=>{
  const visible=isNew?fields:fields.filter(([key])=>JSON.stringify(original[key])!==JSON.stringify(proposed[key]));
  const specsChanged=JSON.stringify(original.specifications||{})!==JSON.stringify(proposed.specifications||{});
  return <div className="space-y-3" aria-label={isNew?'新品提交资料':'产品字段差异'}>
    <p className="text-sm font-semibold">{isNew?'新品提交资料':`本次修改 ${visible.length} 项公开字段`}</p>
    {!visible.length&&<p className="text-sm text-stone-500">公开字段没有变化。{specsChanged?'内部技术资料有更新，请按需核对。':''}</p>}
    {visible.map(([key,label])=><div key={key} className="rounded border border-stone-200 p-3">
      <p className="mb-2 text-xs font-semibold text-stone-700">{label}</p>
      <div className={isNew?'text-sm':'grid gap-3 text-sm sm:grid-cols-2'}>
        {!isNew&&<div className="min-w-0"><p className="mb-1 text-xs text-stone-500">修改前</p>{renderProductValue(key,original[key])}</div>}
        <div className="min-w-0">{!isNew&&<p className="mb-1 text-xs text-stone-500">申请修改为</p>}{renderProductValue(key,proposed[key])}</div>
      </div>
    </div>)}
    {(isNew||specsChanged)&&<details className="rounded border p-3">
      <summary className="cursor-pointer text-sm font-semibold">内部技术与包装资料</summary>
      <p className="my-2 text-xs text-stone-500">内部资料不作为公开网站内容自动发布。</p>
      <pre className="overflow-auto whitespace-pre-wrap break-all text-xs">{JSON.stringify(proposed.specifications||{},null,2)}</pre>
    </details>}
  </div>;
};
export default ProductChangeSummary;
