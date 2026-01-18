import React from 'react';
import { Activity, Clock, Shield, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const AuditTimeline: React.FC = () => {
    // In a real app, this would fetch from an /admin/audit-logs endpoint.
    // Providing a static high-fidelity simulation.
    const logs = [
        { id: 1, type: 'APPROVE', user: 'Admin', target: 'PZ-9021 Dining Table', date: '2024-10-24 14:20', icon: <CheckCircle className="text-green-500"/> },
        { id: 2, type: 'LOGIN', user: 'Factory_Kandal', target: 'System Session', date: '2024-10-24 13:05', icon: <Clock className="text-stone-400"/> },
        { id: 3, type: 'PUBLISH', user: 'Admin', target: 'Site Configuration v2.1', date: '2024-10-24 11:45', icon: <Shield className="text-amber-500"/> },
        { id: 4, type: 'REJECT', user: 'Admin', target: 'PZ-8801 Side Chair', date: '2024-10-24 10:30', icon: <XCircle className="text-red-500"/> },
        { id: 5, type: 'CREATE', user: 'Factory_Zhaoqing', target: 'New Product Record', date: '2024-10-24 09:15', icon: <AlertCircle className="text-blue-500"/> },
    ];

    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <div className="bg-white border border-stone-200 p-8 mb-8 shadow-sm">
                <h3 className="font-serif text-2xl text-stone-900 mb-2 flex items-center">
                    <Activity className="mr-3 text-amber-700" size={24} />
                    系统审计日志
                </h3>
                <p className="text-stone-500 text-sm">记录所有关键的系统操作、数据变更以及安全登录事件。</p>
            </div>

            <div className="space-y-4">
                {logs.map(log => (
                    <div key={log.id} className="bg-white border border-stone-200 p-4 flex items-center gap-6 hover:bg-stone-50 transition-colors">
                        <div className="w-10 h-10 bg-stone-100 flex items-center justify-center rounded-sm">
                            {log.icon}
                        </div>
                        <div className="flex-grow">
                            <div className="flex justify-between items-start">
                                <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
                                    {log.type}: <span className="text-stone-500 normal-case font-medium">{log.target}</span>
                                </h4>
                                <span className="text-[10px] font-mono text-stone-400">{log.date}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">操作员:</span>
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">{log.user}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 text-center">
                <button className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors">
                    加载更多历史记录
                </button>
            </div>
        </div>
    );
};

export default AuditTimeline;