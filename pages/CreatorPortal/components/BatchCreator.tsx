import React, { useEffect, useRef, useState } from 'react';
import {
  Upload, X, Loader2, CheckCircle, AlertTriangle, Save,
  Layers, ArrowUp, ArrowDown, RotateCcw
} from 'lucide-react';
import { Category, ProductionSite } from '../../../types';

type Mode = 'many-products' | 'one-product';
type AssetStatus = 'ready' | 'uploading' | 'uploaded' | 'saved' | 'error' | 'verify';

interface AssetRow {
  id: number;
  file: File;
  previewUrl: string;
  name: string;
  code: string;
  material: string;
  size: string;
  production_sites: ProductionSite[];
  url?: string;
  status: AssetStatus;
  error?: string;
}

interface DraftPayload {
  name: string;
  code: string;
  category: string;
  material: string;
  size: string;
  production_sites: ProductionSite[];
  images: string[];
  status: 'draft';
  is_published: 0;
}

interface BatchCreatorProps {
  categories: Category[];
  fixedCategoryId?: string;
  onCreateDraft: (product: DraftPayload) => Promise<void>;
  onCheckSkuCodes: (codes: string[]) => Promise<string[]>;
  onCompleted: () => Promise<void>;
  onCancel: () => void;
  onUpload: (file: File) => Promise<string>;
  lang?: 'en' | 'zh';
}

const MAX_FILES = 30;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const SKU_PATTERN = /^PZ-[A-Z0-9][A-Z0-9_-]{1,39}$/;
const normalizeCode = (code: string) => code.trim().toUpperCase();
const isKnownSkuConflict = (error: unknown) => /SKU_CONFLICT|SKU already exists/i.test(String((error as any)?.message || error));
const makeName = (name: string) => name.replace(/\.[^/.]+$/, '').trim();
const productionSiteOptions: { value: ProductionSite; label: string }[] = [
  { value: 'zhaoqing', label: 'Zhaoqing · China / 肇庆' },
  { value: 'cambodia', label: 'Kandal · Cambodia / 柬埔寨' },
];

const BatchCreator: React.FC<BatchCreatorProps> = ({
  categories, fixedCategoryId, onCreateDraft, onCheckSkuCodes, onCompleted, onCancel, onUpload, lang = 'en'
}) => {
  const T = (en: string, zh: string) => lang === 'zh' ? zh : en;
  const [mode, setMode] = useState<Mode>('many-products');
  const [selectedCategory, setSelectedCategory] = useState(fixedCategoryId || '');
  const [selectedSites, setSelectedSites] = useState<ProductionSite[]>([]);
  const [rows, setRows] = useState<AssetRow[]>([]);
  const [single, setSingle] = useState({ name: '', code: '', material: '', size: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [progress, setProgress] = useState('');
  const nextId = useRef(1);
  const inFlight = useRef(false);
  const previewUrls = useRef<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    previewUrls.current.forEach(url => URL.revokeObjectURL(url));
  }, []);

  const updateRow = (id: number, patch: Partial<AssetRow>) => {
    setRows(prev => prev.map(row => row.id === id ? { ...row, ...patch } : row));
  };

  const releasePreview = (url: string) => {
    URL.revokeObjectURL(url);
    previewUrls.current = previewUrls.current.filter(item => item !== url);
  };

  const addFiles = (fileList: FileList | null) => {
    if (!fileList || inFlight.current) return;
    const incoming = Array.from(fileList);
    if (rows.length + incoming.length > MAX_FILES) {
      setFeedback('Choose up to ' + MAX_FILES + ' images per batch.');
      return;
    }
    if (incoming.some(file => !file.type.startsWith('image/') || file.size > MAX_FILE_BYTES)) {
      setFeedback(T('Only image files up to 10 MB each are accepted.', '仅支持单张不超过 10 MB 的图片。'));
      return;
    }
    const existing = new Set(rows.map(row => row.file.name + ':' + row.file.size + ':' + row.file.lastModified));
    const unique = incoming.filter(file => {
      const key = file.name + ':' + file.size + ':' + file.lastModified;
      if (existing.has(key)) return false;
      existing.add(key);
      return true;
    });
    const added = unique.map(file => {
      const previewUrl = URL.createObjectURL(file);
      previewUrls.current.push(previewUrl);
      return {
        id: nextId.current++,
        file, previewUrl,
        name: makeName(file.name),
        code: '', material: '', size: '',
        production_sites: [...selectedSites],
        status: 'ready' as AssetStatus
      };
    });
    setRows(prev => [...prev, ...added]);
    setFeedback(unique.length ? '' : 'These image files are already in the queue.');
    if (inputRef.current) inputRef.current.value = '';
  };

  const clearRows = () => {
    rows.forEach(row => releasePreview(row.previewUrl));
    setRows([]);
    setFeedback('');
    setProgress('');
  };

  const switchMode = (next: Mode) => {
    if (next === mode || inFlight.current) return;
    if (rows.length > 0 && !window.confirm(T('Switching upload mode clears this queue. Continue?', '切换上传模式将清空当前队列，确认继续吗？'))) return;
    clearRows();
    setMode(next);
  };

  const deleteRow = (id: number) => {
    if (inFlight.current) return;
    const row = rows.find(item => item.id === id);
    if (!row || row.status === 'saved') return;
    releasePreview(row.previewUrl);
    setRows(prev => prev.filter(item => item.id !== id));
  };

  const moveImage = (index: number, by: number) => {
    if (inFlight.current) return;
    const target = index + by;
    if (target < 0 || target >= rows.length) return;
    setRows(prev => {
      const updated = [...prev];
      [updated[index], updated[target]] = [updated[target], updated[index]];
      return updated;
    });
  };

  const toggleSite = (site: ProductionSite) => {
    setSelectedSites(prev => prev.includes(site)
      ? prev.filter(value => value !== site)
      : [...prev, site]);
  };

  const verifyAndRetry = (rowId?: number) => {
    if (!window.confirm(T('First check Master Registry to confirm the SKU was NOT created. Retry only after checking.', '请先在产品总库确认该 SKU 未被创建，再尝试重试。'))) return;
    setRows(prev => prev.map(row =>
      row.status === 'verify' && (rowId === undefined || row.id === rowId)
        ? { ...row, status: row.url ? 'uploaded' : 'ready', error: undefined }
        : row
    ));
    setFeedback('');
  };

  const createDraft = (params: { name: string; code: string; material: string; size: string }, urls: string[], sites: ProductionSite[]) => {
    const payload: DraftPayload = {
      name: params.name.trim(), code: normalizeCode(params.code),
      category: fixedCategoryId || selectedCategory, material: params.material.trim(),
      size: params.size.trim(), production_sites: [...sites],
      images: urls, status: 'draft', is_published: 0
    };
    return onCreateDraft(payload);
  };

  const processBatch = async () => {
    if (inFlight.current) return;
    setFeedback('');
    if (!(fixedCategoryId || selectedCategory)) return setFeedback(T('Select a product category first.', '请先选择产品分类。'));
    if (mode === 'one-product' && selectedSites.length === 0) return setFeedback('请选择至少一个生产基地。');
    if (rows.length === 0) return setFeedback(T('Choose image files first.', '请先选择图片。'));
    if (rows.some(row => row.status === 'verify')) {
      return setFeedback('先前保存结果未确认，请到产品总库核实后再重试。');
    }

    const remaining = rows.filter(row => row.status !== 'saved');
    if (remaining.length === 0) return setFeedback('当前队列的草稿已全部保存。');
    if (mode === 'many-products' && remaining.some(row => row.production_sites.length === 0)) {
      return setFeedback(T('Select at least one production site for each product.', '每个产品必须选择至少一个生产基地。'));
    }

    const candidates = mode === 'one-product'
      ? [single]
      : remaining.map(row => ({ name: row.name, code: row.code, material: row.material, size: row.size }));
    if (candidates.some(item => !item.name.trim() || !SKU_PATTERN.test(normalizeCode(item.code)))) {
      return setFeedback('Each product needs a name and a unique SKU such as PZ-BIRCH-001 (2–40 characters after PZ-).');
    }

    const codes = candidates.map(item => normalizeCode(item.code));
    if (new Set(codes).size !== codes.length) {
      return setFeedback('Duplicate SKU codes found within this batch. Correct them before saving.');
    }

    let knownCodes: string[];
    try {
      // Indexed backend lookup; the SQLite UNIQUE index remains authoritative.
      knownCodes = (await onCheckSkuCodes(codes)).map(normalizeCode);
    } catch (error: any) {
      return setFeedback('Cannot check existing SKUs: ' + (error?.message || 'network error'));
    }
    const existing = new Set(knownCodes);
    const collisions = codes.filter(code => existing.has(code));
    if (collisions.length) return setFeedback('These SKU codes already exist: ' + collisions.join(', '));

    if (!window.confirm('Create ' + (mode === 'one-product' ? '1 product with ' + rows.length + ' images' : remaining.length + ' product drafts') + '? All new records will remain Draft.')) return;

    inFlight.current = true;
    setIsProcessing(true);
    let saved = 0;
    let failed = 0;

    try {
      if (mode === 'one-product') {
        const imageUrls: string[] = [];
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          setProgress('Uploading image ' + (i + 1) + '/' + rows.length);
          if (row.url) {
            imageUrls.push(row.url);
            continue;
          }
          updateRow(row.id, { status: 'uploading', error: undefined });
          try {
            const url = await onUpload(row.file);
            if (!url || !url.startsWith('https://')) throw new Error('Invalid uploaded image URL');
            imageUrls.push(url);
            updateRow(row.id, { url, status: 'uploaded' });
          } catch (error: any) {
            failed++;
            updateRow(row.id, { status: 'error', error: error?.message || 'Image upload failed' });
            setFeedback('Image upload failed. Fix the issue and retry; successfully uploaded files are reused.');
            return;
          }
        }
        setProgress('Saving one draft with ' + imageUrls.length + ' images');
        try {
          await createDraft(single, imageUrls, selectedSites);
          saved++;
          setRows(prev => prev.map(row => ({ ...row, status: 'saved', error: undefined })));
        } catch (error: any) {
          failed++;
          if (isKnownSkuConflict(error)) {
            setRows(prev => prev.map(row => ({ ...row, status: 'error', error: 'SKU already exists. Choose a new SKU and retry.' })));
            setFeedback('The SKU was taken during upload. Enter a different SKU and retry. Existing uploaded images will be reused.');
          } else {
            setRows(prev => prev.map(row => ({ ...row, status: 'verify', error: error?.message || T('Save outcome unknown','保存结果未确认') })));
            setFeedback(T('Save result uncertain. Check Master Registry for SKU ', '保存结果不明确，请到产品总库核查 SKU ') + normalizeCode(single.code) + ' before retrying.');
          }
        }
      } else {
        for (let i = 0; i < remaining.length; i++) {
          const row = remaining[i];
          setProgress('Processing product ' + (i + 1) + '/' + remaining.length);
          let url = row.url;
          if (!url) {
            updateRow(row.id, { status: 'uploading', error: undefined });
            try {
              url = await onUpload(row.file);
              if (!url || !url.startsWith('https://')) throw new Error('Invalid uploaded image URL');
              updateRow(row.id, { url, status: 'uploaded' });
            } catch (error: any) {
              failed++;
              updateRow(row.id, { status: 'error', error: error?.message || 'Image upload failed' });
              continue;
            }
          }
          try {
            await createDraft(row, [url], row.production_sites);
            saved++;
            updateRow(row.id, { status: 'saved', error: undefined });
          } catch (error: any) {
            failed++;
            updateRow(row.id, isKnownSkuConflict(error)
              ? { status: 'error', error: 'SKU already exists. Choose a new SKU and retry.' }
              : { status: 'verify', error: error?.message || T('Save outcome unknown','保存结果未确认') });
          }
        }
      }
    } finally {
      inFlight.current = false;
      setIsProcessing(false);
      setProgress('');
      if (saved) {
        try { await onCompleted(); } catch (error) { console.error('Registry refresh failed', error); }
      }
      if (!failed && saved) setFeedback('Created ' + saved + ' draft SKU(s). Success rows will not be resubmitted.');
      if (failed && mode === 'many-products') setFeedback(saved + ' saved; ' + failed + ' failed or need verification. Review each row before retrying.');
    }
  };

  const hasSaved = rows.some(row => row.status === 'saved');
  const hasUncertain = rows.some(row => row.status === 'verify');
  const canEditSingle = !hasSaved;

  const leaveBatch = () => {
    if (inFlight.current) return;
    if (rows.some(row => row.status !== 'saved') && rows.length > 0 &&
      !window.confirm(T('Leave Batch Induction? Unfinished inputs will be lost.', '离开批量录入会丢失尚未保存的内容，确定离开吗？'))) return;
    onCancel();
  };

  return (
    <div className="mx-auto max-w-6xl overflow-hidden rounded-sm border border-stone-200 bg-white shadow-xl">
      <div className="flex items-center justify-between bg-stone-900 p-6 text-white">
        <div className="flex items-center gap-3">
          <Layers size={20} className="text-safety-700" />
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest">批量产品录入</h2>
            <p className="mt-1 text-xs text-stone-300">创建草稿前请检查产品资料和图片</p>
          </div>
        </div>
        <button type="button" disabled={isProcessing} onClick={leaveBatch} className="rounded p-2 hover:bg-stone-700" aria-label={T("Close batch uploader","关闭批量上传")}><X size={20}/></button>
      </div>

      <div className="space-y-6 p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" disabled={isProcessing} onClick={() => switchMode('many-products')}
            className={'rounded-sm border p-4 text-left ' + (mode === 'many-products' ? 'border-stone-900 bg-stone-100' : 'border-stone-200')}>
            <strong className="text-sm">多款产品</strong>
            <p className="mt-1 text-xs text-stone-500">每张图片创建一份产品草稿，每款产品需要独立 SKU。</p>
          </button>
          <button type="button" disabled={isProcessing} onClick={() => switchMode('one-product')}
            className={'rounded-sm border p-4 text-left ' + (mode === 'one-product' ? 'border-stone-900 bg-stone-100' : 'border-stone-200')}>
            <strong className="text-sm">{T("One product, many photos / 单款多图","单款产品，多张图片")}</strong>
            <p className="mt-1 text-xs text-stone-500">{T("All images belong to one SKU; first image is the cover.","所有图片归属同一 SKU，第一张作为主图。")}</p>
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="block text-xs font-bold uppercase text-stone-600">
            {T("Product Category","产品分类")}
            {fixedCategoryId ? (
              <div className="mt-2 w-full border border-stone-200 bg-stone-100 p-3 text-sm font-normal text-stone-900">
                {(() => {
                  const selected = categories.find(c => c.id === fixedCategoryId);
                  return selected
                    ? (lang === 'zh' ? (selected.title_cn || selected.title_zh || selected.title) : selected.title)
                    : T('Category unavailable','分类不存在');
                })()} · {T('Auto-selected','已自动关联')}
              </div>
            ) : (
              <select disabled={isProcessing || hasSaved} value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
                className="mt-2 w-full border border-stone-200 bg-white p-3 text-sm font-normal text-stone-900">
                <option value="">{T("Choose category","选择产品分类")}</option>
                {categories.map(category => <option key={category.id} value={category.id}>{lang === 'zh' ? (category.title_cn || category.title_zh || category.title) : category.title}</option>)}
              </select>
            )}
          </div>
          <fieldset className="border border-stone-200 p-3">
            <legend className="px-1 text-xs font-bold uppercase text-stone-600">{mode === 'many-products' ? '默认生产基地' : '生产基地'}</legend>
            {productionSiteOptions.map(site => (
              <label key={site.value} className="mr-5 inline-flex items-center gap-2 py-2 text-xs">
                <input type="checkbox" disabled={isProcessing || hasSaved} checked={selectedSites.includes(site.value)}
                  onChange={() => toggleSite(site.value)} />
                {site.label}
              </label>
            ))}
            {mode === 'many-products' && <p className="text-xs text-stone-500">{T("Applies to newly added products only. Choose at least one site on each product card.","默认生产基地仅对之后添加的产品生效；每个产品都必须选择生产基地。")}</p>}
          </fieldset>
        </div>

        {mode === 'one-product' && (
          <div className="grid gap-3 rounded-sm border border-stone-200 bg-stone-50 p-4 sm:grid-cols-2">
            {([
              ['name', '产品名称', '例如：白橡木餐桌'],
              ['code', 'SKU（必填）', 'PZ-DT-001'],
              ['material', '材质', '例如：白橡木'],
              ['size', '尺寸', '例如：72 × 36 × 30 英寸']
            ] as const).map(([field, label, hint]) => (
              <label key={field} className="block text-xs font-bold text-stone-600">
                {label}
                <input disabled={!canEditSingle || isProcessing} value={single[field]}
                  onChange={e => setSingle(prev => ({ ...prev, [field]: field === 'code' ? e.target.value.toUpperCase() : e.target.value }))}
                  placeholder={lang === 'zh' ? (field === 'name' ? '例如：白橡木餐桌' : field === 'material' ? '例如：白橡木' : hint) : hint} className="mt-2 w-full border border-stone-200 bg-white p-3 text-sm font-normal text-stone-900" />
              </label>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">{T("Image Queue:","图片队列：")} {rows.length}</h3>
            <p className="text-xs text-stone-500">支持常用图片格式，每张不超过 10 MB，最多 {MAX_FILES} 张</p>
          </div>
          <div className="flex gap-3">
            <input type="file" accept="image/*" multiple ref={inputRef} className="hidden" onChange={e => addFiles(e.target.files)} />
            <button type="button" disabled={isProcessing || hasSaved || rows.length >= MAX_FILES} onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 bg-stone-900 px-4 py-3 text-xs font-bold text-white disabled:opacity-40">
              <Upload size={15} /> 选择图片
            </button>
            {rows.length > 0 && !hasSaved && (
              <button type="button" disabled={isProcessing} onClick={() => {
                if (window.confirm(T('Clear all selected images and unsaved inputs?', '清空已选图片和未保存内容吗？'))) clearRows();
              }} className="border border-stone-200 px-4 py-3 text-xs">{T("Clear","清空")}</button>
            )}
          </div>
        </div>

        {rows.length > 0 && (
          <div className="max-h-[600px] space-y-3 overflow-y-auto pr-1">
            {rows.map((row, index) => (
              <div key={row.id} className="grid gap-4 rounded border border-stone-200 p-3 md:grid-cols-[108px_minmax(0,1fr)_auto]">
                <div>
                  <img src={row.previewUrl} alt={row.file.name} className="h-24 w-24 rounded-sm object-cover"/>
                  {mode === 'one-product' && index === 0 && <span className="text-[10px] font-bold text-green-700">{T("Cover / 主图","主图")}</span>}
                </div>
                <div className="min-w-0">
                  {mode === 'many-products' ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {([
                        ['name', '产品名称'],
                        ['code', 'SKU（必填）'],
                        ['material', '材质'],
                        ['size', '尺寸']
                      ] as const).map(([field, label]) => (
                        <label key={field} className="block text-[11px] font-bold text-stone-500">
                          {label}
                          <input disabled={isProcessing || row.status === 'saved' || row.status === 'verify'}
                            value={row[field]} onChange={e => updateRow(row.id, { [field]: field === 'code' ? e.target.value.toUpperCase() : e.target.value })}
                            className="mt-1 w-full border border-stone-200 p-2 text-xs font-normal text-stone-900" />
                        </label>
                      ))}
                      <fieldset className="border border-stone-200 p-2 sm:col-span-2">
                        <legend className="px-1 text-[11px] font-bold text-stone-600">生产基地（必选）</legend>
                        {productionSiteOptions.map(site => (
                          <label key={site.value} className="mr-5 inline-flex items-center gap-2 py-2 text-xs">
                            <input type="checkbox" disabled={isProcessing || row.status === 'saved' || row.status === 'verify'}
                              checked={row.production_sites.includes(site.value)}
                              onChange={() => updateRow(row.id, { production_sites: row.production_sites.includes(site.value)
                                ? row.production_sites.filter(value => value !== site.value)
                                : [...row.production_sites, site.value] })} />
                            {site.label}
                          </label>
                        ))}
                        {row.production_sites.length === 0 && <p className="text-xs text-red-700">{T("请选择至少一个生产基地。","请选择至少一个生产基地。")}</p>}
                      </fieldset>
                    </div>
                  ) : (
                    <div className="text-xs text-stone-600">{row.file.name}</div>
                  )}
                  <div className="mt-2 text-xs">
                    <strong className={row.status === 'saved' ? 'text-green-700' : row.status === 'error' || row.status === 'verify' ? 'text-red-700' : 'text-stone-500'}>
                      {row.status === 'saved' ? T('Draft saved','草稿已保存') : row.status === 'verify' ? T('Save uncertain – verify SKU before retry','保存结果未确认，请核实 SKU 后再重试') : row.status}
                    </strong>
                    {row.error && <p className="mt-1 break-words text-red-700">{row.error}</p>}
                  </div>
                  {row.status === 'verify' && mode === 'many-products' && (
                    <button type="button" onClick={() => verifyAndRetry(row.id)} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-amber-700">
                      <RotateCcw size={12}/> 已核实产品库，重新尝试
                    </button>
                  )}
                </div>
                <div className="flex flex-row gap-2 md:flex-col">
                  {mode === 'one-product' && (
                    <>
                      <button type="button" title={T('Move earlier','向前移动')} disabled={isProcessing || hasSaved || index === 0}
                        onClick={() => moveImage(index, -1)} className="rounded border border-stone-200 p-2 disabled:opacity-30"><ArrowUp size={15}/></button>
                      <button type="button" title={T('Move later','向后移动')} disabled={isProcessing || hasSaved || index === rows.length - 1}
                        onClick={() => moveImage(index, 1)} className="rounded border border-stone-200 p-2 disabled:opacity-30"><ArrowDown size={15}/></button>
                    </>
                  )}
                  {row.status !== 'saved' && (
                    <button type="button" title={T('Remove image','移除图片')} disabled={isProcessing}
                      onClick={() => deleteRow(row.id)} className="rounded border border-stone-200 p-2 text-red-600 disabled:opacity-30"><X size={15}/></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {hasUncertain && mode === 'one-product' && (
          <button type="button" onClick={() => verifyAndRetry()} className="inline-flex items-center gap-2 text-xs font-bold text-amber-700">
            <RotateCcw size={14}/> 已核实产品库中没有此 SKU，允许重试。
          </button>
        )}
        {feedback && <div role="alert" className="rounded-sm border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><AlertTriangle size={16} className="mr-2 inline"/>{feedback}</div>}
        {progress && <p role="status" className="flex items-center gap-2 text-sm text-stone-700"><Loader2 className="animate-spin" size={16}/>{progress}</p>}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-5">
          <p className="text-xs text-stone-500">{T("Draft only. No automatic review or publication. A failed D1 save may leave an unused file in R2.","仅创建草稿，不会自动审核或发布。保存失败可能在 R2 留下未引用的图片。")}</p>
          <div className="flex gap-3">
            <button type="button" disabled={isProcessing} onClick={leaveBatch}
              className="border border-stone-200 px-5 py-3 text-xs font-bold">{T("Back to Registry","返回产品列表")}</button>
            <button type="button" disabled={isProcessing || !rows.length || hasUncertain || rows.every(row => row.status === 'saved')}
              onClick={processBatch} className="inline-flex items-center gap-2 bg-stone-900 px-5 py-3 text-xs font-bold text-white disabled:opacity-40">
              {isProcessing ? <Loader2 size={15} className="animate-spin"/> : <Save size={15}/>}
              Validate & Create Drafts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchCreator;
