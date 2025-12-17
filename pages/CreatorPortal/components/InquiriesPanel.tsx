import React, { useEffect, useState } from 'react';
import { adminFetch } from '../../../utils/adminFetch';
import { Inquiry } from '../../../types';
import { Loader2, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

const InquiriesPanel: React.FC = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Inquiry; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });

  useEffect(() => {
    const fetchInquiries = async () => {
      setLoading(true);
      try {
        const json = await adminFetch<{ data: any[] }>('/admin/inquiries');
        const mapped: Inquiry[] = (json.data || []).map((row) => ({
          id: row.id,
          name: row.name,
          company: row.company || '',
          email: row.email,
          type: row.type as any,
          message: row.message,
          date: row.created_at ? row.created_at.split('T')[0] : '',
          status: row.status as any,
        }));
        setInquiries(mapped);
      } catch (err) {
        console.error("Failed to fetch inquiries", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInquiries();
  }, []);

  const handleSort = (key: keyof Inquiry) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedInquiries = [...inquiries].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ columnKey }: { columnKey: keyof Inquiry }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={14} className="ml-1 text-stone-300" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1 text-amber-700" /> : <ArrowDown size={14} className="ml-1 text-amber-700" />;
  };

  return (
    <div className="animate-fade-in bg-white border border-stone-200 shadow-sm">
      <div className="p-6 border-b border-stone-200">
        <h3 className="font-serif text-2xl text-stone-900">Inquiries</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-stone-600">
          <thead className="bg-stone-50 text-stone-500 uppercase text-xs tracking-wider">
            <tr>
              <th className="p-4 cursor-pointer hover:bg-stone-100" onClick={() => handleSort('date')}>
                <div className="flex items-center">Date <SortIcon columnKey="date" /></div>
              </th>
              <th className="p-4 cursor-pointer hover:bg-stone-100" onClick={() => handleSort('name')}>
                <div className="flex items-center">Name <SortIcon columnKey="name" /></div>
              </th>
              <th className="p-4">Company</th>
              <th className="p-4">Type</th>
              <th className="p-4">Message</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center"><Loader2 className="animate-spin inline mr-2"/> Loading...</td></tr>
            ) : sortedInquiries.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-stone-400">No inquiries found.</td></tr>
            ) : (
              sortedInquiries.map((inq) => (
                <tr key={inq.id} className="hover:bg-stone-50">
                  <td className="p-4 font-mono text-xs">{inq.date}</td>
                  <td className="p-4 font-bold text-stone-900">{inq.name}</td>
                  <td className="p-4">{inq.company}</td>
                  <td className="p-4"><span className="text-[10px] uppercase font-bold bg-stone-100 px-2 py-1 rounded text-stone-500">{inq.type}</span></td>
                  <td className="p-4 text-xs max-w-xs truncate" title={inq.message}>{inq.message}</td>
                  <td className="p-4">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${inq.status === 'New' ? 'bg-green-100 text-green-800' : 'bg-stone-100 text-stone-500'}`}>
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
  );
};

export default InquiriesPanel;