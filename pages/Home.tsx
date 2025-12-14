
import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  Anchor,
  Ruler,
  Factory,
  Settings,
  Truck,
  Square,
  PenTool,
  LayoutTemplate,
  Cpu,
  Database,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { usePublishedSiteConfig } from '../contexts/SiteConfigContext';
import { getAssetUrl } from '../utils/getAssetUrl';

const Home: React.FC = () => {
  /* =========================
     ✅ ALL HOOKS AT TOP LEVEL
  ========================= */
  const { t } = useLanguage();
  const [activeHub, setActiveHub] = useState<'cn' | 'kh'>('cn');
  const { config: site, loading } = usePublishedSiteConfig();

  /* =========================
     ✅ SAFE DERIVED DATA
  ========================= */
  const heroBg = getAssetUrl(site?.home?.hero?.image);
  const heroTitle = site?.home?.hero?.title || t.home.heroTitle;
  const factoryImg = getAssetUrl(site?.home?.factory?.image);
  const ctaBg = getAssetUrl(site?.home?.cta?.image);
  const hubCnImg = getAssetUrl(site?.home?.hub_cn?.image);
  const hubKhImg = getAssetUrl(site?.home?.hub_kh?.image);

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

  const currentHub = hubs.find((h) => h.id === activeHub) || hubs[0];

  /* =========================
     ✅ SAFE EARLY RETURN
     (NO HOOKS BELOW THIS)
  ========================= */
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-stone-900 text-stone-500">
        <Loader2 className="animate-spin mr-2" size={24} />
        Loading Configuration...
      </div>
    );
  }

  return (
    <>
      {/* ================= HERO ================= */}
      <section className="relative h-[100dvh] w-full overflow-hidden bg-stone-900 border-b-8 border-safety-700">
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
              <Link
                to="/capabilities"
                className="bg-safety-700 text-white px-8 py-4 uppercase text-xs font-bold flex items-center"
              >
                {t.home.heroBtnPrimary}
                <ArrowRight size={16} className="ml-2" />
              </Link>

              <Link
                to="/manufacturing"
                className="border border-stone-600 text-white px-8 py-4 uppercase text-xs font-bold"
              >
                {t.home.heroBtnSecondary}
              </Link>

              <Link
                to="/materials"
                className="text-stone-300 px-6 py-4 uppercase text-xs font-bold"
              >
                {t.home.heroBtnTertiary}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FACTORY ================= */}
      <section className="bg-stone-900 text-stone-200 grid grid-cols-1 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden">
          {factoryImg && (
            <img
              src={factoryImg}
              alt="Factory"
              className="w-full h-full object-cover opacity-80"
            />
          )}
        </div>

        <div className="p-12 flex flex-col justify-center">
          <span className="text-safety-700 uppercase text-xs mb-4">
            {t.home.factoryStrength}
          </span>
          <h2 className="font-serif text-3xl text-white mb-6">
            {t.home.strengthTitle}
          </h2>
          <p className="text-stone-400">{t.home.strengthDesc2}</p>
        </div>
      </section>

      {/* ================= GLOBAL HUBS ================= */}
      <section className="bg-white py-24">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h2 className="font-serif text-3xl mb-6">
              {t.home.globalHubs}
            </h2>

            {hubs.map((hub) => (
              <div
                key={hub.id}
                onClick={() => setActiveHub(hub.id as 'cn' | 'kh')}
                className={`cursor-pointer p-4 border-l-4 mb-4 ${
                  activeHub === hub.id
                    ? 'border-safety-700 bg-stone-50'
                    : 'border-stone-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {hub.icon}
                  <div>
                    <div className="font-bold">{hub.title}</div>
                    <div className="text-xs text-stone-400">
                      {hub.details}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="aspect-video border bg-stone-900">
            {currentHub?.image && (
              <img
                src={currentHub.image}
                alt={currentHub.title}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="relative py-32 bg-stone-900 text-center">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: ctaBg ? `url("${ctaBg}")` : undefined }}
        />
        <div className="relative z-10">
          <h2 className="font-serif text-4xl text-white mb-6">
            {t.home.readyToScale}
          </h2>
          <Link
            to="/inquire"
            className="inline-block bg-safety-700 text-white px-12 py-4 uppercase text-xs font-bold"
          >
            {t.common.startProject}
          </Link>
        </div>
      </section>
    </>
  );
};

export default Home;
