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
} from 'lucide-react';
import { adminFetch, ADMIN_SESSION_KEY } from '../utils/adminFetch';
import { useLanguage } from '../contexts/LanguageContext';

/* =========================
   Dummy Data (Fallback)
========================= */
const DUMMY_DATA: Inquiry[] = [
  {
    id: '1',
    name: 'Sarah Jenkins',
    company: 'West Elm',
    email: 'sarah.j@westelm.com',
    type: 'OEM/ODM',
    message:
      'We are looking for a new manufacturer for our 2025 bedroom collection. Interested in your walnut capabilities.',
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    status: 'Replied',
  },
  {
    id: '2',
    name: 'Michael Chen',
    company: 'Gensler',
    email: 'm_chen@gensler.com',
    type: 'Trade Program',
    message:
      'Specifying furniture for a boutique hotel in Austin, TX. Need quote for 150 guest room desks.',
    date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
    status: 'Read',
  },
  {
    id: '3',
    name: 'Emma Thompson',
    company: 'Design Studio 42',
    email: 'emma@ds42.com',
    type: 'General',
    message:
      'Do you offer FSC certified white oak? Looking for sustainable options.',
    date: new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0],
    status: 'New',
  },
];

type SortConfig =
  | {
      key: keyof Inquiry;
      direction: 'asc' | 'desc';
    }
  | null;

const STORAGE_KEY = 'pz_inquiries';

const AdminDashboard: React.FC = () => {
  const { t } = useLanguage();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  /* =========================
     Filter & Sort State
  ========================= */
  const [filterType, setFilterType] = useState<string>('All');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'date',
    direction: 'desc',
  });

  /* =========================
     Fetch Inquiries (NO API)
     - Contract-safe
     - Deterministic
  ========================= */
useEffect(() => {
  const fetchInquiries = async () => {
    setLoading(true);

    try {
      const json = await adminFetch<{
        data: {
          id: string;
          name: string;
          company: string | null;
          email: string;
          type: string;
          message: string;
          status: string;
          created_at: string;
        }[];
      }>('/admin/inquiries');

      const mapped: Inquiry[] = (json.data || []).map((row) => ({
        id: row.id,
        name: row.name,
        company: row.company || '',
        email: row.email,
        type: row.type as Inquiry['type'],
        message: row.message,
        date: row.created_at.split('T')[0],
        status: row.status as Inquiry['status'],
      }));

      setInquiries(mapped);
      localStorage.setItem('pz_inquiries', JSON.stringify(mapped));
    } catch (err) {
      console.warn('Failed to fetch inquiries, fallback to local data', err);

      const stored = localStorage.getItem('pz_inquiries');
      if (stored) {
        setInquiries(JSON.parse(stored));
      }
    } finally {
      setLoading(false);
    }
  };

  fetchInquiries();
}, []);

  /* =========================
     Derived Data
  ========================= */
  const processedInquiries = useMemo(() => {
    let data = [...inquiries];

    if (filterType !== 'All') {
      data = data.filter((item) => item.type === filterType);
    }

    if (sortConfig) {
      data.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return data;
  }, [inquiries, filterType, sortConfig]);

  const uniqueTypes = useMemo(() => {
    const types = new Set(inquiries.map((i) => i.type));
    return ['All', ...Array.from(types)];
  }, [inquiries]);

  /* =========================
     Handlers
  ========================= */
  const handleSort = (key: keyof Inquiry) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      await adminFetch('/admin/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Server logout failed, fallback to local cleanup', e);
    }

    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    window.location.reload();
  };

  const downloadCSV = () => {
    const headers = ['ID', 'Date', 'Name', 'Company', 'Email', 'Type', 'Message', 'Status'];
    const rows = processedInquiries.map((inq) => [
      inq.id,
      inq.date,
      `"${inq.name.replace(/"/g, '""')}"`,
      `"${inq.company.replace(/"/g, '""')}"`,
      inq.email,
      inq.type,
      `"${inq.message.replace(/"/g, '""')}"`,
      inq.status,
    ]);

    const csvString = headers.join(',') + '\n' + rows.map((e) => e.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvString], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pz_inquiries_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ columnKey }: { columnKey: keyof Inquiry }) => {
    if (sortConfig?.key !== columnKey)
      return <ArrowUpDown size={14} className="ml-1 text-stone-300" />;
    return sortConfig.direction === 'asc' ? (
      <ArrowUp size={14} className="ml-1 text-amber-700" />
    ) : (
      <ArrowDown size={14} className="ml-1 text-amber-700" />
    );
  };

  /* =========================
     Render
  ========================= */
  return (
    <div className="bg-stone-50 min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <h1 className="font-serif text-3xl text-stone-900">{t.admin.dashboard}</h1>
          <div className="flex items-center space-x-6 flex-wrap gap-y-4">
            <Link
              to="/creator"
              className="bg-amber-700 text-white text-sm font-bold uppercase tracking-widest px-6 py-3 hover:bg-amber-800 transition-colors rounded-sm flex items-center shadow-lg"
            >
              <PenTool size={16} className="mr-2" /> {t.admin.openCreator}
            </Link>

            <Link
              to="/"
              className="text-stone-500 text-sm hover:text-stone-900 font-bold uppercase tracking-widest"
            >
              {t.admin.viewSite}
            </Link>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center text-red-700 hover:text-red-900 text-sm font-bold uppercase tracking-widest disabled:opacity-50"
            >
              {loggingOut ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  {t.admin.logout}...
                </>
              ) : (
                <>
                  {t.admin.logout}
                  <LogOut size={16} className="ml-2" />
                </>
              )}
            </button>
          </div>
        </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-600">
              <thead className="bg-stone-100 text-stone-500 uppercase text-xs tracking-wider">
                <tr>
                  <th className="p-4 font-medium cursor-pointer hover:bg-stone-200 transition-colors select-none group" onClick={() => handleSort('date')}>
                    <div className="flex items-center">{t.admin.cols.date} <SortIcon columnKey="date" /></div>
                  </th>
                  <th className="p-4 font-medium cursor-pointer hover:bg-stone-200 transition-colors select-none" onClick={() => handleSort('name')}>
                    <div className="flex items-center">{t.admin.cols.name} <SortIcon columnKey="name" /></div>
                  </th>
                  <th className="p-4 font-medium cursor-pointer hover:bg-stone-200 transition-colors select-none" onClick={() => handleSort('company')}>
                    <div className="flex items-center">{t.admin.cols.company} <SortIcon columnKey="company" /></div>
                  </th>
                  <th className="p-4 font-medium cursor-pointer hover:bg-stone-200 transition-colors select-none" onClick={() => handleSort('type')}>
                     <div className="flex items-center">{t.admin.cols.type} <SortIcon columnKey="type" /></div>
                  </th>
                  <th className="p-4 font-medium">{t.admin.cols.msg}</th>
                  <th className="p-4 font-medium cursor-pointer hover:bg-stone-200 transition-colors select-none" onClick={() => handleSort('status')}>
                    <div className="flex items-center">{t.admin.cols.status} <SortIcon columnKey="status" /></div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loading && inquiries.length === 0 ? (
                  <tr><td colSpan={6} className="p-12 text-center text-stone-400">{t.admin.loading}</td></tr>
                ) : processedInquiries.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-stone-500">{t.admin.noData}</td></tr>
                ) : (
                  processedInquiries.map((inq) => (
                    <tr key={inq.id} className="hover:bg-stone-50 transition-colors">
                      <td className="p-4 whitespace-nowrap font-mono text-xs">{inq.date}</td>
                      <td className="p-4 text-stone-900 font-bold">{inq.name}</td>
                      <td className="p-4">{inq.company}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[10px] uppercase border font-bold ${
                            inq.type === 'OEM/ODM' ? 'border-amber-200 bg-amber-50 text-amber-800' : 
                            inq.type === 'Trade Program' ? 'border-blue-200 bg-blue-50 text-blue-800' : 
                            inq.type === 'Catalog Request' ? 'border-purple-200 bg-purple-50 text-purple-800' : 
                            'border-stone-200 bg-stone-100 text-stone-600'
                          }`}>
                          {inq.type}
                        </span>
                      </td>
                      <td className="p-4 max-w-xs truncate text-xs" title={inq.message}>{inq.message}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            inq.status === 'New' ? 'bg-green-100 text-green-800' : 'bg-stone-100 text-stone-500'
                          }`}>
                            {inq.status === 'New' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>}
                            {inq.status}
                        </span>
                      </td>
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