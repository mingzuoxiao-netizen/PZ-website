import React, { useCallback, useEffect, useState } from 'react';
import { adminFetch } from '../../../utils/adminFetch';

type Department = { id: string; name: string; factory_site: string; is_active: number };
type Member = {
  id: string; username: string; role: string; is_active: number;
  job_type: string | null; department_id: string | null;
  supervisor_id: string | null; department_name: string | null;
};
type Job = 'supervisor' | 'secretary' | 'staff' | 'data_entry';

const labels: Record<Job, string> = {
  supervisor: '部门主管', secretary: '秘书', staff: '业务人员', data_entry: '资料录入员',
};

const OrganizationManagement: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState('');
  const [site, setSite] = useState('zhaoqing');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [job, setJob] = useState<Job>('supervisor');
  const [departmentId, setDepartmentId] = useState('');
  const [supervisorId, setSupervisorId] = useState('');
  const [legacyId, setLegacyId] = useState('');
  const [legacyJob,setLegacyJob] = useState<Job>('staff');
  const [deleteTarget,setDeleteTarget] = useState<Department|null>(null);
  const [deleteConfirmation,setDeleteConfirmation] = useState('');
  const [assignmentDepartmentId, setAssignmentDepartmentId] = useState('');
  const [assignmentSupervisorId, setAssignmentSupervisorId] = useState('');
  const [expandedDepartmentId, setExpandedDepartmentId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const [ds, accounts] = await Promise.all([
      adminFetch<{ items: Department[] }>('/admin/org/departments'),
      adminFetch<{ users: Member[] }>('/admin/org/accounts'),
    ]);
    const active = (ds.items || []).filter(d => d.is_active === 1);
    setDepartments(ds.items || []);
    setMembers(accounts.users || []);
    setDepartmentId(current => active.some(d => d.id === current) ? current : (active[0]?.id || ''));
    setAssignmentDepartmentId(current => active.some(d => d.id === current) ? current : '');
    setExpandedDepartmentId(current => active.some(d => d.id === current) ? current : null);
    setLoaded(true);
  }, []);

  useEffect(() => {
    void refresh().catch(e => {
      setError(e?.message || '无法读取部门数据，请确认 Staging 已执行迁移并开启组织功能。');
      setLoaded(true);
    });
  }, [refresh]);

  // Keep input values on a failed request; clear them only after successful submission.
  const perform = async <T,>(action: () => Promise<T>, success: string): Promise<T | null> => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await action();
      await refresh();
      setMessage(success);
      return result;
    } catch (e: any) {
      setError(e?.message || '操作失败');
      return null;
    } finally {
      setBusy(false);
    }
  };

  const activeDepartments = departments.filter(d => d.is_active === 1);
  const currentDepartment = activeDepartments.find(d => d.id === departmentId);
  const supervisors = members.filter(
    m => m.job_type === 'supervisor' && m.department_id === departmentId && m.is_active === 1,
  );
  const selectedSupervisorId =
    supervisors.some(m => m.id === supervisorId) ? supervisorId : (supervisors.length === 1 ? supervisors[0].id : '');
  const assignmentDepartment = activeDepartments.find(d => d.id === assignmentDepartmentId);
  const assignmentSupervisors = members.filter(
    m => m.job_type === 'supervisor' && m.department_id === assignmentDepartmentId && m.is_active === 1,
  );
  const selectedAssignmentSupervisorId =
    assignmentSupervisors.some(m => m.id === assignmentSupervisorId)
      ? assignmentSupervisorId
      : (assignmentSupervisors.length === 1 ? assignmentSupervisors[0].id : '');
  const legacy = members.filter(m => m.role?.toLowerCase() === 'factory' && !m.job_type);
  const needsSupervisor = job !== 'supervisor' && supervisors.length === 0;

  const createDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await perform(
      () => adminFetch<{ success: boolean; id: string }>('/admin/org/departments', {
        method: 'POST',
        body: JSON.stringify({ name, factory_site: site }),
      }),
      '部门创建成功，已自动选中。下一步可以创建部门主管。',
    );
    if (created?.id) {
      setDepartmentId(created.id);
      setSupervisorId('');
      setAssignmentSupervisorId('');
      setJob('supervisor');
      setName('');
    }
  };

  const createAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDepartment) return;
    const createdJob = job;
    const created = await perform(
      () => adminFetch<{ success: boolean; id: string }>('/admin/org/accounts', {
        method: 'POST',
        body: JSON.stringify({
          username, password, job_type: createdJob, department_id: departmentId,
          supervisor_id: createdJob === 'supervisor' ? undefined : selectedSupervisorId,
        }),
      }),
      createdJob === 'supervisor'
        ? '主管已创建。已切换到秘书账号，下一步可创建秘书或业务人员。'
        : '部门员工账号创建成功。',
    );
    if (created?.id) {
      setUsername('');
      setPassword('');
      if (createdJob === 'supervisor') {
        setJob('secretary');
        setSupervisorId(created.id);
        // Creating a supervisor in step two must not silently change the pending-account target department.
        if (assignmentDepartmentId === departmentId) setAssignmentSupervisorId(created.id);
      }
    }
  };

  const deleteDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteTarget || deleteConfirmation !== deleteTarget.name || busy) return;
    const result=await perform(
      () => adminFetch<{success:boolean;unassigned_count:number}>(`/admin/org/departments/${encodeURIComponent(deleteTarget.id)}`,{method:'DELETE'}),
      '部门已删除，账号已转入待分配。',
    );
    if (result?.success) {
      setMessage(`部门已删除，${result.unassigned_count || 0} 个账号进入待分配。原有审批历史仍然保留。`);
      setDeleteTarget(null);
      setDeleteConfirmation('');
      setLegacyJob('staff');
      setLegacyId('');
    }
  };

  const assignLegacy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!legacyId || !assignmentDepartment || (legacyJob!=='supervisor' && !selectedAssignmentSupervisorId)) return;
    const result = await perform(
      () => adminFetch('/admin/org/assignments', {
        method: 'POST',
        body: JSON.stringify({
          user_id: legacyId, department_id: assignmentDepartmentId,
          supervisor_id: legacyJob==='supervisor'?undefined:selectedAssignmentSupervisorId, job_type:legacyJob,
        }),
      }),
      '待分配账号已设置岗位并分配到部门。',
    );
    if (result) {setLegacyId('');setLegacyJob('staff');}
  };

  return <div className="space-y-6 p-4 md:p-8">
    <div>
      <h2 className="font-serif text-2xl text-stone-900">部门与主管管理</h2>
      <p className="mt-1 text-sm text-stone-500">
        按顺序操作：先创建部门 → 再创建主管 → 最后添加秘书或业务人员。已有部门可以直接选择，无需重复创建。
      </p>
    </div>

    {error && <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {message && <p role="status" className="rounded border border-green-300 bg-green-50 p-3 text-sm text-green-800">{message}</p>}

    <form onSubmit={e => { void createDepartment(e); }} className="space-y-3 rounded border bg-white p-5">
      <h3 className="font-semibold">第一步 · {activeDepartments.length ? '创建新部门（可选）' : '先创建部门'}</h3>
      {!loaded ? <p className="text-sm text-stone-500">正在加载部门…</p> :
        activeDepartments.length ? <p className="text-sm text-stone-600">现有 {activeDepartments.length} 个部门，可直接在第二步选择。</p> :
          <p className="rounded bg-amber-50 p-3 text-sm text-amber-900">
            还没有部门，请先填写部门名称并点击「创建部门」。成功后系统会自动选中该部门，解锁第二步。
          </p>}
      <div className="flex flex-wrap gap-3">
        <input aria-label="部门名称" className="min-w-40 flex-1 border p-2 text-sm" value={name}
          onChange={e => setName(e.target.value)} placeholder="部门名称（如：肇庆产品部）" required />
        <select aria-label="工厂归属" className="border p-2 text-sm" value={site} onChange={e => setSite(e.target.value)}>
          <option value="zhaoqing">肇庆</option><option value="kandal">柬埔寨</option><option value="shared">跨工厂</option>
        </select>
        <button disabled={busy || !loaded} className="bg-stone-900 px-5 py-2 text-sm text-white disabled:opacity-50">
          创建部门
        </button>
      </div>
    </form>

    <section className="rounded border bg-white p-5">
      <h3 className="mb-3 font-semibold">现有部门（{activeDepartments.length}）</h3>
      <p className="mb-3 text-sm text-stone-500">管理员删除部门后，账号不会被删除，所有原部门账号将进入待分配。产品及审核历史仍保留。</p>
      {!activeDepartments.length && <p className="text-sm text-stone-500">暂无部门。</p>}
      <div className="space-y-2">
        {activeDepartments.map(d=>{
          const count=members.filter(m=>m.department_id===d.id).length;
          return <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded border border-stone-200 p-3">
            <div><div className="font-medium text-sm">{d.name}</div>
              <div className="text-xs text-stone-500">成员 {count} 人 · {d.factory_site==='zhaoqing'?'肇庆':d.factory_site==='kandal'?'柬埔寨':'跨工厂'}</div></div>
            <button type="button" disabled={busy} aria-label={`删除部门 ${d.name}`}
              onClick={()=>{setDeleteTarget(d);setDeleteConfirmation('');}}
              className="rounded border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-40">删除部门</button>
          </div>;
        })}
      </div>
    </section>

    {deleteTarget && <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4">
      <form role="dialog" aria-modal="true" onSubmit={e=>{void deleteDepartment(e);}}
        className="w-full max-w-md space-y-4 bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold">删除部门：{deleteTarget.name}</h3>
        <p className="text-sm text-stone-600">
          此操作会移除部门，并把所属账号转为待分配；不会删除登录账号、产品或审批历史。之后需为账号重新指定部门和岗位。
        </p>
        <label className="block text-sm text-stone-700">输入完整部门名称确认
          <input autoFocus required aria-label="确认删除部门名称" value={deleteConfirmation}
            onChange={e=>setDeleteConfirmation(e.target.value)}
            className="mt-2 w-full border border-stone-300 p-3" />
        </label>
        <div className="flex justify-end gap-3">
          <button type="button" disabled={busy} onClick={()=>setDeleteTarget(null)}
            className="border px-4 py-2">取消</button>
          <button type="submit" disabled={busy||deleteConfirmation!==deleteTarget.name}
            className="bg-red-700 px-4 py-2 text-white disabled:opacity-40">确认删除部门</button>
        </div>
      </form>
    </div>}

    <form onSubmit={e => { void createAccount(e); }} className="space-y-3 rounded border bg-white p-5">
      <h3 className="font-semibold">第二步 · 创建主管或部门员工</h3>
      {!loaded ? <p className="text-sm text-stone-500">正在读取部门…</p> :
        !activeDepartments.length ? <p role="status" className="rounded bg-stone-100 p-3 text-sm text-stone-700">
          请先完成第一步「创建部门」，这里才会显示可选择的部门。
        </p> :
          <p className="text-sm text-stone-600">部门已就绪。{supervisors.length ? '可以创建主管、秘书和业务人员。' : '该部门还没有主管，请先选择「部门主管」创建账号。'}</p>}
      <fieldset disabled={busy || !currentDepartment} className="space-y-3 disabled:opacity-60">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">所属部门</span>
            <select aria-label="所属部门" className="w-full border p-2 text-sm" value={departmentId}
              onChange={e => { setDepartmentId(e.target.value); setSupervisorId(''); }} required>
              {!activeDepartments.length && <option value="">请先在第一步创建部门</option>}
              {activeDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">人员岗位</span>
            <select aria-label="职位" className="w-full border p-2 text-sm" value={job}
              onChange={e => { setJob(e.target.value as Job); setSupervisorId(''); }}>
              {Object.entries(labels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">登录账号</span>
            <input aria-label="新账号名称" className="w-full border p-2 text-sm" value={username}
              onChange={e => setUsername(e.target.value)} required placeholder="例如：sales_assistant" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">初始密码</span>
            <input aria-label="初始密码" className="w-full border p-2 text-sm" type="password" value={password}
              onChange={e => setPassword(e.target.value)} required minLength={12}
              autoComplete="new-password" placeholder="至少 12 位初始密码" />
          </label>
          {job !== 'supervisor' && <label className="space-y-1 text-sm">
            <span className="font-medium">直属主管</span>
            <select aria-label="直属主管" className="w-full border p-2 text-sm" value={selectedSupervisorId}
              onChange={e => setSupervisorId(e.target.value)} required>
              <option value="">{needsSupervisor ? '请先创建部门主管' : '选择直属主管'}</option>
              {supervisors.map(s => <option key={s.id} value={s.id}>{s.username}</option>)}
            </select>
          </label>}
        </div>
        {needsSupervisor && <p role="status" className="rounded bg-amber-50 p-3 text-sm text-amber-900">
          当前部门还没有主管。请先将「人员岗位」切换为「部门主管」并创建，然后才能添加秘书或其他员工。
        </p>}
        <button disabled={busy || !currentDepartment || needsSupervisor || (job !== 'supervisor' && !selectedSupervisorId)}
          className="bg-stone-900 px-5 py-2 text-sm text-white disabled:opacity-50">
          创建账号
        </button>
      </fieldset>
    </form>

    <form onSubmit={e => { void assignLegacy(e); }} className="space-y-4 rounded border bg-white p-5">
      <div>
        <h3 className="font-semibold">第三步 · 待分配账号（{legacy.length}）</h3>
        <p className="mt-1 text-sm text-stone-500">
          选择账号和目标部门，先分配主管，再将其他账号分配到该部门主管名下；不受第二步选择的部门影响。
        </p>
      </div>
      {!legacy.length && <p className="text-sm text-stone-500">当前没有待分配的工厂账号。</p>}
      <fieldset disabled={busy || !legacy.length || !activeDepartments.length}
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5 disabled:opacity-60">
        <label className="space-y-1 text-sm">
          <span className="font-medium">待分配账号</span>
          <select aria-label="待分配工厂账号" value={legacyId}
            onChange={e => setLegacyId(e.target.value)}
            className="w-full rounded border border-stone-300 p-2 text-sm" required>
            <option value="">选择账号</option>
            {legacy.map(m => <option key={m.id} value={m.id}>{m.username}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">目标部门</span>
          <select aria-label="待分配目标部门" value={assignmentDepartmentId}
            onChange={e => { setAssignmentDepartmentId(e.target.value); setAssignmentSupervisorId(''); }}
            className="w-full rounded border border-stone-300 p-2 text-sm" required>
            <option value="">选择要分配到的部门</option>
            {activeDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">岗位</span>
          <select aria-label="待分配账号岗位" value={legacyJob}
            onChange={e=>setLegacyJob(e.target.value as Job)}
            className="w-full rounded border border-stone-300 p-2 text-sm">
            {Object.entries(labels).map(([key,title])=><option key={key} value={key}>{title}</option>)}
          </select>
        </label>
        {legacyJob!=='supervisor' &&
          <label className="space-y-1 text-sm">
            <span className="font-medium">直属主管</span>
            <select aria-label="旧账号直属主管" value={selectedAssignmentSupervisorId}
              onChange={e => setAssignmentSupervisorId(e.target.value)}
              className="w-full rounded border border-stone-300 p-2 text-sm" required>
              <option value="">选择目标部门的主管</option>
              {assignmentSupervisors.map(m => <option key={m.id} value={m.id}>{m.username}</option>)}
            </select>
          </label>}
        <button disabled={busy || !legacyId || !assignmentDepartment ||
            (legacyJob!=='supervisor' && !selectedAssignmentSupervisorId)}
          className="self-end rounded bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-50">
          确认分配
        </button>
      </fieldset>
      {!!legacy.length && !!assignmentDepartment && legacyJob !== 'supervisor' && !assignmentSupervisors.length &&
        <p role="status" className="rounded bg-amber-50 p-3 text-sm text-amber-900">
          {assignmentDepartment.name} 暂无启用的部门主管，请先在上面将一名待分配账号设为主管。
        </p>}
    </form>

    <section className="space-y-4 rounded border bg-white p-5">
      <div>
        <h3 className="font-semibold">组织成员（{members.length}）</h3>
        <p className="mt-1 text-sm text-stone-500">
          按部门查看组织架构。管理员先查看各部门主管，点击部门卡片后查看该部门全部人员。
        </p>
      </div>
      {!activeDepartments.length &&
        <p className="rounded bg-stone-50 p-4 text-sm text-stone-600">目前没有启用的部门，请先创建部门。</p>}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {activeDepartments.map(department => {
          const departmentMembers = members.filter(m => m.department_id === department.id);
          const departmentSupervisors = departmentMembers.filter(m => m.job_type === 'supervisor');
          const employeeCount = departmentMembers.filter(m => m.job_type !== 'supervisor').length;
          const isExpanded = expandedDepartmentId === department.id;
          return <button key={department.id} type="button"
            aria-label={`查看部门成员 ${department.name}`}
            aria-expanded={isExpanded}
            aria-controls="organization-department-members"
            onClick={() => setExpandedDepartmentId(current => current === department.id ? null : department.id)}
            className={`rounded border p-4 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-stone-700 ${isExpanded ? 'border-stone-800 bg-stone-50' : 'border-stone-200 hover:border-stone-400'}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-stone-900">{department.name}</span>
              <span className="text-xs text-stone-500">{isExpanded ? '收起' : '查看成员'}</span>
            </div>
            <p className="mt-1 text-xs text-stone-500">
              {department.factory_site==='zhaoqing'?'肇庆':department.factory_site==='kandal'?'柬埔寨':'跨工厂'}
              {' · '}共 {departmentMembers.length} 人（员工 {employeeCount} 人）
            </p>
            <div className="mt-3 border-t border-stone-200 pt-3 text-sm">
              <span className="font-medium text-stone-700">部门主管：</span>
              {departmentSupervisors.length ?
                <span className="text-stone-900">{departmentSupervisors.map(m=>m.username + (m.is_active ? '' : '（已停用）')).join('、')}</span> :
                <span className="text-amber-700">尚未设置</span>}
            </div>
          </button>;
        })}
      </div>
      {expandedDepartmentId && activeDepartments.some(d => d.id === expandedDepartmentId) &&
        <div id="organization-department-members" className="rounded border border-stone-200 bg-stone-50 p-4">
          {activeDepartments.filter(d => d.id === expandedDepartmentId).map(department => {
            const selectedMembers = members
              .filter(m => m.department_id === department.id)
              .sort((a,b) =>
                (a.job_type==='supervisor'?0:1)-(b.job_type==='supervisor'?0:1) ||
                a.username.localeCompare(b.username,'zh-CN'));
            return <div key={department.id}>
              <div className="mb-3 flex items-center justify-between">
                <h4 className="font-semibold text-stone-900">{department.name} · 部门人员（{selectedMembers.length}）</h4>
                <button type="button" aria-label="收起部门成员"
                  onClick={()=>setExpandedDepartmentId(null)}
                  className="rounded border border-stone-300 px-3 py-1 text-xs text-stone-600">收起</button>
              </div>
              {!selectedMembers.length ?
                <p className="py-6 text-sm text-stone-500">该部门尚无成员。</p> :
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead><tr className="border-b text-stone-500">
                      <th className="p-2">账号</th><th className="p-2">岗位</th>
                      <th className="p-2">直属主管</th><th className="p-2">状态</th>
                    </tr></thead>
                    <tbody>{selectedMembers.map(m => {
                      const direct = members.find(x=>x.id === m.supervisor_id);
                      return <tr key={m.id} className="border-b border-stone-200">
                        <td className="p-2">{m.username}</td>
                        <td className="p-2">{m.job_type ? labels[m.job_type as Job] : '未分配岗位'}</td>
                        <td className="p-2">{direct?.username || '—'}</td>
                        <td className="p-2">{m.is_active ? '启用' : '停用'}</td>
                      </tr>;
                    })}</tbody>
                  </table>
                </div>}
            </div>;
          })}
        </div>}
      {members.some(m => m.role?.toLowerCase() === 'admin') &&
        <p className="text-xs text-stone-500">
          系统管理员：{members.filter(m => m.role?.toLowerCase()==='admin').map(m=>m.username).join('、')}
          （独立于各部门）
        </p>}
      {legacy.length>0 &&
        <p className="text-xs text-stone-500">另有 {legacy.length} 个待分配账号，可在第三步处理。</p>}
    </section>
  </div>;
};
export default OrganizationManagement;
