import React, { useCallback, useEffect, useState } from 'react';
import { Activity, ChevronDown, ChevronUp, RefreshCw, Search, ShieldAlert } from 'lucide-react';
import { adminFetch } from '../../../utils/adminFetch';

interface AuditEvent {
  id: string;
  created_at: string;
  actor_id: string;
  actor_username: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  status: 'pending' | 'success' | 'failed';
  http_status: number | null;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  changed_fields: string[];
}
interface AuditPage {
  items: AuditEvent[];
  total: number;
  page: number;
  limit: number;
}
interface Filters {
  actor: string;
  action: string;
  type: string;
  status: string;
  from: string;
  to: string;
}
const emptyFilters: Filters = { actor: '', action: '', type: '', status: '', from: '', to: '' };
const actionLabels: Record<string, string> = {
  'product.create': '新建产品',
  'product.update': '修改产品',
  'product.approve': '批准产品',
  'product.reject': '退回产品',
  'product.delete': '删除产品',
  'product.submit': '提交产品审核',
  'product.remove_image': '移除产品图片',
  'product.publish_catalog': '发布产品目录',
  'category.request_create': '申请新分类',
  'category.approve': '批准分类',
  'category.reject': '退回分类',
  'category.change_request': '申请修改分类',
  'category_change.approve': '批准分类修改',
  'category_change.reject': '退回分类修改',
  'category_change.reconcile': '分类修改对账',
  'site_config.save_draft': '保存网站内容草稿',
  'site_config.publish': '发布网站配置',
  'site_config.rollback': '回滚网站配置',
  'site_config.bootstrap': '初始化网站配置',
  'account.create': '创建账号',
  'account.update': '更改账号权限',
  'account.reset_password': '重置账号密码',
  'media.upload_image': '上传图片',
  'media.upload_pdf': '上传产品目录 PDF'
};
const types: Record<string, string> = {
  product: '产品', catalog: '产品目录', category_request: '分类申请',
  category_change: '分类修改', site_config: '网站配置', account: '账号', media: '文件'
};
const fields: Record<string, string> = {
  name: '英文名称', name_cn: '中文名称', category: '分类',
  sub_category: '子分类', material: '材质', size: '尺寸', finish: '表面处理',
  code: 'SKU', status: '产品状态', images_count: '产品图片数量',
  production_sites_count: '生产基地数量', created_by: '创建人 ID',
  updated_at: '最后修改时间', username: '账号名称', role: '账号角色',
  is_active: '账号状态', draft_revision: '草稿版本',
  published_revision: '发布修订号', published_version: '发布版本',
  'draft': '草稿', 'published': '已发布',
  title: '英文标题', title_cn: '中文标题', image: '图片链接',
  hidden: '是否隐藏', category_id: '分类 ID'
};
function displayDate(value: string) {
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? value : dt.toLocaleString('zh-CN');
}
function displayValue(value: unknown): string {
  if (value == null) return '—';
  if (typeof value === 'boolean') return value ? '是' : '否';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
function fieldLabel(key: string): string {
  if (key.startsWith('draft.')) return '草稿 · ' + key.slice(6);
  if (key.startsWith('published.')) return '已发布 · ' + key.slice(10);
  return fields[key] || key;
}
function changedValue(snapshot: Record<string, unknown>, key: string): unknown {
  if (key.startsWith('draft.') || key.startsWith('published.')) {
    const part = key.startsWith('draft.') ? 'draft_fields' : 'published_fields';
    const fieldKey = key.slice(key.startsWith('draft.') ? 6 : 10);
    const values = snapshot[part];
    return values && typeof values === 'object'
      ? (values as Record<string, unknown>)[fieldKey] : undefined;
  }
  return snapshot[key];
}
const AuditTimeline: React.FC = () => {
  const [draft, setDraft] = useState<Filters>(emptyFilters);
  const [applied, setApplied] = useState<Filters>(emptyFilters);
  const [result, setResult] = useState<AuditPage | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async (filters: Filters, targetPage: number) => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams({ page: String(targetPage), limit: '30' });
      (Object.keys(filters) as Array<keyof Filters>).forEach(key => {
        if (filters[key]) query.set(key, filters[key]);
      });
      const response = await adminFetch<AuditPage>('admin/audit-logs?' + query.toString());
      if (!Array.isArray(response?.items) || typeof response.total !== 'number') {
        throw new Error('操作日志服务器返回的数据格式不正确。');
      }
      setResult(response);
      setPage(targetPage);
      setExpanded(null);
    } catch (e: any) {
      setResult(null);
      setError(e?.message || '读取操作日志失败。');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(emptyFilters, 1); }, [load]);
  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    setApplied({ ...draft });
    void load(draft, 1);
  };
  const reset = () => {
    setDraft(emptyFilters);
    setApplied(emptyFilters);
    void load(emptyFilters, 1);
  };
  const totalPages = Math.max(1, Math.ceil((result?.total || 0) / 30));

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-24 space-y-5">
      <header className="bg-white border border-stone-200 p-6">
        <h2 className="font-serif text-2xl text-stone-900 flex items-center gap-3"><Activity size={24} className="text-amber-700" />操作日志</h2>
        <p className="text-sm text-stone-500 mt-2">
          查询后台实际操作及结果。只记录审计功能启用后的事件；操作人、时间和修改字段由服务器记录。
        </p>
        <p className="text-xs text-stone-500 mt-1">
          「处理中」表示服务器已保留记录，但操作结果尚未确认；这不代表操作成功。
        </p>
      </header>

      <form onSubmit={apply} className="bg-white border border-stone-200 p-5 grid md:grid-cols-3 xl:grid-cols-6 gap-3">
        <label className="text-xs font-semibold text-stone-600 flex flex-col gap-1">操作人
          <input value={draft.actor} maxLength={120} onChange={e => setDraft(x => ({ ...x, actor: e.target.value }))}
            placeholder="账号名称" className="border border-stone-200 p-2.5 text-sm font-normal" />
        </label>
        <label className="text-xs font-semibold text-stone-600 flex flex-col gap-1">操作类型
          <select value={draft.action} onChange={e => setDraft(x => ({ ...x, action: e.target.value }))}
            className="border border-stone-200 p-2.5 text-sm font-normal">
            <option value="">全部操作</option>
            {Object.entries(actionLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-stone-600 flex flex-col gap-1">数据类型
          <select value={draft.type} onChange={e => setDraft(x => ({ ...x, type: e.target.value }))}
            className="border border-stone-200 p-2.5 text-sm font-normal">
            <option value="">全部类型</option>
            {Object.entries(types).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-stone-600 flex flex-col gap-1">结果
          <select value={draft.status} onChange={e => setDraft(x => ({ ...x, status: e.target.value }))}
            className="border border-stone-200 p-2.5 text-sm font-normal">
            <option value="">全部结果</option>
            <option value="success">成功</option>
            <option value="failed">失败</option>
            <option value="pending">结果待确认</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-stone-600 flex flex-col gap-1">开始日期
          <input type="date" value={draft.from} onChange={e => setDraft(x => ({ ...x, from: e.target.value }))}
            className="border border-stone-200 p-2.5 text-sm font-normal" />
        </label>
        <label className="text-xs font-semibold text-stone-600 flex flex-col gap-1">结束日期
          <input type="date" value={draft.to} onChange={e => setDraft(x => ({ ...x, to: e.target.value }))}
            className="border border-stone-200 p-2.5 text-sm font-normal" />
        </label>
        <div className="flex items-center flex-wrap gap-2 md:col-span-3 xl:col-span-6">
          <button type="submit" disabled={loading} className="inline-flex gap-2 items-center bg-stone-900 text-white px-5 py-2.5 text-sm disabled:opacity-50">
            <Search size={15} />查询
          </button>
          <button type="button" disabled={loading} onClick={reset} className="border border-stone-200 px-5 py-2.5 text-sm disabled:opacity-50">重置</button>
          <button type="button" disabled={loading} onClick={() => void load(applied, page)}
            className="inline-flex items-center gap-2 border border-stone-200 px-5 py-2.5 text-sm disabled:opacity-50">
            <RefreshCw size={15} />刷新
          </button>
          <span className="text-xs text-stone-500 ml-auto">{result ? `共 ${result.total} 条记录` : '尚未读取'}</span>
        </div>
      </form>

      {error && <div role="alert" className="border border-red-200 bg-red-50 p-5 text-red-800 text-sm flex gap-3">
        <ShieldAlert size={19} className="flex-shrink-0" />
        <span>无法读取操作日志：{error}。请确认 Worker 已部署并执行 D1 审计表迁移。</span>
      </div>}

      <div className="bg-white border border-stone-200 divide-y divide-stone-100">
        {loading && <p className="p-8 text-center text-sm text-stone-500">正在读取真实操作记录…</p>}
        {!loading && result?.items.length === 0 && (
          <p className="p-10 text-center text-sm text-stone-500">当前筛选条件下没有操作记录；启用前的历史操作不会自动补齐。</p>
        )}
        {!loading && result?.items.map(item => (
          <article key={item.id} className="p-4 md:p-5">
            <div className="flex gap-3 justify-between items-start flex-wrap">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-stone-900">{actionLabels[item.action] || item.action}
                  <span className="text-xs font-normal text-stone-400 ml-2">· {types[item.entity_type] || item.entity_type}</span>
                </h3>
                <p className="text-xs text-stone-500 mt-2">
                  {displayDate(item.created_at)} · 操作人：{item.actor_username || item.actor_id}（{item.actor_role}）
                </p>
                {item.entity_id && <p className="font-mono text-xs text-stone-400 mt-1 break-all">对象 ID：{item.entity_id}</p>}
              </div>
              <div className="flex gap-3 items-center">
                <span className={'text-xs font-semibold ' + (item.status === 'success' ? 'text-emerald-700' : item.status === 'failed' ? 'text-red-700' : 'text-amber-700')}>
                  {item.status === 'success' ? '成功' : item.status === 'failed' ? '失败' : '结果待确认'}
                </span>
                <button type="button" onClick={() => setExpanded(x => x === item.id ? null : item.id)}
                  aria-expanded={expanded === item.id} className="border border-stone-200 px-3 py-2 text-xs inline-flex items-center gap-1">
                  {expanded === item.id ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}详情
                </button>
              </div>
            </div>
            {expanded === item.id && (
              <div className="mt-4 border-t border-stone-100 pt-4 text-xs space-y-3">
                <p className="text-stone-500">事件编号：{item.id} · HTTP 状态：{item.http_status ?? '尚未确认'}</p>
                <p className="font-semibold text-stone-700">变更字段：{item.changed_fields?.length ? item.changed_fields.map(fieldLabel).join('、') : '未提供字段级差异'}</p>
                {item.action === 'account.reset_password' && <p className="text-stone-500">出于安全考虑，不记录密码或密码哈希。</p>}
                {item.entity_type === 'site_config' && item.changed_fields?.length > 0 && (
                  <div className="border border-stone-200 divide-y divide-stone-100">
                    {item.changed_fields.map(field => (
                      <div key={field} className="grid md:grid-cols-[1.2fr_1fr_1fr] gap-2 text-xs p-3">
                        <span className="font-medium text-stone-700 break-words">{fieldLabel(field)}</span>
                        <span className="break-words text-stone-500">之前：{displayValue(changedValue(item.before || {}, field))}</span>
                        <span className="break-words text-stone-800">之后：{displayValue(changedValue(item.after || {}, field))}</span>
                      </div>
                    ))}
                  </div>
                )}
                {item.entity_type !== 'site_config' && (item.before && Object.keys(item.before).length > 0 || item.after && Object.keys(item.after).length > 0) && (
                  <div className="grid md:grid-cols-2 gap-4">
                    {([['操作前', item.before], ['操作后', item.after]] as const).map(([title, data]) => (
                      <div key={title} className="bg-stone-50 border border-stone-100 p-3 min-w-0">
                        <h4 className="font-semibold text-stone-700 mb-2">{title}</h4>
                        {Object.entries(data || {}).map(([key, value]) => (
                          <p key={key} className="mb-1 break-words text-stone-600">
                            <span className="text-stone-500">{fields[key] || key}：</span>{displayValue(value)}
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
      {!loading && result && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button type="button" disabled={loading || page <= 1} onClick={() => void load(applied, page - 1)}
            className="border border-stone-300 px-4 py-2 text-sm disabled:opacity-40">上一页</button>
          <span className="text-sm text-stone-500">第 {page} / {totalPages} 页</span>
          <button type="button" disabled={loading || page >= totalPages} onClick={() => void load(applied, page + 1)}
            className="border border-stone-300 px-4 py-2 text-sm disabled:opacity-40">下一页</button>
        </div>
      )}
    </div>
  );
};

export default AuditTimeline;
