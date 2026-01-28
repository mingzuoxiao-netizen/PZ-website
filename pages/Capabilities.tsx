import React from 'react';
import { Armchair, BoxSelect, Briefcase, PenTool, Scale, ShieldCheck, Ruler, Table, ArrowUpRight, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { usePublishedSiteConfig } from '../contexts/SiteConfigContext';
import { resolveImage } from '../utils/imageResolver';

const Capabilities: React.FC = () => {
  const { t } = useLanguage();
  const { config, loading } = usePublishedSiteConfig();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-stone-50 text-stone-400 font-mono">
        <Loader2 className="animate-spin mr-2" size={20} /> SYNCHRONIZING_CAPABILITIES...
      </div>
    );
  }

  const heroPoster = resolveImage(config?.capabilities?.hero_poster);

  const icons = [
    <Armchair size={28}/>,
    <ArrowUpRight size={28}/>,
    <BoxSelect size={28}/>,
    <Table size={28}/>,
    <Ruler size={28}/>,
    <Briefcase size={28}/>,
    <PenTool size={28}/>
  ];

  return (
    <div className="bg-stone-50 min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-6 md:px-12">
        
        {/* Editorial Header Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-32 items-center">
            <div>
                <h2 className="text-safety-700 font-bold tracking-[0.3em] uppercase text-[10px] mb-6 inline-block border-b border-safety-700 pb-1 font-mono">
                    {t.capabilities.subtitle}
                </h2>
                <h1 className="font-serif text-5xl md:text-8xl text-stone-900 mb-8 leading-none tracking-tighter">
                    {t.capabilities.title}
                </h1>
                <p className="text-stone-500 text-xl md:text-2xl leading-relaxed font-light mb-12">
                    {t.capabilities.intro}
                </p>
                <Link 
                    to="/collections" 
                    className="inline-flex items-center gap-3 bg-stone-900 text-white px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-safety-700 transition-all shadow-xl"
                >
                    Access Portfolio Registry <ArrowUpRight size={14} />
                </Link>
            </div>
            <div className="relative aspect-[4/5] lg:aspect-square bg-stone-200 overflow-hidden shadow-2xl border border-stone-100 rounded-sm">
                <img 
                    src={heroPoster} 
                    className="w-full h-full object-cover transition-transform duration-[10s] hover:scale-110" 
                    alt="Capability Hero" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/40 to-transparent"></div>
                <div className="absolute bottom-10 left-10">
                    <span className="font-mono text-[9px] text-white/60 uppercase tracking-[0.5em] block mb-2">Protocol Verified</span>
                    <div className="w-12 h-0.5 bg-safety-700"></div>
                </div>
            </div>
        </div>

        {/* Product Categories Grid */}
        <div className="mb-32">
            <div className="flex items-center justify-between mb-12 border-b border-stone-200 pb-6">
                <h3 className="text-stone-900 font-bold uppercase tracking-[0.3em] text-[10px] font-mono">{t.capabilities.categories}</h3>
                <span className="text-stone-300 font-mono text-[10px]">VER. 2.5</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {t.capabilities.productCats.map((cat, idx) => (
                    <div key={idx} className="bg-white p-10 border border-stone-100 hover:border-safety-700 shadow-sm hover:shadow-2xl transition-all duration-500 group flex flex-col justify-between min-h-[280px]">
                        <div>
                            <div className="text-stone-200 group-hover:text-safety-700 mb-8 transition-colors transform group-hover:-translate-y-1 duration-500">
                                {icons[idx % icons.length]}
                            </div>
                            <h4 className="font-serif text-stone-900 mb-4 text-2xl leading-tight">{cat.name}</h4>
                        </div>
                        <p className="text-xs text-stone-400 leading-relaxed font-medium pt-6 border-t border-stone-50 group-hover:border-stone-100 transition-colors">
                            {cat.desc}
                        </p>
                    </div>
                ))}
            </div>
        </div>
        
        {/* Technical Constraints */}
        <div className="mb-32">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-stone-200 pb-6">
                <div>
                   <span className="text-stone-300 font-mono text-[10px] mb-2 block font-bold uppercase tracking-widest">02 / Technical Limits</span>
                   <h3 className="font-serif text-4xl md:text-5xl text-stone-900 tracking-tighter">{t.capabilities.limits.title}</h3>
                </div>
                <div className="mt-8 md:mt-0">
                   <Link to="/inquire" className="text-[10px] font-bold uppercase tracking-[0.3em] text-safety-700 hover:text-stone-900 border-b-2 border-safety-700 pb-2 transition-all font-mono">
                      {t.capabilities.limits.request}
                   </Link>
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-stone-200 bg-white shadow-lg overflow-hidden rounded-sm">
                <div className="p-12 border-b md:border-b-0 md:border-r border-stone-100 hover:bg-stone-50 transition-colors group">
                   <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 mb-10 flex items-center">
                       <span className="w-1.5 h-6 bg-stone-900 mr-4 group-hover:bg-safety-700 transition-colors"></span> {t.capabilities.limits.maxDim}
                   </h4>
                   <ul className="space-y-6 text-sm">
                      <li className="flex justify-between items-center border-b border-stone-50 pb-2">
                          <span className="text-stone-500 font-medium">{t.capabilities.limits.length}</span> 
                          <span className="font-mono text-stone-900 font-bold bg-stone-100 px-3 py-1">4000mm</span>
                      </li>
                      <li className="flex justify-between items-center border-b border-stone-50 pb-2">
                          <span className="text-stone-500 font-medium">{t.capabilities.limits.width}</span> 
                          <span className="font-mono text-stone-900 font-bold bg-stone-100 px-3 py-1">1220mm</span>
                      </li>
                      <li className="flex justify-between items-center border-b border-stone-50 pb-2">
                          <span className="text-stone-500 font-medium">{t.capabilities.limits.thickness}</span> 
                          <span className="font-mono text-stone-900 font-bold bg-stone-100 px-3 py-1">150mm</span>
                      </li>
                   </ul>
                </div>
                <div className="p-12 border-b md:border-b-0 md:border-r border-stone-100 hover:bg-stone-50 transition-colors group">
                   <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 mb-10 flex items-center">
                       <span className="w-1.5 h-6 bg-safety-700 mr-4"></span> {t.capabilities.limits.precision}
                   </h4>
                   <ul className="space-y-6 text-sm">
                      <li className="flex justify-between items-center border-b border-stone-50 pb-2">
                          <span className="text-stone-500 font-medium">{t.capabilities.limits.cncTol}</span> 
                          <span className="font-mono text-stone-900 font-bold bg-stone-100 px-3 py-1">±0.1mm</span>
                      </li>
                      <li className="flex justify-between items-center border-b border-stone-50 pb-2">
                          <span className="text-stone-500 font-medium">{t.capabilities.limits.moisture}</span> 
                          <span className="font-mono text-stone-900 font-bold bg-stone-100 px-3 py-1">8-10% (KD)</span>
                      </li>
                      <li className="flex justify-between items-center border-b border-stone-50 pb-2">
                          <span className="text-stone-500 font-medium">{t.capabilities.limits.gloss}</span> 
                          <span className="font-mono text-stone-900 font-bold bg-stone-100 px-3 py-1">5° - 90°</span>
                      </li>
                   </ul>
                </div>
                <div className="p-12 hover:bg-stone-50 transition-colors group">
                   <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 mb-10 flex items-center">
                       <span className="w-1.5 h-6 bg-stone-400 mr-4 group-hover:bg-safety-700 transition-colors"></span> {t.capabilities.limits.materials}
                   </h4>
                   <ul className="space-y-6 text-sm">
                      <li className="flex justify-between items-center border-b border-stone-50 pb-2">
                          <span className="text-stone-500 font-medium">{t.capabilities.limits.solidWood}</span> 
                          <span className="font-bold text-stone-900 uppercase text-xs">Supported</span>
                      </li>
                      <li className="flex justify-between items-center border-b border-stone-50 pb-2">
                          <span className="text-stone-500 font-medium">{t.capabilities.limits.veneer}</span> 
                          <span className="font-bold text-stone-900 uppercase text-xs">Supported</span>
                      </li>
                      <li className="flex justify-between items-center border-b border-stone-50 pb-2">
                          <span className="text-stone-500 font-medium">{t.capabilities.limits.mixed}</span> 
                          <span className="font-bold text-stone-900 uppercase text-xs">Hybrid Media</span>
                      </li>
                   </ul>
                </div>
             </div>
        </div>

        {/* Operational Models Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 shadow-2xl mb-24 rounded-sm overflow-hidden">
            <div className="bg-stone-900 text-white p-16 md:p-20 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] opacity-5 text-white pointer-events-none">
                    <PenTool size={400} strokeWidth={0.5} />
                </div>
                
                <span className="text-safety-700 font-mono font-bold uppercase tracking-[0.4em] text-[9px] mb-8 block">03 / {t.capabilities.oem.service}</span>
                <h3 className="font-serif text-4xl md:text-5xl mb-10 tracking-tighter leading-tight">{t.capabilities.oem.title}</h3>
                <p className="text-stone-400 mb-16 leading-relaxed text-xl font-light">
                    {t.capabilities.oem.desc}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 border-t border-white/10 pt-12 relative z-10">
                    <div>
                        <h4 className="font-bold text-white mb-4 text-xs uppercase tracking-[0.2em] border-l-2 border-safety-700 pl-4">{t.capabilities.oem.oemTitle}</h4>
                        <p className="text-xs text-stone-500 leading-relaxed font-mono">{t.capabilities.oem.oemDesc}</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-4 text-xs uppercase tracking-[0.2em] border-l-2 border-stone-500 pl-4">{t.capabilities.oem.odmTitle}</h4>
                        <p className="text-xs text-stone-500 leading-relaxed font-mono">{t.capabilities.oem.odmDesc}</p>
                    </div>
                </div>
            </div>
            
            <div className="bg-white p-16 md:p-20 flex flex-col justify-center border-l border-stone-100">
                 <span className="text-stone-400 font-mono font-bold uppercase tracking-[0.4em] text-[9px] mb-8 block">04 / {t.capabilities.compliance.title}</span>
                 <p className="text-stone-600 mb-16 leading-relaxed text-xl font-light">
                    {t.capabilities.compliance.desc}
                 </p>
                 <ul className="space-y-12">
                    <li className="flex items-start group">
                        <div className="mr-8 mt-1 text-stone-200 group-hover:text-safety-700 transition-colors duration-500">
                            <ShieldCheck size={36} strokeWidth={1} />
                        </div>
                        <div>
                            <h4 className="font-serif text-stone-900 text-xl mb-3 tracking-tight">{t.capabilities.compliance.safety}</h4>
                            <p className="text-sm text-stone-500 leading-relaxed max-w-sm">{t.capabilities.compliance.safetyDesc}</p>
                        </div>
                    </li>
                    <li className="flex items-start group">
                        <div className="mr-8 mt-1 text-stone-200 group-hover:text-safety-700 transition-colors duration-500">
                            <Scale size={36} strokeWidth={1} />
                        </div>
                        <div>
                            <h4 className="font-serif text-stone-900 text-xl mb-3 tracking-tight">{t.capabilities.compliance.sustain}</h4>
                            <p className="text-sm text-stone-500 leading-relaxed max-w-sm">{t.capabilities.compliance.sustainDesc}</p>
                        </div>
                    </li>
                    <li className="flex items-start group">
                        <div className="mr-8 mt-1 text-stone-200 group-hover:text-safety-700 transition-colors duration-500">
                            <BoxSelect size={36} strokeWidth={1} />
                        </div>
                        <div>
                            <h4 className="font-serif text-stone-900 text-xl mb-3 tracking-tight">{t.capabilities.compliance.pack}</h4>
                            <p className="text-sm text-stone-500 leading-relaxed max-w-sm">{t.capabilities.compliance.packDesc}</p>
                        </div>
                    </li>
                 </ul>
            </div>
        </div>

        {/* Closing CTA */}
        <div className="text-center py-20 bg-stone-900 rounded-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-grid opacity-5"></div>
            <div className="relative z-10">
                <h2 className="font-serif text-4xl md:text-6xl text-white mb-10 tracking-tighter">{t.capabilities.cta.title}</h2>
                <Link 
                    to="/inquire" 
                    className="inline-block bg-safety-700 text-white px-16 py-6 font-bold uppercase tracking-[0.3em] text-xs hover:bg-white hover:text-stone-900 transition-all duration-500 shadow-2xl"
                >
                    {t.capabilities.cta.btn}
                </Link>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Capabilities;