import React, { useEffect, useState } from 'react';
import { SITE_SCHEMA } from '../../../utils/siteSchema';
import { getByPath, setByPath } from '../../../utils/objectPath';
import FieldInput from './FieldInput';
import { Save, RefreshCw, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface SiteConfigEditorProps {
  config: any;
  onChange: (nextConfig: any) => void;
  onSave: () => void;
  isSaving: boolean;
  onRefresh: () => void;
  onUpload: (file: File) => Promise<string>;
  onDelete?: (url: string) => Promise<void>;
}

const SiteConfigEditor: React.FC<SiteConfigEditorProps> = ({
  config,
  onChange,
  onSave,
  isSaving,
  onRefresh,
  onUpload,
  onDelete
}) => {
  const { t } = useLanguage();

  const [initialConfigStr, setInitialConfigStr] = useState('');

  const hasUnsavedChanges =
    initialConfigStr !== '' && JSON.stringify(config) !== initialConfigStr;

  useEffect(() => {
    if (config && initialConfigStr === '') {
      setInitialConfigStr(JSON.stringify(config));
    }
  }, [config]);

  if (!config) {
    return (
      <div className="p-8 text-center text-stone-400">
        Loading Configuration…
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-20 relative">

      {/* Sticky Header */}
      <div className="sticky top-[90px] z-30 -mx-6 md:-mx-12 px-6 md:px-12 py-4 mb-8 bg-white/95 backdrop-blur border-b border-stone-200 shadow-sm flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h3 className="font-serif text-2xl text-stone-900 flex items-center">
            {t.creator.config.title}
            {hasUnsavedChanges && (
              <span className="ml-3 text-[10px] bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-bold uppercase border border-amber-200 flex items-center animate-pulse">
                <AlertCircle size={10} className="mr-1" />
                {t.creator.config.unsaved}
              </span>
            )}
          </h3>
          <p className="text-stone-500 text-xs mt-1">
            {t.creator.config.desc}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {hasUnsavedChanges && (
            <button
              onClick={onRefresh}
              className="text-xs font-bold uppercase text-stone-500 hover:text-red-600"
            >
              {t.creator.config.discard}
            </button>
          )}

          <button
            onClick={onSave}
            disabled={isSaving || !hasUnsavedChanges}
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
            {isSaving ? t.creator.config.publishing : t.creator.config.publish}
          </button>
        </div>
      </div>

      {/* Config Sections */}
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
                  onUpload={onUpload}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SiteConfigEditor;

