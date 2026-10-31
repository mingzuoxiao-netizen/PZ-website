import React, { useMemo, useState } from 'react';
import { Image as ImageIcon, Save, RefreshCw, Globe, AlertCircle } from 'lucide-react';
import { SITE_SCHEMA } from '../../../utils/siteSchema';
import { getByPath, setByPath } from '../../../utils/objectPath';
import PZImageManager from './PZImageManager';
import { resolveImage } from '../../../utils/imageResolver';

interface SiteMediaManagerProps {
  config: any;
  initialGroupIndex?: number;
  onChange: (config: any) => void;
  onSave: () => Promise<void>;
  onPublish: () => Promise<void>;
  onRefresh: () => Promise<void>;
  isSaving: boolean;
  onUpload: (file: File) => Promise<string>;
}

const groups = [
  { title: '产品分类封面', sections: [] },
  { title: '首页图片', sections: ['Home Page / Hero', 'Home Page / Sections', 'Home Page / Global Hubs'] },
  { title: '产品目录及导航横幅', sections: ['Portfolio Page', 'Navigation Menu (Posters)'] },
  { title: '公司与工厂图片', sections: ['About Page', 'Manufacturing Page', 'Capabilities Page', 'Global Capacity / Terminals'] },
  { title: '木材与工艺图片', sections: ['Materials / Technical Construction', 'Materials / Lumber Registry'] },
  { title: '询盘页面图片', sections: ['Inquire Page'] }
];

const imageLabels: Record<string, string> = {
  'home.hero.image': '首页顶部主视觉',
  'home.factory.image': '制造流程 — 工人背影照片',
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

const SiteMediaManager: React.FC<SiteMediaManagerProps> = ({ config, initialGroupIndex = 0, onChange, onSave, onPublish, onRefresh, isSaving, onUpload }) => {
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const imageFields = useMemo(() => SITE_SCHEMA.flatMap(s =>
    s.fields.filter(f => f.type === 'image').map(f => ({ ...f, section: s.section }))
  ), []);
  const active = groups[groupIndex];
  const fields = imageFields.filter(f => active.sections.includes(f.section));
  const snapshot = JSON.stringify(config || {});
  const dirty = savedSnapshot !== '' && savedSnapshot !== snapshot;

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
      setSavedSnapshot(JSON.stringify(config));
      setNotice(success);
    } catch (e: any) {
      setError(e?.message || '操作失败，请重试。');
    } finally {
      setBusy(false);
    }
  };

  const save = () => perform(onSave, '已保存配置草稿。网站访客暂时不会看到这些修改，仍需单独发布。');
  const publish = async () => {
    if (dirty || isSaving || busy) return;
    if (!window.confirm('确认将已经保存的站点配置发布给正式网站访客吗？')) return;
    await perform(onPublish, '已提交网站配置发布操作。');
  };
  const reset = async () => {
    if (dirty && !window.confirm('放弃尚未保存的图片替换操作吗？')) return;
    await perform(async () => { await onRefresh(); }, '已重新读取已保存的配置。');
    setSavedSnapshot('');
  };

  return (
    <div className="max-w-[1200px] mx-auto pb-24">
      <header className="bg-white border border-stone-200 p-6 mb-6 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <div className="text-xs tracking-wide text-[#805036] font-bold flex items-center gap-2"><ImageIcon size={16}/> 网站内容管理</div>
          <h2 className="font-semibold text-2xl text-stone-900 mt-2">{groupIndex === 0 ? '产品分类封面管理' : '网站图片管理'}</h2>
          <p className="text-sm text-stone-500 mt-2">上传图片后先保存草稿，再通过发布操作更新公开网站。所有图片可以随时替换，不需要重新部署前端代码。</p>
          <p className="text-xs text-amber-800 mt-2">建议使用授权实拍图片；首页主图建议横图，工人背影图建议宽幅构图。新图上传后，请检查电脑端和手机端裁切效果。</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={reset} disabled={busy || isSaving} className="inline-flex gap-2 items-center border border-stone-300 px-4 py-2.5 text-sm disabled:opacity-50"><RefreshCw size={15}/>放弃更改 / 刷新</button>
          <button type="button" onClick={save} disabled={!dirty || busy || isSaving} className="inline-flex gap-2 items-center bg-stone-900 text-white px-4 py-2.5 text-sm disabled:opacity-50"><Save size={15}/>保存草稿</button>
          <button type="button" onClick={publish} disabled={dirty || busy || isSaving} className="inline-flex gap-2 items-center bg-[#805036] text-white px-4 py-2.5 text-sm disabled:opacity-50"><Globe size={15}/>发布到网站</button>
        </div>
      </header>
      {dirty && <div role="status" className="mb-4 bg-amber-50 border border-amber-200 text-amber-900 p-4 text-sm">尚有未保存的图片修改。请先保存草稿，再决定是否发布。</div>}
      {error && <div role="alert" className="mb-4 bg-red-50 text-red-700 border border-red-200 p-4 text-sm flex gap-2 items-center"><AlertCircle size={17}/>{error}</div>}
      {notice && <div role="status" className="mb-4 bg-green-50 text-green-800 border border-green-200 p-4 text-sm">{notice}</div>}
      <div className="grid lg:grid-cols-[220px_1fr] gap-6">
        <nav aria-label="网站图片分类" className="bg-white border border-stone-200 p-3 self-start">
          {groups.map((g, i) => <button key={g.title} type="button" onClick={() => setGroupIndex(i)} className={'w-full text-left text-sm px-4 py-3 border-l-2 ' + (groupIndex === i ? 'bg-[#f8f1e9] text-[#754831] border-[#754831] font-semibold' : 'text-stone-600 border-transparent hover:bg-stone-50')}>{g.title}</button>)}
        </nav>
        <div className="space-y-4">
          {groupIndex === 0 && <div className="bg-white border border-stone-200 px-5 py-4 text-sm text-stone-600">这里管理产品中心每个分类的主图。工厂新申请的分类，只有管理员审核批准并发布后才会出现在这里。替换图片后请先保存草稿，再发布网站配置。</div>}
          <div className="grid sm:grid-cols-2 gap-4">
          {groupIndex === 0 && Array.isArray(config.categories) && config.categories.map((category: any, index: number) => (
            <section key={'category-' + category.id} className="bg-white border border-stone-200 p-5">
              <h3 className="font-semibold text-stone-900 text-sm">产品分类：{category.title_zh || category.title}</h3>
              <p className="text-xs text-stone-400 mt-1 mb-3">分类封面 · {category.id}</p>
              {!!category.image && <img src={resolveImage(category.image)} alt="分类封面预览" className="h-32 w-full object-cover border border-stone-100 mb-3" loading="lazy"/>}
              <PZImageManager
                label="替换分类封面"
                images={category.image ? [category.image] : []}
                onUpdate={images => {
                  const nextCategories = config.categories.map((item: any, idx: number) =>
                    idx === index ? { ...item, image: images[0] || '' } : item);
                  onChange({ ...config, categories: nextCategories });
                  setError('');
                  setNotice('');
                }}
                onUpload={onUpload}
                onError={setError}
                maxImages={1}
                accept="image/png,image/jpeg,image/webp"
              />
            </section>
          ))}
          {groupIndex === 0 && (!Array.isArray(config.categories) || config.categories.length === 0) && <p className="text-sm text-stone-500">暂无可管理的正式产品分类，请先确认站点配置。</p>}
          {fields.map(field => {
            const image = String(getByPath(config, field.path) || '');
            return (
              <section key={field.path} className="bg-white border border-stone-200 p-5">
                <h3 className="font-semibold text-stone-900 text-sm">{imageLabels[field.path] || field.label}</h3>
                <p className="text-xs text-stone-400 mt-1 mb-3">{field.path}</p>
                {image && <img src={resolveImage(image)} alt="当前图片预览" className="h-32 w-full object-cover bg-stone-100 mb-3 border border-stone-100" loading="lazy" />}
                <PZImageManager
                  label="上传或替换图片"
                  images={image ? [image] : []}
                  onUpdate={next => { onChange(setByPath(config, field.path, next[0] || '')); setError(''); setNotice(''); }}
                  onUpload={onUpload}
                  onError={setError}
                  maxImages={1}
                  accept="image/png,image/jpeg,image/webp"
                  aspectRatio={field.path === 'home.factory.image' ? 2.2 : undefined}
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
