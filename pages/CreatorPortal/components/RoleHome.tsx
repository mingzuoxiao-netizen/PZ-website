import React,{useCallback,useEffect,useState} from 'react';
import {RefreshCw,AlertCircle,Clock} from 'lucide-react';
import {adminFetch} from '../../../utils/adminFetch';
import {Button,ListSkeleton,Toast} from '../ui/BackofficeComponents';
import {backofficeError} from '../ui/feedback';

export type DashboardRole='FACTORY'|'SUPERVISOR'|'ADMIN';
export type DashboardTarget={
  tab:'inventory'|'reviews'|'review'|'inquiries'|'completeness';
  status?:'draft'|'returned'|'waiting';
  stale?:boolean;recheck?:0|1;
  section?:'products'|'fast-lane';
  inquiryPreset?:'new'|'overdue';
  sku?:string;
};
type FactoryHome={
  role:'FACTORY';updated_at:string;drafts:number;returned:number;
  oldest_returned_at:string|null;in_review:number;stale_drafts:number;
  stale_items:{id:string;code:string;name:string;status:string;updated_at:string|null;created_at:string}[];
};
type SupervisorHome={
  role:'SUPERVISOR';updated_at:string;first_reviews:number;rechecks:number;total_pending:number;
};
type AdminHome={
  role:'ADMIN';updated_at:string;final_review:number;sample_queue:number;
  new_inquiries_24h:number;overdue_inquiries:number;stale_drafts:number;
};
type HomeData=FactoryHome|SupervisorHome|AdminHome;
const endpoint:Record<DashboardRole,string>={
  FACTORY:'factory/dashboard/home',SUPERVISOR:'supervisor/dashboard/home',ADMIN:'admin/dashboard/home'
};
function elapsed(raw:string|null){
  if(!raw)return '—';
  const date=Date.parse(raw);if(!Number.isFinite(date))return '—';
  const hours=Math.max(0,Math.floor((Date.now()-date)/3600000));
  return hours<24?hours+' 小时':Math.floor(hours/24)+' 天';
}
const DashboardCard:React.FC<{
  title:string;value?:number;description:string;onClick?:()=>void;urgent?:boolean;
}>=({title,value,description,onClick,urgent=false})=>{
  const className='w-full rounded border p-5 text-left shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#385575] '+
    (urgent&&(value??0)>0?'border-amber-300 bg-amber-50':'border-stone-200 bg-white')+
    (onClick?' hover:border-stone-400':'');
  const content=<><p className="text-sm font-semibold text-stone-600">{title}</p>
    <p className="mt-3 font-serif text-3xl tabular-nums text-stone-900">{value===undefined?'查看':value}</p>
    <p className="mt-2 text-xs leading-5 text-stone-600">{description}</p></>;
  return onClick?<button type="button" className={className} onClick={onClick}
    aria-label={title+'：'+(value===undefined?'查看':value)+'，进入相关列表'}>{content}</button>:
    <div className={className}>{content}</div>;
};
const RoleHome:React.FC<{
  role:DashboardRole;onNavigate:(target:DashboardTarget)=>void;
}>=({role,onNavigate})=>{
  const [data,setData]=useState<HomeData|null>(null),[loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const load=useCallback(async()=>{
    setLoading(true);setError('');setData(null);
    try{
      const result=await adminFetch<HomeData>(endpoint[role]);
      if(result?.role!==role)throw Error('服务器返回了不同角色的统计，已停止显示。');
      setData(result);
    }catch(e:any){setError(backofficeError(e,'无法同步工作台统计，请刷新后重试。'));}
    finally{setLoading(false);}
  },[role]);
  useEffect(()=>{void load();},[load]);
  return <section aria-label="我的待办首页" className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="font-serif text-2xl text-stone-900">我的待办</h1>
        <p className="mt-1 text-sm text-stone-600">根据你当前的工作权限实时统计，不缓存其他账号的数据。</p></div>
      <Button type="button" onClick={()=>void load()} disabled={loading}>
        <RefreshCw size={16} className={loading?'animate-spin':''}/>刷新待办
      </Button>
    </div>
    {error&&<Toast variant="error" message={error} onClose={()=>setError('')}/>}
    {loading?<ListSkeleton rows={4}/>:
      data?.role==='FACTORY'?<>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardCard title="我的进行中草稿" value={data.drafts}
            description="打开我的草稿列表，继续填写资料"
            onClick={()=>onNavigate({tab:'inventory',status:'draft'})}/>
          <DashboardCard title="退回待我修改" value={data.returned} urgent
            description={'最早退回已等待 '+elapsed(data.oldest_returned_at)}
            onClick={()=>onNavigate({tab:'inventory',status:'returned'})}/>
          <DashboardCard title="我的审核中产品" value={data.in_review}
            description="包括等待主管和管理员审核的产品"
            onClick={()=>onNavigate({tab:'inventory',status:'waiting'})}/>
          <DashboardCard title="超过 7 天未更新的草稿" value={data.stale_drafts} urgent
            description="仅计算状态为草稿、连续七天未编辑的产品"
            onClick={()=>onNavigate({tab:'inventory',status:'draft',stale:true})}/>
        </div>
        <section className="rounded border border-stone-200 bg-white p-4">
          <h2 className="flex items-center gap-2 text-base font-semibold"><Clock size={17}/>超期未更新草稿</h2>
          {data.stale_items.length===0?<p className="mt-3 text-sm text-stone-500">暂无超过 7 天未修改的草稿。</p>:
            <div className="mt-3 space-y-2">
              {data.stale_items.map(item=><button key={item.id} type="button" aria-label={"打开超期草稿 "+(item.code||item.name)}
                onClick={()=>onNavigate({tab:'inventory',status:'draft',stale:true,sku:item.code||''})}
                className="flex w-full flex-wrap items-center justify-between gap-2 rounded border border-stone-200 px-3 py-3 text-left hover:bg-stone-50">
                <span className="break-all text-sm font-semibold">{item.code||'未编号'} · {item.name||'未命名草稿'}</span>
                <span className="text-xs text-amber-900">未更新 {elapsed(item.updated_at||item.created_at)}</span>
              </button>)}
              {data.stale_drafts>data.stale_items.length&&
                <button type="button" className="text-sm underline"
                  onClick={()=>onNavigate({tab:'inventory',status:'draft',stale:true})}>
                  还有 {data.stale_drafts-data.stale_items.length} 项，查看全部
                </button>}
            </div>}
        </section>
      </>:data?.role==='SUPERVISOR'?<>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <DashboardCard title="等待我的首次初审" value={data.first_reviews}
            description="包含新产品和修订的首次审核项目"
            onClick={()=>onNavigate({tab:'reviews',recheck:0})}/>
          <DashboardCard title="退回后待复检" value={data.rechecks} urgent
            description="优先查看提交过新版本的产品"
            onClick={()=>onNavigate({tab:'reviews',recheck:1})}/>
          <DashboardCard title="主管全部待办" value={data.total_pending}
            description="进入部门待办队列"
            onClick={()=>onNavigate({tab:'reviews'})}/>
        </div>
        <p className="rounded border border-stone-200 bg-white p-4 text-sm text-stone-600">
          复检标识与审核列表使用同一条产品版本规则，管理员退回及修订仍遵循现有审核权限。
        </p>
      </>:data?.role==='ADMIN'?<>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <DashboardCard title="待我终审与发布" value={data.final_review} urgent
            description="打开产品与修订发布队列"
            onClick={()=>onNavigate({tab:'review',section:'products'})}/>
          <DashboardCard title="快速通道待抽检" value={data.sample_queue}
            description="查看已快速发布、尚待抽检的产品"
            onClick={()=>onNavigate({tab:'review',section:'fast-lane'})}/>
          <DashboardCard title="24 小时内新询盘" value={data.new_inquiries_24h}
            description="进入新询盘列表，分配负责人"
            onClick={()=>onNavigate({tab:'inquiries',inquiryPreset:'new'})}/>
          <DashboardCard title="已超过 24 小时未处理询盘" value={data.overdue_inquiries} urgent
            description="仅筛选仍处于新询盘状态的客户咨询"
            onClick={()=>onNavigate({tab:'inquiries',inquiryPreset:'overdue'})}/>
          <DashboardCard title="全站 7 天未更新草稿" value={data.stale_drafts}
            description="仅显示全站汇总数量，查看草稿状态列表"
            onClick={()=>onNavigate({tab:'inventory',status:'draft',stale:true})}/>
          <DashboardCard title="产品资料完整度"
            description="打开单独看板，查看缺失材质、图片、尺寸等问题"
            onClick={()=>onNavigate({tab:'completeness'})}/>
        </div>
      </>:null}
    {data&&<p className="text-xs text-stone-500">统计时间：{new Date(data.updated_at).toLocaleString('zh-CN')} · 数量来自 Worker 当前查询</p>}
  </section>;
};
export default RoleHome;
