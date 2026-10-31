import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { resolveImage } from '../utils/imageResolver';
import { fetchPublicCatalogPage } from '../utils/publicCatalog';
import type { ProductVariant } from '../types';
// Added ArrowRight to the imports from lucide-react
import { Loader2, Search as SearchIcon, PackageX, ArrowRight } from 'lucide-react';

interface SearchResultItem {
  type: 'category' | 'variant';
  categoryTitle: string;
  name: string;
  description: string;
  image: string;
  link: string;
  code?: string;
}

const toSearchItem = (p: ProductVariant): SearchResultItem => ({
  type: 'variant',
  categoryTitle: p.category || 'General',
  name: p.name,
  description: p.description || '',
  image: p.images[0] || '',
  link: '/portfolio?category=' + encodeURIComponent(p.category || '') +
    '&product=' + encodeURIComponent(p.id || p.code || ''),
  code: p.code
});

const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { t } = useLanguage();
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setResults([]);
    setNextCursor(null);
    if (!query.trim()) {
      setLoading(false);
      return () => controller.abort();
    }
    setLoading(true);
    fetchPublicCatalogPage({ q: query, limit: 24, signal: controller.signal })
      .then(page => {
        if (controller.signal.aborted) return;
        setResults(page.items.map(toSearchItem));
        setNextCursor(page.nextCursor);
      })
      .catch(e => {
        if (!controller.signal.aborted) console.error('Search failed', e);
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query]);

  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await fetchPublicCatalogPage({ q: query, limit: 24, cursor: nextCursor });
      setResults(previous => {
        const existing = new Set(previous.map(p => p.link));
        return [...previous, ...page.items.map(toSearchItem).filter(p => !existing.has(p.link))];
      });
      setNextCursor(page.nextCursor);
    } catch (e) {
      console.error('Additional search results failed', e);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="bg-stone-50 min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex items-center gap-4 mb-12 border-b border-stone-200 pb-8">
            <SearchIcon size={24} className="text-safety-700" />
            <h1 className="font-serif text-3xl md:text-5xl text-stone-900 tracking-tighter">
                {t.common.search}: <span className="italic">"{query}"</span>
            </h1>
        </div>

        {loading ? (
            <div className="py-40 flex flex-col items-center justify-center text-stone-400">
                <Loader2 className="animate-spin mb-4" size={32} />
                <p className="font-mono text-xs uppercase tracking-widest">Scanning Registry...</p>
            </div>
        ) : results.length === 0 ? (
          <div className="py-40 flex flex-col items-center justify-center text-stone-400 bg-white border border-dashed border-stone-200">
            <PackageX size={48} strokeWidth={1} className="mb-4 opacity-20" />
            <p className="font-mono text-sm uppercase tracking-widest mb-2">Zero Matches Found</p>
            <p className="text-stone-400 text-xs">{t.common.searchRefine}</p>
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
             {results.map((item, idx) => (
               <Link to={item.link} key={idx} className="bg-white border border-stone-200 group hover:border-safety-700 transition-all shadow-sm hover:shadow-xl rounded-sm overflow-hidden flex flex-col">
                  <div className="aspect-video bg-stone-100 relative overflow-hidden">
                     <img src={resolveImage(item.image)} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                     <div className="absolute top-4 left-4">
                        <span className="bg-stone-900 text-white text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-1 rounded-sm shadow-lg">
                            Archive Entry
                        </span>
                     </div>
                  </div>
                  <div className="p-8 flex-grow flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <div className="text-[10px] text-stone-400 uppercase font-bold tracking-[0.2em] font-mono">{item.categoryTitle}</div>
                        {item.code && <span className="text-[9px] font-mono font-bold text-safety-700">REF / {item.code}</span>}
                    </div>
                    <h3 className="font-serif text-2xl text-stone-900 mb-4 group-hover:text-safety-700 transition-colors leading-tight">{item.name}</h3>
                    <p className="text-sm text-stone-500 line-clamp-2 leading-relaxed mb-8 font-light italic">{item.description}</p>
                    <div className="mt-auto pt-6 border-t border-stone-50 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-stone-400 group-hover:text-stone-900 transition-colors">
                        <span>View Registry Details</span>
                        <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
               </Link>
             ))}
          </div>
          {nextCursor && (
            <div className="mt-14 text-center">
              <button onClick={handleLoadMore} disabled={loadingMore}
                className="bg-stone-900 text-white px-10 py-4 text-xs font-bold uppercase tracking-widest disabled:opacity-50">
                {loadingMore ? 'Loading...' : 'Load More Results'}
              </button>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchResults;