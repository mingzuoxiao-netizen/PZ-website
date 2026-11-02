import React, { useCallback, useEffect, useState } from 'react';
import { Users, ClipboardCheck } from 'lucide-react';
import TwoStageProductReviews from './components/TwoStageProductReviews';
import PortalLayout from './PortalLayout';
import { adminFetch } from '../../utils/adminFetch';

type TeamAccount={id:string;username:string;is_active:number;job_type:string};
type Job='secretary'|'staff'|'data_entry';
const labels:Record<Job,string>={secretary:'秘书',staff:'业务人员',data_entry:'资料录入员'};
const SupervisorWorkspace:React.FC=()=>{
  const [tab,setTab]=useState<'team'|'reviews'>('team');
  const [users,setUsers]=useState<TeamAccount[]>([]);
  const [username,setUsername]=useState('');
  const [password,setPassword]=useState('');
  const [job,setJob]=useState<Job>('secretary');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const refresh=useCallback(async()=>{
    const res=await adminFetch<{users:TeamAccount[]}>('/supervisor/accounts');
    setUsers(res.users||[]);
  },[]);
  useEffect(()=>{void refresh().catch(e=>setError(e?.message||'无法读取团队成员。'));},[refresh]);
  const execute=async(fn:()=>Promise<unknown>,message:string)=>{
    setBusy(true);setError('');setNotice('');
    try{await fn();await refresh();setNotice(message);}
    catch(e:any){setError(e?.message||'操作失败');}
    finally{setBusy(false);}
  };
  const create=async(e:React.FormEvent)=>{
    e.preventDefault();
    await execute(()=>adminFetch('/supervisor/accounts',{method:'POST',body:JSON.stringify({username,password,job_type:job})}),'子账号创建成功');
    setPassword('');
  };
  const toggle=(member:TeamAccount)=>void execute(()=>adminFetch('/supervisor/accounts/'+encodeURIComponent(member.id),{
    method:'PATCH',body:JSON.stringify({is_active:!member.is_active})
  }),'账号状态已更新');
  const resetPassword=(member:TeamAccount)=>{
    const pwd=prompt('设置 '+member.username+' 的新密码（不少于 12 位）：');
    if(!pwd)return;
    void execute(()=>adminFetch('/supervisor/accounts/'+encodeURIComponent(member.id)+'/password',{
      method:'POST',body:JSON.stringify({password:pwd})
    }),'密码已重置；账号需要重新登录');
  };
  return <PortalLayout role="SUPERVISOR" userName={sessionStorage.getItem('pz_user_name')||'部门主管'}
    navItems={[{id:'reviews',label:'产品初审',icon:<ClipboardCheck size={18}/>},{id:'team',label:'团队账号管理',icon:<Users size={18}/>}]}
    activeTab={tab} onTabChange={id=>setTab(id as 'team'|'reviews')}>
    {tab==='reviews'?<TwoStageProductReviews role="SUPERVISOR"/>:<div className="space-y-6 p-4 md:p-8">
      <div><h1 className="font-serif text-2xl text-stone-900">团队成员管理</h1><p className="mt-2 text-sm text-stone-500">创建秘书、业务人员或资料录入员账户。所有账号自动归属于你的部门，不能授予主管或管理员权限。</p></div>
      {error&&<div role="alert" className="border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      {notice&&<div role="status" className="border border-green-300 bg-green-50 p-3 text-sm text-green-800">{notice}</div>}
      <form onSubmit={e=>{void create(e);}} className="space-y-3 rounded border bg-white p-5">
        <h2 className="font-semibold">创建下属账户</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <input aria-label="账号名称" className="border p-2 text-sm" required value={username} onChange={e=>setUsername(e.target.value)} placeholder="新账号名称"/>
          <input aria-label="初始密码" className="border p-2 text-sm" type="password" required minLength={12} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="初始密码（12 位以上）"/>
          <select aria-label="人员岗位" className="border p-2 text-sm" value={job} onChange={e=>setJob(e.target.value as Job)}>
            {Object.entries(labels).map(([value,label])=><option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <button disabled={busy} className="bg-stone-900 px-5 py-2 text-sm text-white disabled:opacity-50">创建账户</button>
      </form>
      <section className="rounded border bg-white p-5">
        <h2 className="mb-3 font-semibold">我的团队（{users.length}）</h2>
        <div className="overflow-auto"><table className="w-full text-left text-sm">
          <thead><tr className="border-b text-stone-500"><th className="p-2">登录账号</th><th className="p-2">岗位</th><th className="p-2">状态</th><th className="p-2">账号操作</th></tr></thead>
          <tbody>{users.map(member=><tr key={member.id} className="border-b">
            <td className="p-2">{member.username}</td><td className="p-2">{labels[member.job_type as Job]||member.job_type}</td>
            <td className="p-2">{member.is_active?'启用':'停用'}</td>
            <td className="flex flex-wrap gap-2 p-2"><button type="button" disabled={busy} onClick={()=>toggle(member)} className="border px-2 py-1 text-xs disabled:opacity-50">{member.is_active?'停用':'启用'}</button><button type="button" disabled={busy} onClick={()=>resetPassword(member)} className="border px-2 py-1 text-xs disabled:opacity-50">重置密码</button></td>
          </tr>)}</tbody>
        </table></div>
        {!users.length&&<p className="mt-3 text-sm text-stone-500">尚未创建团队账号。</p>}
      </section>

    </div>}
  </PortalLayout>;
};
export default SupervisorWorkspace;
