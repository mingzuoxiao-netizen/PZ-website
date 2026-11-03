// PZ structured product data v1. Source: PZ V2 benchmark workbook (no pricing).
// These details remain internal to authenticated product records until a
// separate public-detail rollout explicitly selects safe fields.
export type SpecStringField='series_id'|'color'|'construction_en'|'care_en'|'warnings_en';
export interface ProductSpecifications {
  schema_version:1;
  series_id?:string;
  color?:string;
  dimensions_cm?:{length?:number;width?:number;height?:number;thickness?:number};
  net_weight_kg?:number;
  selling_points_en?:string[];
  construction_en?:string;
  materials?:Array<{part:string;material:string;construction?:string;finish?:string}>;
  attributes?:Record<string,string>;
  packaging?:Array<{carton_no:number;length_cm?:number;width_cm?:number;height_cm?:number;gross_weight_kg?:number;net_weight_kg?:number;units?:number;packing_method?:string;protection_notes?:string}>;
  assembly?:{required?:boolean;minutes?:number;instructions_file?:string};
  care_en?:string;
  warnings_en?:string;
  media_roles?:Record<string,'main'|'lifestyle'|'detail'|'dimension'|'material'|'packaging'>;
  attachments?:Array<{file_name:string;type:'dimension'|'assembly'|'certificate'|'other';visibility:'public'|'internal'}>;
  verification?:Array<{claim:string;evidence_file?:string;status:'unverified'|'verified'|'not_applicable'}>;
  provenance?:{provider?:string;reviewer?:string;source_factory?:string};
}

export type AttributeDefinition={key:string;labelZh:string;labelEn:string;unit?:string;needsEvidence?:boolean};
const diningTable:AttributeDefinition[]=[
  {key:'seating_capacity',labelZh:'适用座位数',labelEn:'Seats',unit:'人'},
  {key:'tabletop_thickness',labelZh:'台面厚度',labelEn:'Top thickness',unit:'cm'},
  {key:'apron_clearance',labelZh:'围板至地面净空',labelEn:'Apron clearance',unit:'cm'},
  {key:'distance_between_legs',labelZh:'桌腿间距',labelEn:'Distance between legs',unit:'cm'},
  {key:'extendable',labelZh:'是否可伸缩',labelEn:'Extendable'}
];
const seating:AttributeDefinition[]=[
  {key:'seat_height',labelZh:'座高',labelEn:'Seat height',unit:'cm'},
  {key:'seat_depth',labelZh:'座深',labelEn:'Seat depth',unit:'cm'},
  {key:'seat_width',labelZh:'座宽',labelEn:'Seat width',unit:'cm'},
  {key:'tested_load',labelZh:'经测试承重',labelEn:'Tested load',unit:'kg',needsEvidence:true}
];
const cabinet:AttributeDefinition[]=[
  {key:'door_count',labelZh:'门数',labelEn:'Doors'},
  {key:'drawer_count',labelZh:'抽屉数量',labelEn:'Drawers'},
  {key:'adjustable_shelf',labelZh:'可调层板',labelEn:'Adjustable shelves'},
  {key:'anti_tip_kit',labelZh:'防倾倒装置',labelEn:'Anti-tip kit'},
  {key:'shelf_load',labelZh:'层板承重',labelEn:'Shelf load',unit:'kg',needsEvidence:true}
];
const block:AttributeDefinition[]=[
  {key:'wood_species',labelZh:'木种',labelEn:'Wood species'},
  {key:'panel_construction',labelZh:'拼板结构',labelEn:'Panel construction'},
  {key:'top_thickness',labelZh:'面板厚度',labelEn:'Top thickness',unit:'cm'},
  {key:'edge_profile',labelZh:'封边 / 边型',labelEn:'Edge profile'},
  {key:'finish_type',labelZh:'表面工艺',labelEn:'Finish type'}
];
const shelf:AttributeDefinition[]=[{key:'shelf_count',labelZh:'层板数',labelEn:'Shelf count'},{key:'adjustable_shelf',labelZh:'可调层板',labelEn:'Adjustable shelves'}];
const bed:AttributeDefinition[]=[{key:'mattress_size',labelZh:'适配床垫尺寸',labelEn:'Mattress size'},{key:'slat_count',labelZh:'床板条数',labelEn:'Slat count'}];
export function attributesForCategory(label:string):AttributeDefinition[]{
  const value=(label||'').toLowerCase();
  if(/butcher|work.surface|countertop|panel|wood.top/.test(value))return block;
  if(/dining.*table|dining-table|table.dining|round.table|extendable/.test(value))return diningTable;
  if(/chair|bench|stool|seating/.test(value))return seating;
  if(/sideboard|cabinet|casegood|media|dresser|nightstand|credenza|storage/.test(value))return cabinet;
  if(/shelf|bookcase|shelving/.test(value))return shelf;
  if(/bedroom|(^|[^a-z])bed([^a-z]|$)/.test(value))return bed;
  return [];
}
export type DimensionKey='length'|'width'|'height'|'thickness';
export type DimensionField={key:DimensionKey;en:string;zh:string};
export function isSurfacePanelCategory(category:string):boolean {
  return /butcher|work.surface|countertop|panel|wood.top|cutting.board/i.test(category||'');
}
export function dimensionFieldsForCategory(category:string):DimensionField[] {
  if(isSurfacePanelCategory(category))return [
    {key:'length',en:'Length (cm)',zh:'长度 (cm)'},
    {key:'width',en:'Width (cm)',zh:'宽度 (cm)'},
    {key:'thickness',en:'Thickness (cm)',zh:'厚度 (cm)'}
  ];
  if(/chair|bench|stool|seating/i.test(category||''))return [
    {key:'width',en:'Width (cm)',zh:'宽度 (cm)'},
    {key:'length',en:'Depth (cm)',zh:'深度 (cm)'},
    {key:'height',en:'Height (cm)',zh:'高度 (cm)'}
  ];
  return [
    {key:'length',en:'Length (cm)',zh:'长度 (cm)'},
    {key:'width',en:'Width (cm)',zh:'宽度 (cm)'},
    {key:'height',en:'Height (cm)',zh:'高度 (cm)'}
  ];
}
/** One dimension source: structured cm values. The old public size string is derived on save. */
export function formatDimensionsForDisplay(specs:ProductSpecifications,category:string):string|null {
  const dimensions=specs.dimensions_cm;
  if(!dimensions)return null;
  const fields=dimensionFieldsForCategory(category);
  const values=fields.map(f=>dimensions[f.key]);
  if(values.every(v=>v===undefined||v===null))return null;
  const parts=values.map(v=>typeof v==='number'&&Number.isFinite(v)?String(v):'—');
  return parts.join(' × ')+' cm';
}
export function readProductSpecifications(value:unknown):ProductSpecifications{
  let result:unknown=value;
  if(typeof result==='string'){try{result=JSON.parse(result);}catch{return {schema_version:1};}}
  if(!result||typeof result!=='object'||Array.isArray(result))return {schema_version:1};
  return {...result,schema_version:1} as ProductSpecifications;
}
export function specificationIssues(specs:ProductSpecifications):string[]{
  const issues:string[]=[];
  const nonNegative=(value:unknown,path:string)=>{
    if(value!==undefined&&value!==null&&value!==''&&
      (typeof value!=='number'||!Number.isFinite(value)||value<0||value>100000))
      issues.push(path+' 必须是有效非负数字');
  };
  Object.entries(specs.dimensions_cm||{}).forEach(([k,v])=>nonNegative(v,k));
  nonNegative(specs.net_weight_kg,'净重');
  (specs.packaging||[]).forEach((row,i)=>{
    ['carton_no','length_cm','width_cm','height_cm','gross_weight_kg','net_weight_kg','units'].forEach(k=>
      nonNegative(row[k as keyof typeof row],'包装'+(i+1)+' '+k));
  });
  (specs.verification||[]).forEach((row,i)=>{
    if(row.status==='verified'&&!row.evidence_file?.trim())issues.push('验证项目 '+(i+1)+' 标记已核实时必须填写证据文件');
  });
  return issues;
}
