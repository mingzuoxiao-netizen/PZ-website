// Task 14: authenticated notification feed + opt-in verified email notifications.
// D1 triggers populate the event feed atomically with existing review audit rows.
// Outbound mail happens only after the review response, via ctx.waitUntil.
const emailOK=s=>typeof s==='string'&&s.length<=254&&/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(s);
const mask=s=>!s?'':s.replace(/^(.).+(@[^@]+)$/,'$1***$2');
const now=()=>new Date().toISOString();
const errBody=async request=>{
  try{const v=await request.json();return v&&typeof v==='object'&&!Array.isArray(v)?v:null;}
  catch{return null;}
};
const hex=buffer=>Array.from(new Uint8Array(buffer)).map(x=>x.toString(16).padStart(2,'0')).join('');
const hashCode=async(secret,uid,email,code)=>{
  if(typeof secret!=='string'||secret.length<24)throw Error('Email verification key unavailable');
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),
    {name:'HMAC',hash:'SHA-256'},false,['sign']);
  return hex(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(uid+':'+email+':'+code)));
};
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const origin=env=>{
  try{const url=new URL(String(env.NOTIFY_APP_BASE_URL||''));
    return url.protocol==='https:'&&!url.username&&!url.password&&!url.search&&!url.hash
      ?url.origin:'';
  }catch{return '';}
};
function messageLink(env,role,entityType,entityId){
  const base=origin(env);if(!base)return '';
  const page=role==='ADMIN'?'admin':role==='SUPERVISOR'?'supervisor':'factory';
  const query=entityId&&['review','revision','product'].includes(entityType)
    ?'?'+new URLSearchParams({noticeType:entityType,noticeId:String(entityId).slice(0,120)}):'';
  return base+'/#/creator/'+page+query;
}
export function renderReviewEmail(row,env){
  const url=messageLink(env,row.role,row.entity_type,row.entity_id);
  const subject='PZ Furniture Studio · '+row.title;
  const text=['PZ 家具工作台',row.title,row.message,'',url?'进入后台：'+url:'请登录后台查看详情'].join('\n');
  const html='<div style="font-family:Arial,sans-serif;max-width:600px;color:#263447">'+
    '<h2>'+escapeHtml(row.title)+'</h2><p>'+escapeHtml(row.message)+'</p>'+
    (url?'<p><a href="'+escapeHtml(url)+'">进入 PZ 管理后台</a></p>':
      '<p>请登录 PZ 管理后台查看详情。</p>')+
    '<p style="font-size:12px;color:#64748b">这封邮件由您已验证并开启的审核通知邮箱接收。可在后台通知设置中关闭。</p></div>';
  return {subject,text,html};
}
export async function sendResendEmail(env,{to,subject,text,html,key},fetcher=fetch){
  const token=String(env.NOTIFY_RESEND_API_KEY||''),from=String(env.NOTIFY_FROM_EMAIL||'');
  if(!token||!from)throw Error('Email service not configured');
  if(!emailOK(to)||!from.includes('@'))throw Error('Invalid verified email or sender configuration');
  const body={from,to:[to],subject,text,html};
  const response=await fetcher('https://api.resend.com/emails',{
    method:'POST',headers:{Authorization:'Bearer '+token,
      'Content-Type':'application/json','Idempotency-Key':key.slice(0,200)},
    body:JSON.stringify(body),signal:AbortSignal.timeout(12000)
  });
  if(!response.ok){
    const e=new Error('Email provider HTTP '+response.status);
    e.retryable=response.status===429||response.status>=500;
    throw e;
  }
  const payload=await response.json().catch(()=>null);
  if(!payload?.id)throw Error('Email provider did not acknowledge message ID');
  return String(payload.id);
}
export async function sendWithOneRetry(env,data,fetcher=fetch){
  try{return await sendResendEmail(env,data,fetcher);}
  catch(error){
    if(error.retryable===false)throw error;
    return sendResendEmail(env,data,fetcher);
  }
}
export async function deliverPendingReviewEmails(env,{fetcher=fetch,limit=20}={}){
  if(!env.DB||!env.NOTIFY_RESEND_API_KEY||!env.NOTIFY_FROM_EMAIL)return {sent:0,disabled:true};
  const cutoff=new Date(Date.now()-24*3600*1000).toISOString();
  const work=await env.DB.prepare(
    "SELECT n.id,n.title,n.message,n.event_type,n.entity_type,n.entity_id,"+
      "CASE WHEN lower(u.role)='admin' THEN 'ADMIN' "+
      "WHEN EXISTS(SELECT 1 FROM pz_staff_assignments a WHERE a.user_id=u.id AND a.job_type='supervisor') "+
      "THEN 'SUPERVISOR' ELSE 'FACTORY' END AS role,p.email FROM pz_notifications n "+
      "JOIN pz_notification_email_settings p ON p.user_id=n.recipient_id "+
      "JOIN users u ON u.id=n.recipient_id "+
      "WHERE n.email_state='pending' AND n.created_at>=? AND n.created_at>=p.updated_at "+
      "AND p.verified=1 AND p.email_enabled=1 "+
      "AND u.is_active=1 AND u.deleted_at IS NULL "+
      "ORDER BY n.created_at ASC LIMIT ?"
  ).bind(cutoff,Math.min(30,Math.max(1,limit))).all();
  let sent=0,failed=0;
  for(const row of work.results||[]){
    const claimed=await env.DB.prepare(
      "UPDATE pz_notifications SET email_state='sending',email_attempts=email_attempts+1 "+
      "WHERE id=? AND email_state='pending' AND EXISTS ("+
      "SELECT 1 FROM pz_notification_email_settings p WHERE p.user_id=recipient_id "+
      "AND p.verified=1 AND p.email_enabled=1 AND p.email=?)"
    ).bind(row.id,row.email).run();
    if(Number(claimed.meta?.changes)!==1)continue;
    try{
      const email=renderReviewEmail(row,env);
      const providerId=await sendWithOneRetry(env,{...email,to:row.email,key:'pz-review-'+row.id},fetcher);
      await env.DB.prepare(
        "UPDATE pz_notifications SET email_state='sent',email_provider_id=?,email_sent_at=?,"+
        "email_last_error=NULL WHERE id=? AND email_state='sending'"
      ).bind(providerId,now(),row.id).run();sent++;
    }catch(error){
      failed++;
      // Log error TYPE only, never credential, raw provider payload or mailbox address.
      const safeError=String(error?.message||'send failed').replace(/[^a-zA-Z0-9 ._-]/g,'').slice(0,120);
      await env.DB.prepare(
        "UPDATE pz_notifications SET email_state='failed',email_last_error=? "+
        "WHERE id=? AND email_state='sending'"
      ).bind(safeError,row.id).run();
      console.warn('PZ notification email failed:',safeError);
    }
  }
  return {sent,failed};
}
export function isReviewNotificationEvent(path,method){
  if(method!=='POST')return false;
  return /^\/factory\/products\/[^/]+\/submit$/.test(path)||
    /^\/(supervisor|admin)\/reviews\/[^/]+\/(approve|return|request-correction|publish)$/.test(path)||
    /^\/(factory|supervisor|admin)\/revisions\/[^/]+\/(submit|approve|return|request-correction|publish)$/.test(path)||
    /^\/admin\/fast-lane\/samples\/[^/]+\/unpublish$/.test(path);
}
export function notificationMiddleware(upstream,{authorize,json}){
  return async function(request,env,ctx){
    const pathname=new URL(request.url).pathname,method=request.method;
    if(pathname==='/notifications'||pathname.startsWith('/notifications/')){
      const auth=await authorize(request,env,['ADMIN','SUPERVISOR','FACTORY']);
      if(auth instanceof Response)return auth;
      const uid=auth.user.id;
      try{
        if(pathname==='/notifications'&&method==='GET'){
          const params=new URL(request.url).searchParams;
          const limit=Math.min(50,Math.max(1,Number(params.get('limit')||30)|0));
          const [rows,count]=await Promise.all([
            env.DB.prepare(
              'SELECT id,event_type,entity_type,entity_id,title,message,created_at,read_at,email_state '+
              'FROM pz_notifications WHERE recipient_id=? ORDER BY created_at DESC,id DESC LIMIT ?'
            ).bind(uid,limit).all(),
            env.DB.prepare('SELECT COUNT(*) AS count FROM pz_notifications WHERE recipient_id=? AND read_at IS NULL')
              .bind(uid).first()
          ]);
          return json({items:rows.results||[],unread_count:Number(count?.count||0)});
        }
        if(pathname==='/notifications/unread-count'&&method==='GET'){
          const row=await env.DB.prepare(
            'SELECT COUNT(*) AS count FROM pz_notifications WHERE recipient_id=? AND read_at IS NULL'
          ).bind(uid).first();return json({unread_count:Number(row?.count||0)});
        }
        const readRoute=pathname.match(/^\/notifications\/([^/]+)\/read$/);
        if(readRoute&&method==='POST'){
          const result=await env.DB.prepare(
            'UPDATE pz_notifications SET read_at=COALESCE(read_at,?) WHERE id=? AND recipient_id=?'
          ).bind(now(),decodeURIComponent(readRoute[1]),uid).run();
          return Number(result.meta?.changes)===1?json({success:true}):json({error:'Not found'},404);
        }
        if(pathname==='/notifications/read-all'&&method==='POST'){
          await env.DB.prepare(
            'UPDATE pz_notifications SET read_at=? WHERE recipient_id=? AND read_at IS NULL'
          ).bind(now(),uid).run();return json({success:true});
        }
        if(pathname==='/notifications/email/preferences'&&method==='GET'){
          const row=await env.DB.prepare(
            'SELECT email,verified,email_enabled FROM pz_notification_email_settings WHERE user_id=?'
          ).bind(uid).first();
          return json({email:row?.email||'',email_masked:mask(row?.email),
            verified:Number(row?.verified)===1,enabled:Number(row?.email_enabled)===1,
            provider_configured:!!(env.NOTIFY_RESEND_API_KEY&&env.NOTIFY_FROM_EMAIL)});
        }
        if(pathname==='/notifications/email/preferences'&&method==='POST'){
          const body=await errBody(request);
          if(typeof body?.enabled!=='boolean')return json({error:'Boolean enabled required'},400);
          const result=await env.DB.prepare(
            'UPDATE pz_notification_email_settings SET email_enabled=?,updated_at=? '+
            'WHERE user_id=? AND (verified=1 OR ?=0)'
          ).bind(body.enabled?1:0,now(),uid,body.enabled?1:0).run();
          if(Number(result.meta?.changes)!==1)return json({error:'Verify email first'},409);
          return json({success:true,enabled:body.enabled});
        }
        if(pathname==='/notifications/email/request-code'&&method==='POST'){
          if(!env.NOTIFY_RESEND_API_KEY||!env.NOTIFY_FROM_EMAIL||
            !env.NOTIFY_VERIFICATION_PEPPER)return json({error:'Email verification unavailable'},503);
          const body=await errBody(request);
          const email=String(body?.email||'').trim().toLowerCase();
          if(!emailOK(email))return json({error:'Valid email required'},400);
          const previous=await env.DB.prepare(
            'SELECT email,verification_last_sent_at FROM pz_notification_email_settings WHERE user_id=?'
          ).bind(uid).first();
          if(previous?.verification_last_sent_at&&
              Date.now()-Date.parse(previous.verification_last_sent_at)<60*1000)
            return json({error:'Please wait before requesting another code'},429);
          const duplicate=await env.DB.prepare(
            'SELECT user_id FROM pz_notification_email_settings WHERE email=? AND verified=1 AND user_id<>? LIMIT 1'
          ).bind(email,uid).first();
          if(duplicate)return json({error:'This address is already verified by another account'},409);
          const code=String(crypto.getRandomValues(new Uint32Array(1))[0]%1000000).padStart(6,'0');
          const digest=await hashCode(env.NOTIFY_VERIFICATION_PEPPER,uid,email,code);
          const issued=now(),expiry=new Date(Date.now()+15*60*1000).toISOString();
          // Always reset verified and opt-in on address reconfiguration.
          await env.DB.prepare(
            'INSERT INTO pz_notification_email_settings '+
              '(user_id,email,verified,email_enabled,verification_hash,verification_expires_at,'+
              'verification_attempts,verification_last_sent_at,updated_at) '+
              'VALUES(?,?,0,0,?,?,0,?,?) ON CONFLICT(user_id) DO UPDATE SET '+
              'email=excluded.email,verified=0,email_enabled=0,verification_hash=excluded.verification_hash,'+
              'verification_expires_at=excluded.verification_expires_at,verification_attempts=0,'+
              'verification_last_sent_at=excluded.verification_last_sent_at,updated_at=excluded.updated_at'
          ).bind(uid,email,digest,expiry,issued,issued).run();
          try{
            await sendWithOneRetry(env,{
              to:email,subject:'PZ · 审核通知邮箱验证码',
              text:'您的 PZ 审核邮件验证码：'+code+'。15 分钟内有效。若非本人操作，请忽略。',
              html:'<p>您的 PZ 审核邮件验证码：<strong>'+code+'</strong>。15 分钟内有效。</p>',
              key:'pz-email-verify-'+uid+'-'+issued
            });
          }catch(error){console.warn('PZ email verification provider failed (no secret logged)');
            return json({error:'Verification email could not be sent; retry after cooldown'},503);}
          return json({success:true,verification_sent:true});
        }
        if(pathname==='/notifications/email/verify'&&method==='POST'){
          const body=await errBody(request);
          if(!/^\d{6}$/.test(String(body?.code||'')))return json({error:'Six digit code required'},400);
          const row=await env.DB.prepare(
            'SELECT email,verification_hash,verification_expires_at,verification_attempts '+
            'FROM pz_notification_email_settings WHERE user_id=?'
          ).bind(uid).first();
          if(!row?.verification_hash||Date.parse(row.verification_expires_at)<Date.now()||
              Number(row.verification_attempts)>=5)return json({error:'Verification code expired or locked'},409);
          const digest=await hashCode(env.NOTIFY_VERIFICATION_PEPPER,uid,row.email,String(body.code));
          if(digest!==row.verification_hash){
            await env.DB.prepare(
              'UPDATE pz_notification_email_settings SET verification_attempts=verification_attempts+1 '+
              'WHERE user_id=? AND verification_hash=?'
            ).bind(uid,row.verification_hash).run();
            return json({error:'Verification code incorrect'},400);
          }
          const result=await env.DB.prepare(
            'UPDATE pz_notification_email_settings SET verified=1,email_enabled=1,'+
            'verification_hash=NULL,verification_expires_at=NULL,verification_attempts=0,updated_at=? '+
            'WHERE user_id=? AND verification_hash=?'
          ).bind(now(),uid,row.verification_hash).run();
          return Number(result.meta?.changes)===1?json({success:true,verified:true,enabled:true}):
            json({error:'Verification state changed'},409);
        }
        return json({error:'Notification endpoint not found'},404);
      }catch(error){
        if(/no such table|no such column/i.test(String(error)))
          return json({error:'Notification migration 019 required',code:'NOTIFICATION_SCHEMA_MISSING'},503);
        throw error;
      }
    }
    const response=await upstream.call(this,request,env,ctx);
    if(isReviewNotificationEvent(pathname,method)&&env.DB&&
      env.NOTIFY_RESEND_API_KEY&&env.NOTIFY_FROM_EMAIL&&typeof ctx?.waitUntil==='function'){
      ctx.waitUntil(deliverPendingReviewEmails(env).catch(e=>
        console.warn('PZ notification dispatch failed: ',String(e?.name||'unknown'))));
    }
    return response;
  };
}
