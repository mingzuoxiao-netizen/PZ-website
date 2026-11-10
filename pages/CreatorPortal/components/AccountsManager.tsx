import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Shield, RefreshCw, UserPlus, X, Key, Loader2,
  Save, Factory, ShieldAlert, CheckCircle, Power, Lock, Pencil, Trash2
} from 'lucide-react';
import { adminFetch } from '../../../utils/adminFetch';

type UiRole = 'ADMIN' | 'FACTORY';
type UiStatus = 'Active' | 'Disabled';

interface Account {
  id: string;
  username: string;
  role: UiRole;
  status: UiStatus;
  last_login?: string;
  job_type?: Job | null; department_name?: string | null;
  department_id?: string | null; supervisor_id?: string | null;
}
type Job = 'supervisor' | 'secretary' | 'staff' | 'data_entry';
const labels: Record<Job,string> = {supervisor:'部门主管',secretary:'秘书',staff:'业务人员',data_entry:'资料录入员'};
const labelOf=(a:Account)=>a.role==='ADMIN'?'管理员':a.job_type?labels[a.job_type]:'待分配工厂账号';
const rankOf=(a:Account)=>a.role==='ADMIN'?0:a.job_type==='supervisor'?1:a.job_type?2:3;
const groupOf=(a:Account)=>labelOf(a)+(a.department_name?' · '+a.department_name:'');
const PAGE_SIZE=15;

type ApiUserRow = {
  id: string;
  username: string;
  role: string;
  is_active: number;
  created_at?: string;
  last_login?: string;
  job_type?: string | null; department_name?: string | null;
  department_id?: string | null; supervisor_id?: string | null;
};

function mapApiUserToAccount(u: ApiUserRow): Account {
  const role: UiRole = String(u.role).toLowerCase() === 'admin' ? 'ADMIN' : 'FACTORY';
  const status: UiStatus = u.is_active ? 'Active' : 'Disabled';
  return {
    id: u.id,
    username: u.username,
    role,
    status,
    last_login: u.last_login ?? undefined,
    job_type:u.job_type && u.job_type in labels ? u.job_type as Job : null,
    department_name:u.department_name??null,department_id:u.department_id??null,
    supervisor_id:u.supervisor_id??null,
  };
}

const AccountsManager: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError,setLoadError]=useState('');
  const [search,setSearch]=useState('');
  const [roleFilter,setRoleFilter]=useState('all');
  const [departmentFilter,setDepartmentFilter]=useState('all');
  const [statusFilter,setStatusFilter]=useState('all');
  const [page,setPage]=useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [resettingUser, setResettingUser] = useState<Account | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [accountAction, setAccountAction] = useState<{ type: 'rename' | 'delete'; account: Account } | null>(null);
  const [actionName, setActionName] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UiRole>('FACTORY');
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);setLoadError('');
    try {
      const res = await adminFetch<{ users: ApiUserRow[] }>('/admin/accounts');
      const mapped = (res.users ?? []).map(mapApiUserToAccount);
      setAccounts(mapped);
    } catch (e: any) {
      setLoadError(e?.message || '账号读取失败，请刷新重试。');
      console.error("Failed to fetch accounts", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);
  const departments=Array.from(new Map(accounts
    .filter(a=>a.department_id && a.department_name)
    .map(a=>[a.department_id!,a.department_name!] as [string,string])).entries())
    .sort((a,b)=>a[1].localeCompare(b[1],'zh-CN'));
  const filtered=accounts.filter(a=>{
    const q=search.trim().toLocaleLowerCase();
    if(q && ![a.username,a.id,a.department_name||'',labelOf(a)].some(x=>x.toLocaleLowerCase().includes(q)))return false;
    if(roleFilter==='admin' && a.role!=='ADMIN')return false;
    if(roleFilter==='supervisor' && a.job_type!=='supervisor')return false;
    if(roleFilter==='staff' && (a.role==='ADMIN'||!a.job_type||a.job_type==='supervisor'))return false;
    if(roleFilter==='unassigned' && (a.role==='ADMIN'||a.job_type))return false;
    if(departmentFilter==='unassigned' && (a.role==='ADMIN'||a.department_id))return false;
    if(departmentFilter!=='all'&&departmentFilter!=='unassigned'&&a.department_id!==departmentFilter)return false;
    if(statusFilter!=='all'&&a.status!==statusFilter)return false;
    return true;
  }).sort((a,b)=>rankOf(a)-rankOf(b)||(a.department_name||'').localeCompare(b.department_name||'','zh-CN')||
    (a.job_type||'').localeCompare(b.job_type||'')||a.username.localeCompare(b.username,'zh-CN'));
  const pages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));
  const currentPage=Math.min(page,pages);
  const visible=filtered.slice((currentPage-1)*PAGE_SIZE,currentPage*PAGE_SIZE);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const u = username.trim();
    const p = password;
    if (!u || !p) {
      setError("请输入账号和密码。");
      return;
    }
    if (p.length < 12 || new TextEncoder().encode(p).length > 72 || p.toLowerCase().includes(u.toLowerCase())) {
      setError("密码至少 12 个字符、最多 72 字节，且不能包含账号名称。");
      return;
    }

    setIsSaving(true);
    try {
      const res = await adminFetch<{ success: boolean; id: string }>(
        "/admin/accounts",
        {
          method: "POST",
          body: JSON.stringify({ username: u, password: p, role }),
        }
      );

      if (res?.success) {
        setUsername("");
        setPassword("");
        setRole("FACTORY");
        setIsCreating(false);
        alert("账号创建成功。");
        await fetchAccounts();
      } else {
        setError("Kernel rejected the provision request.");
      }
    } catch (e: any) {
      setError(e?.message || "Communication fault during provisioning.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: UiStatus) => {
    const isActive = currentStatus === 'Active';
    const action = isActive ? "disable" : "restore";
    if (!confirm(`确认执行账号操作 ${action} 吗？`)) return;

    try {
      await adminFetch(`/admin/accounts/${id}`, {
        method: "PUT",
        body: JSON.stringify({ is_active: !isActive }),
      });
      await fetchAccounts();
    } catch (e: any) {
      alert(`操作失败：${e.message}`);
    }
  };

  const handleCommitPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;

    const pwd = newPassword;
    if (pwd.length < 12 || new TextEncoder().encode(pwd).length > 72 ||
        (resettingUser.username.length >= 3 && pwd.toLowerCase().includes(resettingUser.username.toLowerCase()))) {
      alert("新密码至少 12 个字符、最多 72 字节，且不能包含账号名称。");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await adminFetch(`/admin/accounts/${resettingUser.id}/password`, {
        method: "POST",
        body: JSON.stringify({ password: pwd }),
      });

      alert(`账号 ${resettingUser.username} 的密码已重置。`);
      setResettingUser(null);
      setNewPassword("");
      await fetchAccounts();
    } catch (e: any) {
      alert(`密码重置失败：${e.message}`);
    } finally {
      setIsUpdatingPassword(false);
    }
  };


  const openAccountAction = (type: 'rename' | 'delete', account: Account) => {
    setAccountAction({ type, account });
    setActionName(type === 'rename' ? account.username : '');
    setActionError('');
  };

  const handleAccountAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountAction || actionBusy) return;
    const { type, account } = accountAction;
    const name = actionName.trim();
    if (type === 'delete' && actionName !== account.username) {
      setActionError('请输入完整账号名称以确认删除。'); return;
    }
    if (type === 'rename' && (!name || name.length > 80 || /[\s\u0000-\u001f\u007f]/u.test(name))) {
      setActionError('账号名称须为 1–80 个字符，不能包含空格或控制字符。'); return;
    }
    setActionBusy(true);
    setActionError('');
    try {
      const result = await adminFetch<{ success: boolean }>(
        `/admin/accounts/${encodeURIComponent(account.id)}`,
        type === 'delete' ? { method: 'DELETE' } :
          { method: 'PUT', body: JSON.stringify({ username: name }) }
      );
      if (result?.success !== true) throw new Error('服务器未确认操作成功，请刷新列表核实。');
      setAccountAction(null);
      await fetchAccounts();
    } catch (e: any) {
      setActionError(e?.message || '操作失败，请稍后重试。');
    } finally { setActionBusy(false); }
  };

  return (
    <div className="animate-fade-in relative min-h-[600px]">
      <div className="bg-white p-8 border border-stone-200 shadow-sm mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h3 className="font-serif text-2xl text-stone-900 flex items-center">
            <Users className="mr-3 text-safety-700" size={24} /> 账号权限管理
          </h3>
          <p className="text-stone-500 text-xs mt-1 uppercase tracking-widest font-mono">
            当前共 {accounts.length} 个账号
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchAccounts}
            className="border border-stone-200 text-stone-600 px-5 py-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:border-stone-900 hover:text-stone-900 transition-all shadow-sm flex items-center gap-2"
          >
            <RefreshCw size={16} /> 刷新账号列表
          </button>

          <button
            onClick={() => { setIsCreating(true); setError(null); }}
            className="bg-stone-900 text-white px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-safety-700 transition-all shadow-lg flex items-center gap-2 group"
          >
            <UserPlus size={16} className="group-hover:rotate-12 transition-transform" /> 创建账号
          </button>
        </div>
      </div>


      {accountAction && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-stone-950/60 p-4">
          <form onSubmit={handleAccountAction} role="dialog" aria-modal="true" aria-labelledby="account-action-title"
            className="bg-white w-full max-w-md p-6 shadow-2xl space-y-5">
            <h4 id="account-action-title" className="text-xl font-bold text-stone-900">
              {accountAction.type === 'rename' ? '修改账号名称' : '删除账号'}
            </h4>
            <p className="text-sm text-stone-600">目标账号：{accountAction.account.username}</p>
            <p className="text-sm text-stone-600">
              {accountAction.type === 'rename'
                ? '修改后请使用新账号名称登录，密码、账号编号和产品归属保持不变。'
                : '账号删除后不能再次登录；若有历史业务记录，系统会安全注销并保留审计历史。'}
            </p>
            <label className="block text-sm text-stone-700">
              {accountAction.type === 'rename' ? '新账号名称' : '输入完整账号名称以确认删除'}
              <input autoFocus required maxLength={accountAction.type === 'rename' ? 80 : undefined}
                value={actionName} disabled={actionBusy} onChange={e => setActionName(e.target.value)}
                autoComplete="off" className="mt-2 w-full border border-stone-300 p-3" />
            </label>
            {actionError && <p role="alert" className="text-sm text-red-700">{actionError}</p>}
            <div className="flex justify-end gap-3">
              <button type="button" disabled={actionBusy} onClick={() => setAccountAction(null)}
                className="border border-stone-300 px-4 py-2 disabled:opacity-50">取消</button>
              <button type="submit" disabled={actionBusy || (accountAction.type === 'delete' && actionName !== accountAction.account.username)}
                className={`px-4 py-2 text-white disabled:opacity-50 ${accountAction.type === 'delete' ? 'bg-red-700' : 'bg-stone-900'}`}>
                {actionBusy ? '正在处理…' : accountAction.type === 'rename' ? '保存名称' : '确认删除'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Provision Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/60 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden animate-fade-in-up">
            <div className="bg-stone-900 p-6 flex justify-between items-center">
              <h4 className="text-white text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-3">
                <Shield size={16} className="text-safety-700" /> 创建登录账号
              </h4>
              <button onClick={() => setIsCreating(false)} className="text-stone-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="p-8 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-100 p-3 flex items-center gap-3 text-red-600 text-[10px] font-bold uppercase tracking-widest">
                  <ShieldAlert size={14} /> {error}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">登录账号</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="例如：factory_kandal"
                  className="w-full bg-stone-50 border border-stone-200 p-4 text-stone-900 text-sm focus:border-safety-700 outline-none transition-colors font-mono"
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">初始登录密码</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={16} />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="至少 12 个字符"
                    minLength={12}
                    className="w-full bg-stone-50 border border-stone-200 pl-12 pr-4 py-4 text-stone-900 text-sm focus:border-safety-700 outline-none transition-colors font-mono"
                  />
                </div>
                <p className="mt-2 text-xs text-stone-500">建议使用密码管理器生成独立长密码；不得包含账号名称。密码重置后旧登录会话将失效。</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">账号权限</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRole('FACTORY')}
                    className={`flex items-center justify-center gap-2 p-4 border text-[10px] font-bold uppercase tracking-widest transition-all
                      ${role === 'FACTORY' ? 'bg-stone-900 border-stone-900 text-white shadow-md' : 'bg-white border-stone-200 text-stone-400 hover:border-stone-900'}
                    `}
                  >
                    <Factory size={14} /> 工厂账号
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('ADMIN')}
                    className={`flex items-center justify-center gap-2 p-4 border text-[10px] font-bold uppercase tracking-widest transition-all
                      ${role === 'ADMIN' ? 'bg-safety-700 border-safety-700 text-white shadow-md' : 'bg-white border-stone-200 text-stone-400 hover:border-safety-700'}
                    `}
                  >
                    <Shield size={14} /> 管理员
                  </button>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-4 text-[10px] font-bold border border-stone-200 text-stone-500 hover:bg-stone-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-[2] bg-stone-900 text-white py-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-safety-700 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> 创建账号</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rotation Modal */}
      {resettingUser && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-stone-950/70 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm shadow-2xl border border-stone-200 overflow-hidden animate-fade-in-up">
            <div className="bg-amber-700 p-6 flex justify-between items-center text-white">
              <div className="flex items-center gap-3">
                <Lock size={18} />
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em]">重置登录密码</h4>
              </div>
              <button onClick={() => setResettingUser(null)} className="opacity-60 hover:opacity-100 transition-opacity">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCommitPasswordReset} className="p-8 space-y-6">
              <div className="text-center pb-2">
                <p className="text-[10px] font-bold uppercase text-stone-400 mb-1">目标账号</p>
                <p className="text-lg font-serif text-stone-900">{resettingUser.username}</p>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">新密码</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="输入至少 12 个字符的新密码…"
                  minLength={12}
                  className="w-full bg-stone-50 border border-stone-200 p-4 text-stone-900 text-sm focus:border-amber-700 outline-none transition-colors font-mono"
                  autoFocus
                />
                <p className="mt-2 text-xs text-stone-500">密码至少 12 个字符且不包含账号名；重置后该账号所有旧令牌失效。</p>
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="w-full bg-amber-700 text-white py-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-amber-800 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {isUpdatingPassword ? <RefreshCw className="animate-spin" size={16} /> : <><Save size={16} /> 确认重置密码</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 lg:grid-cols-4 gap-3" aria-label="账号分类统计">
        {[
          ['管理员',accounts.filter(a=>a.role==='ADMIN').length],
          ['部门主管',accounts.filter(a=>a.job_type==='supervisor').length],
          ['部门员工',accounts.filter(a=>a.role!=='ADMIN'&&a.job_type&&a.job_type!=='supervisor').length],
          ['待分配',accounts.filter(a=>a.role!=='ADMIN'&&!a.job_type).length],
        ].map(([name,count])=><div key={name} className="rounded border border-stone-200 bg-white p-4">
          <div className="text-xs text-stone-500">{name}</div>
          <div className="mt-1 text-xl font-semibold text-stone-900">{count}</div>
        </div>)}
      </div>
      <div className="mb-5 grid gap-3 rounded border border-stone-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-4">
        <input aria-label="搜索账号" type="search" value={search}
          onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="搜索账号、编号或部门"
          className="rounded border border-stone-300 px-3 py-2 text-sm" />
        <select aria-label="按岗位筛选" value={roleFilter}
          onChange={e=>{setRoleFilter(e.target.value);setPage(1);}} className="rounded border border-stone-300 px-3 py-2 text-sm">
          <option value="all">全部岗位</option><option value="admin">管理员</option>
          <option value="supervisor">部门主管</option><option value="staff">部门员工</option>
          <option value="unassigned">待分配</option>
        </select>
        <select aria-label="按部门筛选" value={departmentFilter}
          onChange={e=>{setDepartmentFilter(e.target.value);setPage(1);}} className="rounded border border-stone-300 px-3 py-2 text-sm">
          <option value="all">全部部门</option><option value="unassigned">待分配</option>
          {departments.map(([id,name])=><option key={id} value={id}>{name}</option>)}
        </select>
        <select aria-label="按状态筛选" value={statusFilter}
          onChange={e=>{setStatusFilter(e.target.value);setPage(1);}} className="rounded border border-stone-300 px-3 py-2 text-sm">
          <option value="all">全部状态</option><option value="Active">已启用</option>
          <option value="Disabled">已停用</option>
        </select>
      </div>
      {loadError && <p role="alert" className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm">{loadError}</p>}
      {/* Identity Matrix */}
      <div className="bg-white border border-stone-200 shadow-sm overflow-hidden rounded-sm">
        {loading && accounts.length === 0 ? (
          <div className="p-32 text-center text-stone-400 flex flex-col items-center">
            <RefreshCw className="animate-spin mb-4" size={32} />
            <span className="text-[10px] font-bold font-mono tracking-widest">正在加载账号…</span>
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-32 text-center text-stone-400 flex flex-col items-center border-2 border-dashed border-stone-100 m-6">
            <Users className="mb-4 opacity-20" size={48} />
            <span className="text-[10px] font-bold uppercase tracking-widest">暂无账号记录。</span>
          </div>
        ) : filtered.length===0 ? (
          <div className="p-16 text-center text-sm text-stone-500">没有符合条件的账号，请调整筛选条件。</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr className="text-[10px] font-bold text-stone-400 uppercase tracking-widest font-mono">
                  <th className="px-8 py-4">账号信息</th>
                  <th className="px-8 py-4">岗位</th>
                  <th className="px-8 py-4">所属部门</th>
                  <th className="px-8 py-4">状态</th>
                  <th className="px-8 py-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {visible.map((account,index) => (
                  <React.Fragment key={account.id}>
                  {(index===0 || groupOf(account)!==groupOf(visible[index-1])) &&
                    <tr className="bg-stone-100"><td colSpan={5} className="px-8 py-2 text-xs font-semibold text-stone-700">{groupOf(account)}</td></tr>}
                  <tr key={account.id} className="hover:bg-stone-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded flex items-center justify-center transition-colors
                          ${account.role === 'ADMIN' ? 'bg-safety-50 text-safety-700' : 'bg-stone-100 text-stone-400 group-hover:bg-stone-200'}
                        `}>
                          {account.role === 'ADMIN' ? <Shield size={18} /> : <Factory size={18} />}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-stone-900">{account.username}</div>
                          <div className="text-[9px] text-stone-400 font-mono mt-0.5 uppercase">账号编号：{account.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-8 py-5">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border inline-block
                        ${account.role === 'ADMIN' ? 'border-safety-700/20 text-safety-700 bg-safety-50' : 'border-stone-200 text-stone-500 bg-stone-50'}
                      `}>
                        {labelOf(account)}
                      </span>
                    </td>

                    <td className="px-8 py-5 text-xs text-stone-600">{account.department_name||(account.role==='ADMIN'?'全站':'待分配')}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${account.status === 'Active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-stone-300'}`}></div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${account.status === 'Active' ? 'text-stone-900' : 'text-stone-400'}`}>
                          {account.status === 'Active' ? '已启用' : '已停用'}
                        </span>
                      </div>
                    </td>

                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2 flex-wrap">
                        <button onClick={() => openAccountAction('rename', account)}
                          aria-label={`修改账号名称 ${account.username}`} title="修改账号名称"
                          className="p-2 border border-stone-200 text-stone-600 hover:border-stone-900 rounded">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => openAccountAction('delete', account)}
                          aria-label={`删除账号 ${account.username}`} title="删除账号"
                          className="p-2 border border-red-200 text-red-700 hover:bg-red-50 rounded">
                          <Trash2 size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(account.id, account.status)}
                          title={account.status === 'Active' ? '停用账号' : '恢复账号'}
                          className={`p-2 transition-all rounded border
                            ${account.status === 'Active'
                              ? 'border-stone-200 text-stone-400 hover:border-red-600 hover:text-red-600 hover:bg-red-50'
                              : 'border-safety-700 text-safety-700 hover:bg-safety-700 hover:text-white'}
                          `}
                        >
                          <Power size={14} />
                        </button>

                        <button
                          onClick={() => setResettingUser(account)}
                          className="p-2 border border-stone-200 text-stone-400 hover:border-stone-900 hover:text-stone-900 hover:bg-white rounded transition-all"
                          title="重置密码"
                        >
                          <RefreshCw size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between items-center gap-3 border-t border-stone-200 p-4 text-xs text-stone-600">
              <span>共 {filtered.length} 个匹配账号 · 第 {currentPage}/{pages} 页</span>
              <div className="flex gap-2">
                <button disabled={currentPage<=1} onClick={()=>setPage(currentPage-1)} className="border px-3 py-2 rounded disabled:opacity-40">上一页</button>
                <button disabled={currentPage>=pages} onClick={()=>setPage(currentPage+1)} className="border px-3 py-2 rounded disabled:opacity-40">下一页</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center justify-center gap-6 py-8 border-t border-stone-200 opacity-30 grayscale hover:opacity-60 transition-opacity">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-500 font-mono">
          <Shield size={12} /> 账号信息受保护
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-500 font-mono">
          <CheckCircle size={12} /> 权限管理
        </div>
      </div>
    </div>
  );
};

export default AccountsManager;