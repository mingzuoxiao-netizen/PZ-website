import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Inquiry } from '../types';
import { Loader2, LogOut, Download, Filter, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

const INQUIRY_API = 'https://pz-inquiry-api.mingzuoxiao29.workers.dev';

// Initial dummy data to populate the dashboard if empty
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

type SortConfig = {
  key: keyof Inquiry;
  direction: 'asc' | 'desc';
} | null;

const AdminDashboard: React.FC = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter & Sort State
  const [filterType, setFilterType] = useState<string>('All');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'desc' });

  useEffect(() => {
    const fetchInquiries = async () => {
      setLoading(true);

      try {
        // 1. 先从 Cloudflare Worker + D1 拉真实数据
        const res = await fetch(`${INQUIRY_API}?limit=200`);
        if (!res.ok) {
          throw new Error('Failed to fetch from API');
        }

        const json = await res.json();
        const rows = (json.data || []) as any[];

        // 2. 把 D1 字段映射到 Inquiry 类型
        const mapped: Inquiry[] = rows.map((row) => ({
          id: row.id,
          name: row.name,
          company: row.company,
          email: row.email,
          // 用 product_type / source 作为 type 的来源，没有就给个 General
          type: row.product_type || row.source || 'General',
          message: row.message,
          // 只取 yyyy-mm-dd
          date: (row.created_at || '').split('T')[0] || '',
          // 目前 D1 里没有 status 字段，先统一标记为 New
          status: 'New',
        }));

        setInquiries(mapped);

        // 4. 顺手存在 localStorage，作为本地缓存 / fallback
        localStorage.setItem('pz_inquiries', JSON.stringify(mapped));
      } catch (error) {
        console.error('Error fetching from API, fallback to local data:', error);

        // 如果 API 挂了，就用 localStorage；再不行就用 DUMMY_DATA
        const localDataString = localStorage.getItem('pz_inquiries');
        let localData: Inquiry[] = [];

        if (localDataString) {
          localData = JSON.parse(localDataString);
        } else {
          localData = DUMMY_DATA;
          localStorage.setItem('pz_inquiries', JSON.stringify(DUMMY_DATA));
        }

        setInquiries(localData);
      } finally {
        setLoading(false);
      }
    };

    fetchInquiries();
  }, []);

  // Compute Processed Data (Filter + Sort)
  const processedInquiries = useMemo(() => {
    let data = [...inquiries];

    // 1. Filter
    if (filterType !== 'All') {
      data = data.filter(item => item.type === filterType);
    }

    // 2. Sort
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

  // Unique Types for Filter Dropdown
  const uniqueTypes = useMemo(() => {
    const types = new Set(inquiries.map(i => i.type));
    return ['All', ...Array.from(types)];
  }, [inquiries]);

  // Handlers
  const handleSort = (key: keyof Inquiry) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleLogout = () => {
    sessionStorage.removeItem('pz_admin_token');
    window.location.reload();
  };

  const downloadCSV = () => {
    const headers = ['ID', 'Date', 'Name', 'Company', 'Email', 'Type', 'Message', 'Status'];
    const rows = processedInquiries.map(inq => [
      inq.id,
      inq.date,
      `"${inq.name.replace(/"/g, '""')}"`, // Escape quotes
      `"${inq.company.replace(/"/g, '""')}"`,
      inq.email,
      inq.type,
      `"${inq.message.replace(/"/g, '""')}"`, // Escape quotes and newlines
      inq.status
    ]);
    
    // 1. Generate CSV String
    const csvString = headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    
    // 2. Add BOM (\uFEFF) so Excel recognizes it as UTF-8 (Fixes Chinese characters)
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvString], { type: 'text/csv;charset=utf-8;' });
    
    // 3. Create Download Link using Blob
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `pz_inquiries_export_${dateStr}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ columnKey }: { columnKey: keyof Inquiry }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown size={14} className="ml-1 text-stone-300" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={14} className="ml-1 text-amber-700" />
      : <ArrowDown size={14} className="ml-1 text-amber-700" />;
  };

  return (
    <div className="bg-stone-50 min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <h1 className="font-serif text-3xl text-stone-900">Admin Dashboard</h1>
          <div className="flex items-center space-x-6">
            <Link
                to="/"
                className="text-stone-500 text-sm hover:text-stone-900 font-bold uppercase tracking-widest"
            >
                View Site
            </Link>
            <button
                onClick={handleLogout}
                className="flex items-center text-red-700 hover:text-red-900 text-sm font-bold uppercase tracking-widest transition-colors"
            >
                Logout <LogOut size={16} className="ml-2" />
            </button>
          </div>
        </div>

        <div className="bg-white border border-stone-200 overflow-hidden rounded-sm shadow-lg">
          
          {/* Toolbar */}
          <div className="p-6 border-b border-stone-200 bg-stone-50 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2 w-full md:w-auto">
                <span className="text-stone-900 font-bold uppercase tracking-wider text-xs">
                    Inquiries ({processedInquiries.length})
                </span>
                {loading && <Loader2 size={16} className="animate-spin text-amber-700" />}
            </div>

            <div className="flex items-center space-x-4 w-full md:w-auto">
                {/* Filter Dropdown */}
                <div className="relative group flex items-center">
                    <Filter size={16} className="text-stone-500 absolute left-3 pointer-events-none" />
                    <select 
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="bg-white border border-stone-300 text-stone-700 text-sm rounded-sm py-2 pl-10 pr-8 focus:outline-none focus:border-amber-700 cursor-pointer appearance-none uppercase tracking-wide font-bold w-full md:w-auto"
                    >
                        {uniqueTypes.map(t => (
                            <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>
                        ))}
                    </select>
                </div>

                {/* CSV Export */}
                <button 
                    onClick={downloadCSV}
                    className="flex items-center bg-stone-900 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 hover:bg-amber-700 transition-colors rounded-sm whitespace-nowrap"
                >
                    Export CSV <Download size={14} className="ml-2" />
                </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-600">
              <thead className="bg-stone-100 text-stone-500 uppercase text-xs tracking-wider">
                <tr>
                  <th 
                    className="p-4 font-medium cursor-pointer hover:bg-stone-200 transition-colors select-none group"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center">Date <SortIcon columnKey="date" /></div>
                  </th>
                  <th 
                    className="p-4 font-medium cursor-pointer hover:bg-stone-200 transition-colors select-none"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">Name <SortIcon columnKey="name" /></div>
                  </th>
                  <th 
                    className="p-4 font-medium cursor-pointer hover:bg-stone-200 transition-colors select-none"
                    onClick={() => handleSort('company')}
                  >
                    <div className="flex items-center">Company <SortIcon columnKey="company" /></div>
                  </th>
                  <th 
                    className="p-4 font-medium cursor-pointer hover:bg-stone-200 transition-colors select-none"
                    onClick={() => handleSort('type')}
                  >
                     <div className="flex items-center">Type <SortIcon columnKey="type" /></div>
                  </th>
                  <th className="p-4 font-medium">Message</th>
                  <th 
                    className="p-4 font-medium cursor-pointer hover:bg-stone-200 transition-colors select-none"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">Status <SortIcon columnKey="status" /></div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loading && inquiries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-12 text-center text-stone-400"
                    >
                      Loading data...
                    </td>
                  </tr>
                ) : processedInquiries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-stone-500"
                    >
                      No inquiries match your filters.
                    </td>
                  </tr>
                ) : (
                  processedInquiries.map((inq) => (
                    <tr
                      key={inq.id}
                      className="hover:bg-stone-50 transition-colors"
                    >
                      <td className="p-4 whitespace-nowrap font-mono text-xs">{inq.date}</td>
                      <td className="p-4 text-stone-900 font-bold">
                        {inq.name}
                      </td>
                      <td className="p-4">{inq.company}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded text-[10px] uppercase border font-bold ${
                            inq.type === 'OEM/ODM'
                              ? 'border-amber-200 bg-amber-50 text-amber-800'
                              : inq.type === 'Trade Program'
                              ? 'border-blue-200 bg-blue-50 text-blue-800'
                              : inq.type === 'Catalog Request'
                              ? 'border-purple-200 bg-purple-50 text-purple-800'
                              : 'border-stone-200 bg-stone-100 text-stone-600'
                          }`}
                        >
                          {inq.type}
                        </span>
                      </td>
                      <td
                        className="p-4 max-w-xs truncate text-xs"
                        title={inq.message}
                      >
                        {inq.message}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            inq.status === 'New'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-stone-100 text-stone-500'
                          }`}
                        >
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
    </div>
  );
};

export default AdminDashboard;