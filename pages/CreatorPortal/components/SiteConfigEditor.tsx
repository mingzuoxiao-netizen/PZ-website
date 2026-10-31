import React, { useEffect, useState } from 'react';
import { SITE_SCHEMA } from '../../../utils/siteSchema';
import { getByPath, setByPath } from '../../../utils/objectPath';
import FieldInput from './FieldInput';
import { Save, RefreshCw, AlertCircle, Globe } from 'lucide-react';

interface SiteConfigEditorProps {
  config: any;
  onChange: (nextConfig: any) => void;
  onSave: () => Promise<void> | void;
  onPublish: () => void;
  isSaving: boolean;
  onRefresh: () => Promise<void> | void;
  onUpload: (file: File) => Promise<string>;
  onDelete?: (url: string) => Promise<void>;
}

const SiteConfigEditor: React.FC<SiteConfigEditorProps> = ({
  config,
  onChange,
  onSave,
  onPublish,
  isSaving,
  onRefresh,
  onUpload,
  onDelete
}) => {
  // Management screens stay Chinese regardless of public website language.
  const sectionNames: Record<string, string> = {
    'Global Settings': '全站设置',
    'Navigation Menu (Posters)': '导航菜单图片',
    'Home Page / Hero': '首页主视觉',
    'Home Page / Sections': '首页其他区域',
    'Home Page / Global Hubs': '双工厂展示',
    'About Page': '关于我们页面',
    'Manufacturing Page': '生产制造页面',
    'Capabilities Page': '制造能力页面',
    'Portfolio Page': '产品中心页面',
    'Inquire Page': '客户询盘页面',
    'Global Capacity / Terminals': '全球生产基地与物流',
    'Materials / Technical Construction': '木材加工工艺',
    'Materials / Lumber Registry': '木材样品图库'
  };

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
        正在读取网站配置…
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-20 relative">

      {/* Floating Header */}
      <div className="sticky top-[70px] md:top-[90px] z-30 -mx-6 md:-mx-12 px-6 md:px-12 py-4 mb-8 bg-white/95 backdrop-blur border-b border-stone-200 shadow-sm flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h3 className="font-serif text-2xl text-stone-900 flex items-center">
            网站内容配置
            {hasUnsavedChanges && (
              <span className="ml-3 text-[10px] bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-bold uppercase border border-amber-200 flex items-center animate-pulse">
                <AlertCircle size={10} className="mr-1" />
                未保存更改
              </span>
            )}
          </h3>
          <p className="text-stone-500 text-xs mt-1">
            编辑网站文本、图片和站点展示设置。
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {hasUnsavedChanges && (
            <button
              onClick={async () => { await onRefresh(); setInitialConfigStr(''); }}
              className="text-xs font-bold uppercase text-stone-500 hover:text-red-600 mr-4"
            >
              放弃未保存更改
            </button>
          )}

          <button
            onClick={async () => { await onSave(); setInitialConfigStr(JSON.stringify(config)); }}
            disabled={isSaving || !hasUnsavedChanges}
            className={`flex items-center px-6 py-3 text-[10px] font-bold uppercase tracking-widest rounded-sm transition
              ${
                hasUnsavedChanges
                  ? 'bg-stone-900 text-white hover:bg-stone-800 shadow-md'
                  : 'bg-stone-100 text-stone-400 cursor-not-allowed'
              }`}
          >
            {isSaving ? (
              <RefreshCw size={14} className="animate-spin mr-2" />
            ) : (
              <Save size={14} className="mr-2" />
            )}
            保存草稿
          </button>

          <div className="w-px h-6 bg-stone-200 mx-2"></div>

          <button
            onClick={onPublish}
            disabled={isSaving || hasUnsavedChanges}
            title={hasUnsavedChanges ? "请先保存当前更改" : "发布已保存的网站内容"}
            className={`flex items-center px-6 py-3 text-[10px] font-bold uppercase tracking-widest rounded-sm transition
              ${
                !hasUnsavedChanges
                  ? 'bg-amber-700 text-white hover:bg-amber-800 shadow-lg'
                  : 'bg-stone-100 text-stone-400 cursor-not-allowed opacity-50'
              }`}
          >
            {isSaving ? (
              <RefreshCw size={14} className="animate-spin mr-2" />
            ) : (
              <Globe size={14} className="mr-2" />
            )}
            发布到网站
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12 max-w-4xl mx-auto">
        {SITE_SCHEMA.map(section => (
          <div key={section.section} className="bg-white border p-8 shadow-sm">
            <h2 className="text-lg font-serif mb-6 border-b pb-4 text-stone-900">
              {sectionNames[section.section] || '网站内容设置'}
            </h2>

            <div className="space-y-2">
              {section.fields.map(field => (
                <FieldInput
                  key={field.path}
                  label={field.label}
                  type={field.type}
                  value={getByPath(config, field.path)}
                  help={field.help}
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