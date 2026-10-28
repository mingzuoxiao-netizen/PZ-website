import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDownUp,
  CalendarDays,
  Inbox,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { adminFetch } from '../../../utils/adminFetch';

/** The existing ADMIN-protected GET /admin/inquiries endpoint is read-only. */
type ApiInquiry = {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
  // Optional: current Worker may only return the five fields above.
  company?: string | null;
  product_type?: string | null;
  status?: string | null;
  source?: string | null;
};

type Inquiry = {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  company: string;
  productType: string;
  status: string;
  source: string;
};

type InquiryResponse = { inquiries?: ApiInquiry[] };
type SortOrder = 'newest' | 'oldest';

// Display missing optional fields as unavailable, never invent a status.
const optionalText = (value: string | null | undefined) =>
  typeof value === 'string' && value.trim() ? value.trim() : '—';

const normalizeInquiry = (row: ApiInquiry): Inquiry => ({
  id: String(row.id ?? ''),
  name: optionalText(row.name),
  email: optionalText(row.email),
  message: optionalText(row.message),
  createdAt: String(row.created_at ?? ''),
  company: optionalText(row.company),
  productType: optionalText(row.product_type),
  status: optionalText(row.status),
  source: optionalText(row.source),
});

const dateValue = (value: string): number => {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatDate = (value: string) => {
  const timestamp = dateValue(value);
  if (!timestamp) return value || '—';
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestamp);
};

const InquiryManager: React.FC = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [order, setOrder] = useState<SortOrder>('newest');
  const [selected, setSelected] = useState<Inquiry | null>(null);

  const loadInquiries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminFetch<InquiryResponse>('admin/inquiries');
      if (!response || !Array.isArray(response.inquiries)) {
        throw new Error('Unexpected server response: inquiries list is missing.');
      }
      setInquiries(response.inquiries.map(normalizeInquiry));
    } catch (err) {
      // Keep the last successful list, and display a visible error instead
      // of quietly presenting it as fresh data.
      setError(err instanceof Error ? err.message : 'Unable to load inquiries.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInquiries();
  }, [loadInquiries]);

  useEffect(() => {
    if (!selected) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selected]);

  const filteredInquiries = useMemo(() => {
    const search = query.trim().toLowerCase();
    return inquiries
      .filter((inquiry) => !search || [
        inquiry.name, inquiry.email, inquiry.company,
        inquiry.productType, inquiry.message, inquiry.status,
      ].some((value) => value.toLowerCase().includes(search)))
      .sort((a, b) => order === 'newest'
        ? dateValue(b.createdAt) - dateValue(a.createdAt)
        : dateValue(a.createdAt) - dateValue(b.createdAt));
  }, [inquiries, query, order]);

  return (
    <section className="mx-auto max-w-[1500px] px-6 py-10 md:px-10" aria-labelledby="inquiry-heading">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <h1 id="inquiry-heading" className="font-serif text-3xl text-stone-900">Inquiry Management</h1>
            <span className="border border-stone-200 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-stone-500">Read only · V1</span>
          </div>
          <p className="text-sm text-stone-500">Customer submissions received through the PZ website.</p>
        </div>
        <button
          type="button"
          onClick={() => void loadInquiries()}
          disabled={loading}
          className="inline-flex items-center gap-2 border border-stone-200 bg-white px-5 py-3 text-xs font-bold uppercase tracking-widest text-stone-900 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="border border-stone-200 bg-white p-6">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-stone-500">Loaded inquiries</p>
          <div className="flex items-center gap-3">
            <Inbox size={23} className="text-orange-700" />
            <span className="font-serif text-3xl text-stone-900">{inquiries.length}</span>
          </div>
          <p className="mt-2 text-xs text-stone-400">The current API returns at most 500 recent records.</p>
        </div>
        <div className="border border-stone-200 bg-white p-6">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-stone-500">Most recent submission</p>
          <div className="flex items-center gap-3">
            <CalendarDays size={23} className="text-orange-700" />
            <span className="font-serif text-lg text-stone-900">
              {inquiries.length ? formatDate(inquiries.reduce((latest, item) =>
                dateValue(item.createdAt) > dateValue(latest) ? item.createdAt : latest,
              inquiries[0].createdAt)) : '—'}
            </span>
          </div>
          <p className="mt-2 text-xs text-stone-400">Dates are displayed in your browser's time zone.</p>
        </div>
      </div>

      <div className="border border-stone-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 p-5">
          <label className="relative block w-full max-w-md">
            <span className="sr-only">Search inquiries</span>
            <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, email, company, message..."
              className="w-full border border-stone-200 bg-stone-50 py-3 pl-10 pr-3 text-sm text-stone-900 outline-none focus:border-orange-600"
            />
          </label>
          <button
            type="button"
            onClick={() => setOrder((current) => current === 'newest' ? 'oldest' : 'newest')}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-600 hover:text-stone-900"
          >
            <ArrowDownUp size={15} /> {order === 'newest' ? 'Newest first' : 'Oldest first'}
          </button>
        </div>

        {error && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border-b border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
            <span className="flex items-center gap-2"><AlertCircle size={17} /> Failed to refresh: {error}</span>
            <button type="button" onClick={() => void loadInquiries()} className="font-bold underline">Try again</button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[790px] text-left text-sm">
            <thead className="bg-stone-50 text-[11px] uppercase tracking-wider text-stone-500">
              <tr>
                <th scope="col" className="px-5 py-4">Received</th>
                <th scope="col" className="px-5 py-4">Customer</th>
                <th scope="col" className="px-5 py-4">Company</th>
                <th scope="col" className="px-5 py-4">Product type</th>
                <th scope="col" className="px-5 py-4">Status</th>
                <th scope="col" className="px-5 py-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading && inquiries.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-16 text-center text-stone-500">
                  <span className="inline-flex items-center gap-2"><Loader2 size={18} className="animate-spin" /> Loading inquiries...</span>
                </td></tr>
              ) : !error && inquiries.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-16 text-center text-stone-500">No inquiries have been received yet.</td></tr>
              ) : filteredInquiries.length === 0 && !error ? (
                <tr><td colSpan={6} className="px-5 py-16 text-center text-stone-500">No inquiries match your search.</td></tr>
              ) : (
                filteredInquiries.map((inquiry) => (
                  <tr key={inquiry.id} className="hover:bg-stone-50">
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-stone-500">{formatDate(inquiry.createdAt)}</td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-stone-900">{inquiry.name}</div>
                      <div className="text-xs text-stone-500">{inquiry.email}</div>
                    </td>
                    <td className="px-5 py-4 text-stone-600">{inquiry.company}</td>
                    <td className="px-5 py-4 text-stone-600">{inquiry.productType}</td>
                    <td className="px-5 py-4 text-stone-600">{inquiry.status}</td>
                    <td className="px-5 py-4 text-right">
                      <button type="button" onClick={() => setSelected(inquiry)} className="text-xs font-bold uppercase tracking-wider text-orange-700 hover:underline" aria-label={`View inquiry from ${inquiry.name}`}>
                        View details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 px-5 py-3 text-xs text-stone-400">
          <span>Showing {filteredInquiries.length} of {inquiries.length} loaded inquiries</span>
          {loading && inquiries.length > 0 && <span className="flex items-center gap-1"><Loader2 size={13} className="animate-spin" /> Refreshing...</span>}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="inquiry-detail-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-stone-200 px-6 py-5">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-orange-700">Customer inquiry</p>
                <h2 id="inquiry-detail-title" className="font-serif text-2xl text-stone-900">{selected.name}</h2>
              </div>
              <button type="button" aria-label="Close details" autoFocus onClick={() => setSelected(null)} className="p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900"><X size={20} /></button>
            </div>
            <div className="grid gap-5 px-6 py-6 sm:grid-cols-2">
              <Detail label="Received" value={formatDate(selected.createdAt)} />
              <Detail label="Status" value={selected.status} />
              <Detail label="Company" value={selected.company} />
              <Detail label="Product type" value={selected.productType} />
              <Detail label="Email" value={selected.email} />
              <Detail label="Source" value={selected.source} />
              <div className="sm:col-span-2">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-stone-500">Customer message</p>
                <p className="whitespace-pre-wrap break-words border border-stone-100 bg-stone-50 p-4 text-sm leading-7 text-stone-800">{selected.message}</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-3 border-t border-stone-200 px-6 py-4">
              {selected.email !== '—' && (
                <a href={`mailto:${selected.email}`} className="inline-flex items-center gap-2 bg-stone-900 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-orange-700">
                  <Mail size={15} /> Email customer
                </a>
              )}
              <button type="button" onClick={() => setSelected(null)} className="border border-stone-200 px-5 py-3 text-xs font-bold uppercase tracking-wider text-stone-600 hover:bg-stone-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

const Detail: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-stone-500">{label}</p>
    <p className="break-words text-sm text-stone-900">{value || '—'}</p>
  </div>
);

export default InquiryManager;