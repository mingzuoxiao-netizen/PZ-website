import React, { useState, useEffect } from 'react';
import { 
  Users, Shield, RefreshCw, UserPlus, X, Key, Loader2, 
  Save, Factory, ShieldAlert, CheckCircle, Power, Lock
} from 'lucide-react';
import { adminFetch } from '../../../utils/adminFetch';

interface Account {
  id: string;
  username: string;
  role: 'ADMIN' | 'FACTORY';
  status: 'Active' | 'Disabled';
  last_login?: string;
}

const AccountsManager: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // 密码重置状态
  const [resettingUser, setResettingUser] = useState<Account | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // 创建表单状态
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<'ADMIN' | 'FACTORY'>('FACTORY');
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await adminFetch<{ accounts: Account[] }>('admin/accounts');
      setAccounts(res.accounts || []);
    } catch (e) {
      console.error("同步注册表失败", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("用户名和密码不能为空。");
      return;
    }

    setIsSaving(true);
    try {
      const res = await adminFetch<{ success: boolean; id: string }>(
        "admin/accounts", 
        {
          method: "POST",
          body: JSON.stringify({
            username: username.trim(),
            password,
            role,
          }),
        }
      );

      if (res?.success) {
        setUsername("");
        setPassword("");
        setRole("FACTORY");
        setIsCreating(false);
        alert("系统身份已成功分配。");
        fetchAccounts();
      } else {
        setError("服务器拒绝创建请求。");
      }
    } catch (e: any) {
      setError(e?.message || "创建过程中发生传输错误。");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
      const isActive = currentStatus === 'Active';
      const actionText = isActive ? "禁用" : "启用";
      if (!confirm(`确定要${actionText}该账号吗？`)) return;

      try {
          await adminFetch('admin/accounts/set-active', { 
              method: 'POST', 
              body: JSON.stringify({ user_id: id, is_active: !isActive ? 1 : 0 }) 
          });
          fetchAccounts();
      } catch (e: any) {
          alert(`控制信号执行失败: ${e.message}`);
      }
  };

  const handleCommitPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser || !newPassword.trim()) return;

    setIsUpdatingPassword(true);
    try {
      await adminFetch(`admin/accounts/${resettingUser.id}/password`, {
        method: "POST",
        body: JSON.stringify({ password: newPassword }),
      });
      alert(`[${resettingUser.username}] 的安全密钥已更新。`);
      setResettingUser(null);
      setNewPassword("");
    } catch (e: any) {
      alert(`重置协议失败: ${e.message}`);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="animate-fade-in relative min-h-[600px]">
      <div className="bg-white p-8 border border-stone-200 shadow-sm mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
            <h3 className="font-serif text-2xl text-stone-900 flex items-center">
                <Users className="mr-3 text-safety-700" size={24} /> 系统身份注册表
            </h3>
            <p className="text-stone-500 text-xs mt-1 uppercase tracking-widest font-mono">
                当前已注册 {accounts.length} 个系统账号
            </p>
        </div>
        <button 
          onClick={() => { setIsCreating(true); setError(null); }} 
          className="bg-stone-900 text-white px-8 py-4 text-[13px] font-bold tracking-widest hover:bg-safety-700 transition-all shadow-lg flex items-center gap-2 group"
        >
            <UserPlus size={16} className="group-hover:rotate-12 transition-transform" /> 创建新账号
        </button>
      </div>

      {/* 创建账号弹窗 */}
      {isCreating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/60 backdrop-blur-md p-4 animate-fade-in">
           <div className="bg-white w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden animate-fade-in-up">
              <div className="bg-stone-900 p-6 flex justify-between items-center">
                 <h4 className="text-white text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-3">
                    <Shield size={16} className="text-safety-700" /> 新增系统身份
                 </h4>
                 <button onClick={() => setIsCreating(false)} className="text-stone-500 hover:text-white transition-colors">
                    <X size={20} />
                 </button>
              </div>

              <form onSubmit={handleCreateAccount} className="p-8 space-y-6">
                 {error && (
                    <div className="bg-red-50 border border-red-100 p-3 flex items-center gap-3 text-red-600 text-xs font-bold">
                       <ShieldAlert size={14} /> {error}
                    </div>
                 )}

                 <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">登录用户名</label>
                    <input 
                       type="text" 
                       value={username} 
                       onChange={e => setUsername(e.target.value)}
                       placeholder="例如：factory_shanghai" 
                       className="w-full bg-stone-50 border border-stone-200 p-4 text-stone-900 text-sm focus:border-safety-700 outline-none transition-colors font-mono"
                       autoComplete="off"
                    />
                 </div>

                 <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">临时访问密码</label>
                    <div className="relative">
                       <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={16} />
                       <input 
                          type="password" 
                          value={password} 
                          onChange={e => setPassword(e.target.value)}
                          placeholder="••••••••" 
                          className="w-full bg-stone-50 border border-stone-200 pl-12 pr-4 py-4 text-stone-900 text-sm focus:border-safety-700 outline-none transition-colors font-mono"
                       />
                    </div>
                 </div>

                 <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">权限等级</label>
                    <div className="grid grid-cols-2 gap-4">
                       <button 
                          type="button"
                          onClick={() => setRole('FACTORY')}
                          className={`flex items-center justify-center gap-2 p-4 border text-xs font-bold transition-all
                             ${role === 'FACTORY' ? 'bg-stone-900 border-stone-900 text-white shadow-md' : 'bg-white border-stone-200 text-stone-400 hover:border-stone-900'}
                          `}
                       >
                          <Factory size={14} /> 工厂账号
                       </button>
                       <button 
                          type="button"
                          onClick={() => setRole('ADMIN')}
                          className={`flex items-center justify-center gap-2 p-4 border text-xs font-bold transition-all
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
                      className="flex-1 py-4 text-xs font-bold border border-stone-200 text-stone-500 hover:bg-stone-50 transition-colors"
                    >
                       放弃
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSaving}
                      className="flex-[2] bg-stone-900 text-white py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-safety-700 transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                       {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> 提交注册</>}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* 密码重置弹窗 */}
      {resettingUser && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-stone-950/70 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white w-full max-w-sm shadow-2xl border border-stone-200 overflow-hidden animate-fade-in-up">
                  <div className="bg-amber-700 p-6 flex justify-between items-center text-white">
                      <div className="flex items-center gap-3">
                          <Lock size={18} />
                          <h4 className="text-xs font-bold uppercase tracking-[0.2em]">重置安全密钥</h4>
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
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">新访问密码</label>
                        <input 
                            type="password" 
                            required
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="输入新密码..."
                            className="w-full bg-stone-50 border border-stone-200 p-4 text-stone-900 text-sm focus:border-amber-700 outline-none transition-colors font-mono"
                            autoFocus
                        />
                      </div>
                      <div className="pt-2">
                        <button 
                            type="submit" 
                            disabled={isUpdatingPassword}
                            className="w-full bg-amber-700 text-white py-4 text-xs font-bold tracking-[0.2em] hover:bg-amber-800 transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                            {isUpdatingPassword ? <RefreshCw className="animate-spin" size={16}/> : <Save size={16} />}
                            确认更新
                        </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* 注册表列表 */}
      <div className="bg-white border border-stone-200 shadow-sm overflow-hidden rounded-sm">
        {loading && accounts.length === 0 ? (
            <div className="p-32 text-center text-stone-400 flex flex-col items-center">
                <RefreshCw className="animate-spin mb-4" size={32} />
                <span className="text-xs font-bold font-mono">同步身份数据中...</span>
            </div>
        ) : accounts.length === 0 ? (
            <div className="p-32 text-center text-stone-400 flex flex-col items-center border-2 border-dashed border-stone-100 m-6">
                <Users className="mb-4 opacity-20" size={48} />
                <span className="text-xs font-bold">暂无子级账号记录。</span>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-stone-50 border-b border-stone-200">
                        <tr className="text-[11px] font-bold text-stone-400 uppercase tracking-widest font-mono">
                            <th className="px-8 py-4">身份概况</th>
                            <th className="px-8 py-4">授权等级</th>
                            <th className="px-8 py-4">系统状态</th>
                            <th className="px-8 py-4 text-right">管理操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {accounts.map((account) => (
                            <tr key={account.id} className="hover:bg-stone-50/50 transition-colors group">
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded flex items-center justify-center transition-colors
                                            ${account.role === 'ADMIN' ? 'bg-safety-50 text-safety-700' : 'bg-stone-100 text-stone-400 group-hover:bg-stone-200'}
                                        `}>
                                            {account.role === 'ADMIN' ? <Shield size={18}/> : <Factory size={18}/>}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-stone-900">{account.username}</div>
                                            <div className="text-[9px] text-stone-400 font-mono mt-0.5 uppercase">识别码: {account.id.slice(0,8)}...</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border inline-block
                                        ${account.role === 'ADMIN' ? 'border-safety-700/20 text-safety-700 bg-safety-50' : 'border-stone-200 text-stone-500 bg-stone-50'}
                                    `}>
                                        {account.role === 'ADMIN' ? '核心管理' : '工厂协作'}
                                    </span>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${account.status === 'Active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-stone-300'}`}></div>
                                        <span className={`text-xs font-bold ${account.status === 'Active' ? 'text-stone-900' : 'text-stone-400'}`}>
                                            {account.status === 'Active' ? '可用' : '已停用'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => handleToggleStatus(account.id, account.status)} 
                                            title={account.status === 'Active' ? '收回权限' : '恢复访问'}
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
                                            title="重置访问密码"
                                        >
                                            <RefreshCw size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>

      <div className="mt-8 flex items-center justify-center gap-6 py-8 border-t border-stone-200 opacity-30 grayscale hover:opacity-60 transition-opacity">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-500 font-mono">
              <Shield size={12} /> 加密注册表
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-500 font-mono">
              <CheckCircle size={12} /> 身份已验证
          </div>
      </div>
    </div>
  );
};

export default AccountsManager;