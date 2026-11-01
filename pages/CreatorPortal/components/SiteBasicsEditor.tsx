import React, { useEffect, useRef, useState } from 'react';
import { FileText, Globe, RefreshCw, Save, Upload } from 'lucide-react';

export interface SiteBasicsValues {
  title: string;
  catalogUrl: string;
}

interface Props {
  config: any;
  isSaving: boolean;
  onSave: (values: SiteBasicsValues, baseline: SiteBasicsValues) => Promise<void>;
  onPublish: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onUploadPdf: (file: File) => Promise<string>;
}

const readValues = (config: any): SiteBasicsValues => ({
  title: String(config?.home?.hero?.title ?? ''),
  catalogUrl: String(config?.catalog?.url ?? '')
});

const same = (a: SiteBasicsValues, b: SiteBasicsValues) =>
  a.title === b.title && a.catalogUrl === b.catalogUrl;

const SiteBasicsEditor: React.FC<Props> = ({
  config, isSaving, onSave, onPublish, onRefresh, onUploadPdf
}) => {
  const [baseline, setBaseline] = useState<SiteBasicsValues>(() => readValues(config));
  const [values, setValues] = useState<SiteBasicsValues>(() => readValues(config));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const pickerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!config) return;
    const next = readValues(config);
    setBaseline(next);
    setValues(next);
  }, [config]);

  const dirty = !same(values, baseline);
  const locked = busy || isSaving;

  const uploadPdf = async (file?: File) => {
    if (!file) return;
    if (!/\.pdf$/i.test(file.name) || (file.type && file.type !== 'application/pdf')) {
      setError('请上传 PDF 格式的产品目录。');
      return;
    }
    if (file.size === 0 || file.size > 15 * 1024 * 1024) {
      setError('PDF 文件大小必须在 15 MB 以内。');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const url = await onUploadPdf(file);
      if (!url) throw new Error('上传没有返回文件地址。');
      setValues(prev => ({ ...prev, catalogUrl: url }));
      setNotice('PDF 上传成功，请点击“保存草稿”后再发布。');
    } catch (e: any) {
      setError(e?.message || 'PDF 上传失败，请重试。');
    } finally {
      setBusy(false);
      if (pickerRef.current) pickerRef.current.value = '';
    }
  };

  const save = async () => {
    if (!dirty || locked) return;
    if (!values.title.trim()) {
      setError('首页主标题不能为空。');
      return;
    }
    if (values.catalogUrl.trim()) {
      try {
        if (new URL(values.catalogUrl.trim()).protocol !== 'https:') throw new Error();
      } catch {
        setError('产品目录地址必须是完整的 HTTPS 链接。');
        return;
      }
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await onSave({ title: values.title.trim(), catalogUrl: values.catalogUrl.trim() }, baseline);
      setNotice('网站基础信息草稿已保存；公开网站不会立即改变，仍需发布。');
    } catch (e: any) {
      setError(e?.message || '草稿保存失败，请重试。');
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    if (dirty || locked) return;
    if (!window.confirm('发布将更新所有已保存的网站配置草稿，包括可能由其他管理员修改的图片和分类。确定继续吗？')) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await onPublish();
      setNotice('网站配置发布成功。');
    } catch (e: any) {
      setError(e?.message || '发布失败，请重试。');
    } finally {
      setBusy(false);
    }
  };

  const refresh = async () => {
    if (locked) return;
    if (dirty && !window.confirm('放弃尚未保存的网站基础信息修改吗？')) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await onRefresh();
      setNotice('已重新读取网站配置草稿。');
    } catch (e: any) {
      setError(e?.message || '刷新失败，请重试。');
    } finally {
      setBusy(false);
    }
  };

  if (!config) return <div className="p-8 text-sm text-stone-500">正在读取网站基础信息…</div>;

  return (
    <div className="max-w-4xl mx-auto pb-24 space-y-6">
      <header className="bg-white border border-stone-200 p-6">
        <h2 className="font-serif text-2xl text-stone-900">网站基础信息</h2>
        <p className="text-sm text-stone-500 mt-2">只管理首页主标题及供访客下载的产品目录 PDF，网站图片请前往「网站图片管理」。</p>
        <p className="text-xs text-amber-800 mt-2">先保存草稿，再发布到网站。发布会同时公开全部已保存的网站配置草稿。</p>
        <div className="flex flex-wrap gap-2 mt-5">
          <button type="button" onClick={refresh} disabled={locked} className="inline-flex gap-2 items-center border border-stone-300 px-4 py-2.5 text-sm disabled:opacity-40"><RefreshCw size={15}/>刷新 / 放弃更改</button>
          <button type="button" onClick={save} disabled={locked || !dirty} className="inline-flex gap-2 items-center bg-stone-900 text-white px-4 py-2.5 text-sm disabled:opacity-40"><Save size={15}/>保存草稿</button>
          <button type="button" onClick={publish} disabled={locked || dirty} className="inline-flex gap-2 items-center bg-[#805036] text-white px-4 py-2.5 text-sm disabled:opacity-40"><Globe size={15}/>发布到网站</button>
        </div>
      </header>

      {dirty && <div role="status" className="p-3 text-sm bg-amber-50 text-amber-900 border border-amber-200">有尚未保存的修改，请先保存草稿。</div>}
      {error && <div role="alert" className="p-3 text-sm bg-red-50 text-red-700 border border-red-200">{error}</div>}
      {notice && <div role="status" className="p-3 text-sm bg-green-50 text-green-800 border border-green-200">{notice}</div>}

      <section className="bg-white border border-stone-200 p-6 space-y-3">
        <label htmlFor="site-home-title" className="block text-sm font-semibold text-stone-900">首页主标题</label>
        <input id="site-home-title" type="text" value={values.title} disabled={locked}
          onChange={e => setValues(prev => ({ ...prev, title: e.target.value }))}
          className="w-full border border-stone-300 px-4 py-3 text-sm disabled:opacity-60" />
        <p className="text-xs text-stone-500">公开网站首页主视觉区域显示的标题。</p>
      </section>

      <section className="bg-white border border-stone-200 p-6 space-y-3">
        <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2"><FileText size={18}/>产品目录 PDF</h3>
        <p className="text-xs text-stone-500">可直接上传 PDF（最大 15 MB），也可粘贴已有的 HTTPS 文件地址。</p>
        <input ref={pickerRef} aria-label="选择产品目录 PDF" type="file" accept=".pdf,application/pdf"
          className="hidden" onChange={e => void uploadPdf(e.target.files?.[0])} />
        <button type="button" disabled={locked} onClick={() => pickerRef.current?.click()}
          className="inline-flex items-center gap-2 border border-stone-300 px-4 py-2.5 text-sm disabled:opacity-40">
          <Upload size={16}/>上传 PDF
        </button>
        <label htmlFor="site-catalog-url" className="block text-xs font-medium text-stone-600">产品目录地址</label>
        <input id="site-catalog-url" type="url" value={values.catalogUrl} disabled={locked}
          onChange={e => setValues(prev => ({ ...prev, catalogUrl: e.target.value }))}
          placeholder="https://..." className="w-full border border-stone-300 px-4 py-3 text-sm disabled:opacity-60" />
        {values.catalogUrl.trim() && /^https:\/\//i.test(values.catalogUrl.trim()) && (
          <a href={values.catalogUrl.trim()} target="_blank" rel="noopener noreferrer"
            className="text-sm underline text-[#805036]">预览当前 PDF 文件</a>
        )}
        <p className="text-xs text-stone-500">上传成功不代表已经发布；旧文件不会自动删除，以便历史版本回溯。</p>
      </section>
    </div>
  );
};

export default SiteBasicsEditor;
