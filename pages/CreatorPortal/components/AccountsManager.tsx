
import React, { useState, useEffect } from 'react';
import { Users, Shield, CheckCircle, XCircle, RefreshCw, Power, UserPlus, X, Key, Loader2, Save } from 'lucide-react';
import { adminFetch } from '../../../utils/adminFetch';

interface Account {
  id: string;
  name?: string;
  username: string;
  role: 'ADMIN' | 'FACTORY';
  status: 'Active' | 'Disabled';
  last_login?: string;
  created_at?: string;
}

const AccountsManager: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Modal State
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '' });

  // Load Accounts
  const fetchAccounts = async () => {
    setLoading(true);
    try {
      // Updated to correct endpoint for listing factory accounts
      const res = await adminFetch<{ accounts: Account[] }>('/admin/accounts?role=FACTORY');
      if (res.accounts) {
          setAccounts(res.accounts);
      } else {
          setAccounts([]);
      }
    } catch (e) {
      console.error("Failed to load accounts", e);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newUser.username || !newUser.password) return;

      setIsSubmitting(true);
      try {
          // Updated to correct creation endpoint
          await adminFetch('/admin/accounts/create', {
              method: 'POST',
              body: JSON.stringify({
                  username: newUser.username,
                  password: newUser.password,
                  role: 'FACTORY'
                  // org_id omitted as it is handled by backend context/token if required
              })
          });
          
          alert("Factory Account Created Successfully");
          setIsCreating(false);
          setNewUser({ username: '', password: '' });
          fetchAccounts(); // Refresh list
      } catch (e: any) {
          alert(`Creation failed: ${e.message}`);
      } finally {
          setIsSubmitting(false);
      }
  };

  const generatePassword = () => {
      const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$";
      let pass = "";
      for(let i=0; i<12; i++) {
          pass += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setNewUser(prev => ({ ...prev, password: pass }));
  };

  const handleResetPassword = async (id: string) => {
      if(!confirm("Reset password for this user? This will generate a temporary password.")) return;
      
      try {
          // Updated to correct reset password endpoint
          const res = await adminFetch<{ temp_password?: string }>('/admin/accounts/reset-password', {
              method: 'POST',
              body: JSON.stringify({ account_id: id })
          });
          
          const tempPass = res.temp_password || "PZ-TEMP-2025";
          alert(`Password Reset Successful.\nTemporary Password: ${tempPass}\nPlease share this securely.`);
      } catch (e: any) {
          alert(`Reset failed: ${e.message}`);
      }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
      const isActive = currentStatus === 'Active';
      const actionLabel = isActive ? 'DISABLE' : 'ACTIVATE';
      
      if(!confirm(`Are you sure you want to ${actionLabel} this account?`)) return;

      try {
          // Optimistic update
          const newStatus = isActive ? 'Disabled' : 'Active';
          setAccounts(prev => prev.map(a => a.id === id ? {...a, status: newStatus} : a));

          // Updated to correct set-active endpoint
          await adminFetch('/admin/accounts/set-active', { 
              method: 'POST', 
              body: JSON.stringify({ 
                  account_id: id, 
                  active: !isActive 
              }) 
          });
      } catch (e: any) {
          fetchAccounts(); // Revert on error
          alert(`Action failed: ${e.message}`);
      }
  };

  return (
    <div className="animate-fade-in relative">
      
      {/* --- CREATE MODAL --- */}
      {isCreating && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
              <div className="bg-white w-full max-w-md shadow-2xl border border-stone-200">
                  <div className="flex justify-between items-center p-6 border-b border-stone-100 bg-stone-50">
                      <h3 className="font-serif text-xl text-stone-900">Create Factory Account</h3>
                      <button onClick={() => setIsCreating(false)} className="text-stone-400 hover:text-stone-900 transition-colors">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <form onSubmit={handleCreate} className="p-8 space-y-6">
                      
                      {/* Role (Fixed) */}
                      <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">
                              Account Role
                          </label>
                          <div className="w-full bg-stone-100 border border-stone-200 px-4 py-3 text-sm font-bold text-stone-500 flex items-center">
                              <Shield size={14} className="mr-2 text-stone-400" /> FACTORY
                          </div>
                      </div>

                      {/* Username */}
                      <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2">
                              Username / ID
                          </label>
                          <input 
                              type="text" 
                              required
                              value={newUser.username}
                              onChange={e => setNewUser(prev => ({...prev, username: e.target.value}))}
                              placeholder="e.g. factory_01"
                              className="w-full bg-white border border-stone-300 px-4 py-3 text-stone-900 focus:border-amber-700 outline-none text-sm font-medium"
                          />
                      </div>

                      {/* Password */}
                      <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2">
                              Initial Password
                          </label>
                          <div className="flex gap-2">
                              <input 
                                  type="text" 
                                  required
                                  value={newUser.password}
                                  onChange={e => setNewUser(prev => ({...prev, password: e.target.value}))}
                                  placeholder="Enter password..."
                                  className="w-full bg-white border border-stone-300 px-4 py-3 text-stone-900 focus:border-amber-700 outline-none text-sm font-mono"
                              />
                              <button 
                                  type="button"
                                  onClick={generatePassword}
                                  className="bg-stone-100 border border-stone-300 text-stone-600 hover:bg-stone-200 px-4 py-2"
                                  title="Auto Generate"
                              >
                                  <Key size={16} />
                              </button>
                          </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-4 flex gap-4">
                          <button 
                              type="button" 
                              onClick={() => setIsCreating(false)}
                              className="flex-1 border border-stone-200 text-stone-500 font-bold uppercase tracking-widest text-xs py-3 hover:bg-stone-50 transition-colors"
                          >
                              Cancel
                          </button>
                          <button 
                              type="submit" 
                              disabled={isSubmitting}
                              className="flex-1 bg-stone-900 text-white font-bold uppercase tracking-widest text-xs py-3 hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                          >
                              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Create Account'}
                          </button>
                      </div>

                  </form>
              </div>
          </div>
      )}

      {/* --- HEADER --- */}
      <div className="bg-white p-8 border border-stone-200 shadow-sm mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
            <h3 className="font-serif text-2xl text-stone-900 mb-2 flex items-center">
                <Users className="mr-3 text-amber-700" size={24} />
                Accounts
            </h3>
            <p className="text-stone-500 text-sm max-w-xl leading-relaxed">
                Manage system access. Factory accounts are restricted to Inventory Management only.
            </p>
        </div>
        
        <button 
            onClick={() => setIsCreating(true)}
            className="bg-stone-900 text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-amber-700 transition-colors flex items-center shadow-lg"
        >
            <UserPlus size={16} className="mr-2" /> Create Factory Account
        </button>
      </div>

      {/* --- ACCOUNTS LIST --- */}
      <div className="bg-white border border-stone-200 shadow-sm rounded-sm overflow-hidden min-h-[300px]">
        {loading ? (
            <div className="flex items-center justify-center h-48 text-stone-400">
                <Loader2 className="animate-spin mr-2" /> Loading Accounts...
            </div>
        ) : (
            <table className="w-full text-left">
                <thead className="bg-stone-50 border-b border-stone-200">
                    <tr>
                        <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest">Username</th>
                        <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest">Role</th>
                        <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest">Last Active</th>
                        <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                    {accounts.length === 0 ? (
                        <tr><td colSpan={5} className="p-8 text-center text-stone-400 text-sm">No accounts found.</td></tr>
                    ) : (
                        accounts.map((account) => (
                            <tr key={account.id} className="hover:bg-stone-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-stone-900 text-sm">{account.username}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border
                                        ${account.role === 'ADMIN' ? 'bg-stone-800 text-white border-stone-600' : 
                                        'bg-blue-50 text-blue-700 border-blue-200'}
                                    `}>
                                        {account.role === 'ADMIN' && <Shield size={10} className="mr-1.5" />}
                                        {account.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`flex items-center text-xs font-bold uppercase tracking-wide
                                        ${account.status === 'Active' ? 'text-green-600' : 'text-stone-400'}
                                    `}>
                                        {account.status === 'Active' ? <CheckCircle size={14} className="mr-1.5" /> : <XCircle size={14} className="mr-1.5" />}
                                        {account.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-xs font-mono text-stone-400">
                                    {account.last_login ? new Date(account.last_login).toLocaleDateString() : '-'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => handleResetPassword(account.id)}
                                            className="flex items-center text-stone-500 hover:text-amber-700 text-[10px] font-bold uppercase border border-stone-200 hover:border-amber-700 px-2 py-1 rounded-sm transition-colors"
                                            title="Reset Password"
                                        >
                                            <RefreshCw size={10} className="mr-1" /> Reset PW
                                        </button>
                                        <button 
                                            onClick={() => handleToggleStatus(account.id, account.status)}
                                            className={`flex items-center text-[10px] font-bold uppercase border px-2 py-1 rounded-sm transition-colors
                                                ${account.status === 'Active' ? 'text-red-500 hover:text-red-700 border-red-100 hover:border-red-300' : 'text-green-600 hover:text-green-800 border-green-100'}
                                            `}
                                            title={account.status === 'Active' ? 'Disable' : 'Enable'}
                                        >
                                            <Power size={10} className="mr-1" /> {account.status === 'Active' ? 'Disable' : 'Enable'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        )}
      </div>
    </div>
  );
};

export default AccountsManager;
