import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Inquiry } from '../types';
import { Loader2 } from 'lucide-react';

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

const AdminDashboard: React.FC = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

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

        // 3. 按日期倒序
        mapped.sort((a, b) => b.date.localeCompare(a.date));

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

        localData.sort((a, b) => b.date.localeCompare(a.date));
        setInquiries(localData);
      } finally {
        setLoading(false);
      }
    };

    fetchInquiries();
  }, []);

  return (
    <div className="bg-stone-50 min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex justify-between items-center mb-12">
          <h1 className="font-serif text-3xl text-stone-900">Admin Dashboard</h1>
          <Link
            to="/"
            className="text-stone-500 text-sm hover:text-stone-900"
          >
            Back to Site
          </Link>
        </div>

        <div className="bg-white border border-stone-200 overflow-hidden rounded-sm shadow-lg">
          <div className="p-6 border-b border-stone-200 bg-stone-50 flex justify-between items-center">
            <h2 className="text-stone-900 font-bold uppercase tracking-wider text-xs">
              Recent Inquiries
            </h2>
            {loading && (
              <Loader2 size={16} className="animate-spin text-amber-700" />
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-600">
              <thead className="bg-stone-100 text-stone-500 uppercase text-xs tracking-wider">
                <tr>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Company</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Message</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-12 text-center text-stone-400"
                    >
                      Loading data...
                    </td>
                  </tr>
                ) : inquiries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-stone-500"
                    >
                      No inquiries yet.
                    </td>
                  </tr>
                ) : (
                  inquiries.map((inq) => (
                    <tr
                      key={inq.id}
                      className="hover:bg-stone-50 transition-colors"
                    >
                      <td className="p-4 whitespace-nowrap">{inq.date}</td>
                      <td className="p-4 text-stone-900 font-bold">
                        {inq.name}
                      </td>
                      <td className="p-4">{inq.company}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded text-[10px] uppercase border ${
                            inq.type === 'OEM/ODM'
                              ? 'border-amber-200 bg-amber-50 text-amber-800'
                              : 'border-stone-200 bg-stone-100 text-stone-600'
                          }`}
                        >
                          {inq.type}
                        </span>
                      </td>
                      <td
                        className="p-4 max-w-xs truncate"
                        title={inq.message}
                      >
                        {inq.message}
                      </td>
                      <td className="p-4">
                        <span
                          className={`w-2 h-2 rounded-full inline-block mr-2 ${
                            inq.status === 'New'
                              ? 'bg-green-500'
                              : 'bg-stone-400'
                          }`}
                        ></span>
                        {inq.status}
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
