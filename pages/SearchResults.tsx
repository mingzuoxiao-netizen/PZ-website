
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { categories } from '../data/inventory';
import { useLanguage } from '../contexts/LanguageContext';
import { getAssetUrl } from '../utils/getAssetUrl';
import { normalizeProduct } from '../utils/normalizeProduct';

interface SearchResultItem {
  type: 'category' | 'subcategory' | 'variant';
  categoryTitle: string;
  name: string;
  description: string;
  image: string;
  link: string;
}

const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { t } = useLanguage();
  const [results, setResults] = useState<SearchResultItem[]>([]);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const foundItems: SearchResultItem[] = [];

    categories.forEach(cat => {
      // Check Main Category
      if (cat.title.toLowerCase().includes(lowerQuery) || cat.description.toLowerCase().includes(lowerQuery)) {
        foundItems.push({
          type: 'category',
          categoryTitle: cat.title,
          name: cat.title,
          description: cat.description,
          image: cat.image,
          link: `/collections?category=${cat.id}`
        });
      }

      // Check Subcategories
      cat.subCategories.forEach(sub => {
        if (sub.name.toLowerCase().includes(lowerQuery) || sub.description.toLowerCase().includes(lowerQuery)) {
           foundItems.push({
             type: 'subcategory',
             categoryTitle: cat.title,
             name: sub.name,
             description: sub.description,
             image: sub.image,
             link: `/collections?category=${cat.id}`
           });
        }

        // Check Variants
        if (sub.variants) {
          sub.variants.forEach(variant => {
            const variantMatch = variant.name.toLowerCase().includes(lowerQuery) || 
                                 (variant.description && variant.description.toLowerCase().includes(lowerQuery));
            
            if (variantMatch) {
              // STRICT NORMALIZATION
              const normalized = normalizeProduct(variant);

              foundItems.push({
                type: 'variant',
                categoryTitle: `${cat.title} / ${sub.name}`,
                name: normalized.name,
                description: normalized.description || '',
                // Ensure rendering uses images array source
                image: normalized.images[0] || '', 
                link: `/collections?category=${cat.id}&product=${normalized.id || normalized.name}`
              });
            }
          });
        }
      });
    });

    setResults(foundItems);
  }, [query]);

  return (
    <div className="bg-stone-50 min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-6 md:px-12">
        <h1 className="font-serif text-3xl text-stone-900 mb-8">
          {t.common.search}: "{query}"
        </h1>
        
        {results.length === 0 ? (
          <p className="text-stone-500">{t.common.searchRefine} (No results found)</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {results.map((item, idx) => (
               <Link to={item.link} key={idx} className="bg-white border border-stone-200 group hover:border-safety-700 transition-colors">
                  <div className="aspect-video bg-stone-100 relative overflow-hidden">
                     <img src={getAssetUrl(item.image)} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                     <span className="absolute top-2 left-2 bg-stone-900 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1">
                        {item.type}
                     </span>
                  </div>
                  <div className="p-6">
                     <div className="text-xs text-stone-400 uppercase font-bold tracking-widest mb-2">{item.categoryTitle}</div>
                     <h3 className="font-serif text-xl text-stone-900 mb-2">{item.name}</h3>
                     <p className="text-sm text-stone-500 line-clamp-2">{item.description}</p>
                  </div>
               </Link>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
