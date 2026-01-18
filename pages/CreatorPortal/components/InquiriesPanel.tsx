import React, { useEffect, useState } from 'react';
import { adminFetch } from '../../../utils/adminFetch';
import { Inquiry } from '../../../types';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';

const InquiriesPanel: React.FC = () => {
  const { language } = useLanguage();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInquiries = async () => {
      setLoading(true);
      try {
        const json = await adminFetch<{ data: any[] }>('admin/inquiries');
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

  const labels = {
    title: language === 'zh' ? '客户咨询' : 'Inquiries',
    date: language === 'zh' ? '日期' : 'Date',
    name: language === 'zh' ? '姓名' : 'Name',
    company: language === 'zh' ? '公司' : 'Company',
    message: language === 'zh' ? '留言内容' : 'Message',
    loading: language === 'zh' ? '加载中...' : 'Loading...',
    empty: language === 'zh' ? '暂无咨询记录。' : 'No inquiries found.'
  };

  return (
    <div className="animate-fade-in bg-white border border-stone-200 shadow-sm">
      <div className="p-6 border-b border-stone-200">
        <h3 className="font-serif text-2xl text-stone-900">{labels.title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-stone-600">
          <thead className="bg-stone-50 text-stone-500 uppercase text-xs tracking-wider">
            <tr>
              <th className="p-4">{labels.date}</th>
              <th className="p-4">{labels.name}</th>
              <th className="p-4">{labels.company}</th>
              <th className="p-4">{labels.message}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {loading ? (
              <tr><td colSpan={4} className="p-8 text-center"><Loader2 className="animate-spin inline mr-2"/> {labels.loading}</td></tr>
            ) : inquiries.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-stone-400">{labels.empty}</td></tr>
            ) : (
              inquiries.map((inq) => (
                <tr key={inq.id} className="hover:bg-stone-50">
                  <td className="p-4 font-mono text-xs">{inq.date}</td>
                  <td className="p-4 font-bold text-stone-900">{inq.name}</td>
                  <td className="p-4">{inq.company}</td>
                  <td className="p-4 text-xs max-w-xs truncate">{inq.message}</td>
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