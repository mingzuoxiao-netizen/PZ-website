// Task 15: shared, framework-free CSV draft-import contract.
// Import validates every row with Task 11 preflight, but may persist only DRAFTS.
// Drafts without images remain editable and cannot be submitted until preflight passes.
import {preflightProduct} from './productPreflight.js';

export const IMPORT_LIMIT=100;
export const SITE_VALUES=['zhaoqing','cambodia'];
export const IMAGE_ROLES=['main','lifestyle','detail','material','dimension','packaging'];
export const BASE_COLUMNS=[
  '__example','code','name','name_cn','category','sub_category',
  'material','finish','color','production_sites','description','description_cn',
  'dimensions_cm.length','dimensions_cm.width','dimensions_cm.height','dimensions_cm.thickness',
  'net_weight_kg','selling_points_en','series_id','construction_en','care_en','warnings_en',
  'carton_1.length_cm','carton_1.width_cm','carton_1.height_cm',
  'carton_1.gross_weight_kg','carton_1.net_weight_kg','carton_1.units',
  'carton_1.packing_method','carton_1.protection_notes',
  ...[2,3].flatMap(n=>['length_cm','width_cm','height_cm','gross_weight_kg','net_weight_kg','units','packing_method','protection_notes'].map(key=>'carton_'+n+'.'+key))
];
// The guide is the shared metadata for the legacy CSV and the ZIP/XLSX template.
// Keep machine column keys stable; factory-facing labels are Chinese.
const COLUMN_DEFINITIONS={
  __example:['示例行标记','optional'],code:['SKU 产品编号','import-required'],
  name:['产品英文名称','import-required'],name_cn:['产品中文名称','optional'],
  category:['后台分类 ID','import-required'],sub_category:['子分类','optional'],
  material:['主要材质','import-required'],finish:['表面处理工艺','optional'],
  color:['颜色 / 色号','optional'],production_sites:['生产工厂','optional'],
  description:['英文产品描述','import-required'],description_cn:['中文产品描述','optional'],
  'dimensions_cm.length':['产品长度 / 深度','publish-required','cm'],
  'dimensions_cm.width':['产品宽度','publish-required','cm'],
  'dimensions_cm.height':['产品高度（台面类不适用）','publish-required','cm'],
  'dimensions_cm.thickness':['产品厚度（台面类必填）','publish-required','cm'],
  net_weight_kg:['产品净重','optional','kg'],
  selling_points_en:['英文卖点（分号隔开）','optional'],
  series_id:['产品系列 / 款号','optional'],
  construction_en:['英文结构工艺','optional'],
  care_en:['英文保养说明','optional'],
  warnings_en:['英文使用警示','optional']
};
const CARTON_LABELS={length_cm:['包装长','cm'],width_cm:['包装宽','cm'],
  height_cm:['包装高','cm'],gross_weight_kg:['包装毛重','kg'],
  net_weight_kg:['包装净重','kg'],units:['每箱件数','件'],
  packing_method:['包装方式'],protection_notes:['防护说明']};
for(const n of [1,2,3])for(const [key,[label,unit]] of Object.entries(CARTON_LABELS))
  COLUMN_DEFINITIONS['carton_'+n+'.'+key]=['第'+n+'箱'+label,'optional',unit];
export const COLUMN_GUIDE=Object.freeze(Object.fromEntries(
  BASE_COLUMNS.map(key=>{
    const def=COLUMN_DEFINITIONS[key];
    if(!def)throw Error('缺少导入字段中文说明：'+key);
    return [key,Object.freeze({key,zhLabel:def[0],tier:def[1],...(def[2]?{unit:def[2]}:{})})];
  })));
export const IMPORT_REQUIRED_COLUMNS=Object.freeze(
  BASE_COLUMNS.filter(key=>COLUMN_GUIDE[key].tier==='import-required'));
export function guideForColumns(columns=BASE_COLUMNS,attributeDefinitions=[]){
  const byKey=new Map(attributeDefinitions.map(a=>[a.key,a]));
  return columns.map(key=>{
    if(COLUMN_GUIDE[key])return COLUMN_GUIDE[key];
    if(/^attribute\.[a-z][a-z0-9_]{0,59}$/.test(key)){
      const attribute=byKey.get(key.slice('attribute.'.length));
      return {key,zhLabel:attribute?.labelZh||'品类参数：'+key.slice(10),
        tier:'optional',...(attribute?.unit?{unit:attribute.unit}:{})};
    }
    throw Error('未知导入字段：'+key);
  });
}
const SKU=/^PZ-[A-Z0-9][A-Z0-9_-]{1,39}$/;
const NUMERIC=new Set([
  'dimensions_cm.length','dimensions_cm.width','dimensions_cm.height','dimensions_cm.thickness',
  'net_weight_kg','carton_1.length_cm','carton_1.width_cm','carton_1.height_cm',
  'carton_1.gross_weight_kg','carton_1.net_weight_kg','carton_1.units',
  ...[2,3].flatMap(n=>['length_cm','width_cm','height_cm','gross_weight_kg','net_weight_kg','units'].map(key=>'carton_'+n+'.'+key))
]);
const allowedProduct=new Set(BASE_COLUMNS);
const text=v=>String(v??'').trim();
const issue=(row,field,message,severity='error')=>({row,field,message,severity});
export const normalizeSku=code=>text(code).toUpperCase();
export const columnsForAttributes=(keys=[])=>{
  const keysClean=keys.filter(x=>typeof x==='string'&&/^[a-z][a-z0-9_]{0,59}$/.test(x));
  return [...new Set(keysClean)].map(x=>'attribute.'+x);
};
export function templateColumns(keys=[]){
  return [...BASE_COLUMNS,...columnsForAttributes(keys)];
}
const escapeCell=value=>{
  const s=String(value??'');
  // Quotes around formulas block spreadsheet injection on exported error reports.
  const safe=/^[=+@\-\t\r]/.test(s)?'\''+s:s;
  return /[,\n\r"]/.test(safe)?'"'+safe.replace(/"/g,'""')+'"':safe;
};
export const csvLine=cells=>cells.map(escapeCell).join(',');
export function csvTemplate(columns=BASE_COLUMNS,category='dining-table'){
  const sample={
    __example:'YES',code:'PZ-EXAMPLE-001',name:'Marlow Oak Dining Table',name_cn:'橡木餐桌',
    category,sub_category:'Dining',material:'White Oak',finish:'Matte',
    color:'Natural Oak',production_sites:'zhaoqing',description:'Solid oak dining table',
    description_cn:'橡木餐桌', 'dimensions_cm.length':'180','dimensions_cm.width':'90',
    'dimensions_cm.height':'75',net_weight_kg:'38',
    selling_points_en:'Solid oak;Modern style',
    'carton_1.length_cm':'187','carton_1.width_cm':'97','carton_1.height_cm':'18',
    'carton_1.gross_weight_kg':'45','carton_1.units':'1',
    'attribute.seating_capacity':'6'
  };
  const guides=guideForColumns(columns);
  const groups=['import-required','publish-required','optional'].map(tier=>
    '# '+({'import-required':'导入必填','publish-required':'审核前必填（依品类）',optional:'可选'}[tier])+': '+
    guides.filter(g=>g.tier===tier).map(g=>g.key+'='+g.zhLabel+(g.unit?'（'+g.unit+'）':'')).join('；'));
  return '\ufeff'+[
    '# PZ CSV import. All dimensions in cm; weights in kg. Example row __example=YES is ignored. Export Excel as UTF-8 CSV. 承重/认证数字须提供证据文件。',
    ...groups
  ].map(line=>csvLine([line])).join('\r\n')+'\r\n'+
    csvLine(columns)+'\r\n'+csvLine(columns.map(c=>sample[c]||''))+'\r\n';
}
// RFC 4180 CSV: quoted commas, doubled quotes, embedded newlines, BOM, CRLF.
// Malformed quotes fail the whole file before any changes are made.
export function parseCsv(content){
  if(typeof content!=='string'||content.length>5_000_000)throw Error('CSV file exceeds 5 MB');
  const input=content.replace(/^\ufeff/,'');
  const records=[];let row=[],cell='',quoted=false,closed=false,atStart=true,line=1,start=1;
  for(let i=0;i<input.length;i++){
    const c=input[i],next=input[i+1];
    if(quoted){
      if(c==='"'&&next==='"'){cell+='"';i++;continue;}
      if(c==='"'){quoted=false;closed=true;continue;}
      if(c==='\n')line++;
      cell+=c;continue;
    }
    if(c==='"'&&atStart){quoted=true;atStart=false;continue;}
    if(c===','||c==='\n'||c==='\r'){
      row.push(cell);cell='';atStart=true;closed=false;
      if(c===',')continue;
      if(c==='\r'&&next==='\n')i++;
      if(row.some(v=>v!==''))records.push({line:start,cells:row});
      row=[];line++;start=line;continue;
    }
    if(c==='"'||closed)throw Error('CSV quoting invalid at line '+line);
    cell+=c;atStart=false;
  }
  if(quoted)throw Error('Unclosed CSV quote at line '+start);
  if(row.length||cell){row.push(cell);if(row.some(v=>v!==''))records.push({line:start,cells:row});}
  while(records[0]?.cells?.[0]?.startsWith('#'))records.shift();
  if(!records.length)throw Error('CSV header is missing');
  const heading=records.shift(),headers=heading.cells.map(text);
  if(new Set(headers).size!==headers.length)throw Error('Duplicate CSV header column');
  const missing=['__example',...IMPORT_REQUIRED_COLUMNS].filter(key=>!headers.includes(key));
  if(missing.length)throw Error('Missing CSV columns: '+missing.join(', '));
  const unknown=headers.filter(key=>!allowedProduct.has(key)&&
    !/^attribute\.[a-z][a-z0-9_]{0,59}$/.test(key));
  if(unknown.length)throw Error('Unknown CSV columns: '+unknown.join(', '));
  const data=[];
  for(const record of records){
    if(record.cells.length!==headers.length)throw Error('Column count mismatch on row '+record.line);
    const cells=Object.fromEntries(headers.map((key,i)=>[key,record.cells[i]]));
    if(/^y(es)?$/i.test(text(cells.__example)))continue;
    data.push({row:record.line,cells});
  }
  if(data.length>IMPORT_LIMIT)throw Error('Maximum '+IMPORT_LIMIT+' records per request');
  return {headers,rows:data};
}
const fieldNumber=(raw,key,issues,row)=>{
  const s=text(raw);
  if(!s)return undefined;
  const n=Number(s);
  if(!Number.isFinite(n)||n<0||n>100000||
      (key.endsWith('.units')&&(!Number.isInteger(n)||n<1))){
    issues.push(issue(row,key,'Must be a valid nonnegative number (cm/kg); carton units must be an integer'));
    return undefined;
  }
  return n;
};
export function mapImportRow(input,{categories=[]}={}){
  const cells=input?.cells||{},row=Number(input?.row||0);
  const code=normalizeSku(cells.code),issues=[];
  if(!SKU.test(code))issues.push(issue(row,'code','SKU must start PZ- and contain 2-40 valid characters'));
  for(const field of IMPORT_REQUIRED_COLUMNS.filter(field=>field!=='code'))
    if(!text(cells[field]))issues.push(issue(row,field,'导入必填：'+COLUMN_GUIDE[field].zhLabel));
  if(categories.length&&text(cells.category)){
    const match=categories.find(c=>c.id===text(cells.category));
    if(!match)issues.push(issue(row,'category',
      '未知分类ID '+text(cells.category)+'；有效ID：'+categories.map(c=>c.id).join('、')));
    else if(text(cells.sub_category)&&Array.isArray(match.subCategories)&&match.subCategories.length){
      const choices=match.subCategories.map(s=>s.name).filter(Boolean);
      if(choices.length&&!choices.includes(text(cells.sub_category)))
        issues.push(issue(row,'sub_category','未知子分类；有效值：'+choices.join('、')));
    }
  }
  const dimensions={};
  for(const key of ['length','width','height','thickness']){
    const v=fieldNumber(cells['dimensions_cm.'+key],'dimensions_cm.'+key,issues,row);
    if(v!==undefined)dimensions[key]=v;
  }
  const net=fieldNumber(cells.net_weight_kg,'net_weight_kg',issues,row);
  const cartons=[];
  for(const n of [1,2,3]){
    const carton={carton_no:n};let haveCarton=false;
    for(const key of ['length_cm','width_cm','height_cm','gross_weight_kg','net_weight_kg','units']){
      const field='carton_'+n+'.'+key;
      const v=fieldNumber(cells[field],field,issues,row);
      if(v!==undefined){carton[key]=v;haveCarton=true;}
    }
    for(const key of ['packing_method','protection_notes']){
      if(text(cells['carton_'+n+'.'+key])){
        carton[key]=text(cells['carton_'+n+'.'+key]);haveCarton=true;
      }
    }
    if(haveCarton){
      if(['length_cm','width_cm','height_cm'].some(key=>carton[key]===undefined))
        issues.push(issue(row,'carton_'+n,'第'+n+'箱尺寸未填齐，请在提交审核前补充','warning'));
      cartons.push(carton);
    }
  }
  const sites=text(cells.production_sites)?text(cells.production_sites).split(/[;；,，]/).map(text).filter(Boolean):[];
  if(new Set(sites).size!==sites.length||sites.some(site=>!SITE_VALUES.includes(site)))
    issues.push(issue(row,'production_sites','Use unique zhaoqing and/or cambodia values'));
  const attributes={};
  for(const [key,v] of Object.entries(cells))
    if(/^attribute\.[a-z][a-z0-9_]{0,59}$/.test(key)&&text(v))
      attributes[key.slice(10)]=text(v);
  const spec={schema_version:1,
    ...(Object.keys(dimensions).length?{dimensions_cm:dimensions}:{}),
    ...(net!==undefined?{net_weight_kg:net}:{}),
    ...(text(cells.color)?{color:text(cells.color)}:{}),
    ...(text(cells.series_id)?{series_id:text(cells.series_id)}:{}),
    ...(text(cells.construction_en)?{construction_en:text(cells.construction_en)}:{}),
    ...(text(cells.care_en)?{care_en:text(cells.care_en)}:{}),
    ...(text(cells.warnings_en)?{warnings_en:text(cells.warnings_en)}:{}),
    ...(text(cells.selling_points_en)?{selling_points_en:text(cells.selling_points_en).split(/[;；]/).map(text).filter(Boolean)}:{}),
    ...(Object.keys(attributes).length?{attributes}:{}),
    ...(cartons.length?{packaging:cartons}:{})
  };
  const product={code,name:text(cells.name),name_cn:text(cells.name_cn),
    category:text(cells.category),sub_category:text(cells.sub_category),
    material:text(cells.material),finish:text(cells.finish),
    description:text(cells.description),description_cn:text(cells.description_cn),
    production_sites:sites,images:[],specifications:spec,status:'draft'};
  if(['tested_load','shelf_load'].some(key=>attributes[key]))
    issues.push(issue(row,'attributes','已填写承重/认证类数字：审核时须提供证据文件','warning'));
  const preflight=preflightProduct(product);
  // Missing images or optional image roles may be completed after draft import.
  // Remaining preflight defects are hard import errors.
  for(const item of preflight.errors){
    const severity=item.field==='images'?'warning':'error';
    issues.push(issue(row,item.field,item.zh,severity));
  }
  for(const item of preflight.warnings)issues.push(issue(row,item.field,item.zh,'warning'));
  return {row,code,product,issues,valid:!issues.some(i=>i.severity==='error')};
}
export function attachImageRoles(item,images=[]){
  const roles={};const ordered=[...images].sort((a,b)=>
    (a.role==='main'?0:1)-(b.role==='main'?0:1));
  for(const x of ordered)if(typeof x.url==='string'&&x.url&&IMAGE_ROLES.includes(x.role))roles[x.url]=x.role;
  const product={...item.product,images:ordered.map(x=>x.url),
    specifications:{...item.product.specifications,media_roles:roles}};
  const issues=preflightProduct(product);
  const main=ordered.some(x=>x.role==='main');
  const summary=[...item.issues.filter(x=>x.field!=='images'),
    ...issues.errors.filter(x=>x.field==='images').map(x=>issue(item.row,'images',x.zh,'warning'))];
  if(!main)summary.push(issue(item.row,'images','Missing main image: draft may be imported, but cannot be submitted','warning'));
  return {...item,product,issues:summary,valid:!summary.some(x=>x.severity==='error')};
}
export function matchImageFilename(fileName){
  const match=String(fileName||'').match(/^(PZ-[A-Za-z0-9_-]+)__(main|lifestyle|detail|material|dimension|packaging)\.(jpe?g|png|webp)$/i);
  if(!match)return null;
  const code=normalizeSku(match[1]),role=match[2].toLowerCase();
  return SKU.test(code)?{code,role}:null;
}
export function errorReportCsv(issues){
  return '\ufeff'+csvLine(['row','field','severity','reason'])+'\r\n'+
    issues.map(i=>csvLine([i.row,i.field,i.severity,i.message])).join('\r\n')+'\r\n';
}
