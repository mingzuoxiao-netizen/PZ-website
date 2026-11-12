import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {
  renderReviewEmail,sendResendEmail,sendWithOneRetry,
  deliverPendingReviewEmails,isReviewNotificationEvent,notificationMiddleware
} from '../notificationCore.mjs';

const migration=readFileSync(
  new URL('../../worker-patches/migrations/019_review_notifications_email_REVIEW.sql',import.meta.url),'utf8');
const at='2026-11-12T08:00:00Z';
const db=()=>{
  const sql=new DatabaseSync(':memory:');
  sql.exec('PRAGMA foreign_keys=ON;');
  sql.exec(`
    CREATE TABLE users(id TEXT PRIMARY KEY,username TEXT,role TEXT,is_active INTEGER,deleted_at TEXT);
    CREATE TABLE products(id TEXT PRIMARY KEY,code TEXT);
    CREATE TABLE pz_product_reviews(id TEXT PRIMARY KEY,product_id TEXT,submitter_id TEXT,supervisor_id TEXT,return_reason TEXT);
    CREATE TABLE pz_product_review_events(id TEXT PRIMARY KEY,review_id TEXT,action TEXT,actor_id TEXT,actor_role TEXT,review_version INTEGER,note TEXT,created_at TEXT);
    CREATE TABLE pz_published_product_revisions(id TEXT PRIMARY KEY,product_id TEXT,submitter_id TEXT,supervisor_id TEXT);
    CREATE TABLE pz_published_revision_events(id TEXT PRIMARY KEY,revision_id TEXT,action TEXT,actor_id TEXT,note TEXT,created_at TEXT);
    CREATE TABLE pz_fast_lane_publications(id TEXT PRIMARY KEY,review_id TEXT,product_id TEXT,operator_id TEXT,supervisor_id TEXT);
    CREATE TABLE pz_fast_lane_events(id TEXT PRIMARY KEY,review_id TEXT,event_type TEXT,actor_id TEXT,note TEXT,created_at TEXT);
  `);
  sql.exec(migration);
  sql.prepare('INSERT INTO users VALUES(?,?,?,?,NULL)').run('op','operator','factory',1);
  sql.prepare('INSERT INTO users VALUES(?,?,?,?,NULL)').run('sup','supervisor','factory',1);
  sql.prepare('INSERT INTO users VALUES(?,?,?,?,NULL)').run('adm','administrator','admin',1);
  sql.prepare('INSERT INTO users VALUES(?,?,?,?,NULL)').run('other','unrelated','factory',1);
  sql.prepare("INSERT INTO products VALUES('p1','PZ-TABLE-001')").run();
  sql.prepare("INSERT INTO pz_product_reviews VALUES('r1','p1','op','sup','')").run();
  sql.prepare("INSERT INTO pz_published_product_revisions VALUES('v1','p1','op','sup')").run();
  sql.prepare("INSERT INTO pz_fast_lane_publications VALUES('f1','r1','p1','op','sup')").run();
  return sql;
};
const event=(sql,id,action,actor,note=null)=>{
  sql.prepare('INSERT INTO pz_product_review_events VALUES(?,?,?,?,?,?,?,?)')
    .run(id,'r1',action,actor,'SUPERVISOR',1,note,at);
};
const list=(sql,id)=>sql.prepare(
  'SELECT recipient_id,event_type,entity_type,entity_id,title,message FROM pz_notifications WHERE source_event_id=? ORDER BY recipient_id'
).all(id);

test('review actions create in-app notifications atomically for the correct role',()=>{
  const sql=db();
  try{
    event(sql,'e1','submitted','op');
    assert.deepEqual(list(sql,'e1').map(x=>x.recipient_id),['sup']);
    assert.equal(list(sql,'e1')[0].entity_id,'r1');
    event(sql,'e2','supervisor_approved','sup');
    assert.deepEqual(list(sql,'e2').map(x=>x.recipient_id),['adm']);
    const structured='PZ_FIELD_RETURN_V1:'+JSON.stringify({
      issues:[{field:'images',message:'Replace blurred photo'}],note:''
    });
    event(sql,'e3','supervisor_returned','sup',structured);
    assert.deepEqual(list(sql,'e3').map(x=>x.recipient_id),['op']);
    assert.match(list(sql,'e3')[0].message,/images/);
    event(sql,'e4','published','adm');
    assert.deepEqual(list(sql,'e4').map(x=>x.recipient_id),['op']);
    event(sql,'e5','fast_published','sup');
    assert.deepEqual(list(sql,'e5').map(x=>x.recipient_id),['adm','op']);
    assert.equal(sql.prepare("SELECT COUNT(*) AS c FROM pz_notifications WHERE recipient_id='other'").get().c,0);
  }finally{sql.close();}
});

test('revisions and post-publish retractions notify assigned roles, not unrelated accounts',()=>{
  const sql=db();
  try{
    sql.prepare('INSERT INTO pz_published_revision_events VALUES(?,?,?,?,?,?)').run(
      'rev1','v1','submitted','op',null,at);
    assert.deepEqual(list(sql,'rev1').map(x=>x.recipient_id),['sup']);
    sql.prepare('INSERT INTO pz_published_revision_events VALUES(?,?,?,?,?,?)').run(
      'rev2','v1','supervisor_approved','sup',null,at);
    assert.deepEqual(list(sql,'rev2').map(x=>x.recipient_id),['adm']);
    sql.prepare('INSERT INTO pz_fast_lane_events VALUES(?,?,?,?,?,?)').run(
      'fast1','r1','sample_unpublished','adm','Sample failed',at);
    assert.deepEqual(list(sql,'fast1').map(x=>x.recipient_id),['op','sup']);
    assert.match(list(sql,'fast1')[0].message,/Sample failed/);
  }finally{sql.close();}
});

test('D1 inbox supports append-only event ids and per-recipient read receipts',()=>{
  const sql=db();
  try{
    event(sql,'e1','submitted','op');
    const row=sql.prepare("SELECT id,read_at FROM pz_notifications WHERE recipient_id='sup'").get();
    assert.ok(row.id);assert.equal(row.read_at,null);
    const unread=sql.prepare('SELECT COUNT(*) AS count FROM pz_notifications WHERE recipient_id=? AND read_at IS NULL').get('sup');
    assert.equal(unread.count,1);
    const other=sql.prepare('UPDATE pz_notifications SET read_at=? WHERE id=? AND recipient_id=?').run(at,row.id,'op');
    assert.equal(other.changes,0);
    const self=sql.prepare('UPDATE pz_notifications SET read_at=? WHERE id=? AND recipient_id=?').run(at,row.id,'sup');
    assert.equal(self.changes,1);
  }finally{sql.close();}
});

test('email templates escape HTML and include only trusted HTTPS backoffice route',()=>{
  const row={title:'测试 <alert>',message:'名称包含 <script>alert(1)</script>',role:'SUPERVISOR'};
  const mail=renderReviewEmail(row,{NOTIFY_APP_BASE_URL:'https://staging.peng-zhan.com'});
  assert.match(mail.html,/&lt;script&gt;/);
  assert.doesNotMatch(mail.html,/<script>/);
  assert.match(mail.text,/https:\/\/staging.peng-zhan.com\/#\/creator\/supervisor/);
  assert.doesNotMatch(renderReviewEmail(row,{NOTIFY_APP_BASE_URL:'http://unsafe.site'}).html,/<a href/);
});

test('Resend integration uses authenticated HTTPS + unique idempotency key and one retry',async()=>{
  const env={NOTIFY_RESEND_API_KEY:'re-TEST-SECRET',NOTIFY_FROM_EMAIL:'PZ <notify@example.com>'};
  let attempts=0;
  const fetcher=async(url,options)=>{
    assert.equal(url,'https://api.resend.com/emails');
    assert.equal(options.headers.Authorization,'Bearer re-TEST-SECRET');
    assert.equal(options.headers['Idempotency-Key'],'pz-notification-123');
    assert.equal(JSON.parse(options.body).to[0],'operator@example.com');
    attempts++;
    return new Response(JSON.stringify(attempts===1?{error:'busy'}:{id:'message-id'}),{
      status:attempts===1?503:200,headers:{'content-type':'application/json'}
    });
  };
  const id=await sendWithOneRetry(env,{to:'operator@example.com',subject:'Test',
    text:'Hello',html:'<p>Hello</p>',key:'pz-notification-123'},fetcher);
  assert.equal(id,'message-id');
  assert.equal(attempts,2);
  const invalid=await sendResendEmail({...env,NOTIFY_RESEND_API_KEY:''},{
    to:'operator@example.com',subject:'Test',text:'Test',html:'Test',key:'another'
  },fetcher).then(()=>null,e=>e.message);
  assert.match(invalid,/not configured/);
});

test('email delivery is disabled without secrets, never blocks review writes',async()=>{
  assert.deepEqual(await deliverPendingReviewEmails({DB:{},NOTIFY_RESEND_API_KEY:''}),{
    sent:0,disabled:true
  });
  assert.equal(isReviewNotificationEvent('/factory/products/sku/submit','POST'),true);
  assert.equal(isReviewNotificationEvent('/supervisor/reviews/a/return','POST'),true);
  assert.equal(isReviewNotificationEvent('/admin/fast-lane/samples/x/unpublish','POST'),true);
  assert.equal(isReviewNotificationEvent('/notifications/email/verify','POST'),false);
});

test('notification routes require live authenticated role authorization',async()=>{
  const fn=notificationMiddleware(async()=>new Response('allowed'),{
    authorize:async()=>new Response('forbidden',{status:403}),
    json:(data,status=200)=>new Response(JSON.stringify(data),{status})
  });
  const result=await fn(new Request('https://test/notifications'),{},{});
  assert.equal(result.status,403);
});
