
import React, { useState } from 'react';
import { Users, Shield, CheckCircle, XCircle, RefreshCw, Power } from 'lucide-react';

interface Account {
  id: string;
  name: string;
  username: string; // Added username field for login ref
  role: 'ADMIN' | 'FACTORY';
  status: 'Active' | 'Disabled';
  lastActive: string;
}

// Mock Data
const MOCK_ACCOUNTS: Account[] = [
  { 
    id: '1', 
    name: 'Master Admin', 
    username: 'admin',
    role: 'ADMIN', 
    status: 'Active', 
    lastActive: 'Just now',
  },
  { 
    id: '2', 
    name: 'Factory Supervisor', 
    username: 'factory',
    role: 'FACTORY', 
    status: 'Active', 
    lastActive: '2 hours ago',
  },
  { 
    id: '3', 
    name: 'External Audit', 
    username: 'audit_temp',
    role: 'FACTORY', 
    status: 'Disabled', 
    lastActive: '10 days ago',
  }
];

const AccountsManager: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>(MOCK_ACCOUNTS);

  const handleResetPassword = (id: string) => {
      if(confirm("Generate temporary password for this user?")) {
          alert("Temporary Password: PZ-TEMP-2025\nPlease share this securely.");
      }
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
      const newStatus = currentStatus === 'Active' ? 'Disabled' : 'Active';
      if(confirm(`Are you sure you want to ${newStatus === 'Disabled' ? 'DISABLE' : 'ACTIVATE'} this account?`)) {
          setAccounts(prev => prev.map(a => a.id === id ? {...a, status: newStatus} : a));
      }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="bg-white p-8 border border-stone-200 shadow-sm mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
            <h3 className="font-serif text-2xl text-stone-900 mb-2 flex items-center">
                <Users className="mr-3 text-amber-700" size={24} />
                Factory Accounts
            </h3>
            <p className="text-stone-500 text-sm max-w-xl leading-relaxed">
                Manage factory login credentials. For security, passwords cannot be viewed, only reset.
            </p>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white border border-stone-200 shadow-sm rounded-sm overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                    <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest">Identity</th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest">Role</th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest text-right">Security Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
                {accounts.map((account) => (
                    <tr key={account.id} className="hover:bg-stone-50 transition-colors group">
                        <td className="px-6 py-4">
                            <div>
                                <div className="font-bold text-stone-900 text-sm">{account.name}</div>
                                <div className="text-stone-400 text-xs font-mono">@{account.username}</div>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                ${account.role === 'ADMIN' ? 'bg-stone-800 text-white border-stone-600' : 
                                  'bg-blue-50 text-blue-700 border-blue-200'}
                            `}>
                                {account.role === 'ADMIN' && <Shield size={12} className="mr-1.5" />}
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
                        <td className="px-6 py-4 text-right">
                            <div className="flex justify-end space-x-3">
                                <button 
                                    onClick={() => handleResetPassword(account.id)}
                                    className="flex items-center text-stone-500 hover:text-amber-700 text-xs font-bold uppercase border border-stone-200 hover:border-amber-700 px-3 py-1.5 rounded-sm transition-colors"
                                    title="Reset Password"
                                >
                                    <RefreshCw size={12} className="mr-2" /> Reset PW
                                </button>
                                <button 
                                    onClick={() => handleToggleStatus(account.id, account.status)}
                                    className={`flex items-center text-xs font-bold uppercase border px-3 py-1.5 rounded-sm transition-colors
                                        ${account.status === 'Active' ? 'text-red-500 hover:text-red-700 border-red-100 hover:border-red-300' : 'text-green-600 hover:text-green-800 border-green-100'}
                                    `}
                                    title="Disable Account"
                                >
                                    <Power size={12} className="mr-2" /> {account.status === 'Active' ? 'Disable' : 'Enable'}
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default AccountsManager;
