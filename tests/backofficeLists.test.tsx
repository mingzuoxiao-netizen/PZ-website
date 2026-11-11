import test from 'node:test';
import assert from 'node:assert/strict';
import {fetchBackofficePage} from '../utils/backofficeLists';

test('versioned list client sends full-scope filters without fetching unbounded pages',async()=>{
  const oldFetch=globalThis.fetch,oldStorage=(globalThis as any).sessionStorage;
  (globalThis as any).sessionStorage={getItem:()=>null};
  let calls=0;
  try{
    globalThis.fetch=(async(input:any,options?:RequestInit)=>{
      calls++;const url=new URL(String(input),'https://local.example');
      assert.equal(url.pathname,'/api/supervisor/reviews');
      assert.equal(url.searchParams.get('list_version'),'1');
      assert.equal(url.searchParams.get('q'),'产品 PZ-001');
      assert.equal(url.searchParams.get('submitter'),'staff');
      assert.equal(url.searchParams.get('page'),'7');
      assert.equal(options?.method,'GET');
      return Response.json({list_version:1,items:[{id:'older-pending'}],total:301,page:7,page_size:50,has_more:false});
    }) as typeof fetch;
    const result=await fetchBackofficePage<{id:string}>('supervisor/reviews',
      {page:7,q:'产品 PZ-001',submitter:'staff',status:'action'});
    assert.equal(result.total,301);assert.equal(result.items[0].id,'older-pending');assert.equal(calls,1);
  }finally{
    globalThis.fetch=oldFetch;
    if(oldStorage===undefined)delete (globalThis as any).sessionStorage;
    else (globalThis as any).sessionStorage=oldStorage;
  }
});

test('legacy, malformed and failed list responses cannot silently become zero counts',async()=>{
  const oldFetch=globalThis.fetch,oldStorage=(globalThis as any).sessionStorage;
  (globalThis as any).sessionStorage={getItem:()=>null};
  const valid={list_version:1,items:[],total:0,page:1,page_size:50,has_more:false};
  try{
    for(const result of [{items:[]},{...valid,total:500},{...valid,has_more:true},
      {...valid,total:'0'},{...valid,page:2},{...valid,page_size:500},
      {...valid,total:1,items:[null]},{...valid,total:1,items:[{name:'no id'}]}]){
      globalThis.fetch=(async()=>Response.json(result)) as typeof fetch;
      await assert.rejects(fetchBackofficePage('admin/reviews'),/列表/);
    }
    globalThis.fetch=(async()=>Response.json({error:'database unavailable'},{status:503})) as typeof fetch;
    await assert.rejects(fetchBackofficePage('admin/reviews'),/503/);
    globalThis.fetch=(async()=>Response.json(valid)) as typeof fetch;
    assert.equal((await fetchBackofficePage('admin/reviews')).total,0);
  }finally{
    globalThis.fetch=oldFetch;
    if(oldStorage===undefined)delete (globalThis as any).sessionStorage;
    else (globalThis as any).sessionStorage=oldStorage;
  }
});

test('factory client requires complete owner facets and encodes category aliases as a bounded server filter',async()=>{
  const oldFetch=globalThis.fetch,oldStorage=(globalThis as any).sessionStorage;
  (globalThis as any).sessionStorage={getItem:()=>null};
  const page={list_version:1,items:[],total:0,page:1,page_size:50,has_more:false};
  try{
    globalThis.fetch=(async()=>Response.json(page)) as typeof fetch;
    await assert.rejects(fetchBackofficePage('factory/products'),/完整产品统计未同步/);
    globalThis.fetch=(async input=>{
      const url=new URL(String(input),'https://local.example');
      assert.deepEqual(JSON.parse(url.searchParams.get('categories')!),['Tables','餐桌']);
      return Response.json({...page,status_counts:[{status:'draft',count:1234}],category_counts:[{category:'Tables',count:1234}]});
    }) as typeof fetch;
    const result=await fetchBackofficePage('factory/products',{categories:['Tables','餐桌']});
    assert.equal(result.status_counts![0].count,1234);
    globalThis.fetch=(async()=>Response.json({...page,status_counts:[{status:'draft',count:1234}],category_counts:[]})) as typeof fetch;
    await assert.rejects(fetchBackofficePage('factory/products'),/完整产品统计未同步/);
  }finally{
    globalThis.fetch=oldFetch;if(oldStorage===undefined)delete (globalThis as any).sessionStorage;else (globalThis as any).sessionStorage=oldStorage;
  }
});
