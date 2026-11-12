import React,{useEffect,useMemo,useRef,useState} from 'react';
import {FileArchive,FolderOpen,Images,Download,ShieldCheck,RefreshCw,CheckCircle2} from 'lucide-react';
import type {Category} from '../../../types';
import type {ImportIssue,MappedRow} from '../../../utils/bulkImportCore.mjs';
import type {ZipProductBatch,ZipProductImage} from '../../../utils/zipXlsxImport.mjs';
import {normalizeSku,errorReportCsv} from '../../../utils/bulkImportCore.mjs';
import {readProductZip,disposePreviews,createZipTemplate} from '../../../utils/zipXlsxImport.mjs';
import {attributesForCategory} from '../../../utils/productSpecifications';
import {adminFetch} from '../../../utils/adminFetch';
import {factoryFetch} from '../../../utils/factoryFetch';

type Role='ADMIN'|'FACTORY';
type Operator={id:string;username:string;department_id?:string};
type Result={batch_id:string;owner_id:string;inserted:number;skipped:number;failed:number;
  completed:boolean;already_processed?:boolean;
  rows:{row:number;code:string;disposition:'imported'|'existing'|'invalid';reason?:string}[]};
const IMAGE_OPTIONS=[
  ['lifestyle','产品展示 / 场景'],['detail','细节图'],['material','材质图'],
  ['dimension','尺寸图'],['packaging','包装图']
] as const;
const download=(name:string,bytes:Uint8Array|string,type:string)=>{
  const blob=new Blob([typeof bytes==='string'?bytes:new Uint8Array(bytes)],{type});
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
};
const BulkZipImporter:React.FC<{
  role:Role;categories:Category[];onCompleted?:(batchId:string)=>void|Promise<void>
}>=({role,categories,onCompleted})=>{
  const [category,setCategory]=useState(categories[0]?.id||'');
  const [operators,setOperators]=useState<Operator[]>([]);
  const [owner,setOwner]=useState('');
  const [batch,setBatch]=useState<ZipProductBatch|null>(null);
  const current=useRef<ZipProductBatch|null>(null);
  const [filename,setFilename]=useState('');
  const [selected,setSelected]=useState('');
  const [confirmed,setConfirmed]=useState<Set<string>>(new Set());
  const [existing,setExisting]=useState<string[]>([]);
  const [checked,setChecked]=useState(false);
  const [batchId,setBatchId]=useState('');
  const [uploaded,setUploaded]=useState<Record<string,string>>({});
  const [busy,setBusy]=useState(false);
  const [progress,setProgress]=useState('');
  const [error,setError]=useState('');
  const [result,setResult]=useState<Result|null>(null);
  const [uncertain,setUncertain]=useState(false);
  const api=<T,>(endpoint:string,options?:RequestInit):Promise<T>=>
    role==='ADMIN'?adminFetch<T>(endpoint,options):factoryFetch<T>(endpoint,options);
  useEffect(()=>()=>{disposePreviews(current.current);},[]);
  useEffect(()=>{
    if(role!=='ADMIN')return;
    let active=true;
    void adminFetch<{operators:Operator[]}>('admin/products/import-operators').then(data=>{
      if(active){setOperators(data.operators||[]);
        setOwner(old=>old||data.operators?.[0]?.id||'');}
    }).catch(e=>{if(active)setError('读取可选员工失败：'+(e?.message||'请检查导入功能开关'));});
    return()=>{active=false;};
  },[role]);
  const chosenCategory=categories.find(c=>c.id===category);
  const attributeKeys=attributesForCategory(chosenCategory?.title||category).map(a=>a.key);
  const lookups=useMemo(()=>{
    if(!batch)return [];
    const seen=new Map<string,number>();
    return batch.records.map(row=>{
      const duplicate=seen.has(row.code);
      seen.set(row.code,row.row);
      const issues:ImportIssue[]=[...row.issues];
      if(duplicate)issues.push({row:row.row,field:'code',severity:'error',
        message:'Excel 内 SKU 重复，必须改成唯一编号'});
      if(existing.includes(row.code))issues.push({row:row.row,field:'code',severity:'error',
        message:'数据库已有此 SKU，将跳过且不会覆盖'});
      const images=batch.images.get(row.code)||[];
      if(images.length<4)issues.push({row:row.row,field:'images',severity:'warning',
        message:'当前只有 '+images.length+' 张图片；可以先存草稿，提交审核前需满足完整预检'});
      const valid=!issues.some(x=>x.severity==='error');
      return {...row,images,issues,valid,duplicate};
    });
  },[batch,existing]);
  const ready=lookups.filter(row=>row.valid);
  const sourceErrors=lookups.flatMap(row=>row.issues);
  const errors=sourceErrors.filter(x=>x.severity==='error');
  const toFix=sourceErrors.filter(x=>x.severity==='warning');
  const currentImages=batch?.images.get(selected)||[];
  const unconfirmed=ready.filter(row=>row.images.length>0&&!confirmed.has(row.code));
  const uploadItems=ready.flatMap(row=>row.images.map(image=>({sku:row.code,image})));
  const uploadMissing=uploadItems.filter(x=>!uploaded[x.image.source]).length;
  const chooseFile=async(file?:File)=>{
    if(busy)return;
    setError('');setResult(null);setBatchId('');setUncertain(false);setUploaded({});
    setBatch(null);setFilename('');setSelected('');setExisting([]);setChecked(false);
    setConfirmed(new Set());setProgress('');
    disposePreviews(current.current);current.current=null;
    if(!file)return;
    if(!file.name.toLowerCase().endsWith('.zip')){setError('请选择包含 Excel 和 images/SKU/ 的 ZIP 文件');return;}
    if(file.size>180*1024*1024){setError('ZIP 超过 180 MB，建议按 100 个 SKU 一批拆分');return;}
    setBusy(true);setProgress('安全检查 ZIP，并解析产品 Excel 和 SKU 图片文件夹…');
    try{
      const loaded=await readProductZip(await file.arrayBuffer());
      current.current=loaded;setBatch(loaded);
      setFilename(file.name);setSelected(loaded.records[0]?.code||'');
      const confirmedNames=new Set<string>();
      for(const row of loaded.records){
        const group=loaded.images.get(row.code)||[];
        const manual=loaded.warnings.some(w=>w.startsWith(row.code+' 未标注主图')||
          w.startsWith(row.code+' 有多个疑似主图'));
        if(group.length>0&&!manual)confirmedNames.add(row.code);
      }
      setConfirmed(confirmedNames);
      const codes=[...new Set(loaded.records.map(r=>r.code))]
        .filter(code=>/^PZ-[A-Z0-9][A-Z0-9_-]{1,39}$/.test(code));
      const found:string[]=[];
      for(let i=0;i<codes.length;i+=30){
        const check=await api<{existingCodes?:string[]}>('factory/products/check-skus',{
          method:'POST',body:JSON.stringify({codes:codes.slice(i,i+30)})
        });
        found.push(...(check.existingCodes||[]));
      }
      setExisting(found.map(normalizeSku));setChecked(true);
      setProgress('已匹配 '+loaded.records.length+' 个 SKU、'+
        [...loaded.images.values()].reduce((n,v)=>n+v.length,0)+' 张图片；请选择产品检查预览');
    }catch(e:any){setError('ZIP / Excel 解析或 SKU 查重失败：'+(e?.message||'请检查文件'));}
    finally{setBusy(false);}
  };
  const mutateImages=(sku:string,callback:(images:ZipProductImage[])=>ZipProductImage[])=>{
    setBatch(previous=>{
      if(!previous)return null;
      const images=new Map(previous.images);
      images.set(sku,callback((images.get(sku)||[]).map(v=>({...v}))));
      const updated={...previous,images};current.current=updated;
      return updated;
    });
  };
  const pickMain=(sku:string,index:number)=>{
    mutateImages(sku,items=>{
      const chosen=items.splice(index,1)[0];
      if(!chosen)return items;
      for(const img of items)if(img.role==='main')img.role='lifestyle';
      chosen.role='main';return [chosen,...items];
    });
    setConfirmed(old=>new Set([...old,sku]));
  };
  const moveImage=(sku:string,index:number,direction:number)=>{
    mutateImages(sku,items=>{
      const to=index+direction;
      // Main image always remains first; rest follow explicit sort order.
      if(index<=0||to<=0||to>=items.length)return items;
      [items[index],items[to]]=[items[to],items[index]];
      return items;
    });
  };
  const changeRole=(sku:string,index:number,role:string)=>{
    mutateImages(sku,items=>{
      if(index>0&&items[index])items[index].role=role;return items;
    });
  };
  const confirmImport=async()=>{
    if(!batch||busy||!checked||!ready.length||result||uncertain)return;
    if(role==='ADMIN'&&!owner){setError('请选择已分配主管的员工账号');return;}
    if(unconfirmed.length){setError('请先确认以下 SKU 的主图：'+unconfirmed.map(x=>x.code).slice(0,10).join('、'));return;}
    if(!window.confirm('确认将 '+ready.length+' 个有效 SKU 与匹配图片导入为草稿？不会发布或覆盖现有产品。'))return;
    const id=batchId||crypto.randomUUID();setBatchId(id);
    setBusy(true);setError('');
    const cache={...uploaded};
    try{
      let next=0,done=0;const failures:string[]=[];
      const upload=async()=>{
        while(next<uploadItems.length){
          const item=uploadItems[next++],source=item.image.source;
          if(!cache[source]){
            try{
              const filename=item.image.file;
              const form=new FormData();
              form.append('file',item.image.blob,filename);
              const uploadedImage=await api<{url?:string}>('upload-image',{method:'POST',body:form});
              if(!uploadedImage.url)throw Error('R2 未返回 URL');
              cache[source]=uploadedImage.url;
            }catch(e:any){failures.push(source+': '+(e?.message||'上传失败'));}
          }
          done++;setProgress('上传图片 '+done+' / '+uploadItems.length);
        }
      };
      await Promise.all(Array.from({length:Math.min(3,uploadItems.length)},()=>upload()));
      setUploaded(cache);
      if(failures.length)throw Error(failures.length+' 张图片上传失败；请点击再次确认，只会重试失败的图片。'+
        failures.slice(0,3).join('；'));
      setProgress('所有图片已上传。正在写入 D1 草稿和批次审核记录…');
      const records=batch.rows.map(row=>{
        const code=normalizeSku(row.cells.code);
        const images=(batch.images.get(code)||[]).map(image=>({
          url:cache[image.source],role:image.role
        })).filter(image=>!!image.url);
        return {row:row.row,cells:row.cells,images};
      });
      // Every Excel row, including invalid rows, reaches the Worker so that
      // partial success and row-level error totals are recorded on the server.
      const response=await api<Result>(role==='ADMIN'?'admin/products/import-drafts':
        'factory/products/import-drafts',{
          method:'POST',body:JSON.stringify({batch_id:id,
            ...(role==='ADMIN'?{owner_id:owner}:{}),rows:records})
        });
      if(!response.completed)throw Error('批次尚未完成，请核对批次编号');
      setResult(response);setProgress('草稿导入完成，正式发布 0 条');
      await onCompleted?.(response.batch_id);
    }catch(e:any){
      setError(e?.message||'导入未完成；请核对批次编号');
      // Only the database submission phase can be uncertain. Upload failures
      // may be retried with the same ZIP and cached successful R2 URLs.
      if(uploadItems.every(x=>!!cache[x.image.source]))setUncertain(true);
    }finally{setBusy(false);}
  };
  const reconcile=async()=>{
    if(!batchId||!uncertain||busy)return;
    setBusy(true);setError('');
    try{
      const saved=await api<Result>((role==='ADMIN'?'admin':'factory')+
        '/products/import-batches/'+encodeURIComponent(batchId));
      if(!saved.completed)throw Error('批次尚未完成，请联系管理员检查已写入数据');
      setResult(saved);setUncertain(false);
      setProgress('已核对 D1 批次结果');
      await onCompleted?.(saved.batch_id);
    }catch(e:any){setError('暂不能核对批次 '+batchId+'：'+(e?.message||'请联系管理员'));}
    finally{setBusy(false);}
  };
  const makeTemplate=()=>download('PZ-批量导入模板.zip',
    createZipTemplate(category||'dining-table',attributeKeys),'application/zip');
  return <section className="space-y-5" aria-label="ZIP Excel 批量导入产品草稿">
    <header className="rounded border border-stone-200 bg-white p-5">
      <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
        <FileArchive size={23}/> Excel + 图片文件夹一键导入
      </h2>
      <p className="mt-2 text-sm text-stone-600">
        一个 ZIP 即可：根目录放产品资料.xlsx，images/ 下按 SKU 建文件夹，图片可以保留相机原名。
        最多 100 款产品，每款最多 12 张；<strong>只保存草稿，不自动审核或发布。</strong>
      </p>
    </header>
    <div className="space-y-3 rounded border bg-white p-5">
      <label className="block text-sm font-semibold">1. 选择需要的家具类别模板
        <select className="mt-1 w-full rounded border p-2" value={category}
          onChange={e=>setCategory(e.target.value)}>
          {categories.map(c=><option key={c.id} value={c.id}>{c.title_cn||c.title}</option>)}
        </select>
      </label>
      <button type="button" onClick={makeTemplate}
        className="flex items-center gap-2 rounded border px-4 py-2 text-sm">
        <Download size={16}/> 下载示例 ZIP（内含可直接填写的 Excel 模板）
      </button>
      <div className="rounded bg-stone-50 p-3 text-xs text-stone-600">
        <p className="flex items-center gap-2 font-semibold"><FolderOpen size={16}/> ZIP 内容示意</p>
        <pre className="mt-2 overflow-auto whitespace-pre-wrap">{'产品资料.xlsx\nimages/\n  PZ-001/\n    IMG_0001.jpg\n    IMG_0002.jpg\n  PZ-002/\n    相机照片.png'}</pre>
        <p>文件夹名匹配 SKU。系统自动关联图片，预览时确定主图、用途和排列顺序。</p>
      </div>
      {role==='ADMIN'&&<label className="block text-sm font-semibold">导入归属员工
        <select value={owner} onChange={e=>setOwner(e.target.value)} className="mt-1 w-full rounded border p-2">
          {!operators.length&&<option value="">没有可用员工</option>}
          {operators.map(op=><option key={op.id} value={op.id}>{op.username}</option>)}
        </select>
      </label>}
      <label className="block text-sm font-semibold">2. 上传包含 Excel 和 SKU 图片文件夹的 ZIP
        <input type="file" accept=".zip,application/zip" disabled={busy||!!result||uncertain}
          onChange={e=>void chooseFile(e.target.files?.[0])}
          className="mt-1 block w-full rounded border p-3 text-xs"/>
      </label>
      {!!filename&&<p className="text-sm">已读取：{filename} · {batch?.records.length||0} 条产品</p>}
      {progress&&<p role="status" className="text-sm text-stone-700">{progress}</p>}
    </div>
    {batch&&<div className="space-y-4 rounded border bg-white p-5">
      <h3 className="font-semibold">3. 检查匹配和图片主图（导入前可调整）</h3>
      <p className="text-sm text-stone-600">可导入 {ready.length} / {lookups.length} 条草稿，
        已有 SKU {existing.length} 条，预检错误 {errors.length} 条，
        待补图或确认 {toFix.length} 条。</p>
      <div className="grid gap-3 md:grid-cols-[minmax(210px,0.9fr)_minmax(0,2fr)]">
        <div className="max-h-[380px] space-y-1 overflow-auto rounded border p-2" aria-label="SKU 匹配清单">
          {lookups.map(item=><button key={item.row} type="button"
            onClick={()=>setSelected(item.code)} aria-current={selected===item.code?'true':undefined}
            className={'flex w-full items-center justify-between gap-2 rounded px-3 py-2 text-left text-xs '+
              (selected===item.code?'bg-stone-900 text-white':'bg-stone-50 hover:bg-stone-100')}>
            <span>{item.code}<span className="block opacity-70">{item.product.name}</span></span>
            <span>{item.images.length} 图 · {item.valid?'草稿可导入':'跳过'}</span>
          </button>)}
        </div>
        <div className="min-w-0 space-y-2 rounded border p-3">
          <h4 className="font-semibold">{selected} · 图片预览</h4>
          <p className="text-xs text-stone-600">主图固定排第一；其他图片可调整顺序和用途。
            未标注 main/cover 的首图为候选，必须人工确认。</p>
          {!currentImages.length&&<p className="text-xs text-amber-800">
            未找到此 SKU 的图片文件夹。可以先存草稿，提交审核前必须补齐图片。
          </p>}
          <div className="grid max-h-[430px] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
            {currentImages.map((img,index)=><div key={img.source} className="rounded border p-2">
              <div className="flex gap-2">
                <img src={img.preview} alt={selected+' '+img.file} loading="lazy"
                  className="h-20 w-20 shrink-0 rounded object-contain bg-stone-100"/>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs" title={img.file}>{img.file}</p>
                  <p className="text-xs text-stone-500">{index===0?'主图 / 封面':'第 '+(index+1)+' 张'}</p>
                  {index===0?<span className="text-xs font-semibold text-emerald-800">主图</span>:
                    <select aria-label={img.file+' 的图片用途'} value={img.role}
                      onChange={e=>changeRole(selected,index,e.target.value)}
                      className="mt-1 w-full rounded border p-1 text-xs">
                      {IMAGE_OPTIONS.map(([id,label])=><option key={id} value={id}>{label}</option>)}
                    </select>}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1 text-xs">
                {index>0&&<button type="button" onClick={()=>pickMain(selected,index)}
                  className="rounded border px-2 py-1">设为主图</button>}
                {index>1&&<button type="button" onClick={()=>moveImage(selected,index,-1)}
                  className="rounded border px-2 py-1">上移</button>}
                {index>0&&index<currentImages.length-1&&<button type="button"
                  onClick={()=>moveImage(selected,index,1)} className="rounded border px-2 py-1">下移</button>}
              </div>
            </div>)}
          </div>
          {currentImages.length>0&&<button type="button"
            onClick={()=>setConfirmed(old=>new Set([...old,selected]))}
            className="rounded border border-emerald-600 px-3 py-2 text-xs">
            {confirmed.has(selected)?'✓ 本 SKU 主图已确认':'确认该 SKU 主图与图片顺序'}
          </button>}
        </div>
      </div>
      {batch.warnings.length>0&&<p className="text-xs text-amber-800">
        图片提示：{batch.warnings.slice(0,8).join('；')}{batch.warnings.length>8?'…':''}
      </p>}
      {batch.orphan.length>0&&<p className="text-xs text-amber-800">
        {batch.orphan.length} 张图片没有对应 Excel SKU，已排除（例如：{batch.orphan.slice(0,3).join('、')}）
      </p>}
      <p className="text-xs text-stone-600">仍需确认主图的有效 SKU：{unconfirmed.length}。
        无图草稿可以导入，但不能直接提交审核。</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={()=>download('PZ-导入失败行.csv',
          errorReportCsv(errors),'text/csv;charset=utf-8')} className="rounded border px-3 py-2 text-xs">
          <Download size={13} className="inline"/> 下载字段错误报告
        </button>
        <button type="button" onClick={()=>download('PZ-待补图片.csv',
          errorReportCsv(toFix),'text/csv;charset=utf-8')} className="rounded border px-3 py-2 text-xs">
          <Download size={13} className="inline"/> 下载预检补充报告
        </button>
        <button type="button" onClick={()=>void confirmImport()}
          disabled={!checked||!ready.length||busy||!!result||uncertain||
            unconfirmed.length>0||(role==='ADMIN'&&!owner)}
          className="flex items-center gap-2 rounded bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-40">
          <ShieldCheck size={16}/> {busy?'上传图片及保存中…':
            '确认上传 '+uploadMissing+' 张图片并导入 '+ready.length+' 条草稿'}
        </button>
      </div>
    </div>}
    {error&&<p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {batchId&&uncertain&&!result&&<div className="flex flex-wrap items-center gap-3 rounded border border-amber-300 bg-amber-50 p-3 text-sm">
      批次状态待核对：<code>{batchId}</code>
      <button type="button" disabled={busy} onClick={()=>void reconcile()}
        className="flex items-center gap-1 rounded border px-3 py-2 text-xs">
        <RefreshCw size={13}/> 核对服务器批次
      </button>
    </div>}
    {result&&<div role="status" className="rounded border border-emerald-300 bg-emerald-50 p-4 text-sm">
      <p className="flex items-center gap-2 font-semibold"><CheckCircle2 size={18}/>
        完成：新增草稿 {result.inserted}、跳过已有 {result.skipped}、失败 {result.failed}、正式发布 0。
      </p>
      <p className="mt-2 text-xs">批次编号：<code>{result.batch_id}</code>。可在产品管理按批次筛选。</p>
      <button type="button" onClick={()=>void chooseFile()} className="mt-3 rounded border px-3 py-2 text-xs">
        开始下一批
      </button>
    </div>}
    <p className="flex items-center gap-2 text-xs text-stone-500"><Images size={16}/>
      图片将上传到当前环境的 R2；现有 SKU 不覆盖，导入功能不会触发任何发布操作。</p>
  </section>;
};
export default BulkZipImporter;
