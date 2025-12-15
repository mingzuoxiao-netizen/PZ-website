
import React, { useState } from 'react';
import { Users, Shield, CheckCircle, XCircle, MoreHorizontal, Plus, Search } from 'lucide-react';

interface Account {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Editor' | 'Viewer';
  status: 'Active' | 'Inactive';
  lastActive: string;
  avatarColor: string;
}

// Mock Data
const MOCK_ACCOUNTS: Account[] = [
  { 
    id: '1', 
    name: 'Master Admin', 
    email: 'admin@pz.com', 
    role: 'Admin', 
    status: 'Active', 
    lastActive: 'Just now',
    avatarColor: 'bg-stone-800'
  },
  { 
    id: '2', 
    name: 'Content Team', 
    email: 'editor@pz.com', 
    role: 'Editor', 
    status: 'Active', 
    lastActive: '2 hours ago',
    avatarColor: 'bg-amber-700'
  },
  { 
    id: '3', 
    name: 'Audit Viewer', 
    email: 'audit@pz.com', 
    role: 'Viewer', 
    status: 'Inactive', 
    lastActive: '5 days ago',
    avatarColor: 'bg-stone-400'
  }
];

const AccountsManager: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>(MOCK_ACCOUNTS);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAccounts = accounts.filter(acc => 
    acc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    acc.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="bg-white p-8 border border-stone-200 shadow-sm mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
            <h3 className="font-serif text-2xl text-stone-900 mb-2 flex items-center">
                <Users className="mr-3 text-amber-700" size={24} />
                Accounts & Roles
            </h3>
            <p className="text-stone-500 text-sm max-w-xl leading-relaxed">
                Manage access permissions for the Creator Portal. Admins have full access, while Editors can manage inventory but not site configuration.
            </p>
        </div>
        
        <button className="bg-stone-900 text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-amber-700 transition-colors shadow-md flex items-center whitespace-nowrap">
            <Plus size={16} className="mr-2" /> Add User
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center mb-6">
         <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-amber-700 transition-colors">
                <Search size={16} />
            </div>
            <input 
                type="text" 
                placeholder="Search users..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-stone-200 text-sm focus:outline-none focus:border-amber-700 w-64 shadow-sm"
            />
         </div>
         <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">
            {filteredAccounts.length} Users Found
         </span>
      </div>

      {/* Accounts Table */}
      <div className="bg-white border border-stone-200 shadow-sm rounded-sm overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                    <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest">User</th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest">Role</th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest">Last Active</th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
                {filteredAccounts.map((account) => (
                    <tr key={account.id} className="hover:bg-stone-50 transition-colors group">
                        <td className="px-6 py-4">
                            <div className="flex items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-serif font-bold ${account.avatarColor} mr-4`}>
                                    {account.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold text-stone-900 text-sm">{account.name}</div>
                                    <div className="text-stone-400 text-xs">{account.email}</div>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                ${account.role === 'Admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                                  account.role === 'Editor' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                                  'bg-stone-100 text-stone-600 border-stone-200'}
                            `}>
                                {account.role === 'Admin' && <Shield size={12} className="mr-1.5" />}
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
                        <td className="px-6 py-4">
                            <span className="text-stone-500 text-sm font-mono">{account.lastActive}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                            <button className="text-stone-400 hover:text-stone-900 p-2 rounded-full hover:bg-stone-100 transition-colors">
                                <MoreHorizontal size={18} />
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        
        {filteredAccounts.length === 0 && (
            <div className="p-12 text-center text-stone-400">
                <p>No accounts found matching your search.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default AccountsManager;
