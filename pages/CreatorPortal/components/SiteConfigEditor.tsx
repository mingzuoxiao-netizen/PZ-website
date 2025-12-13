
import React, { useEffect, useState, useRef } from 'react';
import { SITE_SCHEMA } from '../../../utils/siteSchema';
import { getByPath, setByPath } from '../../../utils/objectPath';
import FieldInput from './FieldInput';
import { Save, RefreshCw, Clock, History, RotateCcw, Check, AlertCircle } from 'lucide-react';
import { SiteMeta } from '../../../utils/siteConfig';
import { adminFetch } from '../../../utils/adminFetch';

interface SiteConfigEditorProps {
  config: any;
  meta: SiteMeta | null;
  onChange: (nextConfig: any) => void;
  onSave: () => void;
  isSaving: boolean;
  onRefresh: () => void; // Reload data from source
}

interface HistoryItem {
  version: string;
  uploaded: string;
}

const SiteConfigEditor: React.FC<SiteConfigEditorProps> = ({ config, meta, onChange, onSave, isSaving, onRefresh }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);
  
  // Track initial config to detect unsaved changes
  // Using a simplified check (JSON stringify) for deep comparison
  const [initialConfigStr, setInitialConfigStr] = useState('');
  const hasUnsavedChanges = JSON.stringify(config) !== initialConfigStr && initialConfigStr !== '';

  // Initialize initial config when config loads and initial is empty
  useEffect(() => {
    if (config && initialConfigStr === '') {
        setInitialConfigStr(JSON.stringify(config));
    }
  }, [config]);

  // Reset initial config after a successful save (version change)
  useEffect(() => {
    setInitialConfigStr(JSON.stringify(config));
  }, [meta?.version]);

  // Fetch History on Mount
  useEffect(() => {
    fetchHistory();
  }, [meta?.version]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await adminFetch<{ items: HistoryItem[] }>('/site-config/history');
      if (res && Array.isArray(res.items)) {
        setHistory(res.items);
      }
    } catch (e) {
      console.warn("Failed to fetch config history", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRollback = async (version: string) => {
    if (!confirm(`Are you sure you want to rollback to version ${version}? Current unsaved changes will be lost.`)) return;
    
    setRollingBack(true);
    try {
      await adminFetch('/site-config/rollback', {
        method: 'POST',
        body: JSON.stringify({ version })
      });
      onRefresh(); 
      alert("Rollback successful.");
    } catch (e) {
      console.error(e);
      alert("Rollback failed.");
    } finally {
      setRollingBack(false);
    }
  };
  
  if (!config) return <div className="p-8 text-center text-stone-400">Loading Configuration...</div>;

  return (
    <div className="animate-fade-in pb-20 relative">
      
      {/* 
          UX Optimization: Sticky Header with Enhanced Actions
      */}
      <div 
        className="sticky top-[90px] z-30 -mx-6 md:-mx-12 px-6 md:px-12 py-4 mb-8 bg-white/95 backdrop-blur border-b border-stone-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all"
        style={{ marginTop: '-1px' }}
      >
        <div>
            <h3 className="font-serif text-2xl text-stone-900 flex items-center">
                Site Configuration
                {hasUnsavedChanges && (
                    <span className="ml-3 text-[10px] bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-bold uppercase tracking-wide border border-amber-200 flex items-center animate-pulse">
                        <AlertCircle size={10} className="mr-1"/> Unsaved Changes
                    </span>
                )}
            </h3>
            <p className="text-stone-500 text-xs mt-1">Manage global content and hero images.</p>
        </div>
        
        {/* Action Bar */}
        <div className="flex items-center space-x-4 w-full md:w-auto justify-between md:justify-end">
            <div className="hidden lg:block text-right pr-6 border-r border-stone-200 mr-2">
                <div className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mb-1">Live Version</div>
                <div className="text-stone-900 font-mono text-xs flex items-center justify-end">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    {meta?.version ? `v${meta.version.substring(0,8)}` : 'Legacy'}
                </div>
            </div>

            {hasUnsavedChanges && (
                <button 
                    onClick={() => onRefresh()} 
                    className="text-stone-500 hover:text-red-600 text-xs font-bold uppercase tracking-widest px-4 py-2 hover:bg-red-50 rounded transition-colors"
                >
                    Discard
                </button>
            )}

            <button
                onClick={onSave}
                disabled={isSaving || rollingBack || !hasUnsavedChanges}
                className={`flex items-center px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all shadow-md rounded-sm
                    ${hasUnsavedChanges 
                        ? 'bg-amber-700 text-white hover:bg-amber-800 shadow-amber-200' 
                        : 'bg-stone-100 text-stone-400 cursor-not-allowed shadow-none'}
                `}
            >
                {isSaving ? <RefreshCw size={16} className="animate-spin mr-2"/> : <Save size={16} className="mr-2"/>}
                {isSaving ? "Publishing..." : hasUnsavedChanges ? "Publish Changes" : "Up to Date"}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12 max-w-4xl mx-auto">
        {SITE_SCHEMA.map((section) => (
          <div key={section.section} className="bg-white border border-stone-200 p-8 shadow-sm rounded-sm">
            <h2 className="text-lg font-serif text-stone-900 mb-6 border-b border-stone-100 pb-4">
              {section.section}
            </h2>

            <div className="space-y-2">
              {section.fields.map((field) => {
                const value = getByPath(config, field.path);

                return (
                  <FieldInput
                    key={field.path}
                    label={field.label}
                    type={field.type}
                    value={value}
                    help={field.help}
                    onChange={(val) => {
                      const next = setByPath(config, field.path, val);
                      onChange(next);
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {/* History Section */}
        <div className="mt-12 pt-12 border-t border-stone-200">
            <h3 className="font-serif text-xl text-stone-900 mb-6 flex items-center">
               <History size={20} className="mr-3 text-stone-400" /> Version History
            </h3>
            
            <div className="bg-stone-50 border border-stone-200 rounded-sm overflow-hidden">
                {loadingHistory ? (
                    <div className="p-8 text-center text-stone-400 text-sm">Loading history...</div>
                ) : history.length === 0 ? (
                    <div className="p-8 text-center text-stone-400 text-sm">No version history found.</div>
                ) : (
                    <div className="max-h-96 overflow-y-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-stone-100 text-stone-500 uppercase text-[10px] font-bold tracking-widest border-b border-stone-200 sticky top-0 z-10">
                                <tr>
                                    <th className="p-4">Version Hash</th>
                                    <th className="p-4">Published At</th>
                                    <th className="p-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 bg-white">
                                {history.map((item) => {
                                    const isCurrent = item.version === meta?.version;
                                    return (
                                        <tr key={item.version} className={`transition-colors ${isCurrent ? 'bg-amber-50' : 'hover:bg-stone-50'}`}>
                                            <td className="p-4 font-mono text-stone-600">
                                                {item.version}
                                                {isCurrent && <span className="ml-3 text-[9px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-amber-200">Current</span>}
                                            </td>
                                            <td className="p-4 text-stone-500">
                                                {item.uploaded ? new Date(item.uploaded).toLocaleString() : '-'}
                                            </td>
                                            <td className="p-4 text-right">
                                                {isCurrent ? (
                                                    <span className="text-stone-400 flex items-center justify-end text-xs font-bold uppercase tracking-widest cursor-default">
                                                        <Check size={14} className="mr-1"/> Active
                                                    </span>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleRollback(item.version)}
                                                        disabled={rollingBack}
                                                        className="text-amber-700 hover:text-amber-900 hover:bg-amber-50 px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-widest transition-colors flex items-center ml-auto"
                                                    >
                                                        <RotateCcw size={12} className="mr-1.5"/> Rollback
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default SiteConfigEditor;
