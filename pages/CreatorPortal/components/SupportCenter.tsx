import React, { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, ChevronDown, HelpCircle, Search, X } from 'lucide-react';
import {
  searchSupportTopics,
  supportSections,
  supportTopics,
  type SupportRole,
} from '../supportContent';

interface SupportCenterProps {
  role: SupportRole;
  onNavigate: (tab: string) => void;
}

const suggestions: Record<SupportRole, string[]> = {
  FACTORY: ['ZIP 文件如何上传', '图片没有匹配 SKU', '批量提交审核', '产品被退回'],
  SUPERVISOR: ['产品初审', '安全批量初审', '退回员工', '团队账号'],
  ADMIN: ['产品终审发布', '新品类发布', '永久删除 SKU', '操作日志'],
};

const SupportCenter: React.FC<SupportCenterProps> = ({ role, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [section, setSection] = useState('');
  const [expanded, setExpanded] = useState<string[]>([]);
  const sections = supportSections[role];
  const countBySection = useMemo(() => {
    const count: Record<string, number> = {};
    for (const topic of supportTopics) {
      if (topic.role === role) count[topic.section] = (count[topic.section] || 0) + 1;
    }
    return count;
  }, [role]);
  const allCount = Object.values(countBySection).reduce((sum, count) => sum + count, 0);
  const matches = useMemo(() => searchSupportTopics(role, query, section), [role, query, section]);

  const clearSearch = () => { setQuery(''); setSection(''); setExpanded([]); };
  const toggle = (id: string) => {
    setExpanded(current => current.includes(id) ? current.filter(openId => openId !== id) : [...current, id]);
  };

  return (
    <section className="space-y-6" aria-label="支持中心">
      <div className="overflow-hidden rounded-lg border border-[#e8ded7] bg-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 bg-[#f7f2ed] px-5 py-6 md:px-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#805036] text-white">
              <BookOpen size={24} aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-semibold text-[#243247]">支持中心 <span className="text-sm font-normal text-stone-500">Support</span></h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">按照后台模块查找操作指南，或输入问题直接搜索。展开指南查看操作步骤。</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#e4d2c2] bg-white px-3 py-1 text-xs font-medium text-[#754831]">
            <HelpCircle size={15} aria-hidden="true" /> {allCount} 篇操作指南
          </span>
        </div>
        <div className="p-5 md:px-8 md:py-6">
          <label htmlFor="pz-support-search" className="mb-2 block text-sm font-semibold text-stone-800">搜索操作说明</label>
          <div className="relative max-w-3xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} aria-hidden="true" />
            <input id="pz-support-search" type="search" autoComplete="off" value={query} onChange={event => setQuery(event.target.value)}
              placeholder="例如：ZIP 文件如何上传、图片不匹配 SKU、产品怎么退回……"
              className="w-full rounded-md border border-stone-300 bg-white py-3 pl-12 pr-12 text-sm text-stone-900 outline-none transition focus:border-[#805036] focus:ring-2 focus:ring-[#e4d2c2]" />
            {query && <button type="button" aria-label="清除搜索" onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-stone-500 hover:bg-stone-100 hover:text-stone-900">
              <X size={18} aria-hidden="true" />
            </button>}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-stone-500">
            <span>常见问题</span>
            {suggestions[role].map(suggestion => <button type="button" key={suggestion}
              onClick={() => { setSection(''); setQuery(suggestion); }}
              className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 font-medium text-[#754831] transition hover:border-[#d0ae93] hover:bg-[#f7f2ed] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#805036]">
              {suggestion}
            </button>)}
          </div>
        </div>
      </div>

      <div className="grid min-w-0 gap-5 lg:grid-cols-[235px_minmax(0,1fr)]">
        <nav aria-label="支持中心模块" className="h-fit rounded-lg border border-stone-200 bg-white p-3 shadow-sm">
          <p className="px-3 py-2 text-xs font-bold tracking-wide text-stone-500">按模块查看</p>
          <button type="button" onClick={() => setSection('')} aria-current={!section ? 'true' : undefined}
            className={'flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#805036] ' +
              (!section ? 'bg-[#f7f2ed] font-semibold text-[#805036]' : 'text-stone-700 hover:bg-stone-100')}>
            <span>全部模块</span><span className="text-xs">{allCount}</span>
          </button>
          {sections.map(item => <button key={item.id} type="button" onClick={() => setSection(item.id)}
            aria-current={section === item.id ? 'true' : undefined}
            className={'flex w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#805036] ' +
              (section === item.id ? 'bg-[#f7f2ed] font-semibold text-[#805036]' : 'text-stone-700 hover:bg-stone-100')}>
            <span>{item.label}</span><span className="shrink-0 text-xs text-stone-500">{countBySection[item.id] || 0}</span>
          </button>)}
        </nav>

        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <h3 className="text-lg font-semibold text-[#243247]">{sections.find(item => item.id === section)?.label || '全部操作指南'}</h3>
            <p role="status" className="text-xs text-stone-500">找到 {matches.length} 篇</p>
          </div>
          {!matches.length && <div className="rounded-lg border border-stone-200 bg-white px-6 py-10 text-center shadow-sm">
            <Search size={28} className="mx-auto text-stone-400" aria-hidden="true" />
            <p className="mt-3 font-semibold text-stone-800">没有找到匹配的操作指南</p>
            <p className="mt-1 text-sm text-stone-500">试试「ZIP」「图片」「审核」等关键词，或查看全部模块。</p>
            <button type="button" onClick={clearSearch} className="mt-5 rounded bg-[#243247] px-4 py-2 text-sm font-medium text-white">查看全部指南</button>
          </div>}
          {matches.map((topic, index) => {
            const isOpen = expanded.includes(topic.id) || (query.trim().length > 0 && !expanded.includes('closed:' + topic.id));
            const toggleArticle = () => {
              if (!query.trim()) { toggle(topic.id); return; }
              setExpanded(current => isOpen
                ? [...current.filter(id => id !== topic.id), 'closed:' + topic.id]
                : [...current.filter(id => id !== 'closed:' + topic.id), topic.id]);
            };
            const label = sections.find(item => item.id === topic.section)?.label || '操作指南';
            return <article key={topic.id} className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
              <h4>
                <button type="button" aria-expanded={isOpen} aria-controls={'pz-support-steps-' + topic.id}
                  onClick={toggleArticle} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#805036] md:px-6">
                  <span className="flex min-w-0 flex-1 items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[#f7f2ed] text-xs font-semibold text-[#805036]">{index + 1}</span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold leading-6 text-[#243247] md:text-base">{topic.title}</span>
                      <span className="mt-1 block text-xs text-stone-500">{label} · {topic.steps.length} 个步骤</span>
                    </span>
                  </span>
                  <ChevronDown className={'shrink-0 text-stone-500 transition-transform ' + (isOpen ? 'rotate-180' : '')} size={20} aria-hidden="true" />
                </button>
              </h4>
              {isOpen && <div id={'pz-support-steps-' + topic.id} className="border-t border-stone-100 px-5 pb-5 pt-4 md:px-6">
                <ol className="space-y-3" aria-label={topic.title + '操作步骤'}>
                  {topic.steps.map((step, stepIndex) => <li key={stepIndex} className="flex items-start gap-3 text-sm leading-6 text-stone-700">
                    <span aria-hidden="true" className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-semibold text-[#805036]">{stepIndex + 1}</span>
                    <span>{step}</span>
                  </li>)}
                </ol>
                {topic.destination && <div className="mt-5 border-t border-stone-100 pt-4">
                  <button type="button" onClick={() => onNavigate(topic.destination!)}
                    className="inline-flex items-center gap-2 rounded bg-[#243247] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#805036] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#805036]">
                    {topic.destinationLabel || '前往对应功能'}<ArrowRight size={15} aria-hidden="true" />
                  </button>
                </div>}
              </div>}
            </article>;
          })}
        </div>
      </div>
    </section>
  );
};

export default SupportCenter;
