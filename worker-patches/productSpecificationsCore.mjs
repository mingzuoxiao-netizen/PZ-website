// Server-side validator for internal technical specs. This is embedded into
// BOTH review Worker candidates. Never put this JSON in public catalog reads.
export function pzValidateTechnicalSpecs(input) {
  if (input === undefined) return { json:null, error:null }; // old clients preserve existing column
  if (!input || typeof input !== 'object' || Array.isArray(input))
    return {json:null,error:'specifications must be a JSON object'};
  const forbidden=/(?:^|_)(?:price|cost|quote|margin|profit|fob|exw|msrp|retail|purchase|currency)(?:_|$)/i;
  const allowed={
    top:['schema_version','series_id','color','dimensions_cm','net_weight_kg','selling_points_en','construction_en','materials','attributes','packaging','assembly','care_en','warnings_en','attachments','verification','provenance'],
    dimension:['length','width','height','thickness'],
    material:['part','material','construction','finish'],
    pack:['carton_no','length_cm','width_cm','height_cm','gross_weight_kg','net_weight_kg','units'],
    assembly:['required','minutes','instructions_file'],
    attachment:['file_name','type','visibility'],
    verification:['claim','evidence_file','status'],
    provenance:['provider','reviewer','source_factory']
  };
  const fail=msg=>{throw Error(msg);};
  const object=(value,fields,path)=>{
    if(!value || typeof value!=='object' || Array.isArray(value)) fail(path+' must be an object');
    for(const k of Object.keys(value)){
      if(forbidden.test(k))fail('Financial field not allowed: '+k);
      if(!fields.includes(k))fail('Unsupported '+path+' field: '+k);
    }
    return value;
  };
  const word=(value,path,max=1000)=>{
    if(value===undefined||value===null) return;
    if(typeof value!=='string'||value.length>max)fail(path+' must be text within '+max+' chars');
  };
  const positive=(value,path)=>{
    if(value===undefined||value===null)return;
    if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>100000)fail(path+' must be a nonnegative number');
  };
  const array=(value,path,max)=>{
    if(value===undefined)return [];
    if(!Array.isArray(value)||value.length>max)fail(path+' must be an array with at most '+max+' items');
    return value;
  };
  try{
    object(input,allowed.top,'specifications');
    if(input.schema_version!==undefined&&input.schema_version!==1)fail('Unsupported technical schema version');
    word(input.series_id,'series_id',120);word(input.color,'color',120);
    word(input.construction_en,'construction_en',3000);
    word(input.care_en,'care_en',2500);word(input.warnings_en,'warnings_en',2500);
    positive(input.net_weight_kg,'net_weight_kg');
    if(input.dimensions_cm!==undefined){
      const d=object(input.dimensions_cm,allowed.dimension,'dimensions_cm');
      for(const [k,v] of Object.entries(d))positive(v,'dimensions_cm.'+k);
    }
    array(input.selling_points_en,'selling_points_en',3).forEach((v,i)=>word(v,'selling_points_en.'+i,250));
    array(input.materials,'materials',15).forEach((v,i)=>{
      object(v,allowed.material,'materials.'+i);
      for(const [k,t] of Object.entries(v))word(t,'materials.'+i+'.'+k,300);
    });
    if(input.attributes!==undefined){
      const a=input.attributes;
      if(!a || typeof a!=='object'||Array.isArray(a)||Object.keys(a).length>30)fail('attributes must be a limited object');
      for(const [k,v] of Object.entries(a)){
        if(!/^[a-z][a-z0-9_]{0,50}$/.test(k)||forbidden.test(k))fail('Unsupported technical attribute: '+k);
        word(v,'attributes.'+k,200);
      }
    }
    array(input.packaging,'packaging',15).forEach((v,i)=>{
      object(v,allowed.pack,'packaging.'+i);
      for(const [k,n] of Object.entries(v))positive(n,'packaging.'+i+'.'+k);
      if(!Number.isInteger(v.carton_no)||v.carton_no<1||v.carton_no>15)fail('Carton number must be 1-15');
      if(v.units!==undefined&&!Number.isInteger(v.units))fail('Carton units must be integer');
    });
    if(input.assembly!==undefined){
      const a=object(input.assembly,allowed.assembly,'assembly');
      if(a.required!==undefined&&typeof a.required!=='boolean')fail('assembly.required must be boolean');
      positive(a.minutes,'assembly.minutes');
      word(a.instructions_file,'assembly.instructions_file',240);
    }
    array(input.attachments,'attachments',25).forEach((v,i)=>{
      object(v,allowed.attachment,'attachments.'+i);
      word(v.file_name,'attachments.file_name',240);
      if(!['dimension','assembly','certificate','other'].includes(v.type))fail('Unknown attachment type');
      if(!['public','internal'].includes(v.visibility))fail('Unknown attachment visibility');
    });
    array(input.verification,'verification',15).forEach((v,i)=>{
      object(v,allowed.verification,'verification.'+i);
      word(v.claim,'verification.claim',500);word(v.evidence_file,'verification.evidence_file',240);
      if(!['unverified','verified','not_applicable'].includes(v.status))fail('Unknown verification status');
      if(v.status==='verified'&&!v.evidence_file?.trim())fail('Verified claim requires evidence file');
    });
    if(input.provenance!==undefined){
      const p=object(input.provenance,allowed.provenance,'provenance');
      for(const [k,v] of Object.entries(p))word(v,'provenance.'+k,120);
    }
    const json=JSON.stringify({...input,schema_version:1});
    if(new TextEncoder().encode(json).length>32768)fail('Technical product data exceeds 32KB');
    return {json,error:null};
  }catch(error){
    return {json:null,error:String(error.message||error)};
  }
}
