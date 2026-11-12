import React,{useEffect,useMemo,useState} from 'react';
import {FileSpreadsheet,Upload,AlertTriangle,Download,CheckCircle} from 'lucide-react';
import type {Category} from '../../../types';
import type {MappedRow,ImportIssue,ImportRow} from '../../../utils/bulkImportCore.mjs';
import {attributesForCategory} from '../../../utils/productSpecifications';
import {
  templateColumns,csvTemplate,parseCsv,mapImportRow,attachImageRoles,
  matchImageFilename,errorReportCsv,normalizeSku,IMPORT_LIMIT
} from '../../../utils/bulkImportCore.mjs';
import {adminFetch} from '../../../utils/adminFetch';
import {factoryFetch} from '../../../utils/factoryFetch';

type Role='ADMIN'|'FACTORY';
type Operator={id:string;username:string;department_id?:string};
type Result={batch_id:string;owner_id:string;inserted:number;skipped:number;failed:number;
  completed:boolean;already_processed?:boolean;
  rows:{row:number;code:string;disposition:'imported'|'existing'|'invalid';reason?:string;issues?:ImportIssue[]}[]};
type Asset={file:File;code:string;role:string};
const saveText=(name:string,value:string)=>{
  const url=URL.createObjectURL(new Blob([value],{type:'text/csv;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download=name;
  document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
};
const BulkCsvImporter:React.FC<{
 role:Role;categories:Category[];onCompleted?:(batchId:string)=>void|Promise<void>
}>=({role,categories,onCompleted})=>{
  const [category,setCategory]=useState(categories[0]?.id||'');
  const [operators,setOperators]=useState<Operator[]>([]);
  const [owner,setOwner]=useState('');
  const [records,setRecords]=useState<ImportRow[]>([]);
  const [filename,setFilename]=useState('');
  const [assets,setAssets]=useState<Asset[]>([]);
  const [assetErrors,setAssetErrors]=useState<ImportIssue[]>([]);
  const [uploaded,setUploaded]=useState<Record<string,{url:string;role:string}[]>>({});
  const [existing,setExisting]=useState<string[]>([]);
  const [existingChecked,setExistingChecked]=useState(false);
  const [uploadBusy,setUploadBusy]=useState(false);
  const [progress,setProgress]=useState('');
  const [importBusy,setImportBusy]=useState(false);
  const [server,setServer]=useState<Result|null>(null);
  const [error,setError]=useState('');
  const [batch,setBatch]=useState('');
  const api=<T,>(endpoint:string,options?:RequestInit):Promise<T>=>
    role==='ADMIN'?adminFetch<T>(endpoint,options):factoryFetch<T>(endpoint,options);
  useEffect(()=>{
    if(role!=='ADMIN')return;
    let live=true;
    void adminFetch<{operators:Operator[]}>('admin/products/import-operators')
      .then(res=>{if(live){setOperators(res.operators||[]);setOwner(old=>old||res.operators?.[0]?.id||'');}})
      .catch(e=>{if(live)setError('导入操作员列表不可用：'+(e?.message||'请检查导入功能开关和 D1 迁移'));});
    return()=>{live=false;};
  },[role]);
  const choice=categories.find(x=>x.id===category);
  const label=choice?.title||category;
  const columns=useMemo(()=>templateColumns(attributesForCategory(label).map(x=>x.key)),[label]);
  const parsed=useMemo(()=>records.map(row=>{
    const base=mapImportRow(row);
    const assigned=attachImageRoles(base,uploaded[base.code]||[]);
    const problems=[...assigned.issues];
    if(existing.includes(base.code))problems.push({
      row:row.row,field:'code',severity:'error' as const,message:'SKU 已存在：不会覆盖已有产品'
    });
    const dup=records.filter(x=>normalizeSku(x.cells.code)===base.code).length;
    if(dup>1&&records.find(x=>normalizeSku(x.cells.code)===base.code)?.row!==row.row)
      problems.push({row:row.row,field:'code',severity:'error' as const,message:'CSV 中有重复 SKU'});
    return {...assigned,issues:problems,valid:!problems.some(x=>x.severity==='error')} as MappedRow;
  }),[records,uploaded,existing]);
  const totalIssues=useMemo(()=>{
    const serverIssues=(server?.rows||[]).filter(row=>row.disposition!=='imported')
      .map(row=>({row:row.row,field:'code',severity:'error' as const,
        message:row.reason||'该行未创建产品'}));
    return [...parsed.flatMap(row=>row.issues),...assetErrors,...serverIssues];
  },[parsed,assetErrors,server]);
  const ready=parsed.filter(row=>row.valid);
  const readCsv=async(file?:File)=>{
    setError('');setServer(null);setUploaded({});setAssets([]);setAssetErrors([]);
    setExisting([]);setExistingChecked(false);
    if(!file){setRecords([]);setFilename('');return;}
    if(!/\.csv$/i.test(file.name)){setError('目前支持 UTF-8 CSV。请先在 Excel 中另存为 CSV UTF-8 文件。');return;}
    if(file.size>5_000_000){setError('CSV 文件不能超过 5 MB。');return;}
    try{
      const data=parseCsv(await file.text());
      setRecords(data.rows);setFilename(file.name);
      if(data.rows.length===0)setError('文件只有示例行；请按模板填写自己的产品，再上传。');
      else{
        const codes=[...new Set(data.rows.map(x=>normalizeSku(x.cells.code)))].filter(x=>/^PZ-[A-Z0-9][A-Z0-9_-]{1,39}$/.test(x));
        const matches:string[]=[];
        for(let i=0;i<codes.length;i+=30){
          const chunk=codes.slice(i,i+30);
          const found=await api<{existingCodes?:string[]}>('factory/products/check-skus',{
            method:'POST',body:JSON.stringify({codes:chunk})
          });
          matches.push(...(found.existingCodes||[]));
        }
        setExisting(matches.map(normalizeSku));setExistingChecked(true);
      }
    }catch(e:any){setRecords([]);setError('CSV 解析或 SKU 查重失败：'+(e?.message||'请重试'));}
  };
  const chooseImages=(fileList:FileList|null)=>{
    if(!fileList)return;
    setUploaded({});setAssetErrors([]);setServer(null);
    const next:Asset[]=[],issues:ImportIssue[]=[];
    const skuSet=new Set(records.map(row=>normalizeSku(row.cells.code)));
    const seen=new Set<string>();
    const files=Array.from(fileList);
    if(files.length>1200){setError('单批最多选择 1200 张图片；请拆分导入。');return;}
    for(const file of files){
      const match=matchImageFilename(file.name);
      if(!match){
        issues.push({row:0,field:'image filename',severity:'warning',
          message:'文件名不匹配 {SKU}__{role}.jpg：'+file.name});continue;
      }
      if(!skuSet.has(match.code)){
        issues.push({row:0,field:'image SKU',severity:'warning',
          message:'图片没有匹配 CSV 中的 SKU：'+file.name});continue;
      }
      if(!/\.(jpe?g|png|webp)$/i.test(file.name)||file.size>15*1024*1024||file.size===0){
        issues.push({row:0,field:'image file',severity:'error',
          message:'图片类型或大小不符合上传要求：'+file.name});continue;
      }
      if(seen.has(file.name.toLowerCase())){
        issues.push({row:0,field:'image filename',severity:'warning',message:'重复图片文件名：'+file.name});continue;
      }
      seen.add(file.name.toLowerCase());
      next.push({...match,file});
    }
    setAssets(next);setAssetErrors(issues);
  };
  const uploadImages=async()=>{
    setUploadBusy(true);setError('');setProgress('正在上传图片到 R2…');
    const grouped:Record<string,{url:string;role:string}[]>={};
    const errors=[...assetErrors];
    for(let i=0;i<assets.length;i++){
      const asset=assets[i];
      setProgress('上传图片 '+(i+1)+' / '+assets.length+'：'+asset.file.name);
      try{
        const form=new FormData();form.append('file',asset.file);
        const result=await api<{url?:string}>('upload-image',{method:'POST',body:form});
        if(!result?.url)throw Error('上传没有返回 URL');
        (grouped[asset.code]??=[]).push({url:result.url,role:asset.role});
      }catch(e:any){errors.push({row:0,field:'image upload',severity:'error',
        message:asset.file.name+'：'+(e?.message||'上传失败')});}
    }
    setUploaded(grouped);setAssetErrors(errors);
    setProgress('已上传 '+Object.values(grouped).reduce((n,list)=>n+list.length,0)+' 张图片。');
    setUploadBusy(false);
  };
  const confirm=async()=>{
    if(importBusy||uploadBusy||!existingChecked||!ready.length||!filename)return;
    if(role==='ADMIN'&&!owner){setError('请先选择接收草稿的工厂操作员。');return;}
    if(assets.length&&Object.values(uploaded).reduce((n,list)=>n+list.length,0)===0){
      setError('请先上传所选择的图片，或者清除图片选择后只导入无图草稿。');return;
    }
    if(!window.confirm('确认将 '+ready.length+' 条有效记录保存为草稿？不会提交审核或发布到官网。'))return;
    const batchId=batch||crypto.randomUUID();
    setBatch(batchId);setImportBusy(true);setError('');
    try{
      const rows=records.filter(row=>ready.some(v=>v.row===row.row)).map(row=>({
        row:row.row,cells:row.cells,images:uploaded[normalizeSku(row.cells.code)]||[]
      }));
      const res=await api<Result>(role==='ADMIN'?'admin/products/import-drafts':'factory/products/import-drafts',{
        method:'POST',body:JSON.stringify({batch_id:batchId,owner_id:role==='ADMIN'?owner:undefined,rows})
      });
      if(!res.completed)throw Error('Worker 未确认批次完成，请先查询批次编号');
      setServer(res);setProgress('批次 '+res.batch_id+'：新增 '+res.inserted+' / 已存在 '+res.skipped+' / 无效 '+res.failed);
      await onCompleted?.(res.batch_id);
    }catch(e:any){setError('导入结果尚未确认：'+(e?.message||'请核对批次编号后再重试'));}finally{setImportBusy(false);}
  };
  const reset=()=>{setRecords([]);setFilename('');setAssets([]);setUploaded({});
    setExisting([]);setExistingChecked(false);setServer(null);setError('');setBatch('');setAssetErrors([]);};
  return <section className="space-y-5" aria-label="CSV 批量导入产品草稿">
    <header className="rounded border border-stone-200 bg-white p-5">
      <h2 className="flex items-center gap-2 font-serif text-xl font-semibold"><FileSpreadsheet size={21}/> Excel / CSV 批量导入</h2>
      <p className="mt-2 text-sm text-stone-600">
        支持 Excel「另存为 CSV UTF-8」后的文件，一批最多 {IMPORT_LIMIT} 条。先预检后导入；
        <strong>仅保存为草稿</strong>，不会自动提交审核、覆盖 SKU 或直接发布。
      </p>
    </header>
    <div className="rounded border bg-white p-5 space-y-3">
      <label className="block text-sm font-semibold">模板适用产品类别
        <select value={category} onChange={e=>setCategory(e.target.value)} className="mt-1 w-full rounded border p-2">
          {categories.map(cat=><option key={cat.id} value={cat.id}>{cat.title_cn||cat.title}</option>)}
        </select>
      </label>
      <button type="button" onClick={()=>saveText('PZ-product-import-template.csv',csvTemplate(columns,category||'dining-table'))}
        className="flex items-center gap-2 rounded border border-stone-400 px-4 py-2 text-sm">
        <Download size={16}/> 下载 UTF-8 CSV 模板（含示例行和单位说明）
      </button>
      <p className="text-xs text-stone-600">模板字段依据现有产品字段与该类别技术属性生成。标记 __example=YES 的示例行不会被导入。</p>
      {role==='ADMIN'&&<label className="block text-sm font-semibold">导入归属操作员（必须是已分配主管的在职员工）
        <select value={owner} onChange={e=>setOwner(e.target.value)} className="mt-1 w-full rounded border p-2">
          {!operators.length&&<option value="">没有可用的操作员</option>}
          {operators.map(op=><option value={op.id} key={op.id}>{op.username}</option>)}
        </select>
      </label>}
      <label className="block text-sm font-semibold">第一步：选择 CSV 文件
        <input type="file" accept=".csv,text/csv" onChange={e=>void readCsv(e.target.files?.[0])}
          className="mt-1 block w-full rounded border p-3 text-xs"/>
      </label>
      {!!filename&&<p className="text-sm">已解析：{filename} · {records.length} 行（示例行已排除）</p>}
      {!!records.length&&<label className="block text-sm font-semibold">第二步：按 SKU__角色 上传 JPG/PNG/WebP 产品图片
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple
          onChange={e=>chooseImages(e.target.files)}
          className="mt-1 block w-full rounded border p-3 text-xs"/>
        <span className="mt-1 block text-xs font-normal text-stone-500">
          例如 PZ-CHAIR-001__main.jpg、PZ-CHAIR-001__lifestyle.jpg；角色 main/lifestyle/detail/material/dimension/packaging。
          无图片也可先存草稿，但不能通过后续提交预检。
        </span>
      </label>}
      {!!assets.length&&<button type="button" disabled={uploadBusy||importBusy||!!server}
        onClick={()=>void uploadImages()} className="flex items-center gap-2 rounded border px-4 py-2 text-sm disabled:opacity-50">
        <Upload size={16}/> {uploadBusy?'正在上传…':'将 '+assets.length+' 张匹配图片上传到 R2'}
      </button>}
      {progress&&<p role="status" className="text-sm text-stone-700">{progress}</p>}
    </div>
    {!!records.length&&<div className="rounded border bg-white p-5">
      <h3 className="font-semibold">第三步：机器预检与导入预览</h3>
      <p className="mt-1 text-sm text-stone-600">
        可导入草稿 {ready.length} / {records.length}；已存在 SKU {existing.length}。
        检查规则与产品编辑器预检一致，图片不足只允许保存草稿，后续提交审核仍会被拦截。
      </p>
      <div className="mt-3 max-h-96 overflow-auto">
        <table className="w-full min-w-[540px] text-left text-xs">
          <thead><tr className="border-b bg-stone-50"><th className="p-2">行</th><th className="p-2">SKU</th><th className="p-2">名称</th><th className="p-2">图片</th><th className="p-2">状态</th></tr></thead>
          <tbody>{parsed.map(row=><tr key={row.row} className="border-b">
            <td className="p-2">{row.row}</td><td className="p-2">{row.code}</td>
            <td className="p-2">{row.product.name}</td><td className="p-2">{row.product.images.length}</td>
            <td className="p-2">{!row.valid?'跳过（字段错误/重复 SKU）':row.issues.length?'可存草稿 · 待补充':'可导入'}</td>
          </tr>)}</tbody>
        </table>
      </div>
      {!!totalIssues.length&&<p className="mt-3 text-xs text-amber-800">
        当前报告有 {totalIssues.filter(x=>x.severity==='error').length} 条错误、
        {totalIssues.filter(x=>x.severity==='warning').length} 条待补充提醒。
      </p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={()=>saveText('PZ-import-errors.csv',errorReportCsv(totalIssues))}
          className="flex items-center gap-2 rounded border px-4 py-2 text-sm"><Download size={15}/> 下载错误报告</button>
        <button type="button" disabled={!ready.length||importBusy||uploadBusy||!existingChecked||!!server||
          (role==='ADMIN'&&!owner)}
          onClick={()=>void confirm()}
          className="flex items-center gap-2 rounded bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-40">
          <CheckCircle size={16}/> {importBusy?'正在创建草稿…':'确认导入 '+ready.length+' 条有效草稿'}
        </button>
      </div>
    </div>}
    {error&&<p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {server&&<div role="status" className="space-y-2 rounded border border-emerald-300 bg-emerald-50 p-4 text-sm">
      <p className="font-semibold">批次已完成：新增 {server.inserted}、跳过已有 {server.skipped}、失败 {server.failed}，正式发布 0。</p>
      <p className="text-xs">批次编号：<code>{server.batch_id}</code>（可在产品总库筛选）</p>
      <button type="button" onClick={reset} className="rounded border px-3 py-2 text-xs">开始下一批导入</button>
    </div>}
    {!records.length&&<p className="flex items-center gap-2 text-sm text-stone-600">
      <AlertTriangle size={16}/> CSV 仅生成草稿，后续仍需主管及 Admin 审核。
    </p>}
  </section>;
};
export default BulkCsvImporter;
