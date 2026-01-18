import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowRight,
  Anchor,
  Truck,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { usePublishedSiteConfig } from '../contexts/SiteConfigContext';
import { normalizeProducts } from '../utils/normalizeProduct';
import { API_BASE } from '../utils/siteConfig';
import { resolveImage } from '../utils/imageResolver';
import { categories as staticCategories } from '../data/inventory';
import { ProductVariant } from '../types';

const Home: React.FC = () => {
  const { t } = useLanguage();
  const [activeHub, setActiveHub] = useState<'cn' | 'kh'>('cn');
  const { config: site, loading: siteLoading, isFallback } = usePublishedSiteConfig();
  const [categoryProducts, setCategoryProducts] = useState<ProductVariant[]>([]);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        // Strictly follow /products per contract
        const response = await fetch(`${API_BASE}/products`);
        if (!response.ok) return;
        
        const json = await response.json();
        const rawData = json.products || json.data || (Array.isArray(json) ? json : []);
        setCategoryProducts(normalizeProducts(rawData));
      } catch (e) {
        // Silent fail for products fetch on home page
      }
    };
    fetchHomeData();
  }, []);

  // Use resolveImage to ensure all uploaded paths are correctly formatted
  const heroBg = resolveImage(site?.home?.hero?.image);
  const heroTitle = site?.home?.hero?.title || t.home.heroTitle;
  const factoryImg = resolveImage(site?.home?.factory?.image);
  const ctaBg = resolveImage(site?.home?.cta?.image);
  const hubCnImg = resolveImage(site?.home?.hub_cn?.image);
  const hubKhImg = resolveImage(site?.home?.hub_kh?.image);

  const hubs = useMemo(
    () => [
      {
        id: 'cn',
        title: t.common.location_cn,
        icon: <Anchor size={18} />,
        details: 'Guangdong • 645k Sq.Ft',
        image: hubCnImg,
      },
      {
        id: 'kh',
        title: t.common.location_kh,
        icon: <Truck size={18} />,
        details: 'Kandal • Low Tariff',
        image: hubKhImg,
      },
    ],
    [hubCnImg, hubKhImg, t]
  );

  const activeCategories = useMemo(() => {
      const productCategoryIds = new Set(categoryProducts.map(p => (p.category || '').toLowerCase().trim()));
      const sourceCategories = (site?.categories && site.categories.length > 0) ? site.categories : staticCategories;
      return sourceCategories.filter(cat => {
          const catId = cat.id.toLowerCase().trim();
          const catTitle = cat.title.toLowerCase().trim();
          return productCategoryIds.has(catId) || productCategoryIds.has(catTitle);
      }).slice(0, 3);
  }, [categoryProducts, site]);

  const currentHub = hubs.find((h) => h.id === activeHub) || hubs[0];

  if (siteLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-stone-900 text-stone-500 font-mono">
        <Loader2 className="animate-spin mr-3" size={20} />
        INITIALIZING_SYSTEM...
      </div>
    );
  }

  return (
    <>
      {isFallback && (
          <div className="bg-amber-600 text-white text-[10px] font-bold uppercase tracking-widest py-2 text-center fixed top-0 left-0 w-full z-[60] flex items-center justify-center gap-2">
              <AlertTriangle size={12} />
              Connection offline. Displaying static fallback content.
          </div>
      )}

      <section className={`relative h-[100dvh] w-full overflow-hidden bg-stone-900 border-b-8 border-safety-700 ${isFallback ? 'pt-6' : ''}`}>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: heroBg ? `url("${heroBg}")` : undefined }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/60 to-stone-900/40" />
        </div>

        <div className="relative z-10 h-full container mx-auto px-6 md:px-12 flex flex-col justify-center">
          <div className="max-w-4xl pt-20">
            <div className="inline-flex items-center gap-3 mb-6 border border-white/20 bg-stone-950/80 px-4 py-2">
              <span className="text-stone-300 text-xs font-mono tracking-widest">
                PZ.EST.2014
              </span>
            </div>
            <h1 className="font-serif text-4xl md:text-7xl text-white mb-6">
              {heroTitle}
            </h1>
            <p className="text-stone-300 max-w-xl mb-10">
              {t.home.strengthDesc1}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/collections" className="bg-safety-700 text-white px-8 py-4 uppercase text-xs font-bold flex items-center hover:bg-safety-600 transition-colors">
                Browse Collections <ArrowRight size={16} className="ml-2" />
              </Link>
              <Link to="/manufacturing" className="border border-stone-600 text-white px-8 py-4 uppercase text-xs font-bold hover:bg-white/10 transition-colors">
                {t.home.heroBtnSecondary}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED COLLECTIONS SECTION */}
      {activeCategories.length > 0 && (
          <section className="bg-stone-50 py-24">
              <div className="container mx-auto px-6 md:px-12">
                  <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-stone-200 pb-8 gap-4">
                      <div>
                          <h3 className="text-safety-700 font-bold uppercase tracking-widest text-xs mb-2">Our Work</h3>
                          <h2 className="font-serif text-3xl md:text-5xl text-stone-900">{t.home.featuredCollections}</h2>
                      </div>
                      <Link to="/collections" className="text-stone-400 hover:text-stone-900 text-xs font-bold uppercase tracking-widest flex items-center transition-colors pb-1">
                          View All Collections <ArrowRight size={14} className="ml-2" />
                      </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {activeCategories.map((cat) => (
                          <Link key={cat.id} to={`/collections?category=${cat.id}`} className="group block">
                              <div className="aspect-[4/5] bg-stone-200 overflow-hidden mb-6 shadow-md transition-all duration-700 group-hover:shadow-xl">
                                  <img src={resolveImage(cat.image)} alt={cat.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                              </div>
                              <h3 className="font-serif text-2xl text-stone-900 mb-1 group-hover:text-safety-700 transition-colors">{cat.title}</h3>
                              <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">{cat.subtitle}</p>
                          </Link>
                      ))}
                  </div>
              </div>
          </section>
      )}

      <section className="bg-stone-900 text-stone-200 grid grid-cols-1 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden">
          {factoryImg && (
            <img src={factoryImg} alt="Factory" className="w-full h-full object-cover opacity-80" />
          )}
        </div>
        <div className="p-12 flex flex-col justify-center">
          <span className="text-safety-700 uppercase text-xs mb-4">{t.home.factoryStrength}</span>
          <h2 className="font-serif text-3xl text-white mb-6">{t.home.strengthTitle}</h2>
          <p className="text-stone-400">{t.home.strengthDesc2}</p>
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h2 className="font-serif text-3xl mb-6">{t.home.globalHubs}</h2>
            {hubs.map((hub) => (
              <div
                key={hub.id}
                onClick={() => setActiveHub(hub.id as 'cn' | 'kh')}
                className={`cursor-pointer p-4 border-l-4 mb-4 transition-all ${activeHub === hub.id ? 'border-safety-700 bg-stone-50' : 'border-stone-200 hover:bg-stone-50/50'}`}
              >
                <div className="flex items-center gap-3">
                  {hub.icon}
                  <div>
                    <div className="font-bold">{hub.title}</div>
                    <div className="text-xs text-stone-400">{hub.details}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="aspect-video border bg-stone-900 overflow-hidden rounded-sm">
            {currentHub?.image && (
              <img src={currentHub.image} alt={currentHub.title} className="w-full h-full object-cover animate-fade-in" key={currentHub.id} />
            )}
          </div>
        </div>
      </section>

      <section className="relative py-32 bg-stone-900 text-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: ctaBg ? `url("${ctaBg}")` : undefined }} />
        <div className="relative z-10">
          <h2 className="font-serif text-4xl text-white mb-6">{t.home.readyToScale}</h2>
          <Link to="/inquire" className="inline-block bg-safety-700 text-white px-12 py-4 uppercase text-xs font-bold hover:bg-safety-600 transition-colors shadow-xl">
            {t.common.startProject}
          </Link>
        </div>
      </section>
    </>
  );
};

export default Home;