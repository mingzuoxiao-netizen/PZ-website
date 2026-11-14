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
// Keep fixtures inside the 24-hour notification delivery window in every CI run.
const at=new Date().toISOString();
const optInAt=new Date(Date.now()-60_000).toISOString();
const db=()=>{
  const sql=new DatabaseSync(':memory:');
  sql.exec('PRAGMA foreign_keys=ON;');
  sql.exec(`
    CREATE TABLE users(id TEXT PRIMARY KEY,username TEXT,role TEXT,is_active INTEGER,deleted_at TEXT);
    CREATE TABLE pz_staff_assignments(user_id TEXT,job_type TEXT);
    CREATE TABLE products(id TEXT PRIMARY KEY,code TEXT,name TEXT,name_cn TEXT,category TEXT,status TEXT,deleted_at TEXT);
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
  sql.prepare("INSERT INTO products(id,code,name,name_cn,category,status) VALUES('p1','PZ-TABLE-001','Oak Table','橡木餐桌','tables','published')").run();
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


test('employee must verify a mailbox before receiving review email; can disable afterward',async()=>{
  const sql=db();
  const dbApi={
    prepare(query){
      const stmt=sql.prepare(query);
      return {
        bind(...args){return{
          first:async()=>stmt.get(...args)||null,
          all:async()=>({results:stmt.all(...args)}),
          run:async()=>({meta:{changes:Number(stmt.run(...args).changes)}})
        };}
      };
    }
  };
  const env={DB:dbApi,NOTIFY_RESEND_API_KEY:'test-secret',
    NOTIFY_FROM_EMAIL:'PZ <notify@example.com>',
    NOTIFY_VERIFICATION_PEPPER:'a-staging-long-secret-for-email-hmac',
    NOTIFY_APP_BASE_URL:'https://staging.peng-zhan.com'};
  const fn=notificationMiddleware(async()=>json({success:true}),{
    authorize:async()=>({user:{id:'op'}}),
    json:(data,status=200)=>new Response(JSON.stringify(data),{
      status,headers:{'content-type':'application/json'}})
  });
  const call=async(path,method='GET',body)=>{
    const res=await fn(new Request('https://worker.test'+path,{method,
      headers:{'content-type':'application/json'},
      ...(body?{body:JSON.stringify(body)}:{})}),env,{});
    return {status:res.status,result:await res.json()};
  };
  const original=globalThis.fetch;
  let sentCode='',calls=0;
  globalThis.fetch=async(url,options)=>{
    assert.equal(url,'https://api.resend.com/emails');
    calls++;
    const body=JSON.parse(options.body);
    if(body.subject.includes('验证码'))sentCode=body.text.match(/\d{6}/)?.[0]||'';
    return new Response(JSON.stringify({id:'msg-'+calls}),{
      status:200,headers:{'content-type':'application/json'}
    });
  };
  try{
    const initial=await call('/notifications/email/preferences');
    assert.equal(initial.result.verified,false);
    const requested=await call('/notifications/email/request-code','POST',{email:'Operator@Example.com'});
    assert.equal(requested.status,200);
    assert.equal(requested.result.verification_sent,true);
    assert.match(sentCode,/^\d{6}$/);
    const pending=await call('/notifications/email/preferences');
    assert.equal(pending.result.verified,false);
    assert.equal(pending.result.enabled,false);
    const wrong=await call('/notifications/email/verify','POST',{code:sentCode==='000000'?'999999':'000000'});
    assert.equal(wrong.status,400);
    const verified=await call('/notifications/email/verify','POST',{code:sentCode});
    assert.equal(verified.status,200);
    assert.equal(verified.result.enabled,true);
    const disabled=await call('/notifications/email/preferences','POST',{enabled:false});
    assert.equal(disabled.result.enabled,false);
    const preference=await call('/notifications/email/preferences');
    assert.equal(preference.result.email,'operator@example.com');
    assert.equal(preference.result.verified,true);
    assert.equal(preference.result.enabled,false);
    assert.equal(calls,1);
  }finally{globalThis.fetch=original;sql.close();}
});

test('expired email verification codes cannot turn on review mail',async()=>{
  const sql=db();
  try{
    sql.prepare(
      'INSERT INTO pz_notification_email_settings '+
      '(user_id,email,verification_hash,verification_expires_at,updated_at) VALUES(?,?,?,?,?)'
    ).run('op','person@example.com','invalid-code','2020-01-01T00:00:00Z',at);
    const env={DB:{prepare(q){return{bind(...args){const stmt=sql.prepare(q);
      return{first:async()=>stmt.get(...args)||null};}}}},
      NOTIFY_VERIFICATION_PEPPER:'long-secret-verification-pepper-2026'};
    const fn=notificationMiddleware(async()=>json({}),{
      authorize:async()=>({user:{id:'op'}}),
      json:(value,status=200)=>new Response(JSON.stringify(value),{
        status,headers:{'content-type':'application/json'}})
    });
    const response=await fn(new Request('https://example.test/notifications/email/verify',{
      method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({code:'123456'})
    }),env,{});
    assert.equal(response.status,409);
  }finally{sql.close();}
});


test('product detail deep link is restricted to recipients of the underlying event',async()=>{
  const sql=db();
  try{
    sql.prepare('INSERT INTO pz_fast_lane_events VALUES(?,?,?,?,?,?)').run(
      'fast-deeplink','r1','sample_unpublished','adm','Quality issue',at);
    const dbApi={prepare(query){const stmt=sql.prepare(query);return{
      bind(...args){return{first:async()=>stmt.get(...args)||null,
        all:async()=>({results:stmt.all(...args)}),
        run:async()=>({meta:{changes:Number(stmt.run(...args).changes)}})};}
    };}};
    const fnFor=user=>notificationMiddleware(async()=>json({success:true}),{
      authorize:async()=>({user:{id:user}}),
      json:(data,status=200)=>new Response(JSON.stringify(data),{
        status,headers:{'content-type':'application/json'}})
    });
    const path=new Request('https://worker.test/notifications/product?id=p1');
    const owner=await fnFor('op')(path,{DB:dbApi},{});
    assert.equal(owner.status,200);
    assert.equal((await owner.json()).code,'PZ-TABLE-001');
    const stranger=await fnFor('other')(path,{DB:dbApi},{});
    assert.equal(stranger.status,404);
  }finally{sql.close();}
});

test('verified opt-in notifications send exactly once; disabled or pre-opt-in events do not send',async()=>{
  const sql=db();
  const makeDB=()=>({
    prepare(query){const stmt=sql.prepare(query);return{
      bind(...args){return{
        first:async()=>stmt.get(...args)||null,
        all:async()=>({results:stmt.all(...args)}),
        run:async()=>({meta:{changes:Number(stmt.run(...args).changes)}})
      };}
    };}
  });
  try{
    sql.prepare("INSERT INTO pz_staff_assignments VALUES('sup','supervisor')").run();
    sql.prepare(
      "INSERT INTO pz_notification_email_settings(user_id,email,verified,email_enabled,updated_at) VALUES(?,?,1,1,?)"
    ).run('sup','supervisor@example.com',optInAt);
    event(sql,'email1','submitted','op');
    const env={DB:makeDB(),NOTIFY_RESEND_API_KEY:'resend-test',
      NOTIFY_FROM_EMAIL:'PZ <notify@example.com>',NOTIFY_APP_BASE_URL:'https://staging.peng-zhan.com'};
    let calls=0;
    const fetcher=async(url,options)=>{
      calls++;
      const payload=JSON.parse(options.body);
      assert.equal(payload.to[0],'supervisor@example.com');
      assert.match(payload.text,/creator\/supervisor/);
      return new Response(JSON.stringify({id:'delivered-'+calls}),{
        status:200,headers:{'content-type':'application/json'}
      });
    };
    const first=await deliverPendingReviewEmails(env,{fetcher});
    assert.equal(first.sent,1);
    assert.equal(calls,1);
    const row=sql.prepare("SELECT email_state,email_provider_id FROM pz_notifications WHERE source_event_id='email1'").get();
    assert.equal(row.email_state,'sent');
    assert.equal(row.email_provider_id,'delivered-1');
    const second=await deliverPendingReviewEmails(env,{fetcher});
    assert.equal(second.sent,0);
    assert.equal(calls,1);
    sql.prepare("UPDATE pz_notification_email_settings SET email_enabled=0 WHERE user_id='sup'").run();
    event(sql,'email2','submitted','op');
    await deliverPendingReviewEmails(env,{fetcher});
    assert.equal(calls,1);
    assert.equal(sql.prepare("SELECT email_state FROM pz_notifications WHERE source_event_id='email2'").get().email_state,'pending');
  }finally{sql.close();}
});

test('email provider outage is logged without mutating underlying review event',async()=>{
  const sql=db();
  try{
    sql.prepare(
      "INSERT INTO pz_notification_email_settings(user_id,email,verified,email_enabled,updated_at) VALUES(?,?,1,1,?)"
    ).run('sup','supervisor@example.com',optInAt);
    event(sql,'failure1','submitted','op');
    const dbApi={prepare(query){const stmt=sql.prepare(query);return{
      bind(...args){return{first:async()=>stmt.get(...args)||null,
        all:async()=>({results:stmt.all(...args)}),
        run:async()=>({meta:{changes:Number(stmt.run(...args).changes)}})};}
    };}};
    let attempts=0;
    const fetcher=async()=>{
      attempts++;return new Response(JSON.stringify({error:'unavailable'}),{status:503});
    };
    const result=await deliverPendingReviewEmails({
      DB:dbApi,NOTIFY_RESEND_API_KEY:'test',NOTIFY_FROM_EMAIL:'notify@example.com'
    },{fetcher});
    assert.equal(result.sent,0);
    assert.equal(result.failed,1);
    assert.equal(attempts,2);
    const row=sql.prepare(
      "SELECT email_state,email_attempts,email_last_error FROM pz_notifications WHERE source_event_id='failure1'"
    ).get();
    assert.equal(row.email_state,'failed');
    assert.equal(row.email_attempts,1);
    assert.match(row.email_last_error,/Email provider HTTP 503/);
    assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM pz_product_review_events WHERE id='failure1'").get().n,1);
  }finally{sql.close();}
});
