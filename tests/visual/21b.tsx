/** Isolated, deterministic screenshot fixture. Never connected to Staging or Production D1. */
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import {ClipboardList,Inbox,LayoutGrid,Package} from 'lucide-react';
import PortalLayout from '../../pages/CreatorPortal/PortalLayout';
import RoleHome from '../../pages/CreatorPortal/components/RoleHome';
import AdminReleaseQueue from '../../pages/CreatorPortal/components/AdminReleaseQueue';
import InquiryManager from '../../pages/CreatorPortal/components/InquiryManager';
import ProductForm from '../../pages/CreatorPortal/components/ProductForm';
import '../../pages/CreatorPortal/backoffice.css';

type Page='dashboard'|'queue'|'inquiries'|'product';
const requested=new URLSearchParams(location.search).get('view') as Page|null;
const initialPage:Page=['dashboard','queue','inquiries','product'].includes(requested||'')?requested!:'dashboard';
const now='2026-11-12T16:30:00.000Z';
const items=[
  {id:'r1',product_id:'p1',name:'White Oak Dining Table',name_cn:'白橡木餐桌',code:'PZ-TABLE-001',images:'[]',
    category:'dining',status:'pending_admin',kind:'product',latest_version:1,approved_version:null,
    department_id:'dept',supervisor_id:'lead',submitter_id:'factory'},
  {id:'r2',product_id:'p2',name:'Walnut Dining Chair',name_cn:'黑胡桃木餐椅',code:'PZ-CHAIR-002',images:'[]',
    category:'dining',status:'approved_pending_publish',kind:'product',latest_version:2,approved_version:2,
    department_id:'dept',supervisor_id:'lead',submitter_id:'factory'}
];
const inquiryRows=[
  {id:'i1',name:'Alex',email:'alex@example.test',company:'Pacific Furniture',country:'美国',product_type:'Wholesale',
    linked_product_code:'PZ-TABLE-001',created_at:now,status:'new',assignee_id:null,assignee_name:null,
    first_response_at:null,is_overdue:true,version:0},
  {id:'i2',name:'Jamie',email:'jamie@example.test',company:'Oak & Home',country:'英国',product_type:'Project',
    linked_product_code:'PZ-CHAIR-002',created_at:now,status:'quoted',assignee_id:'lead',assignee_name:'主管甲',
    first_response_at:now,is_overdue:false,version:2}
];
window.fetch=async(input:RequestInfo|URL)=>{
  const request=new URL(String(input),location.origin);
  const path=request.pathname.replace(/^\/api\//,'');
  const page=Number(request.searchParams.get('page')||1),size=Number(request.searchParams.get('page_size')||50);
  if(path==='admin/dashboard/home')return Response.json({role:'ADMIN',updated_at:now,final_review:8,sample_queue:3,
    new_inquiries_24h:4,overdue_inquiries:2,stale_drafts:6});
  if(path==='admin/release-queue'||path==='admin/inquiries'){
    const rows=path==='admin/release-queue'?items:inquiryRows;
    return Response.json({list_version:1,items:rows.slice((page-1)*size,page*size),total:rows.length,
      page,page_size:size,has_more:page*size<rows.length});
  }
  if(path==='admin/org/accounts')return Response.json({users:[{id:'lead',username:'主管甲',department_name:'肇庆产品部',job_type:'supervisor'}]});
  if(path==='admin/inquiries/assignees')return Response.json({items:[{id:'lead',username:'主管甲',role:'SUPERVISOR'}]});
  return Response.json({success:true,items:[],unread_count:0}, {status:200});
};

const navItems=[
  {id:'dashboard',label:'我的待办',icon:<ClipboardList size={18}/>},
  {id:'queue',label:'审核中心',icon:<LayoutGrid size={18}/>},
  {id:'product',label:'产品管理',icon:<Package size={18}/>},
  {id:'inquiries',label:'询盘管理',icon:<Inbox size={18}/>}
];
const category={id:'dining',title:'Dining Tables',title_cn:'餐桌',subtitle:'',image:''};
function App(){
  const [page,setPage]=useState<Page>(initialPage);
  return <MemoryRouter><PortalLayout role="ADMIN" userName="PZ 演示管理员" navItems={navItems}
    activeTab={page} onTabChange={id=>setPage(id as Page)}>
    {page==='dashboard'&&<RoleHome role="ADMIN" onNavigate={()=>setPage('queue')}/>}
    {page==='queue'&&<AdminReleaseQueue/>}
    {page==='inquiries'&&<InquiryManager/>}
    {page==='product'&&<ProductForm initialData={{code:'PZ-TABLE-003',name:'Oak Table',name_cn:'白橡木餐桌',
      category:'dining',status:'draft',material:'White Oak',description:'Solid wood dining table for home.'}}
      categories={[category] as any} userRole="FACTORY" lang="zh" onSave={()=>{}} onCancel={()=>{}}/>}
  </PortalLayout></MemoryRouter>;
}
createRoot(document.getElementById('root')!).render(<App/>);
