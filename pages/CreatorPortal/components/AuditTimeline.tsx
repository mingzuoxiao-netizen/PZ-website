import React from 'react';
import { Activity, ShieldAlert } from 'lucide-react';

/**
 * The current Production API has no verified audit-log read endpoint.
 * Do not show made-up events or an inert "load logs" button to administrators.
 */
const AuditTimeline: React.FC = () => (
  <div className="animate-fade-in max-w-4xl mx-auto">
    <div className="bg-white border border-stone-200 p-8 mb-8 shadow-sm">
      <h3 className="font-serif text-2xl text-stone-900 mb-2 flex items-center">
        <Activity className="mr-3 text-amber-700" size={24} /> 操作日志
      </h3>
      <p className="text-stone-500 text-sm">用于查看后台操作及审批记录。</p>
    </div>
    <div className="bg-white border border-stone-200 p-12 text-center text-stone-500">
      <ShieldAlert className="mx-auto mb-4 text-amber-700" size={30} />
      <h4 className="text-base font-semibold text-stone-900">暂无法读取真实操作日志</h4>
      <p className="mt-2 text-sm">当前后台尚未接入经过验证的操作日志接口，因此不会显示模拟记录。</p>
    </div>
  </div>
);

export default AuditTimeline;
