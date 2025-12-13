
import React, { useState } from 'react';
import { ArrowRight, Anchor, Ruler, Factory, Settings, Truck, Square, PenTool, LayoutTemplate, Cpu, Database, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { usePublishedSiteConfig } from '../contexts/SiteConfigContext';

const Home: React.FC = () => {
  const { t } = useLanguage();
  const [activeHub, setActiveHub] = useState<'cn' | 'kh'>('cn');
  
  // ✅ REAL CMS: Hook returns structured configuration object via Context
  const { config: site, loading } = usePublishedSiteConfig();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-stone-900 text-stone-500">
        <Loader2 className="animate-spin mr-2" size={24} /> Loading Configuration...
      </div>
    );
  }

  // Access via structure with Optional Chaining for safety
  const heroBg = site.home?.hero?.image;
  const heroTitle = site.home?.hero?.title;
  const factoryImg = site.home?.factory?.image;
  const ctaBg = site.home?.cta?.image;
  const hubCnImg = site.home?.hub_cn?.image;
  const hubKhImg = site.home?.hub_kh?.image;

  const hubs = [
    {
      id: 'cn',
      title: t.common.location_cn,
      icon: <Anchor size={18} className={activeHub === 'cn' ? "text-safety-700" : "text-stone-500"} />,
      details: "Guangdong • 645k Sq.Ft",
      image: hubCnImg
    },
    {
      id: 'kh',
      title: t.common.location_kh,
      icon: <Truck size={18} className={activeHub === 'kh' ? "text-safety-700" : "text-stone-500"} />,
      details: "Kandal • Low Tariff",
      image: hubKhImg
    }
  ];

  const currentHub = hubs.find(h => h.id === activeHub) || hubs[0];

  return (
    <>
      {/* Hero Section - Heavy Industrial Cinematic */}
      <section className="relative h-screen w-full overflow-hidden bg-stone-900 border-b-8 border-safety-700">
        {/* Background Image with Slow Pan */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat scale-100 animate-slow-pan transition-opacity duration-700"
          style={{ 
            backgroundImage: `url("${heroBg}")`, 
          }}
        >
          {/* Clean Gradient Overlay - No Noise */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/60 to-stone-900/30"></div>
        </div>

        <div className="relative z-10 h-full container mx-auto px-6 md:px-12 flex flex-col justify-center">
          
          <div className="animate-fade-in-up max-w-4xl">
             {/* Technical Badge */}
             <div className="inline-flex items-center gap-3 mb-8 border border-white/20 bg-stone-950/80 backdrop-blur-sm px-4 py-2">
                <div className="w-2 h-2 bg-safety-700 animate-pulse rounded-full"></div>
                <span className="text-stone-300 text-xs font-mono tracking-widest uppercase">PZ.EST.2014</span>
             </div>
             
             <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white leading-[0.9] mb-8 drop-shadow-2xl">
               {heroTitle || t.home.heroTitle}
             </h1>
             
             <div className="flex items-start gap-6 mb-12">
                <div className="w-1 h-24 bg-safety-700 hidden md:block"></div>
                <p className="text-stone-300 text-lg md:text-xl font-light leading-relaxed max-w-2xl">
                  {t.home.strengthDesc1}
                </p>
             </div>

             <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
                {/* 1. FACTORY CAPABILITIES -> /capabilities */}
                <Link 
                  to="/capabilities" 
                  className="bg-safety-700 text-white px-8 py-4 tracking-widest uppercase text-xs font-bold hover:bg-white hover:text-stone-900 transition-all flex items-center justify-center group shadow-lg"
                >
                  {t.home.heroBtnPrimary} <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform"/>
                </Link>
                
                {/* 2. PRODUCTION PROCESS -> /manufacturing */}
                <Link 
                  to="/manufacturing" 
                  className="border border-stone-600 bg-stone-950/50 backdrop-blur text-white px-8 py-4 tracking-widest uppercase text-xs font-bold hover:border-white transition-colors flex items-center justify-center hover:bg-stone-900/80"
                >
                  {t.home.heroBtnSecondary}
                </Link>

                {/* 3. MATERIAL & WOOD LIBRARY -> /materials */}
                <Link 
                  to="/materials" 
                  className="border border-transparent text-stone-300 hover:text-white px-6 py-4 tracking-widest uppercase text-xs font-bold transition-colors flex items-center justify-center hover:bg-white/5"
                >
                  {t.home.heroBtnTertiary}
                </Link>
             </div>
          </div>
        </div>
        
        {/* Scrolling Ticker Bottom */}
        <div className="absolute bottom-0 w-full bg-stone-950 border-t border-stone-800 py-3 overflow-hidden">
            <div className="flex whitespace-nowrap text-[10px] font-mono text-stone-500 uppercase tracking-[0.3em] space-x-12 animate-pulse">
                <span>Precision CNC Milling</span>
                <span>/</span>
                <span>5-Axis Routing</span>
                <span>/</span>
                <span>FAS Hardwood Sourcing</span>
                <span>/</span>
                <span>Automated Finishing</span>
                <span>/</span>
                <span>ISO 9001 Certified</span>
                <span>/</span>
                <span>Precision CNC Milling</span>
                <span>/</span>
                <span>5-Axis Routing</span>
                <span>/</span>
                <span>FAS Hardwood Sourcing</span>
            </div>
        </div>
      </section>

      {/* Intro - Blueprint Style */}
      <section className="bg-stone-100 py-24 border-b border-stone-300 relative bg-grid bg-[length:40px_40px]">
         <div className="container mx-auto px-6 md:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-4 border-t-4 border-stone-900 pt-6">
                    <span className="font-mono text-xs text-safety-700 font-bold block mb-2">01 / MISSION</span>
                    <h2 className="font-serif text-3xl text-stone-900 leading-tight">
                        {t.home.heroQuote}
                    </h2>
                </div>
                <div className="lg:col-span-8">
                    <p className="text-stone-600 text-lg leading-relaxed font-light mb-8">
                        {t.home.strengthDesc2}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="bg-white p-4 border border-stone-200 shadow-sm">
                            <Cpu size={24} className="text-stone-400 mb-3"/>
                            <h4 className="font-bold text-stone-900 text-sm">Automation</h4>
                        </div>
                        <div className="bg-white p-4 border border-stone-200 shadow-sm">
                            <Ruler size={24} className="text-stone-400 mb-3"/>
                            <h4 className="font-bold text-stone-900 text-sm">Precision</h4>
                        </div>
                        <div className="bg-white p-4 border border-stone-200 shadow-sm">
                            <Database size={24} className="text-stone-400 mb-3"/>
                            <h4 className="font-bold text-stone-900 text-sm">Scalability</h4>
                        </div>
                        <div className="bg-white p-4 border border-stone-200 shadow-sm">
                            <LayoutTemplate size={24} className="text-stone-400 mb-3"/>
                            <h4 className="font-bold text-stone-900 text-sm">Design</h4>
                        </div>
                    </div>
                </div>
            </div>
         </div>
      </section>

      {/* Factory Strength - Dark Mode Industrial - FIXED VISIBILITY */}
      <section className="bg-stone-900 text-stone-200">
        <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Image Side - Removed mix-blend and increased opacity */}
            <div className="h-[600px] lg:h-auto relative overflow-hidden group border-r border-stone-800">
               <img 
                 src={factoryImg}
                 alt="Factory Interior" 
                 className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-80"
               />
               <div className="absolute inset-0 bg-stone-900/50"></div>
            </div>

            {/* Content Side */}
            <div className="p-12 lg:p-24 flex flex-col justify-center relative">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Settings size={200} />
               </div>

               <span className="text-safety-700 font-mono font-bold uppercase text-xs mb-6 flex items-center">
                  <Square size={10} className="mr-2 fill-current" />
                  {t.home.factoryStrength}
               </span>
               <h2 className="font-serif text-4xl text-white mb-10 leading-tight">
                  {t.home.strengthTitle}
               </h2>
               
               <div className="space-y-0 divide-y divide-stone-800 border-t border-b border-stone-800">
                  <div className="py-6 group hover:bg-stone-800/50 transition-colors px-4 -mx-4">
                     <div className="flex items-baseline justify-between mb-2">
                        <h4 className="font-bold text-white uppercase text-sm tracking-widest">{t.manufacturing.machinery.autoFinish}</h4>
                        <span className="font-mono text-xs text-stone-500">01</span>
                     </div>
                     <p className="text-stone-400 text-sm leading-relaxed max-w-md">
                        {t.home.strengthSection.autoFinishDesc}
                     </p>
                  </div>
                  
                  <div className="py-6 group hover:bg-stone-800/50 transition-colors px-4 -mx-4">
                     <div className="flex items-baseline justify-between mb-2">
                        <h4 className="font-bold text-white uppercase text-sm tracking-widest">{t.manufacturing.machinery.highPrecision}</h4>
                        <span className="font-mono text-xs text-stone-500">02</span>
                     </div>
                     <p className="text-stone-400 text-sm leading-relaxed max-w-md">
                        {t.home.strengthSection.highPrecisionDesc}
                     </p>
                  </div>

                  <div className="py-6 group hover:bg-stone-800/50 transition-colors px-4 -mx-4">
                     <div className="flex items-baseline justify-between mb-2">
                        <h4 className="font-bold text-white uppercase text-sm tracking-widest">{t.manufacturing.machinery.climate}</h4>
                        <span className="font-mono text-xs text-stone-500">03</span>
                     </div>
                     <p className="text-stone-400 text-sm leading-relaxed max-w-md">
                        {t.home.strengthSection.climateDesc}
                     </p>
                  </div>
               </div>
               
               <div className="mt-14">
                 <Link 
                   to="/manufacturing" 
                   className="text-white font-mono font-bold uppercase text-xs border border-stone-600 px-6 py-3 hover:bg-safety-700 hover:border-safety-700 transition-colors inline-flex items-center"
                 >
                   {t.home.exploreMfg} <ArrowRight size={14} className="ml-2" />
                 </Link>
               </div>
            </div>
        </div>
      </section>

      {/* Core Pillars - Industrial Cards */}
      <section className="bg-stone-200 py-32 relative">
        <div className="container mx-auto px-6 md:px-12">
           <div className="flex flex-col md:flex-row justify-between items-end mb-16 border-b border-stone-300 pb-6">
              <div>
                 <h2 className="font-serif text-4xl text-stone-900 mb-2">{t.home.competencies}</h2>
                 <p className="font-mono text-stone-500 text-xs">ESTABLISHED PROCESSES V.2024</p>
              </div>
              <Link to="/about" className="hidden md:flex items-center text-stone-900 hover:text-safety-700 text-xs font-bold uppercase tracking-widest transition-colors mt-6 md:mt-0">
                 More About Us <ArrowRight size={16} className="ml-2" />
              </Link>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
              {/* Card 1 */}
              <div className="bg-white p-10 hover:bg-stone-50 transition-colors group relative border-r border-stone-200">
                 <div className="absolute top-4 right-4 font-mono text-stone-300 text-4xl font-bold opacity-30 group-hover:opacity-100 transition-opacity">01</div>
                 <div className="mb-6 text-safety-700">
                    <LayoutTemplate size={32} strokeWidth={1.5} />
                 </div>
                 <h3 className="font-bold text-stone-900 mb-4 uppercase tracking-wide text-sm">{t.home.comp1Title}</h3>
                 <p className="text-stone-600 text-sm leading-relaxed mb-8 min-h-[60px]">
                     {t.home.comp1Desc}
                 </p>
                 <div className="h-1 w-12 bg-stone-200 group-hover:bg-safety-700 transition-colors"></div>
              </div>

              {/* Card 2 */}
              <div className="bg-white p-10 hover:bg-stone-50 transition-colors group relative border-r border-stone-200">
                 <div className="absolute top-4 right-4 font-mono text-stone-300 text-4xl font-bold opacity-30 group-hover:opacity-100 transition-opacity">02</div>
                 <div className="mb-6 text-safety-700">
                    <Truck size={32} strokeWidth={1.5} />
                 </div>
                 <h3 className="font-bold text-stone-900 mb-4 uppercase tracking-wide text-sm">{t.home.comp2Title}</h3>
                 <p className="text-stone-600 text-sm leading-relaxed mb-8 min-h-[60px]">
                     {t.home.comp2Desc}
                 </p>
                 <div className="h-1 w-12 bg-stone-200 group-hover:bg-safety-700 transition-colors"></div>
              </div>

              {/* Card 3 */}
              <div className="bg-white p-10 hover:bg-stone-50 transition-colors group relative">
                 <div className="absolute top-4 right-4 font-mono text-stone-300 text-4xl font-bold opacity-30 group-hover:opacity-100 transition-opacity">03</div>
                 <div className="mb-6 text-safety-700">
                    <PenTool size={32} strokeWidth={1.5} />
                 </div>
                 <h3 className="font-bold text-stone-900 mb-4 uppercase tracking-wide text-sm">{t.home.comp3Title}</h3>
                 <p className="text-stone-600 text-sm leading-relaxed mb-8 min-h-[60px]">
                     {t.home.comp3Desc}
                 </p>
                 <div className="h-1 w-12 bg-stone-200 group-hover:bg-safety-700 transition-colors"></div>
              </div>
           </div>
        </div>
      </section>

      {/* Global Presence - Map Style */}
      <section className="py-24 bg-white border-t border-stone-200">
        <div className="container mx-auto px-6 md:px-12">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div>
                 <span className="text-stone-400 font-mono text-xs mb-4 block">/// NETWORK</span>
                 <h2 className="font-serif text-4xl text-stone-900 mb-6">{t.home.globalHubs}</h2>
                 <p className="text-stone-600 mb-10 leading-relaxed text-lg">
                   {t.home.globalDesc}
                 </p>
                 
                 <div className="space-y-4">
                    {hubs.map((hub) => (
                      <div 
                        key={hub.id}
                        onClick={() => setActiveHub(hub.id as any)}
                        className={`
                          p-6 border-l-4 cursor-pointer transition-all duration-300 flex items-center justify-between
                          ${activeHub === hub.id 
                            ? 'border-safety-700 bg-stone-50 shadow-inner' 
                            : 'border-stone-200 hover:border-stone-400 hover:bg-stone-50'}
                        `}
                      >
                         <div className="flex items-center gap-4">
                            {hub.icon}
                            <div>
                                <h4 className={`font-bold uppercase tracking-wider text-sm ${activeHub === hub.id ? 'text-stone-900' : 'text-stone-500'}`}>
                                  {hub.title}
                                </h4>
                                <span className="text-xs text-stone-400 font-mono mt-1 block">{hub.details}</span>
                            </div>
                         </div>
                         {activeHub === hub.id && <ArrowRight size={16} className="text-safety-700" />}
                      </div>
                    ))}
                 </div>
              </div>
              
              <div className="relative h-[500px] shadow-2xl overflow-hidden border border-stone-900 bg-stone-900 p-2">
                 <div className="relative w-full h-full overflow-hidden">
                    <img 
                        key={activeHub}
                        src={currentHub.image} 
                        alt={currentHub.title} 
                        className="w-full h-full object-cover animate-fade-in filter contrast-125"
                    />
                    {/* Camera UI Overlay */}
                    <div className="absolute inset-0 pointer-events-none border border-white/10">
                        <div className="absolute top-4 left-4 text-white/80 font-mono text-[10px]">CAM_0{activeHub === 'cn' ? '1' : '2'} • LIVE FEED</div>
                        <div className="absolute bottom-4 right-4 text-safety-700 font-mono text-[10px] animate-pulse">● REC</div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-white/30 rounded-full flex items-center justify-center">
                            <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                        </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Stats - Metallic Texture Removed */}
      <section className="bg-stone-800 text-white py-20 relative border-t-4 border-safety-700">
         <div className="container mx-auto px-6 md:px-12 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
               <div className="text-center px-4 group">
                  <span className="block text-4xl md:text-5xl font-mono mb-2 group-hover:text-safety-700 transition-colors">10+</span>
                  <span className="text-xs uppercase tracking-widest text-stone-400 font-bold">{t.home.stats.exp}</span>
               </div>
               <div className="text-center px-4 group">
                  <span className="block text-4xl md:text-5xl font-mono mb-2 group-hover:text-safety-700 transition-colors">2</span>
                  <span className="text-xs uppercase tracking-widest text-stone-400 font-bold">{t.home.stats.factories}</span>
               </div>
               <div className="text-center px-4 group">
                  <span className="block text-4xl md:text-5xl font-mono mb-2 group-hover:text-safety-700 transition-colors">1M+</span>
                  <span className="text-xs uppercase tracking-widest text-stone-400 font-bold">{t.capacity.stats.sqft}</span>
               </div>
               <div className="text-center px-4 group">
                  <span className="block text-4xl md:text-5xl font-mono mb-2 group-hover:text-safety-700 transition-colors">30+</span>
                  <span className="text-xs uppercase tracking-widest text-stone-400 font-bold">{t.home.stats.partners}</span>
               </div>
            </div>
         </div>
      </section>

      {/* Final CTA - Wood & Steel */}
      <section className="py-32 text-center relative overflow-hidden bg-stone-900">
         {/* Background Texture - UPDATED to use getAsset */}
         <div 
             className="absolute inset-0 bg-cover bg-center opacity-20"
             style={{ backgroundImage: `url("${ctaBg}")` }}
         ></div>
         <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/90 to-transparent"></div>
         
         <div className="container mx-auto px-6 relative z-10">
            <span className="text-safety-700 text-xs font-bold font-mono uppercase tracking-[0.3em] mb-4 block">
                /// INITIATE_PARTNERSHIP
            </span>
            <h2 className="font-serif text-4xl md:text-6xl text-white mb-8">
               {t.home.readyToScale}
            </h2>
            <p className="text-stone-400 max-w-xl mx-auto mb-10 text-lg font-light">
               Execute your next program with precision.
            </p>
            <Link 
              to="/inquire" 
              className="inline-block bg-safety-700 text-white px-16 py-5 font-bold uppercase tracking-widest text-sm hover:bg-white hover:text-stone-900 transition-all duration-300 shadow-2xl border border-transparent hover:border-white"
            >
              {t.common.startProject}
            </Link>
         </div>
      </section>
    </>
  );
};

export default Home;
