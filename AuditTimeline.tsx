import React from 'react';
import { Activity, Clock, Shield, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const AuditTimeline: React.FC = () => {
    const logs = [
        { id: 1, type: 'APPROVE', user: 'Admin', target: 'PZ-9021 Dining Table', date: '2024-10-24 14:20', icon: <CheckCircle className="text-green-500"/> },
        { id: 2, type: 'LOGIN', user: 'Factory_Kandal', target: 'Secure Session', date: '2024-10-24 13:05', icon: <Clock className="text-stone-400"/> },
        { id: 3, type: 'PUBLISH', user: 'Admin', target: 'Registry Logic v2.1', date: '2024-10-24 11:45', icon: <Shield className="text-amber-500"/> },
        { id: 4, type: 'REJECT', user: 'Admin', target: 'PZ-8801 Side Chair', date: '2024-10-24 10:30', icon: <XCircle className="text-red-500"/> },
        { id: 5, type: 'CREATE', user: 'Factory_Zhaoqing', target: 'Initial Record Load', date: '2024-10-24 09:15', icon: <AlertCircle className="text-blue-500"/> },
    ];

    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <div className="bg-white border border-stone-200 p-8 mb-8 shadow-sm">
                <h3 className="font-serif text-2xl text-stone-900 mb-2 flex items-center">
                    <Activity className="mr-3 text-amber-700" size={24} />
                    System Audit Logs
                </h3>
                <p className="text-stone-500 text-sm">Immutable history of registry modifications, process approvals, and security events.</p>
            </div>

            <div className="space-y-4">
                {logs.map(log => (
                    <div key={log.id} className="bg-white border border-stone-200 p-4 flex items-center gap-6 hover:bg-stone-50 transition-colors">
                        <div className="w-10 h-10 bg-stone-100 flex items-center justify-center rounded-sm">
                            {log.icon}
                        </div>
                        <div className="flex-grow font-mono">
                            <div className="flex justify-between items-start">
                                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                                    {log.type}: <span className="text-stone-500 normal-case font-medium">{log.target}</span>
                                </h4>
                                <span className="text-[10px] text-stone-400">{log.date}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Operator:</span>
                                <span className="text-[10px] font-bold text-safety-700 bg-safety-50 px-1.5 py-0.5 rounded">{log.user}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 text-center">
                <button className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors font-mono">
                    Load Sequential Logs
                </button>
            </div>
        </div>
    );
};

export default AuditTimeline;