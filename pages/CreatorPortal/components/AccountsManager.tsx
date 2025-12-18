
import React, { useState, useEffect } from 'react';
import { Users, Shield, CheckCircle, XCircle, RefreshCw, Power, UserPlus, X, Key, Loader2, Save } from 'lucide-react';
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
  const [newUser, setNewUser] = useState({ username: '', password: '' });

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      // ✅ Normalized: "admin/accounts"
      const res = await adminFetch<{ accounts: Account[] }>('admin/accounts?role=FACTORY');
      setAccounts(res.accounts || []);
    } catch (e) {
      console.error("Failed to load accounts", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
      const isActive = currentStatus === 'Active';
      try {
          // ✅ Normalized: "admin/accounts/set-active"
          await adminFetch('admin/accounts/set-active', { 
              method: 'POST', 
              body: JSON.stringify({ user_id: id, is_active: !isActive ? 1 : 0 }) 
          });
          fetchAccounts();
      } catch (e: any) {
          alert(`Action failed: ${e.message}`);
      }
  };

  return (
    <div className="animate-fade-in">
      <div className="bg-white p-8 border border-stone-200 shadow-sm mb-8 flex justify-between items-center">
        <div>
            <h3 className="font-serif text-2xl text-stone-900 flex items-center">
                <Users className="mr-3 text-amber-700" size={24} /> Accounts
            </h3>
        </div>
        <button onClick={() => setIsCreating(true)} className="bg-stone-900 text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-amber-700">
            Create Factory Account
        </button>
      </div>

      <div className="bg-white border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
            <div className="p-12 text-center text-stone-400">Loading Accounts...</div>
        ) : (
            <table className="w-full text-left">
                <thead className="bg-stone-50 border-b border-stone-200">
                    <tr className="text-xs font-bold text-stone-500 uppercase">
                        <th className="px-6 py-4">Username</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                    {accounts.map((account) => (
                        <tr key={account.id} className="hover:bg-stone-50 transition-colors">
                            <td className="px-6 py-4 text-sm font-bold">{account.username}</td>
                            <td className="px-6 py-4"><span className="text-[10px] uppercase font-bold border px-2 py-0.5 rounded-full">{account.role}</span></td>
                            <td className="px-6 py-4">
                                <span className={`text-xs font-bold uppercase ${account.status === 'Active' ? 'text-green-600' : 'text-stone-400'}`}>
                                    {account.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button onClick={() => handleToggleStatus(account.id, account.status)} className="text-[10px] font-bold uppercase border px-2 py-1">
                                    {account.status === 'Active' ? 'Disable' : 'Enable'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )}
      </div>
    </div>
  );
};

export default AccountsManager;
