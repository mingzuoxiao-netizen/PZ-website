import React, { useState, useEffect } from 'react';
import { 
  Users, Shield, RefreshCw, UserPlus, X, Key, Loader2, 
  Save, Factory, ShieldAlert, CheckCircle, Power, MoreVertical 
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
  
  // Form State (Integrated from your logic)
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<'ADMIN' | 'FACTORY'>('FACTORY');
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      // The API returns an object with an accounts array
      const res = await adminFetch<{ accounts: Account[] }>('admin/accounts');
      setAccounts(res.accounts || []);
    } catch (e) {
      console.error("Registry sync failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  // Primary Creation Logic (Using your provided pattern)
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Baseline validation
    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      return;
    }

    setIsSaving(true);
    try {
      // Endpoint mapped to the backend logic provided
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
        alert("System identity provisioned successfully.");
        fetchAccounts(); // Refresh the registry list
      } else {
        setError("Creation rejected by server protocol.");
      }
    } catch (e: any) {
      setError(e?.message || "Transmission fault during creation.");
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
          alert(`Control signal failed: ${e.message}`);
      }
  };

  return (
    <div className="animate-fade-in relative min-h-[600px]">
      {/* Header with Stats */}
      <div className="bg-white p-8 border border-stone-200 shadow-sm mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
            <h3 className="font-serif text-2xl text-stone-900 flex items-center">
                <Users className="mr-3 text-safety-700" size={24} /> System Identity Registry
            </h3>
            <p className="text-stone-500 text-xs mt-1 uppercase tracking-widest font-mono">
                {accounts.length} Total Registered Identities
            </p>
        </div>
        <button 
          onClick={() => { setIsCreating(true); setError(null); }} 
          className="bg-stone-900 text-white px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-safety-700 transition-all shadow-lg flex items-center gap-2 group"
        >
            <UserPlus size={16} className="group-hover:rotate-12 transition-transform" /> Provision New User
        </button>
      </div>

      {/* PROVISIONING MODAL */}
      {isCreating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/60 backdrop-blur-md p-4 animate-fade-in">
           <div className="bg-white w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden animate-fade-in-up">
              <div className="bg-stone-900 p-6 flex justify-between items-center">
                 <h4 className="text-white text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-3">
                    <Shield size={16} className="text-safety-700" /> New System Identity
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
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Registry Username</label>
                    <input 
                       type="text" 
                       value={username} 
                       onChange={e => setUsername(e.target.value)}
                       placeholder="e.g. factory_zhaoqing" 
                       className="w-full bg-stone-50 border border-stone-200 p-4 text-stone-900 text-sm focus:border-safety-700 outline-none transition-colors font-mono"
                       autoComplete="off"
                    />
                 </div>

                 <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Temporary Access Key</label>
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
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Privilege Tier</label>
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
                      className="flex-1 py-4 text-[10px] font-bold uppercase tracking-widest border border-stone-200 text-stone-500 hover:bg-stone-50 transition-colors"
                    >
                       Discard
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSaving}
                      className="flex-[2] bg-stone-900 text-white py-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-safety-700 transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                       {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Commit to Registry</>}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* MASTER REGISTRY LIST */}
      <div className="bg-white border border-stone-200 shadow-sm overflow-hidden rounded-sm">
        {loading && accounts.length === 0 ? (
            <div className="p-32 text-center text-stone-400 flex flex-col items-center">
                <RefreshCw className="animate-spin mb-4" size={32} />
                <span className="text-[10px] font-bold uppercase tracking-widest font-mono">Synchronizing Identities...</span>
            </div>
        ) : accounts.length === 0 ? (
            <div className="p-32 text-center text-stone-400 flex flex-col items-center border-2 border-dashed border-stone-100 m-6">
                <Users className="mb-4 opacity-20" size={48} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Registry is currently void.</span>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-stone-50 border-b border-stone-200">
                        <tr className="text-[10px] font-bold text-stone-400 uppercase tracking-widest font-mono">
                            <th className="px-8 py-4">Identity Profile</th>
                            <th className="px-8 py-4">Authorization</th>
                            <th className="px-8 py-4">System Status</th>
                            <th className="px-8 py-4 text-right">Registry Operations</th>
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
                                            <div className="text-[9px] text-stone-400 font-mono mt-0.5 uppercase">ID: {account.id.slice(0,8)}...</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border inline-block
                                        ${account.role === 'ADMIN' ? 'border-safety-700/20 text-safety-700 bg-safety-50' : 'border-stone-200 text-stone-500 bg-stone-50'}
                                    `}>
                                        {account.role} Tier
                                    </span>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${account.status === 'Active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-stone-300'}`}></div>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${account.status === 'Active' ? 'text-stone-900' : 'text-stone-400'}`}>
                                            {account.status}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => handleToggleStatus(account.id, account.status)} 
                                            title={account.status === 'Active' ? 'Revoke Access' : 'Restore Access'}
                                            className={`p-2 transition-all rounded border
                                                ${account.status === 'Active' 
                                                    ? 'border-stone-200 text-stone-400 hover:border-red-600 hover:text-red-600 hover:bg-red-50' 
                                                    : 'border-safety-700 text-safety-700 hover:bg-safety-700 hover:text-white'}
                                            `}
                                        >
                                            <Power size={14} />
                                        </button>
                                        <button 
                                            onClick={() => alert("Password reset protocol initiated. (Simulation)")}
                                            className="p-2 border border-stone-200 text-stone-400 hover:border-stone-900 hover:text-stone-900 hover:bg-white rounded transition-all"
                                            title="Reset Security Key"
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

      {/* SECURITY FOOTER */}
      <div className="mt-8 flex items-center justify-center gap-6 py-8 border-t border-stone-200 opacity-30 grayscale hover:opacity-60 transition-opacity">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-500 font-mono">
              <Shield size={12} /> Encrypted Registry
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-500 font-mono">
              <CheckCircle size={12} /> Auth Validated
          </div>
      </div>
    </div>
  );
};

export default AccountsManager;