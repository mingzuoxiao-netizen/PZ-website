import React, { useState, useEffect } from 'react';
import { Users, Shield, RefreshCw, UserPlus, X, Key, Loader2, Save, Factory, ShieldAlert } from 'lucide-react';
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
  
  // Form State from provided snippet
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
      console.error("Failed to load accounts", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  // Provided Logic Implementation
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await adminFetch<{ success: boolean; id: string }>(
        "admin/accounts", // Using the endpoint from your snippet
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
        alert("Account created.");
        fetchAccounts(); // Refresh the list
      } else {
        alert("Create failed.");
      }
    } catch (e: any) {
      setError(e?.message || "Create failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
      const isActive = currentStatus === 'Active';
      try {
          await adminFetch('admin/accounts/set-active', { 
              method: 'POST', 
              body: JSON.stringify({ user_id: id, is_active: !isActive ? 1 : 0 }) 
          });
          fetchAccounts();
      } catch (e: any) {
          alert(`Status update failed: ${e.message}`);
      }
  };

  return (
    <div className="animate-fade-in relative">
      <div className="bg-white p-8 border border-stone-200 shadow-sm mb-8 flex justify-between items-center">
        <div>
            <h3 className="font-serif text-2xl text-stone-900 flex items-center">
                <Users className="mr-3 text-safety-700" size={24} /> Registry Accounts
            </h3>
            <p className="text-stone-500 text-xs mt-1 uppercase tracking-widest font-mono">Control access for factory and administrative entities</p>
        </div>
        <button 
          onClick={() => { setIsCreating(true); setError(null); }} 
          className="bg-stone-900 text-white px-8 py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-safety-700 transition-colors shadow-lg flex items-center gap-2"
        >
            <UserPlus size={16} /> Create New Account
        </button>
      </div>

      {/* CREATE ACCOUNT MODAL */}
      {isCreating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/60 backdrop-blur-md p-4 animate-fade-in">
           <div className="bg-white w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden animate-fade-in-up">
              <div className="bg-stone-900 p-6 flex justify-between items-center">
                 <h4 className="text-white text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-3">
                    <UserPlus size={16} className="text-safety-700" /> New System User
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
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Login Identifier</label>
                    <input 
                       type="text" 
                       value={username} 
                       onChange={e => setUsername(e.target.value)}
                       placeholder="Username" 
                       className="w-full bg-stone-50 border border-stone-200 p-4 text-stone-900 text-sm focus:border-safety-700 outline-none transition-colors font-mono"
                    />
                 </div>

                 <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Temporary Password</label>
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
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">System Privilege</label>
                    <div className="grid grid-cols-2 gap-4">
                       <button 
                          type="button"
                          onClick={() => setRole('FACTORY')}
                          className={`flex items-center justify-center gap-2 p-4 border text-[10px] font-bold uppercase tracking-widest transition-all
                             ${role === 'FACTORY' ? 'bg-stone-900 border-stone-900 text-white shadow-md' : 'bg-white border-stone-200 text-stone-400 hover:border-stone-900'}
                          `}
                       >
                          <Factory size={14} /> Factory
                       </button>
                       <button 
                          type="button"
                          onClick={() => setRole('ADMIN')}
                          className={`flex items-center justify-center gap-2 p-4 border text-[10px] font-bold uppercase tracking-widest transition-all
                             ${role === 'ADMIN' ? 'bg-safety-700 border-safety-700 text-white shadow-md' : 'bg-white border-stone-200 text-stone-400 hover:border-safety-700'}
                          `}
                       >
                          <Shield size={14} /> Admin
                       </button>
                    </div>
                 </div>

                 <div className="pt-4 flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setIsCreating(false)} 
                      className="flex-1 py-4 text-[10px] font-bold uppercase tracking-widest border border-stone-200 text-stone-500 hover:bg-stone-50"
                    >
                       Discard
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSaving}
                      className="flex-[2] bg-stone-900 text-white py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-safety-700 transition-colors shadow-lg flex items-center justify-center gap-2"
                    >
                       {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Commit Account</>}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* ACCOUNTS LIST */}
      <div className="bg-white border border-stone-200 shadow-sm overflow-hidden rounded-sm">
        {loading && accounts.length === 0 ? (
            <div className="p-32 text-center text-stone-400 flex flex-col items-center">
                <RefreshCw className="animate-spin mb-4" size={32} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Synchronizing Accounts...</span>
            </div>
        ) : accounts.length === 0 ? (
            <div className="p-32 text-center text-stone-400 flex flex-col items-center">
                <Users className="mb-4 opacity-20" size={48} />
                <span className="text-[10px] font-bold uppercase tracking-widest">No subordinate accounts detected.</span>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-stone-100 border-b border-stone-200">
                        <tr className="text-[10px] font-bold text-stone-500 uppercase tracking-widest font-mono">
                            <th className="px-8 py-4">Identity</th>
                            <th className="px-8 py-4">Level</th>
                            <th className="px-8 py-4">Status</th>
                            <th className="px-8 py-4 text-right">System Control</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {accounts.map((account) => (
                            <tr key={account.id} className="hover:bg-stone-50 transition-colors group">
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-safety-50 group-hover:text-safety-700 transition-colors">
                                            {account.role === 'ADMIN' ? <Shield size={14}/> : <Factory size={14}/>}
                                        </div>
                                        <span className="text-sm font-bold text-stone-900">{account.username}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border
                                        ${account.role === 'ADMIN' ? 'border-safety-700/20 text-safety-700 bg-safety-50' : 'border-stone-200 text-stone-500 bg-stone-50'}
                                    `}>
                                        {account.role}
                                    </span>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${account.status === 'Active' ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-stone-300'}`}></div>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${account.status === 'Active' ? 'text-stone-900' : 'text-stone-400'}`}>
                                            {account.status}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <button 
                                        onClick={() => handleToggleStatus(account.id, account.status)} 
                                        className={`text-[9px] font-bold uppercase tracking-[0.2em] border px-4 py-2 transition-all rounded-sm
                                            ${account.status === 'Active' 
                                                ? 'border-stone-200 text-stone-400 hover:border-red-600 hover:text-red-600 hover:bg-red-50' 
                                                : 'border-safety-700 text-safety-700 hover:bg-safety-700 hover:text-white'}
                                        `}
                                    >
                                        {account.status === 'Active' ? 'Deactivate' : 'Restore'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  );
};

export default AccountsManager;