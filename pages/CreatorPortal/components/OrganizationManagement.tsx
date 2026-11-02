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
  const [assignmentSupervisorId, setAssignmentSupervisorId] = useState('');
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
  const selectedAssignmentSupervisorId =
    supervisors.some(m => m.id === assignmentSupervisorId) ? assignmentSupervisorId : (supervisors.length === 1 ? supervisors[0].id : '');
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
        setAssignmentSupervisorId(created.id);
      }
    }
  };

  const assignLegacy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDepartment || !selectedAssignmentSupervisorId) return;
    const result = await perform(
      () => adminFetch('/admin/org/assignments', {
        method: 'POST',
        body: JSON.stringify({
          user_id: legacyId, department_id: departmentId,
          supervisor_id: selectedAssignmentSupervisorId, job_type: 'staff',
        }),
      }),
      '旧工厂账号已分配到指定主管。',
    );
    if (result) setLegacyId('');
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
              onChange={e => { setDepartmentId(e.target.value); setSupervisorId(''); setAssignmentSupervisorId(''); }} required>
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

    <form onSubmit={e => { void assignLegacy(e); }} className="space-y-3 rounded border bg-white p-5">
      <h3 className="font-semibold">第三步 · 分配现有工厂账号（可选）</h3>
      <p className="text-sm text-stone-500">只需要为以前创建、尚未归属主管的工厂账号进行分配；新账号会自动关联部门和主管。</p>
      {!legacy.length && <p className="text-sm text-stone-500">当前没有待分配的旧工厂账号。</p>}
      {!!legacy.length && !supervisors.length && <p className="text-sm text-stone-500">请在第二步先为选中的部门创建主管。</p>}
      <fieldset disabled={busy || !currentDepartment || !supervisors.length || !legacy.length}
        className="flex flex-wrap gap-2 disabled:opacity-60">
        <select aria-label="待分配工厂账号" value={legacyId} onChange={e => setLegacyId(e.target.value)}
          className="min-w-40 flex-1 border p-2 text-sm" required>
          <option value="">选择旧账号</option>{legacy.map(m => <option key={m.id} value={m.id}>{m.username}</option>)}
        </select>
        <select aria-label="旧账号直属主管" value={selectedAssignmentSupervisorId}
          onChange={e => setAssignmentSupervisorId(e.target.value)}
          className="min-w-40 flex-1 border p-2 text-sm" required>
          <option value="">选择主管（对应上方选定部门）</option>
          {supervisors.map(m => <option key={m.id} value={m.id}>{m.username}</option>)}
        </select>
        <button disabled={busy || !legacyId || !selectedAssignmentSupervisorId}
          className="bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-50">分配账号</button>
      </fieldset>
    </form>

    <section className="rounded border bg-white p-5">
      <h3 className="mb-3 font-semibold">组织成员（{members.length}）</h3>
      <div className="overflow-auto"><table className="w-full text-left text-sm">
        <thead><tr className="border-b text-stone-500">
          <th className="p-2">账号</th><th className="p-2">岗位</th><th className="p-2">部门</th><th className="p-2">状态</th>
        </tr></thead>
        <tbody>{members.map(m => <tr key={m.id} className="border-b">
          <td className="p-2">{m.username}</td>
          <td className="p-2">{m.job_type ? labels[m.job_type as Job] : m.role?.toLowerCase() === 'admin' ? '管理员' : '未分配工厂账号'}</td>
          <td className="p-2">{m.department_name || '—'}</td>
          <td className="p-2">{m.is_active ? '启用' : '停用'}</td>
        </tr>)}</tbody>
      </table></div>
    </section>
  </div>;
};
export default OrganizationManagement;
