// Explicitly invoked only by the manually selected Staging acceptance run.
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
if(process.env.PZ_STAGING_RESOURCES_VERIFIED!=='true')throw Error('Staging resource audit required');
if(!process.env.PZ_D1_ID||process.env.PZ_D1_ID===process.env.PZ_EXPECTED_PRODUCTION_D1_ID)
  throw Error('Independent Staging D1 required');
const args=['--yes','wrangler@4.156.0'];
const config=['--config','worker/wrangler.generated.toml','--env','staging'];
function command(parts){
  try{return execFileSync('npx',[...args,...parts],{encoding:'utf8',maxBuffer:10*1024*1024});}
  catch{throw Error('Staging D1 command failed; stop before retry and inspect database state');}
}
export function query(sql){
  const output=JSON.parse(command(['d1','execute','DB',...config,'--remote','--command',sql,'--json']));
  if(output.some(x=>x.success===false))throw Error('Staging D1 query failed');
  return output.flatMap(x=>x.results||[]);
}
const checkpoint=command(['d1','time-travel','info','DB',...config,'--json']);
console.log('Staging pre-migration recovery checkpoint:',checkpoint);
const tables=new Set(query("SELECT name FROM sqlite_master WHERE type='table'").map(x=>x.name));
for(const name of ['users','products','pz_product_reviews','pz_product_review_versions',
  'pz_product_review_events','pz_published_product_revisions','pz_published_revision_events',
  'pz_departments','pz_staff_assignments']){
  if(!tables.has(name))throw Error('Missing baseline table: '+name);
}
const columns=new Set(query('PRAGMA table_info(products)').map(x=>x.name));
for(const name of ['specs_json','catalog_hidden','deleted_at','created_by'])
  if(!columns.has(name))throw Error('Missing baseline product column: '+name);
const apply=file=>{
  command(['d1','execute','DB',...config,'--remote','--file','worker-patches/migrations/'+file,'--json']);
  console.log('Applied Staging migration:',file);
};
const duplicates=query("SELECT COUNT(*) AS n FROM (SELECT UPPER(TRIM(code)) FROM products WHERE code IS NOT NULL AND TRIM(code)<>'' GROUP BY UPPER(TRIM(code)) HAVING COUNT(*)>1)");
if(Number(duplicates[0]?.n)!==0)throw Error('Existing duplicate SKUs require manual reconciliation');
apply('002_unique_normalized_sku.sql');
apply('017_backoffice_list_indexes_REVIEW.sql');
if(!tables.has('pz_fast_lane_settings'))apply('018_trusted_operator_fast_lane_REVIEW.sql');
if(!tables.has('pz_notifications'))apply('019_review_notifications_email_REVIEW.sql');
if(!columns.has('import_batch_id'))apply('020_bulk_draft_import_REVIEW.sql');
const after=new Set(query("SELECT name FROM sqlite_master WHERE type='table'").map(x=>x.name));
for(const name of ['pz_fast_lane_settings','pz_fast_lane_trust','pz_fast_lane_publications',
  'pz_fast_lane_events','pz_notifications','pz_notification_email_settings',
  'pz_product_import_batches','pz_product_import_rows'])
  if(!after.has(name))throw Error('Partial migration requires reconciliation: '+name);
const triggers=new Set(query("SELECT name FROM sqlite_master WHERE type='trigger'").map(x=>x.name));
for(const name of ['pz_notify_new_product_event','pz_notify_revision_event','pz_notify_sample_retracted',
  'pz_fast_lane_events_no_update','pz_fast_lane_events_no_delete'])
  if(!triggers.has(name))throw Error('Missing migration trigger: '+name);
const setting=query('SELECT enabled FROM pz_fast_lane_settings WHERE id=1')[0];
if(Number(setting?.enabled)!==0)throw Error('Fast lane must start disabled for acceptance');
console.log('Staging migrations verified; fast lane remains disabled. No Production database was addressed.');
