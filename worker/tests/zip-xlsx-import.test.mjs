import {deflateRawSync} from 'node:zlib';
import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectZip,createStoredZip,ZIP_LIMITS} from '../../utils/safeZip.mjs';
import {createTemplateWorkbook,createZipTemplate,readWorkbook,readProductZip,
  disposePreviews,matchSkuFolder,assignInitialImageRoles} from '../../utils/zipXlsxImport.mjs';
import {templateColumns,normalizeSku} from '../../utils/bulkImportCore.mjs';

const unescape=s=>s.replace(/&(?:amp|lt|gt|quot|apos);/g,c=>({
  '&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'"
}[c]));
class MiniNode{
  constructor(name='',attrs={}){this.localName=name.split(':').at(-1);this.attrs=attrs;this.parts=[];}
  get children(){return this.parts.filter(x=>typeof x!=='string');}
  get textContent(){return this.parts.map(x=>typeof x==='string'?x:x.textContent).join('');}
  getAttribute(key){return this.attrs[key]??null;}
  getAttributeNS(ns,key){return this.attrs['r:'+key]??this.attrs[key]??null;}
  getElementsByTagNameNS(ns,key){
    const found=[];
    const visit=node=>{for(const child of node.children){
      if(key==='*'||child.localName===key)found.push(child);
      visit(child);
    }};
    visit(this);return found;
  }
  getElementsByTagName(key){return this.getElementsByTagNameNS('*',key);}
}
class MiniDOMParser{
  parseFromString(content){
    const doc=new MiniNode('document'),stack=[doc];
    const tokens=content.match(/<[^>]*>|[^<]+/g)||[];
    for(const token of tokens){
      if(token.startsWith('<?')||token.startsWith('<!'))continue;
      if(token.startsWith('</')){stack.pop();continue;}
      if(token.startsWith('<')){
        const close=/\/>$/.test(token),name=/^<([\w:-]+)/.exec(token)?.[1]||'';
        const attrs={};
        for(const m of token.matchAll(/([\w:-]+)="([^"]*)"/g))attrs[m[1]]=unescape(m[2]);
        const node=new MiniNode(name,attrs);
        stack.at(-1).parts.push(node);
        if(!close)stack.push(node);
      }else stack.at(-1).parts.push(unescape(token));
    }
    return doc;
  }
}
const originalParser=globalThis.DOMParser;
const setDom=()=>{globalThis.DOMParser=MiniDOMParser;};
const restoreDom=()=>{if(originalParser===undefined)delete globalThis.DOMParser;
  else globalThis.DOMParser=originalParser;};
const col=i=>{let name='';for(let n=i+1;n>0;n=Math.floor((n-1)/26))
  name=String.fromCharCode(65+(n-1)%26)+name;return name;};
const escape=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
async function workbookWithRow(sku='PZ-TABLE-001'){
  const template=createTemplateWorkbook('dining-table'),zip=inspectZip(template);
  const keys=templateColumns();
  const values={code:sku,name:'White Oak Table',name_cn:'橡木餐桌',
    category:'dining-table',material:'White Oak',description:'Solid oak dining table',
    production_sites:'zhaoqing','dimensions_cm.length':'180','dimensions_cm.width':'90',
    'dimensions_cm.height':'75'};
  const row='<row r="3">'+keys.map((key,i)=>values[key]?
    '<c r="'+col(i)+'3" t="inlineStr"><is><t>'+escape(values[key])+'</t></is></c>':'').join('')+'</row>';
  const files=[];
  for(const entry of zip.entries){
    const data=await zip.read(entry);
    files.push({name:entry.name,data:entry.name==='xl/worksheets/sheet1.xml'?
      new TextEncoder().encode(new TextDecoder().decode(data).replace('</sheetData>',row+'</sheetData>')):data});
  }
  return createStoredZip(files);
}
const jpg=new Uint8Array([0xff,0xd8,0xff,0xe1,0,0,0xff,0xd9]);

function deflatedFixture(name,plaintext){
  const raw=new TextEncoder().encode(plaintext);
  const stored=createStoredZip([{name,data:raw}]);
  const nameLength=new DataView(stored.buffer).getUint16(26,true),
    localSize=30+nameLength,centralLength=46+nameLength,
    compressed=deflateRawSync(raw);
  const out=new Uint8Array(localSize+compressed.length+centralLength+22);
  out.set(stored.subarray(0,localSize),0);
  out.set(compressed,localSize);
  out.set(stored.subarray(localSize+raw.length,
    localSize+raw.length+centralLength),localSize+compressed.length);
  out.set(stored.subarray(localSize+raw.length+centralLength),
    localSize+compressed.length+centralLength);
  const view=new DataView(out.buffer),cd=localSize+compressed.length,eocd=cd+centralLength;
  view.setUint16(8,8,true);view.setUint32(18,compressed.length,true);
  view.setUint16(cd+10,8,true);view.setUint32(cd+20,compressed.length,true);
  view.setUint32(eocd+16,cd,true);
  return out;
}

test('ordinary Deflate-compressed ZIP files decompress to their exact original bytes',async()=>{
  const content='Furniture photo metadata '.repeat(25);
  const archive=inspectZip(deflatedFixture('file.txt',content));
  const decoded=new TextDecoder().decode(await archive.read('file.txt'));
  assert.equal(decoded,content);
});

test('downloaded ZIP contains real XLSX package, instructions and SKU image folder',async()=>{
  const z=inspectZip(createZipTemplate('dining-table',['seating_capacity']));
  assert.ok(z.has('产品资料.xlsx'));
  assert.ok(z.has('images/'));
  assert.ok(z.has('README.txt'));
  const inner=inspectZip(await z.read('产品资料.xlsx'));
  assert.ok(inner.has('[Content_Types].xml'));
  assert.ok(inner.has('xl/workbook.xml'));
  assert.ok(inner.has('xl/worksheets/sheet1.xml'));
  const content=new TextDecoder().decode(await inner.read('xl/worksheets/sheet1.xml'));
  assert.match(content,/PZ-EXAMPLE-001/);
  assert.match(content,/attribute.seating_capacity/);
  assert.match(content,/dining-table/);
});

test('Excel reader skips the built-in example and retains source row numbers',async()=>{
  setDom();
  try{
    const rows=await readWorkbook(await workbookWithRow());
    assert.equal(rows.length,1);
    assert.equal(rows[0].row,3);
    assert.equal(rows[0].cells.code,'PZ-TABLE-001');
    assert.equal(rows[0].cells.name_cn,'橡木餐桌');
    assert.equal(rows[0].cells['dimensions_cm.length'],'180');
  }finally{restoreDom();}
});

test('camera filenames match ONLY their SKU folder, cover/main and order are deterministic',()=>{
  assert.deepEqual(matchSkuFolder('images/pz-table-001/DSC_8920.JPG'),{
    sku:'PZ-TABLE-001',file:'DSC_8920.JPG'
  });
  assert.equal(matchSkuFolder('PZ-TABLE-001__main.jpg'),null);
  assert.equal(matchSkuFolder('images/PZ-OTHER/folder/photo.jpg'),null);
  const initial=assignInitialImageRoles([
    {file:'DSC_2.jpg',role:'lifestyle'},{file:'DSC_1.jpg',role:'lifestyle'}
  ]);
  assert.equal(initial.needsConfirmation,true);
  assert.equal(initial.images[0].file,'DSC_1.jpg');
  assert.equal(initial.images[0].role,'main');
  const selected=assignInitialImageRoles([
    {file:'DSC_01.jpg',role:'lifestyle'},{file:'cover.jpg',role:'lifestyle'}
  ]);
  assert.equal(selected.needsConfirmation,false);
  assert.equal(selected.images.find(x=>x.role==='main').file,'cover.jpg');
});

test('one ZIP reads XLSX + SKU folders, keeps camera filenames and excludes orphans',async()=>{
  setDom();
  try{
    const wb=await workbookWithRow('PZ-TABLE-001');
    const bytes=createStoredZip([
      {name:'产品资料.xlsx',data:wb},
      {name:'images/PZ-TABLE-001/DSC_0002.jpg',data:jpg},
      {name:'images/PZ-TABLE-001/cover.jpg',data:jpg},
      {name:'images/PZ-OTHER/IMG_001.jpg',data:jpg}
    ]);
    const imported=await readProductZip(bytes);
    try{
      assert.equal(imported.records.length,1);
      const images=imported.images.get('PZ-TABLE-001');
      assert.equal(images.length,2);
      assert.equal(images.find(x=>x.role==='main').file,'cover.jpg');
      assert.equal(imported.orphan.length,1);
      assert.equal(imported.records[0].code,normalizeSku('PZ-TABLE-001'));
    }finally{disposePreviews(imported);}
  }finally{restoreDom();}
});

test('ZIP reader rejects traversal, duplicate names, corrupted CRC and excessive entries',async()=>{
  assert.throws(()=>createStoredZip([{name:'images/../foo.jpg',data:jpg}]),/不安全/);
  assert.throws(()=>inspectZip(createStoredZip([
    {name:'images/PZ-001/A.jpg',data:jpg},
    {name:'images/pz-001/a.JPG',data:jpg}
  ])),/重名/);
  const valid=createStoredZip([{name:'data.txt',data:'hello, world'}]);
  const corrupted=valid.slice();const position=corrupted.indexOf(104);
  assert.ok(position>=0);corrupted[position]^=1;
  await assert.rejects(inspectZip(corrupted).read('data.txt'),/CRC|损坏/);
  assert.throws(()=>createStoredZip(Array.from({length:ZIP_LIMITS.entries+1},(_,i)=>({
    name:'file-'+i+'.txt',data:'x'
  }))),/文件过多/);
});

test('compressing the containing batch folder still matches the workbook and camera photos',async()=>{
  setDom();
  try{
    const wb=await workbookWithRow('PZ-TABLE-001');
    const zipped=createStoredZip([
      {name:'PZ-batch/产品资料.xlsx',data:wb},
      {name:'PZ-batch/images/PZ-TABLE-001/IMG_1234.jpg',data:jpg},
      {name:'PZ-batch/README.txt',data:'instructions'}
    ]);
    const result=await readProductZip(zipped);
    try{
      assert.equal(result.records.length,1);
      assert.equal(result.images.get('PZ-TABLE-001').length,1);
      assert.equal(result.images.get('PZ-TABLE-001')[0].file,'IMG_1234.jpg');
      assert.ok(result.warnings.some(s=>s.includes('人工确认')));
    }finally{disposePreviews(result);}
  }finally{restoreDom();}
});

test('a single XLSX with 100 products and five malformed rows previews 95 valid drafts',async()=>{
  setDom();
  try{
    const template=inspectZip(createTemplateWorkbook('dining-table'));
    const columns=templateColumns();
    const rows=Array.from({length:100},(_,i)=>{
      const value={code:'PZ-OAK-'+String(i).padStart(4,'0'),
        name:'Oak Dining Table',category:'dining-table',
        material:'White Oak',description:'Solid oak dining table',
        production_sites:'zhaoqing',
        'dimensions_cm.length':'180','dimensions_cm.width':'90','dimensions_cm.height':'75'};
      if(i===0)value.code='bad-code';
      if(i===1)value.material='';
      if(i===2)value.name='123456';
      if(i===3)value['dimensions_cm.height']='750cm';
      if(i===4)value.production_sites='invalid-site';
      const n=i+3;
      const cells=columns.map((key,j)=>value[key]?
        '<c r="'+col(j)+n+'" t="inlineStr"><is><t>'+escape(value[key])+'</t></is></c>':'').join('');
      return '<row r="'+n+'">'+cells+'</row>';
    }).join('');
    const files=[];
    for(const item of template.entries){
      const data=await template.read(item);
      files.push({name:item.name,data:item.name==='xl/worksheets/sheet1.xml'?
        new TextEncoder().encode(new TextDecoder().decode(data).replace('</sheetData>',
          rows+'</sheetData>')):data});
    }
    const workbook=createStoredZip(files);
    const zip=createStoredZip([{name:'产品资料.xlsx',data:workbook}]);
    const result=await readProductZip(zip);
    try{
      assert.equal(result.records.length,100);
      assert.equal(result.records.filter(x=>x.valid).length,95);
      assert.equal(result.records.filter(x=>!x.valid).length,5);
      assert.ok(result.records.every(x=>x.product.status==='draft'));
    }finally{disposePreviews(result);}
  }finally{restoreDom();}
});

test('hidden macros, multiple workbooks and missing workbooks fail closed',async()=>{
  setDom();
  try{
    const wb=await workbookWithRow();
    await assert.rejects(readProductZip(createStoredZip([{name:'note.txt',data:'none'}])),/xlsx/);
    await assert.rejects(readProductZip(createStoredZip([
      {name:'products.xlsx',data:wb},{name:'other.xlsx',data:wb}
    ])),/只有一个/);
    const z=inspectZip(wb),files=[];
    for(const e of z.entries)files.push({name:e.name,data:await z.read(e)});
    files.push({name:'xl/vbaProject.bin',data:'unsafe'});
    await assert.rejects(readWorkbook(createStoredZip(files)),/宏|外部链接/);
  }finally{restoreDom();}
});
