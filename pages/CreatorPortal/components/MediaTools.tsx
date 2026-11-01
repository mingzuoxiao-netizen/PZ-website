import React, { useState } from 'react';
import { AlertTriangle, FileSearch, RefreshCw, ShieldCheck } from 'lucide-react';
import { adminFetch } from '../../../utils/adminFetch';

type CheckResult = {
  key: string;
  exists: boolean | null;
  references: Record<string, number>;
  confirmedReferences: number;
  unchecked: string[];
  safeToDelete: false;
  message: string;
};

/**
 * Read-only media usage inspector.
 * Intentionally does not implement R2 DELETE: unlisted historical R2
 * snapshots and external links could still reference an image.
 */
const MediaTools: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<CheckResult | null>(null);

  async function inspect() {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await adminFetch<CheckResult>(
        'admin/media/image-usage?url=' + encodeURIComponent(url.trim())
      );
      if (!data || data.safeToDelete !== false || !data.references) {
        throw new Error('检查结果不完整，请勿删除图片。');
      }
      setResult(data);
    } catch (err: any) {
      setError(err?.message || '检查失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="border border-stone-200 bg-white p-6">
      <h3 className="font-serif text-xl text-stone-900 flex gap-2 items-center">
        <FileSearch size={20}/> 云端图片引用检查（只读）
      </h3>
      <p className="mt-2 text-sm text-stone-600">
        粘贴一条本网站上传图片的完整 CDN 地址，查看是否仍被产品或网站配置使用。
        此工具不执行永久删除。
      </p>
      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <input value={url} onChange={e => setUrl(e.target.value)}
          className="flex-1 border border-stone-200 p-3 text-sm"
          placeholder="https://cdn.peng-zhan.com/uploads%2F..." aria-label="图片 CDN 地址"/>
        <button type="button" onClick={() => void inspect()} disabled={loading || !url.trim()}
          className="bg-stone-900 text-white px-5 py-3 text-sm disabled:opacity-40 flex items-center justify-center gap-2">
          {loading ? <RefreshCw size={15} className="animate-spin"/> : <ShieldCheck size={15}/>}
          检查引用
        </button>
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
      {result && <div className="mt-5 space-y-2 text-sm">
        <p>R2 文件状态：{result.exists === true ? '存在' : result.exists === false ? '未找到' : '未能确认'}</p>
        <p>检测到的引用：<strong>{result.confirmedReferences}</strong> 处（已知数据源）</p>
        {Object.entries(result.references).map(([source, count]) =>
          <p key={source} className="text-stone-600">{source}：{count}</p>
        )}
        <div className="bg-amber-50 border border-amber-200 p-4 text-amber-900 flex items-start gap-2">
          <AlertTriangle size={18} className="shrink-0"/>
          <p>无论检查结果是否为零，都不代表可以永久删除。历史快照、外部链接和缓存可能仍使用图片。
          尚未覆盖：{result.unchecked.join('、') || '无' }。请勿直接在 R2 中清理。</p>
        </div>
      </div>}
    </section>
  );
};

export default MediaTools;
