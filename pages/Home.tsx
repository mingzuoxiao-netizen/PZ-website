
import React from 'react';
import { ArrowRight, Box, Anchor, Ruler, Factory, Settings, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const Home: React.FC = () => {
  const { t, language } = useLanguage();

  return (
    <>
      {/* Hero Section - Industrial Power */}
      <section className="relative h-screen w-full overflow-hidden bg-zinc-900">
        {/* Background Video/Image - Dark, Moody Factory Floor */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat scale-100 animate-slow-pan"
          style={{ 
            // Image: A dark, moody shot of a CNC machine or vast factory floor
            backgroundImage: 'url("https://images.unsplash.com/photo-1565538810643-b5bdb714032a?q=80&w=2540&auto=format&fit=crop")', 
          }}
        >
          {/* Heavy Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/50 to-zinc-950/30"></div>
        </div>

        <div className="relative z-10 h-full container mx-auto px-6 md:px-12 flex flex-col justify-center">
          
          <div className="border-l-4 border-bronze-accent pl-8 animate-fade-in-up">
             <h2 className="text-bronze-accent font-bold tracking-[0.3em] uppercase text-sm md:text-base mb-6">
               {t.home.heroTitle}
             </h2>
             <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white font-bold leading-tight mb-8">
               PZ <br/>
               <span className="text-zinc-400">{t.home.heroSub}</span>
             </h1>
          </div>
          
          <p className="text-zinc-300 text-lg md:text-xl max-w-2xl mt-4 mb-12 font-light leading-relaxed pl-9 animate-fade-in-up delay-100">
             {t.home.strengthDesc1}
          </p>

          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-0 pl-9 animate-fade-in-up delay-200">
            <Link 
              to="/capacity" 
              className="bg-white text-zinc-950 px-10 py-5 tracking-widest uppercase text-xs font-bold flex items-center justify-center hover:bg-bronze-accent hover:text-white transition-colors min-w-[200px]"
            >
              {t.home.factoryProfile} <ArrowRight size={16} className="ml-3" />
            </Link>
            <Link 
              to="/collections" 
              className="border border-white/30 text-white px-10 py-5 tracking-widest uppercase text-xs font-bold flex items-center justify-center hover:bg-white hover:text-zinc-950 transition-colors min-w-[200px] md:ml-4"
            >
              {t.home.viewLibrary}
            </Link>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-12 left-12 md:left-20 animate-bounce hidden md:block">
           <div className="w-[1px] h-16 bg-white/20"></div>
        </div>
      </section>

      {/* Stats Strip - Black & Bold */}
      <section className="bg-zinc-950 text-white border-b border-zinc-800">
         <div className="container mx-auto px-6 md:px-12">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-zinc-800">
               <div className="py-12 px-6">
                  <span className="block text-4xl md:text-5xl font-serif text-bronze-accent mb-2">10+</span>
                  <span className="text-[10px] md:text-xs uppercase tracking-widest text-zinc-500 font-bold">{t.home.stats.exp}</span>
               </div>
               <div className="py-12 px-6">
                  <span className="block text-4xl md:text-5xl font-serif text-white mb-2">2</span>
                  <span className="text-[10px] md:text-xs uppercase tracking-widest text-zinc-500 font-bold">{t.home.stats.factories}</span>
               </div>
               <div className="py-12 px-6">
                  <span className="block text-4xl md:text-5xl font-serif text-white mb-2">1M+</span>
                  <span className="text-[10px] md:text-xs uppercase tracking-widest text-zinc-500 font-bold">{t.capacity.stats.sqft}</span>
               </div>
               <div className="py-12 px-6">
                  <span className="block text-4xl md:text-5xl font-serif text-white mb-2">30+</span>
                  <span className="text-[10px] md:text-xs uppercase tracking-widest text-zinc-500 font-bold">{t.home.stats.partners}</span>
               </div>
            </div>
         </div>
      </section>

      {/* Industrial Strength / Capability - Split Layout */}
      <section className="bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Image Side - Massive Machinery */}
            <div className="h-[500px] lg:h-auto relative bg-zinc-900 group overflow-hidden">
               <img 
                 src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=2070&auto=format&fit=crop" 
                 alt="Industrial Machinery" 
                 className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-1000 grayscale group-hover:grayscale-0"
               />
               <div className="absolute bottom-0 left-0 p-12">
                  <span className="text-white text-xs font-bold uppercase border border-white/30 px-3 py-1 mb-4 inline-block">{t.common.factory_01}</span>
                  <h3 className="text-white font-serif text-3xl">{t.common.location_cn}</h3>
               </div>
            </div>

            {/* Content Side */}
            <div className="p-12 lg:p-24 flex flex-col justify-center bg-zinc-50">
               <h3 className="text-bronze-accent font-bold tracking-[0.2em] uppercase text-xs mb-6 flex items-center">
                  <Box size={14} className="mr-2" />
                  {t.home.factoryStrength}
               </h3>
               <h2 className="font-serif text-4xl lg:text-5xl text-zinc-900 mb-8 leading-tight">
                  {t.home.strengthTitle}
               </h2>
               <div className="w-20 h-1 bg-zinc-900 mb-10"></div>
               <p className="text-zinc-600 mb-6 leading-relaxed text-lg font-light">
                  {t.home.strengthDesc2}
               </p>
               <ul className="space-y-4 mt-4 mb-10">
                  <li className="flex items-center text-zinc-800 font-medium">
                     <Factory className="mr-4 text-zinc-400" size={20} />
                     {t.manufacturing.machinery.autoFinish}
                  </li>
                  <li className="flex items-center text-zinc-800 font-medium">
                     <Ruler className="mr-4 text-zinc-400" size={20} />
                     {t.manufacturing.machinery.highPrecision}
                  </li>
                  <li className="flex items-center text-zinc-800 font-medium">
                     <Settings className="mr-4 text-zinc-400" size={20} />
                     {t.manufacturing.machinery.desc}
                  </li>
               </ul>
               <Link 
                 to="/capacity" 
                 className="text-zinc-900 font-bold uppercase tracking-widest text-xs border-b-2 border-zinc-900 pb-1 self-start hover:text-bronze-accent hover:border-bronze-accent transition-colors"
               >
                 {t.home.exploreMfg}
               </Link>
            </div>
        </div>
      </section>

      {/* Core Pillars - Image Grid (High Impact) */}
      <section className="bg-zinc-900 py-32 text-white">
        <div className="container mx-auto px-6 md:px-12">
           <div className="flex flex-col md:flex-row justify-between items-end mb-16">
              <div className="max-w-xl">
                 <h2 className="font-serif text-4xl text-white mb-4">{t.home.competencies}</h2>
                 <p className="text-zinc-400 font-light">
                    {t.home.strengthDesc1}
                 </p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
              {/* Card 1 */}
              <div className="group relative h-[400px] overflow-hidden bg-zinc-800 cursor-pointer">
                 <img 
                    src="https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=1000&auto=format&fit=crop" 
                    alt="Material" 
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-500 scale-100 group-hover:scale-110 transform"
                 />
                 <div className="absolute inset-0 p-8 flex flex-col justify-between">
                    <span className="text-bronze-accent font-mono text-xs">01</span>
                    <div>
                       <h3 className="font-serif text-2xl mb-2">{t.home.comp1Title}</h3>
                       <p className="text-zinc-300 text-sm leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-y-4 group-hover:translate-y-0">
                          {t.home.comp1Desc}
                       </p>
                    </div>
                 </div>
                 <div className="absolute inset-0 border border-white/10 group-hover:border-bronze-accent/50 transition-colors duration-500"></div>
              </div>

              {/* Card 2 */}
              <div className="group relative h-[400px] overflow-hidden bg-zinc-800 cursor-pointer">
                 <img 
                    src="https://images.unsplash.com/photo-1565610222536-ef125c59da2c?q=80&w=1000&auto=format&fit=crop" 
                    alt="Logistics" 
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-500 scale-100 group-hover:scale-110 transform"
                 />
                 <div className="absolute inset-0 p-8 flex flex-col justify-between">
                    <span className="text-bronze-accent font-mono text-xs">02</span>
                    <div>
                       <h3 className="font-serif text-2xl mb-2">{t.home.comp2Title}</h3>
                       <p className="text-zinc-300 text-sm leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-y-4 group-hover:translate-y-0">
                          {t.home.comp2Desc}
                       </p>
                    </div>
                 </div>
                 <div className="absolute inset-0 border border-white/10 group-hover:border-bronze-accent/50 transition-colors duration-500"></div>
              </div>

              {/* Card 3 */}
              <div className="group relative h-[400px] overflow-hidden bg-zinc-800 cursor-pointer">
                 <img 
                    src="https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=1000&auto=format&fit=crop" 
                    alt="Joinery" 
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-500 scale-100 group-hover:scale-110 transform"
                 />
                 <div className="absolute inset-0 p-8 flex flex-col justify-between">
                    <span className="text-bronze-accent font-mono text-xs">03</span>
                    <div>
                       <h3 className="font-serif text-2xl mb-2">{t.home.comp3Title}</h3>
                       <p className="text-zinc-300 text-sm leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-y-4 group-hover:translate-y-0">
                          {t.home.comp3Desc}
                       </p>
                    </div>
                 </div>
                 <div className="absolute inset-0 border border-white/10 group-hover:border-bronze-accent/50 transition-colors duration-500"></div>
              </div>
           </div>
        </div>
      </section>

      {/* Global Presence - Technical Map Look */}
      <section className="py-24 bg-zinc-100 border-t border-zinc-200">
        <div className="container mx-auto px-6 md:px-12">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div>
                 <h2 className="font-serif text-4xl text-zinc-900 mb-6">{t.home.globalHubs}</h2>
                 <p className="text-zinc-600 mb-8 leading-relaxed">
                   {t.home.globalDesc}
                 </p>
                 <div className="space-y-6">
                    <div className="bg-white p-6 border-l-4 border-bronze-accent shadow-sm">
                       <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-zinc-900 uppercase tracking-wider text-sm">{t.common.location_cn}</h4>
                          <Anchor size={16} className="text-zinc-400" />
                       </div>
                       <p className="text-xs text-zinc-500 font-mono">Guangdong Province • 645k Sq.Ft</p>
                    </div>
                    <div className="bg-white p-6 border-l-4 border-zinc-300 shadow-sm">
                       <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-zinc-900 uppercase tracking-wider text-sm">{t.common.location_kh}</h4>
                          <Truck size={16} className="text-zinc-400" />
                       </div>
                       <p className="text-xs text-zinc-500 font-mono">Kandal Province • Tariff Free • 398k Sq.Ft</p>
                    </div>
                 </div>
              </div>
              <div className="relative">
                 {/* Stylized Abstract Map Image or Industrial Schematic */}
                 <img 
                    src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2670&auto=format&fit=crop" 
                    alt="Global Architecture" 
                    className="w-full h-[400px] object-cover grayscale contrast-125"
                 />
                 <div className="absolute inset-0 bg-zinc-900/10 grid grid-cols-6 grid-rows-6">
                    {/* Grid Overlay for Technical feel */}
                    <div className="border-r border-b border-white/10"></div>
                    <div className="border-r border-b border-white/10"></div>
                    <div className="border-r border-b border-white/10"></div>
                    <div className="border-r border-b border-white/10"></div>
                    <div className="border-r border-b border-white/10"></div>
                    <div className="border-b border-white/10"></div>
                    {/* ... minimal grid ... */}
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Final CTA - Heavy footer lead-in */}
      <section className="bg-bronze-900 py-20 text-center">
         <div className="container mx-auto px-6">
            <h2 className="font-serif text-3xl md:text-5xl text-white mb-8">{t.home.readyToScale}</h2>
            <Link 
              to="/inquire" 
              className="inline-block bg-white text-bronze-900 px-12 py-4 font-bold uppercase tracking-widest text-sm hover:bg-zinc-200 transition-colors"
            >
              {t.common.startProject}
            </Link>
         </div>
      </section>
    </>
  );
};

export default Home;
