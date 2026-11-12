import {hasEvidenceClaims,trustedHistory,fastLaneDecision} from '../utils/fastLane.mjs';

// Worker flag is the emergency stop. Admin-managed D1 setting is an independent
// runtime kill switch. If schema or either check is unavailable, use two stages.
const time=()=>new Date().toISOString();
const uid=()=>crypto.randomUUID();
const parseBody=async request=>{
  try{const b=await request.json();return b&&typeof b==='object'&&!Array.isArray(b)?b:null;}
  catch{return null;}
};
const validReason=value=>typeof value==='string'&&value.trim().length>=5&&value.trim().length<=2000;
const changed=result=>Number(result?.meta?.changes||0)===1;

export async function fastLaneEligibility(env,review,product){
  if(env.PZ_FAST_LANE_ENABLED!=='true')return {eligible:false,reason:'worker_disabled'};
  try{
    const [settings,grant,counts,legacy,category]=await Promise.all([
      env.DB.prepare('SELECT enabled FROM pz_fast_lane_settings WHERE id=1').first(),
      env.DB.prepare('SELECT trusted FROM pz_fast_lane_trust WHERE operator_id=?').bind(review.submitter_id).first(),
      env.DB.prepare(
        "SELECT COUNT(DISTINCT r.id) AS audited,COUNT(DISTINCT CASE WHEN NOT EXISTS ("+
        "SELECT 1 FROM pz_product_review_events e WHERE e.review_id=r.id AND "+
        "e.action IN ('supervisor_returned','admin_returned','correction_assigned')"+
        ") THEN r.id END) AS clean FROM pz_product_reviews r "+
        "WHERE r.submitter_id=? AND r.status='published'"
      ).bind(review.submitter_id).first(),
      env.DB.prepare(
        "SELECT COUNT(*) AS total FROM products p WHERE p.created_by=? AND lower(p.status)='published' "+
        "AND NOT EXISTS(SELECT 1 FROM pz_product_reviews r WHERE r.product_id=p.id)"
      ).bind(review.submitter_id).first(),
      env.DB.prepare(
        "SELECT id FROM products WHERE created_by=? AND lower(category)=lower(?) "+
        "AND lower(status)='published' AND deleted_at IS NULL AND id<>? LIMIT 1"
      ).bind(review.submitter_id,product.category,review.product_id).first()
    ]);
    const history=trustedHistory({clean:counts?.clean,audited:counts?.audited,legacy:legacy?.total});
    const result=fastLaneDecision({
      workerEnabled:true,siteEnabled:Number(settings?.enabled)===1,
      adminTrusted:Number(grant?.trusted)===1,history,
      categoryPreviouslyPublished:!!category,product
    });
    return {...result,history};
  }catch(error){
    // Unmigrated DB, wrong binding or missing history must NEVER publish fast.
    console.warn('Fast-lane eligibility check unavailable; using two-stage review');
    return {eligible:false,reason:'schema_or_data_unavailable'};
  }
}

// The public V1 KV catalog must be refreshed even if V2 queries use D1.
// No internal synthetic ADMIN token is created or accepted.
export async function syncFastLaneCatalog(env,normalizeProductRows){
  const rows=await env.DB.prepare(
    "SELECT id,name,name_cn,category,sub_category,material,size,finish,code,"+
    "description,description_cn,images,production_sites,status,created_at,updated_at "+
    "FROM products WHERE lower(status)='published' AND deleted_at IS NULL "+
    "AND COALESCE(catalog_hidden,0)=0 ORDER BY updated_at DESC"
  ).all();
  const items=normalizeProductRows(rows.results||[]);
  const meta={version:String(Date.now()),publishedAt:time(),count:items.length};
  await env.SITE_CONFIG_KV.put('published:products',JSON.stringify({items}));
  await env.SITE_CONFIG_KV.put('published:products:meta',JSON.stringify(meta));
  try{
    if(env.SITE_CONFIG_HISTORY)await env.SITE_CONFIG_HISTORY.put(
      'snapshots/products/'+meta.version+'.json',JSON.stringify({items}),
      {httpMetadata:{contentType:'application/json'}}
    );
  }catch(error){console.warn('Fast-lane catalog history backup failed');}
  return meta;
}

// Returns null when the normal two-stage flow should be used.
// Only the authenticated assigned supervisor can reach this function.
export async function approveFastLane({env,review,actor,product,snapshot,readinessIssues,json,normalizeProductRows}){
  const eligibility=await fastLaneEligibility(env,review,snapshot);
  if(!eligibility.eligible)return null;
  // Re-check current DB row, original submitted version and any claim-bearing
  // properties: never trust client-supplied eligibility or stale snapshots.
  if(readinessIssues(snapshot).length||readinessIssues(product).length||
      hasEvidenceClaims(snapshot)||hasEvidenceClaims(product))return null;
  if(String(product.status).toLowerCase()!=='pending_supervisor')return null;
  const at=time(),id=uid(),auditId=uid(),eventId=uid();
  try {
    const writes=[
      env.DB.prepare(
        "INSERT INTO pz_fast_lane_publications "+
        "(id,review_id,product_id,operator_id,supervisor_id,category,status,published_at) "+
        "SELECT ?,r.id,r.product_id,r.submitter_id,r.supervisor_id,?,'published',? "+
        "FROM pz_product_reviews r JOIN products p ON p.id=r.product_id "+
        "WHERE r.id=? AND r.status='pending_supervisor' AND r.latest_version=? "+
        "AND r.supervisor_id=? AND r.submitter_id<>r.supervisor_id "+
        "AND lower(p.status)='pending_supervisor' AND p.deleted_at IS NULL "+
        "AND EXISTS(SELECT 1 FROM pz_fast_lane_settings WHERE id=1 AND enabled=1) "+
        "AND EXISTS(SELECT 1 FROM pz_fast_lane_trust t WHERE t.operator_id=r.submitter_id AND t.trusted=1)"
      ).bind(id,snapshot.category,at,review.id,review.latest_version,actor),
      env.DB.prepare(
        "UPDATE pz_product_reviews SET status='published',approved_version=latest_version,"+
        "return_reason=NULL,updated_at=? WHERE id=? AND status='pending_supervisor' "+
        "AND latest_version=? AND EXISTS(SELECT 1 FROM pz_fast_lane_publications f WHERE f.review_id=?)"
      ).bind(at,review.id,review.latest_version,review.id),
      env.DB.prepare(
        "UPDATE products SET status='published',updated_at=? WHERE id=? AND lower(status)='pending_supervisor' "+
        "AND EXISTS(SELECT 1 FROM pz_product_reviews r WHERE r.id=? AND r.status='published')"
      ).bind(at,review.product_id,review.id),
      env.DB.prepare(
        "INSERT INTO pz_product_review_events(id,review_id,action,actor_id,actor_role,review_version,note,created_at) "+
        "SELECT ?,r.id,'fast_published',?,'SUPERVISOR',r.latest_version,?,? "+
        "FROM pz_product_reviews r WHERE r.id=? AND r.status='published'"
      ).bind(eventId,actor,JSON.stringify({lane:'fast',history_fallback:eligibility.history_fallback===true}),at,review.id),
      env.DB.prepare(
        "INSERT INTO pz_fast_lane_events(id,lane,event_type,operator_id,review_id,product_id,actor_id,note,created_at) "+
        "SELECT ?,'fast','published',f.operator_id,f.review_id,f.product_id,?,?,? "+
        "FROM pz_fast_lane_publications f WHERE f.review_id=? AND f.status='published'"
      ).bind(auditId,actor,JSON.stringify({history_fallback:eligibility.history_fallback===true}),at,review.id)
    ];
    const output=await env.DB.batch(writes);
    if(output.some(x=>!changed(x)))return json({error:'Fast-lane publish could not be confirmed; refresh review state',code:'FAST_PUBLISH_CONFLICT'},409);
  }catch(error){
    if(/constraint|unique|transition|stale|no such table/i.test(String(error)))
      return json({error:'Fast-lane state conflict or migration missing',code:'FAST_PUBLISH_CONFLICT'},409);
    throw error;
  }
  try{
    await syncFastLaneCatalog(env,normalizeProductRows);
    await env.DB.prepare('UPDATE pz_fast_lane_publications SET catalog_synced=1 WHERE review_id=?').bind(review.id).run();
    return json({success:true,id:review.id,status:'published',lane:'fast',catalog_published:true,
      history_fallback:eligibility.history_fallback===true});
  }catch(error){
    // D1 is already committed: never repeat publication or pretend it failed.
    return json({success:true,id:review.id,status:'published',lane:'fast',catalog_published:false,
      code:'CATALOG_SYNC_PENDING',message:'Published in D1. Admin must retry catalog sync.'});
  }
}

const audit=(env,{event_type,operator_id=null,review_id=null,product_id=null,actor_id,note='',stamp=time()})=>
  env.DB.prepare(
    'INSERT INTO pz_fast_lane_events(id,lane,event_type,operator_id,review_id,product_id,actor_id,note,created_at) '+
    "VALUES(?,'fast',?,?,?,?,?,?,?)"
  ).bind(uid(),event_type,operator_id,review_id,product_id,actor_id,note,stamp);

export async function handleFastLaneAdmin(request,env,{authorize,json,normalizeProductRows}){
  const path=new URL(request.url).pathname,method=request.method;
  if(!path.startsWith('/admin/fast-lane/'))return null;
  const auth=await authorize(request,env,['ADMIN']);if(auth instanceof Response)return auth;
  const actor=auth.user.id;
  try{
    if(path==='/admin/fast-lane/state'&&method==='GET'){
      const [settings,staff]=await Promise.all([
        env.DB.prepare('SELECT enabled,updated_by,updated_at FROM pz_fast_lane_settings WHERE id=1').first(),
        env.DB.prepare(
          "SELECT u.id,u.username,u.is_active,COALESCE(t.trusted,0) AS trusted,t.updated_at "+
          "FROM users u LEFT JOIN pz_fast_lane_trust t ON t.operator_id=u.id "+
          "WHERE u.deleted_at IS NULL AND EXISTS(SELECT 1 FROM pz_staff_assignments a "+
          "WHERE a.user_id=u.id AND a.job_type IN ('staff','secretary','data_entry')) "+
          "ORDER BY u.username LIMIT 500"
        ).all()
      ]);
      return json({worker_enabled:env.PZ_FAST_LANE_ENABLED==='true',
        enabled:Number(settings?.enabled)===1,operators:staff.results||[],
        settings_updated_by:settings?.updated_by||null,settings_updated_at:settings?.updated_at||null});
    }
    if(path==='/admin/fast-lane/settings'&&method==='POST'){
      const body=await parseBody(request);
      if(typeof body?.enabled!=='boolean'||!validReason(body.reason))
        return json({error:'Boolean enabled and 5–2000 character reason required'},400);
      if(body.enabled&&env.PZ_FAST_LANE_ENABLED!=='true')
        return json({error:'Worker emergency kill switch is disabled; cannot enable fast lane'},409);
      const at=time(),result=await env.DB.batch([
        env.DB.prepare('UPDATE pz_fast_lane_settings SET enabled=?,updated_by=?,updated_at=? WHERE id=1')
          .bind(body.enabled?1:0,actor,at),
        audit(env,{event_type:body.enabled?'enabled':'disabled',actor_id:actor,note:body.reason.trim(),stamp:at})
      ]);
      if(!changed(result[0])||!changed(result[1]))return json({error:'Setting not confirmed'},409);
      return json({success:true,enabled:body.enabled});
    }
    const trust=path.match(/^\/admin\/fast-lane\/operators\/([^/]+)\/trust$/);
    if(trust&&method==='POST'){
      const body=await parseBody(request);
      if(typeof body?.trusted!=='boolean'||!validReason(body.reason))
        return json({error:'Boolean trusted and 5–2000 character reason required'},400);
      const operatorId=decodeURIComponent(trust[1]);
      const staff=await env.DB.prepare(
        "SELECT u.id FROM users u WHERE u.id=? AND u.deleted_at IS NULL AND u.is_active=1 "+
        "AND EXISTS(SELECT 1 FROM pz_staff_assignments a WHERE a.user_id=u.id "+
        "AND a.job_type IN ('staff','secretary','data_entry'))"
      ).bind(operatorId).first();
      if(!staff)return json({error:'Active operator assignment required'},404);
      const at=time();
      const result=await env.DB.batch([
        env.DB.prepare(
          'INSERT INTO pz_fast_lane_trust(operator_id,trusted,updated_by,updated_at) VALUES(?,?,?,?) '+
          'ON CONFLICT(operator_id) DO UPDATE SET trusted=excluded.trusted,'+
          'updated_by=excluded.updated_by,updated_at=excluded.updated_at'
        ).bind(operatorId,body.trusted?1:0,actor,at),
        audit(env,{event_type:body.trusted?'trust_granted':'trust_revoked',operator_id:operatorId,
          actor_id:actor,note:body.reason.trim(),stamp:at})
      ]);
      if(!changed(result[0])||!changed(result[1]))return json({error:'Trust change not confirmed'},409);
      return json({success:true,operator_id:operatorId,trusted:body.trusted});
    }
    if(path==='/admin/fast-lane/samples'&&method==='GET'){
      const params=new URL(request.url).searchParams;
      const page=Math.min(10000,Math.max(1,Number(params.get('page')||1)|0));
      const status=params.get('status')||'pending';
      if(!['pending','all','unpublished','accepted'].includes(status))return json({error:'Invalid sampling status'},400);
      const where=status==='pending'?" WHERE f.status='published'":
        status==='unpublished'?" WHERE f.status='unpublished'":
        status==='accepted'?" WHERE f.status='sampled_ok'":'';
      const [rows,count]=await env.DB.batch([
        env.DB.prepare(
          'SELECT f.*,p.name,p.name_cn,p.code,operator.username AS operator_name,'+
          'reviewer.username AS supervisor_name FROM pz_fast_lane_publications f '+
          'JOIN products p ON p.id=f.product_id LEFT JOIN users operator ON operator.id=f.operator_id '+
          'LEFT JOIN users reviewer ON reviewer.id=f.supervisor_id'+where+
          ' ORDER BY f.published_at DESC,f.id DESC LIMIT 50 OFFSET ?'
        ).bind((page-1)*50),
        env.DB.prepare('SELECT COUNT(*) AS total FROM pz_fast_lane_publications f'+where)
      ]);
      return json({items:rows.results||[],total:count.results?.[0]?.total||0,page,page_size:50});
    }
    const item=path.match(/^\/admin\/fast-lane\/samples\/([^/]+)\/(accept|unpublish|sync-catalog)$/);
    if(item&&method==='POST'){
      const sampleId=decodeURIComponent(item[1]),action=item[2];
      const sample=await env.DB.prepare(
        'SELECT * FROM pz_fast_lane_publications WHERE id=? LIMIT 1'
      ).bind(sampleId).first();
      if(!sample)return json({error:'Fast-lane sample not found'},404);
      if(action==='sync-catalog'){
        try{
          await syncFastLaneCatalog(env,normalizeProductRows);
          await env.DB.prepare('UPDATE pz_fast_lane_publications SET catalog_synced=1 WHERE id=?')
            .bind(sampleId).run();
          return json({success:true,catalog_published:true});
        }catch{return json({error:'Catalog sync failed; retry safely',code:'CATALOG_SYNC_PENDING'},503);}
      }
      if(sample.status!=='published')return json({error:'Sample already reviewed; refresh state'},409);
      const body=await parseBody(request);
      if(action==='unpublish'&&!validReason(body?.reason))
        return json({error:'Unpublish reason must have 5–2000 characters'},400);
      const at=time(),note=action==='unpublish'?body.reason.trim():'Admin sample accepted';
      if(action==='accept'){
        const result=await env.DB.batch([
          env.DB.prepare(
            "UPDATE pz_fast_lane_publications SET status='sampled_ok',reviewed_by=?,reviewed_at=? "+
            "WHERE id=? AND status='published'"
          ).bind(actor,at,sampleId),
          audit(env,{event_type:'sample_accepted',operator_id:sample.operator_id,review_id:sample.review_id,
            product_id:sample.product_id,actor_id:actor,note,stamp:at})
        ]);
        if(!changed(result[0])||!changed(result[1]))return json({error:'Sample state changed'},409);
        return json({success:true,status:'sampled_ok'});
      }
      // Keep the historical published review immutable: catalog_hidden is
      // the existing public visibility mechanism. Count repeated retractions.
      const [resultVisible,resultHidden,resultAudit]=await env.DB.batch([
        env.DB.prepare(
          "UPDATE pz_fast_lane_publications SET status='unpublished',reviewed_by=?,reviewed_at=?,"+
          "unpublish_reason=? WHERE id=? AND status='published'"
        ).bind(actor,at,note,sampleId),
        env.DB.prepare(
          "UPDATE products SET catalog_hidden=1,updated_at=? WHERE id=? AND lower(status)='published' "+
          "AND EXISTS(SELECT 1 FROM pz_fast_lane_publications WHERE id=? AND status='unpublished')"
        ).bind(at,sample.product_id,sampleId),
        audit(env,{event_type:'sample_unpublished',operator_id:sample.operator_id,review_id:sample.review_id,
          product_id:sample.product_id,actor_id:actor,note,stamp:at})
      ]);
      if(!changed(resultVisible)||!changed(resultHidden)||!changed(resultAudit))
        return json({error:'Sample state changed; refresh before retry'},409);
      const retracted=await env.DB.prepare(
        "SELECT COUNT(*) AS total FROM pz_fast_lane_publications WHERE operator_id=? AND status='unpublished'"
      ).bind(sample.operator_id).first();
      let autoRevoked=false;
      if(Number(retracted?.total)>=2){
        const result=await env.DB.prepare(
          "UPDATE pz_fast_lane_trust SET trusted=0,updated_by=?,updated_at=? WHERE operator_id=? AND trusted=1"
        ).bind(actor,at,sample.operator_id).run();
        autoRevoked=changed(result);
        if(autoRevoked)await audit(env,{event_type:'trust_auto_revoked',
          operator_id:sample.operator_id,actor_id:actor,note:'Two post-publish sampling unpublishes',
          stamp:at}).run();
      }
      try{await syncFastLaneCatalog(env,normalizeProductRows);
        return json({success:true,status:'unpublished',auto_revoked:autoRevoked,catalog_published:true});
      }catch{return json({success:true,status:'unpublished',auto_revoked:autoRevoked,
        catalog_published:false,code:'CATALOG_SYNC_PENDING'});}
    }
    return json({error:'Fast lane admin route not found'},404);
  }catch(error){
    if(/no such table|no such column/i.test(String(error)))
      return json({error:'Fast-lane migration 018 is not installed',code:'FAST_LANE_SCHEMA_MISSING'},503);
    if(/constraint|unique|FOREIGN KEY/i.test(String(error)))
      return json({error:'Fast-lane state conflict',code:'FAST_LANE_CONFLICT'},409);
    throw error;
  }
}
