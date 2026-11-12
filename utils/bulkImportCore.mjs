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
  'carton_1.packing_method','carton_1.protection_notes'
];
const SKU=/^PZ-[A-Z0-9][A-Z0-9_-]{1,39}$/;
const NUMERIC=new Set([
  'dimensions_cm.length','dimensions_cm.width','dimensions_cm.height','dimensions_cm.thickness',
  'net_weight_kg','carton_1.length_cm','carton_1.width_cm','carton_1.height_cm',
  'carton_1.gross_weight_kg','carton_1.net_weight_kg','carton_1.units'
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
export function csvTemplate(columns=BASE_COLUMNS){
  const sample={
    __example:'YES',code:'PZ-EXAMPLE-001',name:'Marlow Oak Dining Table',name_cn:'橡木餐桌',
    category:'dining-table',sub_category:'Dining',material:'White Oak',finish:'Matte',
    color:'Natural Oak',production_sites:'zhaoqing',description:'Solid oak dining table',
    description_cn:'橡木餐桌', 'dimensions_cm.length':'180','dimensions_cm.width':'90',
    'dimensions_cm.height':'75',net_weight_kg:'38',
    selling_points_en:'Solid oak;Modern style',
    'carton_1.length_cm':'187','carton_1.width_cm':'97','carton_1.height_cm':'18',
    'carton_1.gross_weight_kg':'45','carton_1.units':'1',
    'attribute.seating_capacity':'6'
  };
  return '\ufeff'+csvLine(['# PZ CSV import. All dimensions in cm; weights in kg. Example row __example=YES is ignored. Export Excel as UTF-8 CSV.'])+'\r\n'+
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
  if(records[0]?.cells?.[0]?.startsWith('#'))records.shift();
  if(!records.length)throw Error('CSV header is missing');
  const heading=records.shift(),headers=heading.cells.map(text);
  if(new Set(headers).size!==headers.length)throw Error('Duplicate CSV header column');
  const missing=['__example','code','name','category','material','description'].filter(key=>!headers.includes(key));
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
      (key==='carton_1.units'&&(!Number.isInteger(n)||n<1))){
    issues.push(issue(row,key,'Must be a valid nonnegative number (cm/kg); carton units must be an integer'));
    return undefined;
  }
  return n;
};
export function mapImportRow(input){
  const cells=input?.cells||{},row=Number(input?.row||0);
  const code=normalizeSku(cells.code),issues=[];
  if(!SKU.test(code))issues.push(issue(row,'code','SKU must start PZ- and contain 2-40 valid characters'));
  for(const field of ['name','category','material','description'])
    if(!text(cells[field]))issues.push(issue(row,field,'Required for catalog import'));
  const dimensions={};
  for(const key of ['length','width','height','thickness']){
    const v=fieldNumber(cells['dimensions_cm.'+key],'dimensions_cm.'+key,issues,row);
    if(v!==undefined)dimensions[key]=v;
  }
  const net=fieldNumber(cells.net_weight_kg,'net_weight_kg',issues,row);
  const carton={carton_no:1},haveCarton=false;
  for(const key of ['length_cm','width_cm','height_cm','gross_weight_kg','net_weight_kg','units']){
    const v=fieldNumber(cells['carton_1.'+key],'carton_1.'+key,issues,row);
    if(v!==undefined){carton[key]=v;haveCarton=true;}
  }
  for(const key of ['packing_method','protection_notes']){
    if(text(cells['carton_1.'+key])){carton[key]=text(cells['carton_1.'+key]);haveCarton=true;}
  }
  const sites=text(cells.production_sites)?text(cells.production_sites).split(/[;,]/).map(text).filter(Boolean):[];
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
    ...(text(cells.selling_points_en)?{selling_points_en:text(cells.selling_points_en).split(';').map(text).filter(Boolean)}:{}),
    ...(Object.keys(attributes).length?{attributes}:{}),
    ...(haveCarton?{packaging:[carton]}:{})
  };
  const product={code,name:text(cells.name),name_cn:text(cells.name_cn),
    category:text(cells.category),sub_category:text(cells.sub_category),
    material:text(cells.material),finish:text(cells.finish),
    description:text(cells.description),description_cn:text(cells.description_cn),
    production_sites:sites,images:[],specifications:spec,status:'draft'};
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
