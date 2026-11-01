import React, { useMemo, useState } from 'react';
import { Image as ImageIcon, Save, RefreshCw, Globe, AlertCircle, Monitor, Smartphone, ExternalLink, CheckCircle2 } from 'lucide-react';
import { SITE_SCHEMA } from '../../../utils/siteSchema';
import { getByPath, setByPath } from '../../../utils/objectPath';
import PZImageManager from './PZImageManager';
import { resolveImage } from '../../../utils/imageResolver';
import { getSiteImageChanges } from '../../../utils/siteMediaChanges';

interface SiteMediaManagerProps {
  config: any;
  onChange: (config: any) => void;
  onSave: (edited: any, baseline: any) => Promise<void>;
  onPublish: () => Promise<void>;
  onRefresh: () => Promise<any>;
  isSaving: boolean;
  onUpload: (file: File) => Promise<string>;
}

const groups = [
  { title: '首页图片', sections: ['Home Page / Hero', 'Home Page / Sections', 'Home Page / Global Hubs'] },
  { title: '产品目录及导航横幅', sections: ['Portfolio Page', 'Navigation Menu (Posters)'] },
  { title: '公司与工厂图片', sections: ['About Page', 'Manufacturing Page', 'Capabilities Page', 'Global Capacity / Terminals'] },
  { title: '木材与工艺图片', sections: ['Materials / Technical Construction', 'Materials / Lumber Registry'] },
  { title: '询盘页面图片', sections: ['Inquire Page'] }
];

const imageLabels: Record<string, string> = {
  'home.hero.image': '首页顶部主视觉',
  'home.factory.image': '制造流程展示图（建议工人背影）',
  'home.cta.image': '首页底部询盘背景',
  'home.hub_cn.image': '肇庆工厂展示图',
  'home.hub_kh.image': '柬埔寨工厂展示图',
  'portfolio.hero_poster': '产品目录顶部图片',
  'about.banner': '关于我们横幅',
  'manufacturing.hero_machinery': '制造设备展示图',
  'manufacturing.hero_qc': '品质检验展示图',
  'capabilities.hero_poster': '制造能力展示图',
  'inquire.hero_poster': '询盘页面顶部图片',
  'capacity.card_cn': '肇庆生产基地卡片',
  'capacity.card_kh': '柬埔寨生产基地卡片'
};

const SiteMediaManager: React.FC<SiteMediaManagerProps> = ({ config, onChange, onSave, onPublish, onRefresh, isSaving, onUpload }) => {
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [groupIndex, setGroupIndex] = useState(0);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const imageFields = useMemo(() => SITE_SCHEMA.flatMap(s =>
    s.fields.filter(f => f.type === 'image').map(f => ({ ...f, section: s.section }))
  ), []);
  const active = groups[groupIndex];
  const fields = imageFields.filter(f => active.sections.includes(f.section));
  const baseline = useMemo(() => {
    try { return savedSnapshot ? JSON.parse(savedSnapshot) : config; }
    catch { return config; }
  }, [savedSnapshot, config]);
  const changedImages = getSiteImageChanges(baseline, config);
  const dirty = savedSnapshot !== '' && changedImages.length > 0;
  const changedPaths = new Set(changedImages.map(change => change.path));

  React.useEffect(() => {
    if (!config) return;
    if (!savedSnapshot) setSavedSnapshot(JSON.stringify(config));
  }, [config, savedSnapshot]);

  if (!config) return <div className="p-8">正在读取网站图片配置…</div>;

  const perform = async (task: () => Promise<void>, success: string) => {
    setError('');
    setNotice('');
    setBusy(true);
    try {
      await task();
      setNotice(success);
    } catch (e: any) {
      setError(e?.message || '操作失败，请重试。');
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    if (!dirty || busy || isSaving) return;
    const edited = config;
    const original = baseline;
    return perform(async () => {
      await onSave(edited, original);
      setSavedSnapshot(JSON.stringify(edited));
    }, '已保存图片修改到草稿。访客暂时不会看到这些修改，仍需发布网站配置。');
  };
  const publish = async () => {
    if (dirty || isSaving || busy) return;
    if (!window.confirm('确认发布全部已保存的网站配置草稿吗？本操作也可能包含其他管理员已保存的图片、文字和分类修改。')) return;
    await perform(onPublish, '网站配置发布操作已完成，请打开公开网站确认实际效果。');
  };
  const reset = async () => {
    if (dirty && !window.confirm('放弃尚未保存的图片替换操作吗？')) return;
    await perform(async () => {
      const latest = await onRefresh();
      if (!latest) throw new Error('刷新没有返回网站草稿，请重试。');
      setSavedSnapshot(JSON.stringify(latest));
    }, '已重新读取网站配置草稿。');
  };

  return (
    <div className="max-w-[1200px] mx-auto pb-24">
      <header className="bg-white border border-stone-200 p-6 mb-6 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <div className="text-xs tracking-wide text-[#805036] font-bold flex items-center gap-2"><ImageIcon size={16}/> 网站图片管理</div>
          <h2 className="font-semibold text-2xl text-stone-900 mt-2">网站图片管理</h2>
          <p className="text-sm text-stone-500 mt-2">上传图片后先保存草稿，再通过发布操作更新公开网站。所有图片可以随时替换，不需要重新部署前端代码。</p>
          <p className="text-xs text-amber-800 mt-2">实际产品与工厂介绍请使用真实资料；AI 场景效果图仅用于品牌概念，不要标成真实工厂。上传后请检查电脑和手机裁切预览。</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={reset} disabled={busy || isSaving} className="inline-flex gap-2 items-center border border-stone-300 px-4 py-2.5 text-sm disabled:opacity-50"><RefreshCw size={15}/>放弃更改 / 刷新</button>
          <button type="button" onClick={save} disabled={!dirty || busy || isSaving} className="inline-flex gap-2 items-center bg-stone-900 text-white px-4 py-2.5 text-sm disabled:opacity-50"><Save size={15}/>保存草稿</button>
          <button type="button" onClick={publish} disabled={dirty || busy || isSaving} className="inline-flex gap-2 items-center bg-[#805036] text-white px-4 py-2.5 text-sm disabled:opacity-50"><Globe size={15}/>发布到网站</button>
        </div>
      </header>
      <div role="status" className="mb-4 flex flex-wrap items-center gap-3 border border-stone-200 bg-white px-4 py-3 text-sm">
        {dirty ? <AlertCircle size={17} className="text-amber-700" aria-hidden="true" /> : <CheckCircle2 size={17} className="text-[#647a55]" aria-hidden="true" />}
        <span>{dirty ? `有 ${changedImages.length} 处图片修改尚未保存。` : '当前页面没有未保存的图片修改。'}</span>
        <span className="text-stone-500">保存草稿 ≠ 发布网站。发布时将应用全部已保存的站点配置草稿。</span>
      </div>
      {error && <div role="alert" className="mb-4 bg-red-50 text-red-700 border border-red-200 p-4 text-sm flex gap-2 items-center"><AlertCircle size={17}/>{error}</div>}
      {notice && <div role="status" className="mb-4 bg-green-50 text-green-800 border border-green-200 p-4 text-sm">{notice}</div>}
      <div className="grid lg:grid-cols-[220px_1fr] gap-6">
        <nav aria-label="网站图片分类" className="bg-white border border-stone-200 p-3 self-start flex gap-1 overflow-x-auto lg:block">
          {groups.map((g, i) => <button key={g.title} type="button" onClick={() => setGroupIndex(i)}
            aria-current={groupIndex === i ? 'page' : undefined}
            className={'shrink-0 lg:w-full text-left text-sm px-4 py-3 border-l-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#754831] ' + (groupIndex === i ? 'bg-[#f8f1e9] text-[#754831] border-[#754831] font-semibold' : 'text-stone-600 border-transparent hover:bg-stone-50')}>{g.title}</button>)}
        </nav>
        <div className="space-y-4 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-stone-200 px-4 py-3">
            <p className="text-sm font-semibold text-stone-800">{active.title} <span className="font-normal text-stone-500">· {fields.length} 个图片位置</span></p>
            <div role="group" aria-label="图片裁切预览尺寸" className="inline-flex border border-stone-200">
              <button type="button" aria-pressed={previewMode === 'desktop'} onClick={() => setPreviewMode('desktop')}
                className={'flex items-center gap-2 px-3 py-2 text-xs ' + (previewMode === 'desktop' ? 'bg-[#754831] text-white' : 'bg-white text-stone-600 hover:bg-stone-50')}>
                <Monitor size={14} aria-hidden="true" />电脑裁切
              </button>
              <button type="button" aria-pressed={previewMode === 'mobile'} onClick={() => setPreviewMode('mobile')}
                className={'flex items-center gap-2 px-3 py-2 text-xs ' + (previewMode === 'mobile' ? 'bg-[#754831] text-white' : 'bg-white text-stone-600 hover:bg-stone-50')}>
                <Smartphone size={14} aria-hidden="true" />手机裁切
              </button>
            </div>
          </div>
          <p className="text-xs text-stone-500">此处仅预览图片居中裁切效果，实际页面的布局可能不同。图片来源仍由现有后台管理。</p>
          <div className="grid sm:grid-cols-2 gap-4">
          {fields.map(field => {
            const image = String(getByPath(config, field.path) || '');
            return (
              <section key={field.path} className={'bg-white border p-5 ' + (changedPaths.has(field.path) ? 'border-amber-300' : 'border-stone-200')}>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-stone-900 text-sm">{imageLabels[field.path] || field.label}</h3>
                  {changedPaths.has(field.path) && <span className="shrink-0 bg-amber-50 px-2 py-1 text-[11px] text-amber-900">未保存</span>}
                </div>
                <p className="text-xs text-stone-400 mt-1 mb-3">{field.path}</p>
                {image ? (
                  <div className="mb-3">
                    <div className={previewMode === 'desktop' ? 'aspect-video w-full' : 'aspect-[4/5] w-[60%] max-w-[210px] mx-auto'}>
                      <img src={resolveImage(image)} alt={`当前图片预览：${imageLabels[field.path] || field.label}`}
                        className="h-full w-full object-cover bg-stone-100 border border-stone-200" loading="lazy" />
                    </div>
                    <a href={resolveImage(image)} target="_blank" rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-[11px] text-[#805036] underline underline-offset-2">查看原始图片 <ExternalLink size={12} aria-hidden="true" /></a>
                  </div>
                ) : <p className="mb-3 flex min-h-28 items-center justify-center bg-stone-50 border border-dashed border-stone-200 text-sm text-stone-500">此位置尚未设置图片</p>}
                <PZImageManager
                  lang="zh"
                  label="上传或替换图片"
                  images={image ? [image] : []}
                  onUpdate={next => { onChange(setByPath(config, field.path, next[0] || '')); setError(''); setNotice(''); }}
                  onUpload={onUpload}
                  onError={setError}
                  maxImages={1}
                  accept="image/png,image/jpeg,image/webp"
                  // Avoid silently cropping uploaded source files; preview cropping is visual only.
                />
                <p className="text-[11px] text-stone-500 mt-2">替换操作只修改当前页面图片引用，不会直接删除 R2 中的旧图片。</p>
              </section>
            );
          })}
          </div>
        </div>
      </div>
    </div>
  );
};
export default SiteMediaManager;
