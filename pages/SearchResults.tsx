
import React, { useMemo, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, AlertCircle, ChevronRight, ArrowRight } from 'lucide-react';
import { categories } from '../data/inventory';
import { SubCategory, ProductVariant } from '../types';

interface SearchResultItem {
  type: 'subcategory' | 'variant';
  categoryTitle: string;
  name: string;
  description: string;
  image: string;
  link: string; // We will link to Collections with state if possible, or just note it
}

const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();
  const [localSearch, setLocalSearch] = useState(query);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearch.trim()) {
        navigate(`/search?q=${encodeURIComponent(localSearch)}`);
    }
  };

  const results = useMemo(() => {
    if (!query || query.trim().length < 2) return [];

    const lowerQuery = query.toLowerCase();
    const foundItems: SearchResultItem[] = [];

    categories.forEach(cat => {
      // Check Subcategories
      cat.subCategories.forEach(sub => {
        const subMatch = sub.name.toLowerCase().includes(lowerQuery) || sub.description.toLowerCase().includes(lowerQuery);
        
        if (subMatch) {
          foundItems.push({
            type: 'subcategory',
            categoryTitle: cat.title,
            name: sub.name,
            description: sub.description,
            image: sub.image,
            link: '/collections' // In a real app we'd deep link, here we just direct to collections
          });
        }

        // Check Variants
        if (sub.variants) {
          sub.variants.forEach(variant => {
            const variantMatch = variant.name.toLowerCase().includes(lowerQuery) || 
                                 (variant.description && variant.description.toLowerCase().includes(lowerQuery));
            
            if (variantMatch) {
              foundItems.push({
                type: 'variant',
                categoryTitle: `${cat.title} / ${sub.name}`,
                name: variant.name,
                description: variant.description || '',
                image: variant.image,
                link: '/collections'
              });
            }
          });
        }
      });
    });

    return foundItems;
  }, [query]);

  return (
    <div className="bg-stone-50 min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-6 md:px-12">
        
        {/* Header */}
        <div className="mb-12">
           <Link to="/" className="inline-flex items-center text-stone-500 hover:text-amber-700 mb-6 text-xs font-bold uppercase tracking-widest transition-colors">
              <ArrowLeft size={14} className="mr-2" /> Back Home
           </Link>
           
           <h1 className="font-serif text-3xl md:text-4xl text-stone-900 mb-8">
             Search Results
           </h1>

            {/* In-Page Search Bar for refinement */}
            <form onSubmit={handleSearchSubmit} className="relative max-w-2xl mb-12">
                <input 
                    type="text" 
                    placeholder="Refine your search..."
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    className="w-full bg-white text-xl font-serif text-[#281815] placeholder-stone-400 border border-stone-300 px-6 py-4 rounded-sm shadow-sm focus:border-[#a16207] focus:ring-1 focus:ring-[#a16207] focus:outline-none transition-all"
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a16207] hover:bg-[#a16207] hover:text-white p-2 rounded-full transition-colors">
                    <ArrowRight size={20} />
                </button>
            </form>

           {query && (
             <p className="text-stone-500 mt-2">
               Found {results.length} result{results.length !== 1 ? 's' : ''} for <span className="italic text-amber-700 font-serif">"{query}"</span>
             </p>
           )}
        </div>

        {/* Results Grid */}
        {results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {results.map((item, idx) => (
              <div key={idx} className="bg-white border border-stone-200 group hover:shadow-xl transition-all duration-300 flex flex-col">
                <div className="aspect-[4/3] w-full overflow-hidden bg-stone-100 relative">
                    <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                    <div className="absolute top-4 left-4">
                        <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm ${item.type === 'variant' ? 'bg-amber-700' : 'bg-stone-800'}`}>
                            {item.type}
                        </span>
                    </div>
                </div>
                <div className="p-6 flex-grow flex flex-col">
                    <div className="text-[10px] text-stone-400 uppercase tracking-widest mb-2 font-bold truncate">
                        {item.categoryTitle}
                    </div>
                    <h3 className="font-serif text-xl text-stone-900 mb-3 group-hover:text-amber-700 transition-colors">
                        {item.name}
                    </h3>
                    <p className="text-stone-500 text-sm leading-relaxed mb-6 line-clamp-3">
                        {item.description}
                    </p>
                    
                    <div className="mt-auto pt-4 border-t border-stone-100">
                         <Link to="/collections" className="text-xs font-bold uppercase tracking-widest text-stone-900 flex items-center group-hover:text-amber-700 transition-colors">
                            View Collection <ChevronRight size={14} className="ml-1" />
                         </Link>
                    </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 text-center border border-stone-200 rounded-sm">
             <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-stone-100 text-stone-400 mb-6">
                <Search size={32} />
             </div>
             <h3 className="font-serif text-2xl text-stone-900 mb-2">No matches found</h3>
             <p className="text-stone-500 mb-8 max-w-md mx-auto">
               We couldn't find any products matching "{query}". Try checking for typos or using broader terms like "Chair", "Table", or "Oak".
             </p>
             <Link 
               to="/collections" 
               className="inline-block bg-stone-900 text-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-amber-700 transition-colors"
             >
               Browse Full Catalog
             </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
