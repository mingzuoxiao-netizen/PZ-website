import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Inquiry } from '../types';

const AdminDashboard: React.FC = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('inquiries') || '[]');
    // Add some dummy data if empty for demonstration
    if (data.length === 0) {
        const dummy: Inquiry[] = [
            { id: '1', name: 'John Doe', company: 'Pottery Barn', email: 'j.doe@pb.com', type: 'OEM/ODM', message: 'Looking to source oak dining chairs.', date: '2023-10-25', status: 'Read' },
            { id: '2', name: 'Sarah Smith', company: 'West Elm', email: 's.smith@westelm.com', type: 'General', message: 'Send me a catalog please.', date: '2023-10-26', status: 'New' }
        ];
        setInquiries(dummy);
    } else {
        setInquiries(data);
    }
  }, []);

  return (
    <div className="bg-stone-50 min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex justify-between items-center mb-12">
           <h1 className="font-serif text-3xl text-stone-900">Admin Dashboard</h1>
           <Link to="/" className="text-stone-500 text-sm hover:text-stone-900">Back to Site</Link>
        </div>

        <div className="bg-white border border-stone-200 overflow-hidden rounded-sm shadow-lg">
            <div className="p-6 border-b border-stone-200 bg-stone-50">
                <h2 className="text-stone-900 font-bold uppercase tracking-wider text-xs">Recent Inquiries</h2>
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
                        {inquiries.map((inq) => (
                            <tr key={inq.id} className="hover:bg-stone-50 transition-colors">
                                <td className="p-4 whitespace-nowrap">{inq.date}</td>
                                <td className="p-4 text-stone-900 font-bold">{inq.name}</td>
                                <td className="p-4">{inq.company}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-[10px] uppercase border ${
                                        inq.type === 'OEM/ODM' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-stone-200 bg-stone-100 text-stone-600'
                                    }`}>
                                        {inq.type}
                                    </span>
                                </td>
                                <td className="p-4 max-w-xs truncate" title={inq.message}>{inq.message}</td>
                                <td className="p-4">
                                     <span className={`w-2 h-2 rounded-full inline-block mr-2 ${inq.status === 'New' ? 'bg-green-500' : 'bg-stone-400'}`}></span>
                                     {inq.status}
                                </td>
                            </tr>
                        ))}
                        {inquiries.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-stone-500">No inquiries yet.</td>
                            </tr>
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