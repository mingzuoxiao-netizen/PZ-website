import {inspectZip,createStoredZip,ZIP_LIMITS} from './safeZip.mjs';
import {templateColumns,guideForColumns,normalizeSku,mapImportRow} from './bulkImportCore.mjs';

const dec=new TextDecoder('utf-8',{fatal:true});
const enc=new TextEncoder();
const text=value=>String(value??'').trim();
const xmlEscape=s=>String(s??'').replace(/[&<>"']/g,c=>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&apos;'}[c]));
const cellColumn=letters=>[...letters].reduce((value,c)=>value*26+c.charCodeAt(0)-64,0)-1;
const columnName=index=>{let s='';for(let i=index+1;i>0;i=Math.floor((i-1)/26))
  s=String.fromCharCode(65+(i-1)%26)+s;return s;};
const ext=path=>path.split('.').at(-1).toLowerCase();
const mimeFor=path=>({jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp'}[ext(path)]||'');
const goodImage=(bytes,name)=>{
  const suffix=ext(name);
  if((suffix==='jpg'||suffix==='jpeg')&&bytes.length>4&&bytes[0]===0xff&&bytes[1]===0xd8){
    // Some camera JPEG files contain harmless bytes after the EOI marker.
    for(let i=Math.max(2,bytes.length-32);i<bytes.length-1;i++)
      if(bytes[i]===0xff&&bytes[i+1]===0xd9)return true;
  }
  if(suffix==='png'&&bytes.length>8&&[137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n))return true;
  if(suffix==='webp'&&bytes.length>12&&dec.decode(bytes.subarray(0,4))==='RIFF'&&
      dec.decode(bytes.subarray(8,12))==='WEBP')return true;
  return false;
};
function dom(bytes,path){
  if(bytes.byteLength>ZIP_LIMITS.workbook)throw Error('Excel XML 文件过大：'+path);
  const content=dec.decode(bytes);
  if(/<!\s*(?:DOCTYPE|ENTITY)\b/i.test(content))throw Error('不支持 Excel 外部实体：'+path);
  if(typeof DOMParser==='undefined')throw Error('当前浏览器缺少 Excel XML 解析功能');
  const xml=new DOMParser().parseFromString(content,'application/xml');
  if(xml.getElementsByTagName('parsererror').length||
      xml.getElementsByTagNameNS('*','parsererror').length)
    throw Error('Excel XML 解析失败：'+path);
  return xml;
}
const children=(element,name)=>Array.from(element?.getElementsByTagNameNS('*',name)||[]);
const direct=(element,name)=>Array.from(element?.children||[])
  .find(x=>x.localName===name)||null;
const valueText=(cell,shared)=>{
  if(direct(cell,'f'))throw Error('导入表不支持公式，请将公式粘贴为实际值');
  const type=cell.getAttribute('t');
  if(type==='e')throw Error('Excel 表含错误单元格');
  if(type==='inlineStr')return children(direct(cell,'is'),'t').map(n=>n.textContent||'').join('');
  const raw=direct(cell,'v')?.textContent||'';
  if(type==='s'){
    const index=Number(raw);
    if(!Number.isInteger(index)||index<0||index>=shared.length)throw Error('Excel 共享字符串索引无效');
    return shared[index];
  }
  if(type==='b')return raw==='1'?'TRUE':'FALSE';
  return raw;
}
function normalizeTarget(target){
  if(!target||target.includes('\\')||target.includes(':')||target.includes('..'))
    throw Error('Excel 文件中存在不安全的工作表路径');
  const path=target.startsWith('/')?target.replace(/^\/+/,''):'xl/'+target;
  return path.replace(/^xl\/xl\//,'xl/');
}
export async function readWorkbook(data){
  if(data.byteLength>ZIP_LIMITS.workbook)throw Error('Excel 文件超过 8 MB');
  const zip=inspectZip(data,{maxArchive:ZIP_LIMITS.workbook,maxTotal:24*1024*1024,
    maxEntry:ZIP_LIMITS.workbook,maxEntries:200});
  for(const entry of zip.entries){
    if(/vbaProject|externalLinks|\.bin$/i.test(entry.name))
      throw Error('不接受带宏或外部链接的 Excel，请保存为普通 .xlsx');
  }
  if(!zip.has('xl/workbook.xml')||!zip.has('xl/_rels/workbook.xml.rels'))
    throw Error('不是有效的 XLSX 文件');
  const [book,rels]=await Promise.all([
    zip.read('xl/workbook.xml'),zip.read('xl/_rels/workbook.xml.rels')
  ]);
  const workbook=dom(book,'xl/workbook.xml'),relationships=dom(rels,'workbook.xml.rels');
  const sheets=children(workbook,'sheet').filter(x=>x.getAttribute('state')!=='hidden');
  if(!sheets.length)throw Error('Excel 没有可见的工作表');
  const sheet=sheets.find(x=>/products|产品资料|产品信息/i.test(x.getAttribute('name')||''))||sheets[0];
  const rid=sheet.getAttribute('r:id')||sheet.getAttributeNS(
    'http://schemas.openxmlformats.org/officeDocument/2006/relationships','id');
  const rel=children(relationships,'Relationship').find(x=>x.getAttribute('Id')===rid);
  if(!rel||rel.getAttribute('TargetMode')==='External')
    throw Error('Excel 工作表的关联路径无效');
  const sheetPath=normalizeTarget(rel.getAttribute('Target'));
  if(!zip.has(sheetPath))throw Error('工作表内容缺失：'+sheetPath);
  let shared=[];
  if(zip.has('xl/sharedStrings.xml')){
    const strings=dom(await zip.read('xl/sharedStrings.xml'),'sharedStrings.xml');
    shared=children(strings,'si').map(si=>children(si,'t').map(t=>t.textContent||'').join(''));
    if(shared.length>50000)throw Error('共享字符串数量过大');
  }
  const sheetXml=dom(await zip.read(sheetPath),'sheet.xml');
  const rows=[];
  for(const xmlRow of children(sheetXml,'row')){
    const rowNumber=Number(xmlRow.getAttribute('r'));
    if(!Number.isInteger(rowNumber)||rowNumber<1||rowNumber>1100)
      throw Error('Excel 行号超出安全范围');
    const values={};
    for(const cell of children(xmlRow,'c')){
      const address=cell.getAttribute('r')||'';
      const match=/^([A-Z]{1,3})(\d+)$/.exec(address);
      if(!match||Number(match[2])!==rowNumber)throw Error('Excel 单元格坐标无效');
      const column=cellColumn(match[1]);
      if(column>=90)throw Error('Excel 列数不得超过 90');
      const value=valueText(cell,shared);
      if(value.length>3000)throw Error('Excel 单元格文字过长：'+address);
      values[column]=value;
    }
    rows.push({number:rowNumber,values});
    if(rows.length>110)throw Error('Excel 记录过多，每批最多 100 条产品');
  }
  const headerIndex=rows.findIndex(row=>{
    const labels=Object.values(row.values).map(v=>text(v).toLowerCase());
    return ['code','name','category','material','description']
      .every(label=>labels.includes(label));
  });
  if(headerIndex<0||headerIndex>9)throw Error(
    '找不到模板字段表头，请下载系统生成的 XLSX 模板');
  const headers=rows[headerIndex].values;
  const occupied=Object.keys(headers).map(Number),headerNames=new Set();
  for(const col of occupied){
    const name=text(headers[col]);
    if(name&&headerNames.has(name))throw Error('Excel 包含重复字段：'+name);
    if(name)headerNames.add(name);
  }
  const imported=[];
  for(const row of rows.slice(headerIndex+1)){
    const cells={__example:''};
    for(const col of occupied){
      const key=text(headers[col]);if(key)cells[key]=text(row.values[col]||'');
    }
    if(/^y(es)?$/i.test(cells.__example))continue;
    if(!Object.values(cells).some(Boolean))continue;
    if(imported.length>=100)throw Error('一批最多导入 100 条产品');
    imported.push({row:row.number,cells});
  }
  if(!imported.length)throw Error('Excel 没有可导入的产品，示例行不会被导入');
  return imported;
}
const MAIN_TOKEN=/(^|[\s_.\-])(main|cover|主图)(?=[\s_.\-]|$)/i;
const orderImages=(a,b)=>a.file.localeCompare(b.file,'zh',{numeric:true,sensitivity:'base'});
export function matchSkuFolder(path){
  if(typeof path!=='string')return null;
  const parts=path.split('/');
  if(parts.length!==3||parts[0].toLowerCase()!=='images'||!mimeFor(path)||!parts[2])
    return null;
  const sku=normalizeSku(parts[1]);
  return /^PZ-[A-Z0-9][A-Z0-9_-]{1,39}$/.test(sku)
    ?{sku,file:parts[2]}:null;
}
export function assignInitialImageRoles(items){
  const group=items.map(x=>({...x})).sort(orderImages);
  for(const image of group)image.role='lifestyle';
  const found=group.filter(image=>MAIN_TOKEN.test(image.file));
  const choice=found[0]||group[0];
  if(choice){
    choice.role='main';
    group.splice(group.indexOf(choice),1);
    group.unshift(choice);
  }
  return {images:group,needsConfirmation:group.length>0&&found.length!==1};
}
export async function readProductZip(buffer,{categories=[]}={}){
  const zip=inspectZip(buffer);
  const workbooks=zip.entries.filter(e=>{
    const basename=e.name.split('/').at(-1);
    return !e.isDir&&!e.name.startsWith('__MACOSX/')&&
      e.name.toLowerCase().endsWith('.xlsx')&&!basename.startsWith('~$')&&
      !basename.startsWith('.');
  });
  if(workbooks.length!==1)throw Error('ZIP 中必须有且只有一个 .xlsx 产品资料文件');
  const workbookParts=workbooks[0].name.split('/');
  if(workbookParts.length>2||workbookParts[0].toLowerCase()==='images')
    throw Error('Excel 应位于 ZIP 根目录或唯一的顶层文件夹');
  const base=workbookParts.length===2?workbookParts[0]+'/':'';
  const rows=await readWorkbook(await zip.read(workbooks[0],ZIP_LIMITS.workbook));
  const records=rows.map(row=>mapImportRow(row,{categories})),productSku=new Set(records.map(x=>x.code));
  const bySku=new Map(records.map(x=>[x.code,[]]));
  const orphan=[],warnings=[],previews=[];
  try{
  for(const entry of zip.entries){
    if(entry.isDir||entry.name===workbooks[0].name||(entry.name==='README.txt'||entry.name===base+'README.txt'))continue;
    if(entry.name.startsWith('__MACOSX/')||entry.name.includes('/.'))continue;
    const relative=base&&entry.name.startsWith(base)?entry.name.slice(base.length):entry.name;
    const matched=matchSkuFolder(relative);
    if(!matched){
      warnings.push('非图片或路径不符合 images/SKU/ 的文件已跳过：'+entry.name);continue;
    }
    const sku=matched.sku;
    if(!productSku.has(sku)){
      orphan.push(entry.name);continue;
    }
    const group=bySku.get(sku);
    if(group.length>=12)throw Error('产品 '+sku+' 的图片超过 12 张');
    const bytes=await zip.read(entry,ZIP_LIMITS.entry);
    if(!goodImage(bytes,entry.name))
      throw Error('图片扩展名与实际格式不符：'+entry.name);
    const blob=new Blob([bytes],{type:mimeFor(entry.name)}),preview=URL.createObjectURL(blob);
    previews.push(preview);
    group.push({file:matched.file,blob,preview,role:'lifestyle',source:entry.name});
  }
  for(const [sku,group] of bySku){
    const initial=assignInitialImageRoles(group);
    bySku.set(sku,initial.images);
    if(!group.length)continue;
    const mainCandidates=group.filter(item=>MAIN_TOKEN.test(item.file));
    if(mainCandidates.length>1)warnings.push(sku+' 有多个疑似主图，请确认唯一主图');
    if(!mainCandidates.length)warnings.push(sku+' 未标注主图，已临时选择第一张，需要人工确认');
  }
  return {rows,records,images:bySku,warnings,orphan};
  }catch(error){
    for(const url of previews)URL.revokeObjectURL(url);
    throw error;
  }
}
export const disposePreviews=batch=>{
  if(!batch)return;
  for(const items of batch.images.values())for(const item of items)
    URL.revokeObjectURL(item.preview);
};
const xmlCell=(column,row,value)=>{
  const ref=columnName(column)+(row+1);
  return '<c r="'+ref+'" t="inlineStr"><is><t xml:space="preserve">'+
    xmlEscape(value)+'</t></is></c>';
};
const sheetXml=(rows,{hideMachineRow=false,freeze=false}={})=>
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
  '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+
  (freeze?'<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>':'')+
  '<sheetData>'+rows.map((cells,i)=>'<row r="'+(i+1)+'"'+
    (hideMachineRow&&i===1?' hidden="1"':'')+'>'+cells.map((value,j)=>xmlCell(j,i,value)).join('')+'</row>').join('')+
  '</sheetData></worksheet>';
export function createTemplateWorkbook(category,attributeKeys=[],options={}){
  const headers=templateColumns(attributeKeys);
  const guides=guideForColumns(headers,options.attributeDefinitions||[]);
  const categoryOptions=options.categories||[];
  const tiers={'import-required':'导入必填','publish-required':'审核前必填（按产品品类）',optional:'选填'};
  const examples={
    __example:'YES',code:'PZ-EXAMPLE-001',name:'Marlow Oak Dining Table',
    name_cn:'橡木餐桌',category,material:'White Oak',finish:'Matte',
    production_sites:'zhaoqing',description:'Solid oak dining table',
    'dimensions_cm.length':'180','dimensions_cm.width':'90','dimensions_cm.height':'75'
  };
  const instructions=[
    ['PZ 家具产品 ZIP 导入指南（工厂中文填写版）','填写说明'],
    ['产品资料.xlsx','保留本文件在 ZIP 根目录'],
    ['images/PZ-001/','把该 SKU 的所有照片放入此文件夹；照片可保留相机原名'],
    ['SKU 编号','SKU 是唯一匹配键，Excel 和图片文件夹必须一致；编码不得翻译'],
    ['Excel 表头','产品资料第1行是中文，第2行隐藏技术字段；请勿删除或修改隐藏行'],
    ['分类编码','从下方有效分类ID中选择，不要自行翻译或编造'],
    ['导入必填',guides.filter(x=>x.tier==='import-required').map(x=>x.zhLabel).join('、')],
    ['审核前必填',guides.filter(x=>x.tier==='publish-required').map(x=>x.zhLabel).join('、')],
    ['证据红线','承重、认证类数值必须附证据文件；没有证据不要填写已验证的结论'],
    ...categoryOptions.map(c=>['有效分类：'+c.id,c.title_cn||c.title_zh||c.title||c.id]),
    ['图片角色','系统自动选择主图，可以在导入预览调整主图、顺序和用途'],
    ['__example','YES 示例行自动忽略，请从下一行开始录入'],
    ['尺寸和重量','dimensions_cm 为厘米，重量字段为 kg'],
    ['导入行为','仅保存产品草稿，不自动提交审核或发布'],
    ['数量','单批最多 100 个 SKU，每款最多 12 张图片'],
    ['多箱包装','最多填写第1、2、3箱；只填写实际存在的箱子'],
    ['多值填写','生产工厂可用中文分号/逗号分隔；实际值仍为 zhaoqing 或 cambodia']
  ];
  const dictionary=[['中文字段','系统识别代码（勿修改）','填写等级','单位','例子'],
    ...guides.map(g=>[g.zhLabel,g.key,tiers[g.tier],g.unit||'',g.key==='category'?category:g.key==='production_sites'?'zhaoqing':'' ])];
  const contentTypes='<?xml version="1.0" encoding="UTF-8"?>'+
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'+
    '<Default Extension="xml" ContentType="application/xml"/>'+
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'+
    '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'+
    '<Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'+ 
    '<Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'+
    '</Types>';
  const files=[
    {name:'[Content_Types].xml',data:contentTypes},
    {name:'_rels/.rels',data:'<?xml version="1.0" encoding="UTF-8"?>'+
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'},
    {name:'xl/workbook.xml',data:'<?xml version="1.0" encoding="UTF-8"?>'+
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '+
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'+
      '<sheets><sheet name="Products" sheetId="1" r:id="rId1"/>'+
      '<sheet name="说明" sheetId="2" r:id="rId2"/>'+ 
      '<sheet name="中文字段对照" sheetId="3" r:id="rId3"/></sheets></workbook>'},
    {name:'xl/_rels/workbook.xml.rels',data:'<?xml version="1.0" encoding="UTF-8"?>'+
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'+
      '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>'+ 
      '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/></Relationships>'},
    {name:'xl/worksheets/sheet1.xml',data:sheetXml([
      guides.map(g=>g.zhLabel+(g.unit?'（'+g.unit+'）':'')),
      headers,headers.map(key=>examples[key]||'')],{hideMachineRow:true,freeze:true})},
    {name:'xl/worksheets/sheet2.xml',data:sheetXml(instructions)},
    {name:'xl/worksheets/sheet3.xml',data:sheetXml(dictionary,{freeze:true})}
  ];
  return createStoredZip(files);
}
export function createZipTemplate(category,attributeKeys=[],options={}){
  const xlsx=createTemplateWorkbook(category,attributeKeys,options);
  return createStoredZip([
    {name:'产品资料.xlsx',data:xlsx},
    {name:'images/',data:new Uint8Array(0)},
    {name:'README.txt',data:'工厂中文模板：打开产品资料.xlsx，第1行中文名称，第2行隐藏技术字段请勿修改。照片放入 images/<SKU>/ 文件夹，图片可使用相机原名。导入仅保存草稿。'}
  ]);
}
export function zipSummary(batch){
  return batch.records.map(item=>{
    const images=batch.images.get(item.code)||[];
    return {...item,images,needsMainConfirmation:images.length>0&&!images.some(x=>MAIN_TOKEN.test(x.file))};
  });
}
