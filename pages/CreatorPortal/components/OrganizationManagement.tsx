import React, { useCallback, useEffect, useState } from 'react';
import { adminFetch } from '../../../utils/adminFetch';

type Department = {id:string;name:string;factory_site:string;is_active:number};
type Member = {id:string;username:string;role:string;is_active:number;job_type:string|null;department_id:string|null;supervisor_id:string|null;department_name:string|null};
type Job = 'supervisor'|'secretary'|'staff'|'data_entry';
const labels:Record<Job,string> = {supervisor:'部门主管',secretary:'秘书',staff:'业务人员',data_entry:'资料录入员'};

const OrganizationManagement:React.FC = () => {
  const [departments,setDepartments] = useState<Department[]>([]);
  const [members,setMembers] = useState<Member[]>([]);
  const [name,setName] = useState('');
  const [site,setSite] = useState('zhaoqing');
  const [username,setUsername] = useState('');
  const [password,setPassword] = useState('');
  const [job,setJob] = useState<Job>('supervisor');
  const [departmentId,setDepartmentId] = useState('');
  const [supervisorId,setSupervisorId] = useState('');
  const [legacyId,setLegacyId] = useState('');
  const [message,setMessage] = useState('');
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  const refresh=useCallback(async()=>{
    const [ds,accounts]=await Promise.all([
      adminFetch<{items:Department[]}>('/admin/org/departments'),
      adminFetch<{users:Member[]}>('/admin/org/accounts')
    ]);
    setDepartments(ds.items||[]);
    setMembers(accounts.users||[]);
  },[]);
  useEffect(()=>{void refresh().catch(e=>setError(e?.message||'无法读取部门数据，请确认 Staging 已执行迁移并开启组织功能。'));},[refresh]);
  const handle=async(action:()=>Promise<unknown>,success:string)=>{
    setBusy(true);setError('');setMessage('');
    try{await action();setMessage(success);await refresh();}
    catch(e:any){setError(e?.message||'操作失败');}
    finally{setBusy(false);}
  };
  const supervisors=members.filter(m=>m.job_type==='supervisor'&&m.department_id===departmentId&&m.is_active===1);
  const legacy=members.filter(m=>m.role?.toLowerCase()==='factory'&&!m.job_type);
  return <div className="space-y-6 p-4 md:p-8">
    <div><h2 className="font-serif text-2xl text-stone-900">部门与主管管理</h2><p className="mt-1 text-sm text-stone-500">总部统一管理部门；主管可以自行创建本部门秘书和业务账号。该功能须先在 Staging 启用。</p></div>
    {error&&<p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {message&&<p role="status" className="rounded border border-green-300 bg-green-50 p-3 text-sm text-green-800">{message}</p>}
    <form onSubmit={e=>{e.preventDefault();void handle(()=>adminFetch('/admin/org/departments',{method:'POST',body:JSON.stringify({name,factory_site:site})}),'部门已创建').then(()=>setName(''));}} className="space-y-3 rounded border bg-white p-5">
      <h3 className="font-semibold">1. 创建部门</h3>
      <div className="flex flex-wrap gap-3">
        <input aria-label="部门名称" className="flex-1 border p-2 text-sm" value={name} onChange={e=>setName(e.target.value)} placeholder="部门名称（如：肇庆产品部）" required/>
        <select aria-label="工厂归属" className="border p-2 text-sm" value={site} onChange={e=>setSite(e.target.value)}>
          <option value="zhaoqing">肇庆</option><option value="kandal">柬埔寨</option><option value="shared">跨工厂</option>
        </select>
        <button disabled={busy} className="bg-stone-900 px-5 py-2 text-sm text-white disabled:opacity-50">创建部门</button>
      </div>
    </form>
    <form onSubmit={e=>{e.preventDefault();void handle(()=>adminFetch('/admin/org/accounts',{method:'POST',body:JSON.stringify({username,password,job_type:job,department_id:departmentId,supervisor_id:job==='supervisor'?undefined:supervisorId})}),'账号创建成功').then(()=>setPassword(''));}} className="space-y-3 rounded border bg-white p-5">
      <h3 className="font-semibold">2. 创建主管或部门员工</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <input aria-label="新账号名称" className="border p-2 text-sm" value={username} onChange={e=>setUsername(e.target.value)} required placeholder="登录账号"/>
        <input aria-label="初始密码" className="border p-2 text-sm" type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={12} autoComplete="new-password" placeholder="至少 12 位初始密码"/>
        <select aria-label="职位" className="border p-2 text-sm" value={job} onChange={e=>setJob(e.target.value as Job)}>
          {Object.entries(labels).map(([id,label])=><option key={id} value={id}>{label}</option>)}
        </select>
        <select aria-label="所属部门" className="border p-2 text-sm" value={departmentId} onChange={e=>{setDepartmentId(e.target.value);setSupervisorId('');}} required>
          <option value="">选择部门</option>{departments.filter(d=>d.is_active).map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        {job!=='supervisor'&&<select aria-label="直属主管" className="border p-2 text-sm" value={supervisorId} onChange={e=>setSupervisorId(e.target.value)} required>
          <option value="">选择直属主管</option>{supervisors.map(s=><option key={s.id} value={s.id}>{s.username}</option>)}
        </select>}
      </div>
      <button disabled={busy||!departmentId||(job!=='supervisor'&&!supervisorId)} className="bg-stone-900 px-5 py-2 text-sm text-white disabled:opacity-50">创建账号</button>
    </form>
    <form onSubmit={e=>{e.preventDefault();void handle(()=>adminFetch('/admin/org/assignments',{method:'POST',body:JSON.stringify({user_id:legacyId,department_id:departmentId,supervisor_id:supervisorId,job_type:'staff'})}),'旧工厂账号已分配到主管').then(()=>setLegacyId(''));}} className="space-y-3 rounded border bg-white p-5">
      <h3 className="font-semibold">3. 将现有工厂账号分配到主管</h3>
      <div className="flex flex-wrap gap-2">
        <select aria-label="待分配工厂账号" value={legacyId} onChange={e=>setLegacyId(e.target.value)} className="min-w-40 flex-1 border p-2 text-sm" required>
          <option value="">选择旧账号</option>{legacy.map(m=><option key={m.id} value={m.id}>{m.username}</option>)}
        </select>
        <select aria-label="旧账号直属主管" value={supervisorId} onChange={e=>setSupervisorId(e.target.value)} className="min-w-40 flex-1 border p-2 text-sm" required>
          <option value="">选择主管（与上方选定部门一致）</option>{supervisors.map(m=><option key={m.id} value={m.id}>{m.username}</option>)}
        </select>
        <button disabled={busy||!legacyId||!supervisorId} className="bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-50">分配账号</button>
      </div>
    </form>
    <section className="rounded border bg-white p-5">
      <h3 className="mb-3 font-semibold">组织成员（{members.length}）</h3>
      <div className="overflow-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-stone-500"><th className="p-2">账号</th><th className="p-2">岗位</th><th className="p-2">部门</th><th className="p-2">状态</th></tr></thead>
        <tbody>{members.map(m=><tr key={m.id} className="border-b"><td className="p-2">{m.username}</td><td className="p-2">{m.job_type?labels[m.job_type as Job]:m.role?.toLowerCase()==='admin'?'管理员':'未分配工厂账号'}</td><td className="p-2">{m.department_name||'—'}</td><td className="p-2">{m.is_active?'启用':'停用'}</td></tr>)}</tbody></table></div>
    </section>
  </div>;
};
export default OrganizationManagement;
