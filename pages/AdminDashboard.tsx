
import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Inquiry } from '../types';
import {
  Loader2,
  LogOut,
  Download,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  PenTool,
  Eye,
} from 'lucide-react';
import { adminFetch, ADMIN_SESSION_KEY } from '../utils/adminFetch';
import { useLanguage } from '../contexts/LanguageContext';

type SortConfig =
  | {
      key: keyof Inquiry;
      direction: 'asc' | 'desc';
    }
  | null;

const AdminDashboard: React.FC = () => {
  const { t } = useLanguage();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'date',
    direction: 'desc',
  });

  useEffect(() => {
    const fetchInquiries = async () => {
      setLoading(true);
      try {
        const json = await adminFetch<{
          data: any[];
        }>('admin/inquiries');

        const mapped: Inquiry[] = (json.data || []).map((row) => ({
          id: row.id,
          name: row.name,
          company: row.company || '',
          email: row.email,
          type: row.type as Inquiry['type'],
          message: row.message,
          date: row.created_at ? row.created_at.split('T')[0] : '',
          status: row.status as Inquiry['status'],
        }));

        setInquiries(mapped);
      } catch (err) {
        console.warn('Failed to fetch inquiries', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInquiries();
  }, []);

  const processedInquiries = useMemo(() => {
    let data = [...inquiries];
    if (sortConfig) {
      data.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [inquiries, sortConfig]);

  const handleSort = (key: keyof Inquiry) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const handleLogout = () => {
    setLoggingOut(true);
    sessionStorage.clear();
    window.location.href = '#/';
    window.location.reload();
  };

  const SortIcon = ({ columnKey }: { columnKey: keyof Inquiry }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown size={14} className="ml-1 text-stone-300" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1 text-amber-700" /> : <ArrowDown size={14} className="ml-1 text-amber-700" />;
  };

  return (
    <div className="bg-stone-50 min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <h1 className="font-serif text-3xl text-stone-900">{t.admin.dashboard}</h1>
          <div className="flex items-center space-x-4">
            <Link to="/admin-pzf-2025/preview" className="bg-white border border-stone-200 text-stone-900 text-sm font-bold uppercase tracking-widest px-6 py-3 hover:bg-stone-50 rounded-sm flex items-center shadow-sm">
                <Eye size={16} className="mr-2" /> Preview Site
            </Link>
            <Link to="/creator" className="bg-amber-700 text-white text-sm font-bold uppercase tracking-widest px-6 py-3 hover:bg-amber-800 rounded-sm flex items-center shadow-lg">
              <PenTool size={16} className="mr-2" /> {t.admin.openCreator}
            </Link>
            <button onClick={handleLogout} className="flex items-center text-red-700 hover:text-red-900 text-sm font-bold uppercase tracking-widest ml-4">
              {loggingOut ? <Loader2 size={16} className="mr-2 animate-spin" /> : <LogOut size={16} className="mr-2" />}
              {t.admin.logout}
            </button>
          </div>
        </div>

        <div className="bg-white border border-stone-200 overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-600">
              <thead className="bg-stone-100 text-stone-500 uppercase text-xs tracking-wider">
                <tr>
                  <th className="p-4 cursor-pointer" onClick={() => handleSort('date')}>
                    <div className="flex items-center">Date <SortIcon columnKey="date" /></div>
                  </th>
                  <th className="p-4 cursor-pointer" onClick={() => handleSort('name')}>
                    <div className="flex items-center">Name <SortIcon columnKey="name" /></div>
                  </th>
                  <th className="p-4">Company</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loading ? (
                  <tr><td colSpan={5} className="p-12 text-center text-stone-400">Loading...</td></tr>
                ) : inquiries.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-stone-500">No data found.</td></tr>
                ) : (
                  processedInquiries.map((inq) => (
                    <tr key={inq.id} className="hover:bg-stone-50">
                      <td className="p-4 font-mono text-xs">{inq.date}</td>
                      <td className="p-4 text-stone-900 font-bold">{inq.name}</td>
                      <td className="p-4">{inq.company}</td>
                      <td className="p-4"><span className="px-2 py-1 bg-stone-100 rounded text-[10px] uppercase">{inq.type}</span></td>
                      <td className="p-4"><span className="text-[10px] font-bold uppercase">{inq.status}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
