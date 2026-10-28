
import React, { useState } from 'react';
import { Settings, Cpu, Layers, CheckCircle2, Hammer, Package, Ruler } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { usePublishedSiteConfig } from '../contexts/SiteConfigContext';

const Manufacturing: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'process' | 'machinery' | 'qc'>('process');
  const { config } = usePublishedSiteConfig();

  const processIcons = [
    <Layers size={24} />,
    <Hammer size={24} />,
    <Cpu size={24} />,
    <Layers size={24} />,
    <Settings size={24} />,
    <Package size={24} />
  ];

  /* --- REUSABLE COMPONENT BLOCKS --- */

  const ProcessSection = () => (
    <div className="animate-fade-in py-12">
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {t.manufacturing.steps.map((proc, idx) => (
            <div key={idx} className="group bg-white p-8 border border-stone-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
               <div className="flex items-center justify-between mb-6 border-b border-stone-100 pb-4">
                  <span className="text-4xl font-serif text-stone-200 group-hover:text-amber-700 transition-colors">0{idx + 1}</span>
                  <div className="text-stone-300 group-hover:text-stone-900 transition-colors bg-stone-50 p-3 rounded-full">
                     {processIcons[idx % processIcons.length]}
                  </div>
               </div>
               <h3 className="font-bold text-lg text-stone-900 mb-3 uppercase tracking-wide">{proc.title}</h3>
               <p className="text-stone-500 text-sm leading-relaxed">
                  {proc.desc}
               </p>
            </div>
          ))}
       </div>
    </div>
  );

  const MachinerySection = () => (
    <div className="animate-fade-in -mx-6 md:-mx-12 px-6 md:px-12 py-20 bg-stone-900 text-white">
       <div className="flex flex-col md:flex-row items-center gap-12 mb-16">
          <div className="flex-1 order-2 md:order-1">
             <div className="inline-block px-3 py-1 bg-amber-900/30 border border-amber-700/50 text-amber-500 text-xs font-mono font-bold uppercase tracking-widest mb-4">
                PZ.TECH.SYSTEM
             </div>
             <h3 className="font-serif text-3xl md:text-4xl text-white mb-6">{t.manufacturing.machinery.title}</h3>
             <p className="text-stone-400 leading-relaxed mb-8 text-base">
                {t.manufacturing.machinery.desc}
             </p>
             <ul className="space-y-4 font-mono text-sm text-stone-300">
                <li className="flex items-center">
                   <div className="w-1.5 h-1.5 bg-amber-500 mr-4"></div> {t.manufacturing.machinery.highPrecision}
                </li>
                <li className="flex items-center">
                   <div className="w-1.5 h-1.5 bg-amber-500 mr-4"></div> {t.manufacturing.machinery.autoFinish}
                </li>
                <li className="flex items-center">
                   <div className="w-1.5 h-1.5 bg-amber-500 mr-4"></div> {t.manufacturing.machinery.climate}
                </li>
             </ul>
          </div>
          <div className="flex-1 w-full h-[400px] bg-stone-800 border border-stone-700 p-1 order-1 md:order-2 relative group">
             <div className="absolute top-4 left-4 z-10 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
             <img 
                src={config.manufacturing?.hero_machinery}
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                alt="Machinery" 
             />
             <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none"></div>
          </div>
       </div>
       
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.manufacturing.machineryList.map((m, idx) => (
             <div key={idx} className="bg-stone-800/50 border border-stone-700 p-8 hover:bg-stone-800 transition-colors group">
                <div className="text-[10px] font-mono text-amber-500 mb-2 tracking-widest uppercase">{m.type}</div>
                <h4 className="text-white font-bold text-lg mb-3">{m.name}</h4>
                <p className="text-stone-400 text-sm leading-relaxed">{m.desc}</p>
             </div>
          ))}
       </div>
    </div>
  );

  const QCSection = () => (
    <div className="animate-fade-in py-12">
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20 items-center">
          <div className="order-2 lg:order-1">
             <span className="text-amber-700 font-bold uppercase tracking-widest text-xs mb-4 block">Quality Assurance</span>
             <h3 className="font-serif text-4xl text-stone-900 mb-8">{t.manufacturing.qc.title}</h3>
             <p className="text-stone-600 mb-10 leading-relaxed text-lg font-light">
                {t.manufacturing.qc.desc}
             </p>
             
             <div className="space-y-8">
                <div className="flex gap-6 p-6 bg-white border border-stone-100 shadow-sm rounded-sm">
                   <div className="flex-shrink-0 mt-1 text-green-700">
                       <CheckCircle2 size={32} />
                   </div>
                   <div>
                      <h4 className="font-bold text-stone-900 text-sm uppercase tracking-widest mb-2">{t.manufacturing.qc.iqc}</h4>
                      <p className="text-stone-500 text-sm">{t.manufacturing.qc.iqcDesc}</p>
                   </div>
                </div>
                <div className="flex gap-6 p-6 bg-white border border-stone-100 shadow-sm rounded-sm">
                   <div className="flex-shrink-0 mt-1 text-blue-700">
                       <Ruler size={32} />
                   </div>
                   <div>
                      <h4 className="font-bold text-stone-900 text-sm uppercase tracking-widest mb-2">{t.manufacturing.qc.ipqc}</h4>
                      <p className="text-stone-500 text-sm">{t.manufacturing.qc.ipqcDesc}</p>
                   </div>
                </div>
                <div className="flex gap-6 p-6 bg-white border border-stone-100 shadow-sm rounded-sm">
                   <div className="flex-shrink-0 mt-1 text-amber-700">
                       <Package size={32} />
                   </div>
                   <div>
                      <h4 className="font-bold text-stone-900 text-sm uppercase tracking-widest mb-2">{t.manufacturing.qc.fqc}</h4>
                      <p className="text-stone-500 text-sm">{t.manufacturing.qc.fqcDesc}</p>
                   </div>
                </div>
             </div>
          </div>
          
          <div className="order-1 lg:order-2 relative h-[600px] w-full bg-stone-200 rounded-sm overflow-hidden shadow-2xl">
             <img 
               src={config.manufacturing?.hero_qc}
               className="w-full h-full object-cover" 
               alt="QC Lab"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-stone-900/50 to-transparent"></div>
             <div className="absolute bottom-8 left-8 bg-white/90 backdrop-blur px-6 py-4 border-l-4 border-green-600">
                <span className="block text-xs font-bold uppercase tracking-widest text-stone-500">Standard</span>
                <span className="block text-xl font-serif text-stone-900">AQL 2.5 / 4.0</span>
             </div>
          </div>
       </div>
    </div>
  );

  return (
    <div className="bg-stone-50 min-h-screen pt-28 md:pt-32 pb-20">
      <div className="container mx-auto px-6 md:px-12">
        
        {/* Header */}
        <div className="mb-16 md:mb-20 text-center max-w-4xl mx-auto">
          <span className="text-amber-700 font-bold tracking-[0.2em] uppercase text-xs mb-4 block">
            {t.manufacturing.subtitle}
          </span>
          <h1 className="font-serif text-4xl md:text-6xl text-stone-900 mb-8">
            {t.manufacturing.title}
          </h1>
          <p className="text-stone-600 text-lg md:text-xl font-light leading-relaxed">
            {t.manufacturing.intro}
          </p>
        </div>

        {/* --- DESKTOP VIEW: TAB NAVIGATION (Large Screens) --- */}
        <div className="hidden lg:block mb-20">
            <div className="border-b border-stone-200 mb-12 flex justify-center">
                <div className="flex gap-12">
                    {['process', 'machinery', 'qc'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all
                        ${activeTab === tab 
                            ? 'border-b-2 border-amber-700 text-stone-900' 
                            : 'text-stone-400 hover:text-stone-600'}
                        `}
                    >
                        {t.manufacturing.tabs[tab]}
                    </button>
                    ))}
                </div>
            </div>

            {activeTab === 'process' && <ProcessSection />}
            {activeTab === 'machinery' && <MachinerySection />}
            {activeTab === 'qc' && <QCSection />}
        </div>

        {/* --- MOBILE/TABLET VIEW: VERTICAL STACK --- */}
        <div className="lg:hidden flex flex-col gap-20">
            <div className="relative">
                <div className="sticky top-[70px] bg-stone-50/95 backdrop-blur z-20 py-4 border-b border-stone-200 mb-8">
                    <h2 className="font-bold text-stone-900 uppercase tracking-widest text-sm flex items-center">
                        <span className="w-2 h-2 bg-amber-700 mr-3 rounded-full"></span>
                        {t.manufacturing.tabs.process}
                    </h2>
                </div>
                <ProcessSection />
            </div>

            <div className="relative">
                <MachinerySection />
            </div>

            <div className="relative">
                <div className="sticky top-[70px] bg-stone-50/95 backdrop-blur z-20 py-4 border-b border-stone-200 mb-8">
                    <h2 className="font-bold text-stone-900 uppercase tracking-widest text-sm flex items-center">
                        <span className="w-2 h-2 bg-amber-700 mr-3 rounded-full"></span>
                        {t.manufacturing.tabs.qc}
                    </h2>
                </div>
                <QCSection />
            </div>
        </div>

      </div>
    </div>
  );
};

export default Manufacturing;
