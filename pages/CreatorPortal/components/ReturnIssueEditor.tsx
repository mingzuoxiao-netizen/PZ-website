import React from 'react';
import type { ReturnIssue } from '../../../utils/reviewReturn.mjs';

export const RETURN_FIELD_OPTIONS=[
  ['images','产品图片'],['name','英文名称'],['name_cn','中文名称'],
  ['material','主要材质'],['description','英文描述'],['description_cn','中文描述'],
  ['category','产品分类'],['sub_category','产品子类'],['finish','表面处理'],
  ['dimensions_cm.length','长度（cm）'],['dimensions_cm.width','宽度（cm）'],
  ['dimensions_cm.height','高度（cm）'],['dimensions_cm.thickness','厚度（cm）'],
  ['media_roles','图片用途'],['specifications','其他技术资料'],['production_sites','生产基地']
] as const;
export const defaultReturnIssue=():ReturnIssue=>({field:'images',message:''});
export function returnIssuesComplete(value:ReturnIssue[]):boolean {
  return value.length>0&&value.length<=20&&
    new Set(value.map(item=>item.field)).size===value.length &&
    value.every(item=>item.field&&item.message.trim().length>=3&&item.message.trim().length<=500);
}
const ReturnIssueEditor:React.FC<{
  issues:ReturnIssue[];
  onChange:(items:ReturnIssue[])=>void;
  disabled?:boolean;
}>=({issues,onChange,disabled=false})=>{
  const patch=(index:number,part:Partial<ReturnIssue>)=>
    onChange(issues.map((item,i)=>i===index?{...item,...part}:item));
  return <div className="space-y-3" aria-label="退回字段明细">
    <p className="text-xs text-stone-600">逐项指定需要修改的字段和原因（必填）。整体备注可选。</p>
    {issues.map((issue,i)=><div key={i} className="grid gap-2 rounded border border-amber-200 bg-amber-50 p-3 sm:grid-cols-[minmax(150px,1fr)_2fr_auto]">
      <label className="text-xs font-semibold">字段
        <select aria-label={'退回字段 '+(i+1)} value={issue.field} disabled={disabled}
          onChange={event=>patch(i,{field:event.target.value})}
          className="mt-1 block w-full rounded border bg-white p-2 text-sm">
          {RETURN_FIELD_OPTIONS.map(([value,label])=>
            <option value={value} key={value}>{label}</option>)}
        </select>
      </label>
      <label className="text-xs font-semibold">修改要求
        <textarea aria-label={'字段修改原因 '+(i+1)} rows={2} value={issue.message}
          maxLength={500} disabled={disabled}
          onChange={event=>patch(i,{message:event.target.value})}
          className="mt-1 block w-full rounded border bg-white p-2 text-sm"
          placeholder="说明此字段需要怎样修改（至少3字）"/>
      </label>
      <button type="button" disabled={disabled||issues.length===1} className="self-end rounded border px-3 py-2 text-xs"
        onClick={()=>onChange(issues.filter((_,j)=>j!==i))}>删除</button>
    </div>)}
    <button type="button" disabled={disabled||issues.length>=20}
      onClick={()=>onChange([...issues,{field:RETURN_FIELD_OPTIONS.find(([key])=>!issues.some(item=>item.field===key))?.[0]||'images',message:''}])}
      className="rounded border border-stone-300 px-3 py-2 text-xs">+ 添加需要修改的字段</button>
    {!returnIssuesComplete(issues)&&<p className="text-xs text-amber-800">至少填写一个字段及具体原因，字段不可重复。</p>}
  </div>;
};
export default ReturnIssueEditor;
