import {adminFetch} from './adminFetch';

export type BackofficeListEndpoint = 'admin/reviews'|'admin/revisions'|'admin/release-queue'|
  'supervisor/reviews'|'supervisor/revisions'|'supervisor/release-queue'|'factory/revisions'|'factory/products'|'admin/inquiries';
export interface BackofficeListQuery {
  page?:number;page_size?:number;q?:string;status?:string;category?:string;categories?:string[];
  department?:string;supervisor?:string;submitter?:string;site?:string;
  import_batch?:string;assignee?:string;overdue?:0|1;
  kind?:'product'|'revision';
  sort?:'oldest'|'newest';
}
export interface BackofficePage<T> {
  list_version:1;items:T[];total:number;page:number;page_size:number;has_more:boolean;
  products?:T[];
  status_counts?:{status:string;count:number}[];
  category_counts?:{category:string|null;count:number}[];
}

/** Never turn an unversioned, truncated legacy response into a complete page. */
export async function fetchBackofficePage<T>(endpoint:BackofficeListEndpoint,
  query:BackofficeListQuery={},signal?:AbortSignal):Promise<BackofficePage<T>> {
  const params:Record<string,string>={list_version:'1',page:String(query.page??1),
    page_size:String(query.page_size??50)};
  for(const [key,value] of Object.entries(query))
    if(value!==undefined&&value!=='')params[key]=Array.isArray(value)?JSON.stringify(value):String(value);
  const result=await adminFetch<BackofficePage<T>>(endpoint,{params,signal});
  if(!result||result.list_version!==1)
    throw Error('当前列表服务需要更新，暂时无法确认完整结果。请联系管理员。');
  const page=Number(params.page),size=Number(params.page_size);
  const valid=Number.isSafeInteger(result.total)&&result.total>=0&&
    result.page===page&&result.page_size===size&&size>=1&&size<=100&&
    Array.isArray(result.items)&&result.items.length===Math.min(size,Math.max(0,result.total-(page-1)*size))&&
    result.items.every(item=>!!item&&typeof item==='object'&&typeof (item as {id?:unknown}).id==='string')&&
    result.has_more===(page*size<result.total);
  if(!valid)throw Error('列表结果不完整，请刷新重试；当前数量不能作为完整统计。');
  if(endpoint==='factory/products'){
    const statuses=result.status_counts,categories=result.category_counts;
    if(!Array.isArray(statuses)||!Array.isArray(categories)||
       statuses.some(row=>typeof row.status!=='string'||!Number.isSafeInteger(row.count)||row.count<0)||
       categories.some(row=>row.category!==null&&typeof row.category!=='string'||!Number.isSafeInteger(row.count)||row.count<0)||
       statuses.reduce((sum,row)=>sum+row.count,0)!==categories.reduce((sum,row)=>sum+row.count,0)||
       statuses.reduce((sum,row)=>sum+row.count,0)<result.total)
      throw Error('完整产品统计未同步，请刷新重试。');
  }
  return result;
}
