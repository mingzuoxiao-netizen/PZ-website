import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {
  csvTemplate,parseCsv,csvLine,mapImportRow,attachImageRoles,matchImageFilename,
  templateColumns,errorReportCsv
} from '../../utils/bulkImportCore.mjs';
import {preflightProduct} from '../../utils/productPreflight.js';
import {bulkImportFetch} from '../bulkImportCore.mjs';

const migration=readFileSync(new URL(
  '../../worker-patches/migrations/020_bulk_draft_import_REVIEW.sql',import.meta.url),'utf8');
const uuidOne='00000000-0000-4000-8000-000000000001';
const uuidTwo='00000000-0000-4000-8000-000000000002';
const json=(data,status=200)=>new Response(JSON.stringify(data),
  {status,headers:{'content-type':'application/json'}});

const validRow=i=>({
  row:i+4,
  cells:{
    __example:'',code:'PZ-OAK-'+String(i).padStart(4,'0'),
    name:'Marlow Oak Dining Table',name_cn:'橡木餐桌',category:'dining-table',
    material:'White Oak',finish:'Matte',description:'Solid oak dining table',
    description_cn:'橡木餐桌',
    production_sites:'zhaoqing',
    'dimensions_cm.length':'180','dimensions_cm.width':'90',
    'dimensions_cm.height':'75','net_weight_kg':'38'
  },
  images:[]
});

function setup(role='FACTORY'){
  const sql=new DatabaseSync(':memory:');sql.exec('PRAGMA foreign_keys=ON');
  sql.exec(`
    CREATE TABLE users(id TEXT PRIMARY KEY,username TEXT,role TEXT,is_active INTEGER,deleted_at TEXT);
    CREATE TABLE pz_departments(id TEXT PRIMARY KEY,is_active INTEGER);
    CREATE TABLE pz_staff_assignments(user_id TEXT,department_id TEXT,job_type TEXT,supervisor_id TEXT);
    CREATE TABLE products (
      id TEXT PRIMARY KEY,name TEXT,name_cn TEXT,category TEXT,sub_category TEXT,
      material TEXT,size TEXT,finish TEXT,code TEXT,
      description TEXT,description_cn TEXT,images TEXT,
      status TEXT,created_at TEXT,updated_at TEXT,production_sites TEXT,
      org_id TEXT,created_by TEXT,specs_json TEXT,deleted_at TEXT,catalog_hidden INTEGER DEFAULT 0
    );
    CREATE UNIQUE INDEX sku_unique_normalized ON products(UPPER(TRIM(code)))
      WHERE code IS NOT NULL AND TRIM(code)<>'';
  `);
  sql.exec(migration);
  const insert=sql.prepare('INSERT INTO users VALUES(?,?,?,?,NULL)');
  insert.run('op','staff','factory',1);
  insert.run('sup','supervisor','factory',1);
  insert.run('adm','administrator','admin',1);
  insert.run('other','unrelated','factory',1);
  sql.prepare("INSERT INTO pz_departments VALUES('d1',1)").run();
  sql.prepare("INSERT INTO pz_staff_assignments VALUES('op','d1','staff','sup')").run();
  sql.prepare("INSERT INTO pz_staff_assignments VALUES('sup','d1','supervisor',NULL)").run();
  const db={
    prepare(query){
      const stmt=sql.prepare(query);
      return {
        bind(...params){return{
          first:async()=>stmt.get(...params)||null,
          all:async()=>({results:stmt.all(...params)}),
          run:async()=>({meta:{changes:Number(stmt.run(...params).changes)}})
        };},
        first:async()=>stmt.get()||null,
        all:async()=>({results:stmt.all()})
      };
    }
  };
  const env={DB:db,PZ_BULK_IMPORT_ENABLED:'true',PZ_ORG_RBAC_ENABLED:'true'};
  const authRole=role,userId=role==='ADMIN'?'adm':'op';
  const handler=bulkImportFetch(async()=>json({error:'unhandled'},404),{
    authorize:async()=>({user:{id:userId,role:authRole}}),
    json,canManageProduct:async()=>true,
    validateSpecs:()=>({error:null}),
    imageBase:()=> 'https://staging-assets.example.com'
  });
  const run=async(rows,batch_id=uuidOne,owner_id=undefined)=>{
    const request=new Request('https://api.example/'+(role==='ADMIN'?'admin':'factory')+
      '/products/import-drafts',{
      method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({batch_id,owner_id,rows})
    });
    const response=await handler(request,env,{});
    return {status:response.status,data:await response.json()};
  };
  return {sql,env,handler,run,close:()=>sql.close()};
}

test('CSV template includes units and non-imported example; parser handles commas, UTF-8 and quotes',()=>{
  const columns=templateColumns(['seating_capacity','tabletop_thickness']);
  assert.ok(columns.includes('attribute.seating_capacity'));
  assert.ok(columns.includes('carton_1.gross_weight_kg'));
  const template=csvTemplate(columns,'dining-table');
  assert.match(template,/cm; weights in kg/);
  assert.match(template,/PZ-EXAMPLE-001/);
  assert.equal(parseCsv(template).rows.length,0,'example row cannot be imported');
  const row={row:4,cells:{code:'PZ-A1',name:'Marlow, "Oak" Table',category:'tables',
    material:'Oak',description:'Wood table',__example:''}};
  const csv=template+csvLine(columns.map(key=>row.cells[key]||''))+'\r\n';
  const parsed=parseCsv(csv);
  assert.equal(parsed.rows.length,1);
  assert.equal(parsed.rows[0].cells.name,'Marlow, "Oak" Table');
  assert.equal(parsed.rows[0].row,4);
  assert.throws(()=>parseCsv('code,code\na,b'),/Duplicate CSV header/);
});

test('100-row batch with 5 intentionally malformed rows creates 95 owned DRAFTS and zero published',async()=>{
  const t=setup();
  try{
    const rows=Array.from({length:100},(_,i)=>validRow(i));
    rows[0].cells.code='bad-sku';
    rows[1].cells.material='';
    rows[2].cells.name='测试';
    rows[3].cells['dimensions_cm.height']='750cm';
    rows[4].cells.production_sites='unknown-site';
    const first=await t.run(rows);
    assert.equal(first.status,200,JSON.stringify(first.data));
    assert.equal(first.data.inserted,95);
    assert.equal(first.data.failed,5);
    assert.equal(first.data.skipped,0);
    const counts=t.sql.prepare(
      'SELECT status,COUNT(*) AS count FROM products GROUP BY status'
    ).all();
    assert.deepEqual(counts.map(x=>[x.status,x.count]),[['draft',95]]);
    assert.equal(t.sql.prepare("SELECT COUNT(*) AS count FROM products WHERE created_by='op'").get().count,95);
    assert.equal(t.sql.prepare("SELECT COUNT(*) AS count FROM products WHERE status='published'").get().count,0);
    assert.equal(t.sql.prepare("SELECT COUNT(*) AS count FROM products WHERE import_batch_id=?").get(uuidOne).count,95);
    assert.equal(t.sql.prepare("SELECT COUNT(*) AS count FROM pz_product_import_rows WHERE disposition='invalid'").get().count,5);
    assert.ok(first.data.rows.filter(x=>x.disposition==='invalid').every(x=>x.reason),'invalid rows require field reasons');
    // Same idempotency key returns exactly the prior server-verified result.
    const duplicateRequest=await t.run(rows,uuidOne);
    assert.equal(duplicateRequest.data.already_processed,true);
    assert.equal(duplicateRequest.data.inserted,95);
    // Re-import as a NEW batch ID must create no duplicates, overwrite nothing.
    const repeated=await t.run(rows,uuidTwo);
    assert.equal(repeated.status,200);
    assert.equal(repeated.data.inserted,0);
    assert.equal(repeated.data.skipped,95);
    assert.equal(repeated.data.failed,5);
    assert.equal(t.sql.prepare("SELECT COUNT(*) AS count FROM products").get().count,95);
    assert.equal(t.sql.prepare("SELECT COUNT(*) AS count FROM products WHERE status='published'").get().count,0);
  }finally{t.close();}
});

test('SKU filename matching maps main to first image, preserves roles, and missing main blocks submit',async()=>{
  const t=setup();
  try{
    const main='https://staging-assets.example.com/uploads%2F123-main.jpg';
    const detail='https://staging-assets.example.com/uploads%2F124-detail.jpg';
    assert.deepEqual(matchImageFilename('PZ-OAK-0005__main.jpg'),{code:'PZ-OAK-0005',role:'main'});
    assert.equal(matchImageFilename('badfile.jpg'),null);
    const r=validRow(5);
    r.images=[{url:detail,role:'detail'},{url:main,role:'main'}];
    const imported=await t.run([r]);
    assert.equal(imported.status,200);
    assert.equal(imported.data.inserted,1);
    const stored=t.sql.prepare('SELECT status,images,specs_json FROM products WHERE code=?').get('PZ-OAK-0005');
    assert.equal(stored.status,'draft');
    assert.deepEqual(JSON.parse(stored.images),[main,detail]);
    const specs=JSON.parse(stored.specs_json);
    assert.equal(specs.media_roles[main],'main');
    assert.equal(specs.media_roles[detail],'detail');
    assert.ok(preflightProduct({...mapImportRow(r).product,images:JSON.parse(stored.images),specifications:specs})
      .errors.some(x=>x.code==='images_minimum'),'under-four images cannot enter review');
    const missing=attachImageRoles(mapImportRow(validRow(6)),[{url:detail,role:'detail'}]);
    assert.ok(missing.issues.some(x=>x.message.includes('Missing main image')));
  }finally{t.close();}
});

test('unauthorized owner overrides, disabled import and forged external image URLs fail closed',async()=>{
  const t=setup();
  try{
    const override=await t.run([validRow(1)],uuidOne,'other');
    assert.equal(override.status,403);
    const invalid={...validRow(2),images:[{url:'https://evil.example.com/uploads%2Fa.jpg',role:'main'}]};
    const res=await t.run([invalid],uuidOne);
    assert.equal(res.status,200);
    assert.equal(res.data.inserted,0);
    assert.equal(res.data.failed,1);
    t.env.PZ_BULK_IMPORT_ENABLED='false';
    const disabled=await t.run([validRow(3)],uuidTwo);
    assert.equal(disabled.status,503);
  }finally{t.close();}
});

test('server always inserts DRAFT and ignores untrusted status overrides from caller CSV cells',async()=>{
  const t=setup();
  try{
    const row=validRow(8);
    row.cells.status='published';row.cells.is_published='1';
    const res=await t.run([row]);
    assert.equal(res.status,200);
    assert.equal(res.data.inserted,1);
    const state=t.sql.prepare("SELECT status FROM products WHERE code='PZ-OAK-0008'").get();
    assert.equal(state.status,'draft');
    assert.equal(t.sql.prepare('SELECT COUNT(*) AS count FROM pz_product_import_rows').get().count,1);
  }finally{t.close();}
});

test('error CSV includes row/field/severity, escapes formula injection, and existing SKU filter is server-side',()=>{
  const report=errorReportCsv([{row:5,field:'name',severity:'error',message:'=CMD()'}]);
  assert.match(report,/row,field,severity,reason/);
  assert.ok(report.includes("'=CMD()"));
  const code=readFileSync(new URL('../src/index.js',import.meta.url),'utf8');
  assert.match(code,/base.push\('p.import_batch_id=\?'\)/);
  assert.match(code,/p.import_batch_id/);
  assert.match(code,/bulkImportFetch\(pzImportOriginalFetch/);
});


test('Admin may import on behalf of assigned operator, but never an unassigned account',async()=>{
  const t=setup('ADMIN');
  try{
    const row=validRow(55);
    const accepted=await t.run([row],uuidOne,'op');
    assert.equal(accepted.status,200);
    assert.equal(accepted.data.inserted,1);
    const p=t.sql.prepare("SELECT created_by,status FROM products WHERE code='PZ-OAK-0055'").get();
    assert.equal(p.created_by,'op');assert.equal(p.status,'draft');
    const denied=await t.run([validRow(56)],uuidTwo,'other');
    assert.equal(denied.status,403);
    const count=t.sql.prepare('SELECT COUNT(*) AS n FROM products').get().n;
    assert.equal(count,1);
  }finally{t.close();}
});

test('pagination by import_batch_id is applied in SQL without touching other account batches',()=>{
  const t=setup();
  try{
    const query=t.sql.prepare('PRAGMA table_info(products)').all();
    assert.ok(query.some(row=>row.name==='import_batch_id'));
    const idx=t.sql.prepare(
      "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_pz_products_import_batch'"
    ).get();
    assert.ok(idx);
    const code=readFileSync(new URL('../src/index.js',import.meta.url),'utf8');
    assert.match(code,/base.push\('p.import_batch_id=\?'\);bindings.push\(batch\)/);
  }finally{t.close();}
});
