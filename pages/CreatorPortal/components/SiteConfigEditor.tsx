import React, { useEffect, useState } from 'react';
import { SITE_SCHEMA } from '../../../utils/siteSchema';
import { getByPath, setByPath } from '../../../utils/objectPath';
import FieldInput from './FieldInput';
import { Save, RefreshCw, History, RotateCcw, Check, AlertCircle } from 'lucide-react';
import { SiteMeta } from '../../../utils/siteConfig';
import { adminFetch } from '../../../utils/adminFetch';
import { useLanguage } from '../../../contexts/LanguageContext';

interface SiteConfigEditorProps {
  config: any;
  meta: SiteMeta | null;
  onChange: (nextConfig: any) => void;
  onSave: () => void;
  isSaving: boolean;
  onRefresh: () => void;
}

interface HistoryItem {
  version: string;
  published_at: string;
  message?: string;
}

const SiteConfigEditor: React.FC<SiteConfigEditorProps> = ({
  config,
  meta,
  onChange,
  onSave,
  isSaving,
  onRefresh
}) => {
  const { t } = useLanguage();

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);

  const [initialConfigStr, setInitialConfigStr] = useState('');

  const hasUnsavedChanges =
    initialConfigStr !== '' && JSON.stringify(config) !== initialConfigStr;

  /* ------------------------------
     Track baseline config
  ------------------------------ */
  useEffect(() => {
    if (config && initialConfigStr === '') {
      setInitialConfigStr(JSON.stringify(config));
    }
  }, [config]);

  useEffect(() => {
    if (config) {
      setInitialConfigStr(JSON.stringify(config));
    }
  }, [meta?.version]);

  /* ------------------------------
     Load history (FIXED)
  ------------------------------ */
  useEffect(() => {
    fetchHistory();
  }, [meta?.version]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await adminFetch<HistoryItem[]>('/site-config/history');
      if (Array.isArray(res)) {
        setHistory(res);
      } else {
        setHistory([]);
      }
    } catch (e) {
      console.warn('[SiteConfig] History fetch failed:', e);
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  /* ------------------------------
     Rollback (方案 C 正确实现)
  ------------------------------ */
  const handleRollback = async (version: string) => {
    if (
      !confirm(
        `Rollback to version ${version}?\n\nCurrent unsaved changes will be lost.`
      )
    )
      return;

    setRollingBack(true);
    try {
      await adminFetch('/site-config', {
      method: 'POST',
      body: JSON.stringify({
    config,
    message: 'Update navigation images'
  })
});

      await onRefresh();   // 刷新当前 config
      await fetchHistory(); // 刷新历史列表

      alert('Rollback successful.');
    } catch (e) {
      console.error(e);
      alert('Rollback failed.');
    } finally {
      setRollingBack(false);
    }
  };

  if (!config) {
    return (
      <div className="p-8 text-center text-stone-400">
        Loading Configuration…
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-20 relative">

      {/* ================= Toolbar ================= */}
      <div className="sticky top-[90px] z-30 -mx-6 md:-mx-12 px-6 md:px-12 py-4 mb-8 bg-white/95 backdrop-blur border-b border-stone-200 shadow-sm flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h3 className="font-serif text-2xl text-stone-900 flex items-center">
            Site Configuration
            {hasUnsavedChanges && (
              <span className="ml-3 text-[10px] bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-bold uppercase border border-amber-200 flex items-center animate-pulse">
                <AlertCircle size={10} className="mr-1" /> Unsaved Changes
              </span>
            )}
          </h3>
          <p className="text-stone-500 text-xs mt-1">
            Manage global content and hero images.
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {hasUnsavedChanges && (
            <button
              onClick={onRefresh}
              className="text-xs font-bold uppercase text-stone-500 hover:text-red-600"
            >
              Discard
            </button>
          )}

          <button
            onClick={onSave}
            disabled={isSaving || rollingBack || !hasUnsavedChanges}
            className={`flex items-center px-6 py-3 text-xs font-bold uppercase tracking-widest rounded-sm transition
              ${
                hasUnsavedChanges
                  ? 'bg-amber-700 text-white hover:bg-amber-800'
                  : 'bg-stone-100 text-stone-400 cursor-not-allowed'
              }`}
          >
            {isSaving ? (
              <RefreshCw size={14} className="animate-spin mr-2" />
            ) : (
              <Save size={14} className="mr-2" />
            )}
            {isSaving ? 'Publishing…' : 'Publish Changes'}
          </button>
        </div>
      </div>

      {/* ================= Config Fields ================= */}
      <div className="grid grid-cols-1 gap-12 max-w-4xl mx-auto">
        {SITE_SCHEMA.map(section => (
          <div key={section.section} className="bg-white border p-8">
            <h2 className="text-lg font-serif mb-6 border-b pb-4">
              {t.siteConfig?.sections?.[section.section] ?? section.section}
            </h2>

            <div className="space-y-2">
              {section.fields.map(field => (
                <FieldInput
                  key={field.path}
                  label={
                    t.siteConfig?.fields?.[field.path]?.label ?? field.label
                  }
                  type={field.type}
                  value={getByPath(config, field.path)}
                  help={
                    t.siteConfig?.fields?.[field.path]?.help ?? field.help
                  }
                  onChange={val =>
                    onChange(setByPath(config, field.path, val))
                  }
                />
              ))}
            </div>
          </div>
        ))}

        {/* ================= History ================= */}
        <div className="mt-12 pt-12 border-t">
          <h3 className="font-serif text-xl mb-6 flex items-center">
            <History size={18} className="mr-2 text-stone-400" />
            Version History
          </h3>

          <div className="border rounded-sm overflow-hidden bg-white">
            {loadingHistory ? (
              <div className="p-8 text-center text-stone-400">Loading…</div>
            ) : history.length === 0 ? (
              <div className="p-8 text-center text-stone-400">
                No history found.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-stone-100 text-xs uppercase">
                  <tr>
                    <th className="p-4 text-left">Version</th>
                    <th className="p-4 text-left">Published</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(item => {
                    const isCurrent = item.version === meta?.version;
                    return (
                      <tr key={item.version} className="border-t">
                        <td className="p-4 font-mono">{item.version}</td>
                        <td className="p-4 text-stone-500">
                          {new Date(item.published_at).toLocaleString()}
                        </td>
                        <td className="p-4 text-right">
                          {isCurrent ? (
                            <span className="text-xs text-stone-400 flex justify-end items-center">
                              <Check size={14} className="mr-1" /> Active
                            </span>
                          ) : (
                            <button
                              onClick={() => handleRollback(item.version)}
                              disabled={rollingBack}
                              className="text-xs font-bold uppercase text-amber-700 hover:text-amber-900 flex items-center ml-auto"
                            >
                              <RotateCcw size={12} className="mr-1" />
                              Rollback
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteConfigEditor;

