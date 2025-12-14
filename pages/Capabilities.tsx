
import React from 'react';
import { Armchair, BoxSelect, Briefcase, PenTool, Scale, ShieldCheck, Ruler, Table, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';

const Capabilities: React.FC = () => {
  const { t, language } = useLanguage();

  const productCats = [
    { name: "Accent Chairs", name_zh: "休閒椅", icon: <Armchair size={28}/>, desc: "Solid wood frames, complex joinery, upholstery.", desc_zh: "實木框架，複雜榫卯，軟包。" },
    { name: "Bar Stools", name_zh: "吧台椅", icon: <ArrowUpRight size={28}/>, desc: "Counter and bar height, swivel mechanisms, metal footrests.", desc_zh: "吧台/櫃台高度，旋轉機制，金屬腳踏。" },
    { name: "Cabinets and Casegoods", name_zh: "櫃類 & 箱體家具", icon: <BoxSelect size={28}/>, desc: "Sideboards, media consoles, soft-close hardware.", desc_zh: "餐邊櫃，電視櫃，緩衝五金。" },
    { name: "Dining Tops", name_zh: "餐桌檯面", icon: <Table size={28}/>, desc: "Solid wood, butcher block, live-edge processing.", desc_zh: "實木，層壓木，自然邊工藝。" },
    { name: "Work Surfaces", name_zh: "工作檯面", icon: <Ruler size={28}/>, desc: "Office desks, adjustable height tops, workbenches.", desc_zh: "辦公桌，升降桌檯面，工作台。" },
    { name: "Hotel Furniture", name_zh: "酒店家具", icon: <Briefcase size={28}/>, desc: "Guest room FF&E, lobby seating, high-traffic finishes.", desc_zh: "客房 FF&E，大堂座椅，耐磨塗裝。" },
    { name: "Custom Projects", name_zh: "定制項目", icon: <PenTool size={28}/>, desc: "Bespoke specifications, mixed materials (stone/metal).", desc_zh: "定制規格，混合材質（石材/金屬）。" },
  ];

  const getStr = (obj: any, key: string) => {
    if (language === 'zh' && obj[`${key}_zh`]) {
        return obj[`${key}_zh`];
    }
    return obj[key];
  };

  return (
    <div className="bg-stone-50 min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-6 md:px-12">
        
        {/* Header */}
        <div className="text-center mb-24 max-w-4xl mx-auto">
          <h2 className="text-amber-700 font-bold tracking-[0.2em] uppercase text-xs mb-4 inline-block border-b border-amber-700 pb-1">
            {t.capabilities.subtitle}
          </h2>
          <h1 className="font-serif text-5xl md:text-7xl text-stone-900 mb-8 leading-tight">
            {t.capabilities.title}
          </h1>
          <p className="text-stone-600 text-lg md:text-xl leading-relaxed font-light">
            {t.capabilities.intro}
          </p>
          
          <Link 
            to="/portfolio" 
            className="inline-block mt-8 text-xs font-bold text-stone-400 hover:text-amber-700 transition-colors border-b border-stone-200 hover:border-amber-700 pb-1"
          >
            See Realized Projects in Portfolio →
          </Link>
        </div>

        {/* Product Categories Grid - Cards on Stone */}
        <div className="mb-32">
            <div className="flex items-center justify-between mb-8 border-b border-stone-200 pb-4">
                <h3 className="text-stone-900 font-bold uppercase tracking-widest text-sm">{t.capabilities.categories}</h3>
                <span className="text-stone-400 font-mono text-xs">01</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {productCats.map((cat, idx) => (
                    <div key={idx} className="bg-white p-8 border-t-4 border-stone-100 hover:border-amber-700 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col justify-between min-h-[240px]">
                        <div>
                            <div className="text-stone-300 group-hover:text-amber-700 mb-6 transition-colors">{cat.icon}</div>
                            <h4 className="font-serif text-stone-900 mb-3 text-xl leading-tight">{getStr(cat, 'name')}</h4>
                        </div>
                        <p className="text-sm text-stone-500 leading-relaxed font-medium pt-4 border-t border-stone-50 group-hover:border-stone-100 transition-colors">
                            {getStr(cat, 'desc')}
                        </p>
                    </div>
                ))}
            </div>
        </div>
        
        {/* Technical Limits Section - Blueprint / Technical Style */}
        <div className="mb-32">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 border-b border-stone-200 pb-4">
                <div>
                   <span className="text-stone-400 font-mono text-xs mb-2 block">02</span>
                   <h3 className="font-serif text-3xl md:text-4xl text-stone-900">{t.capabilities.limits.title}</h3>
                   <p className="text-stone-500 mt-2 text-sm">{t.capabilities.limits.subtitle}</p>
                </div>
                <div className="mt-6 md:mt-0">
                   <Link to="/inquire" className="text-xs font-bold uppercase tracking-widest text-amber-700 hover:text-stone-900 border-b-2 border-amber-700 pb-1 transition-colors">
                      {t.capabilities.limits.request}
                   </Link>
                </div>
             </div>
             
             {/* Dark Technical Cards */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-stone-200 bg-white">
                <div className="p-10 border-b md:border-b-0 md:border-r border-stone-200 hover:bg-stone-50 transition-colors">
                   <h4 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-6 flex items-center">
                       <span className="w-2 h-2 bg-stone-900 mr-2"></span> {t.capabilities.limits.maxDim}
                   </h4>
                   <ul className="space-y-4 text-sm">
                      <li className="flex justify-between items-center">
                          <span className="text-stone-500 font-medium">{t.capabilities.limits.length}</span> 
                          <span className="font-mono text-stone-900 font-bold bg-stone-100 px-2 py-1">4000mm</span>
                      </li>
                      <li className="flex justify-between items-center">
                          <span className="text-stone-500 font-medium">{t.capabilities.limits.width}</span> 
                          <span className="font-mono text-stone-900 font-bold bg-stone-100 px-2 py-1">1220mm</span>
                      </li>
                      <li className="flex justify-between items-center">
                          <span className="text-stone-500 font-medium">{t.capabilities.limits.thickness}</span> 
                          <span className="font-mono text-stone-900 font-bold bg-stone-100 px-2 py-1">150mm</span>
                      </li>
                   </ul>
                </div>
                <div className="p-10 border-b md:border-b-0 md:border-r border-stone-200 hover:bg-stone-50 transition-colors">
                   <h4 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-6 flex items-center">
                       <span className="w-2 h-2 bg-amber-700 mr-2"></span> {t.capabilities.limits.precision}
                   </h4>
                   <ul className="space-y-4 text-sm">
                      <li className="flex justify-between items-center">
                          <span className="text-stone-500 font-medium">{t.capabilities.limits.cncTol}</span> 
                          <span className="font-mono text-stone-900 font-bold bg-stone-100 px-2 py-1">±0.1mm</span>
                      </li>
                      <li className="flex justify-between items-center">
                          <span className="text-stone-500 font-medium">{t.capabilities.limits.moisture}</span> 
                          <span className="font-mono text-stone-900 font-bold bg-stone-100 px-2 py-1">8-10% (KD)</span>
                      </li>
                      <li className="flex justify-between items-center">
                          <span className="text-stone-500 font-medium">{t.capabilities.limits.gloss}</span> 
                          <span className="font-mono text-stone-900 font-bold bg-stone-100 px-2 py-1">5° - 90°</span>
                      </li>
                   </ul>
                </div>
                <div className="p-10 hover:bg-stone-50 transition-colors">
                   <h4 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-6 flex items-center">
                       <span className="w-2 h-2 bg-stone-400 mr-2"></span> {t.capabilities.limits.materials}
                   </h4>
                   <ul className="space-y-4 text-sm">
                      <li className="flex justify-between items-center">
                          <span className="text-stone-500 font-medium">{t.capabilities.limits.solidWood}</span> 
                          <span className="font-bold text-stone-900">Supported</span>
                      </li>
                      <li className="flex justify-between items-center">
                          <span className="text-stone-500 font-medium">{t.capabilities.limits.veneer}</span> 
                          <span className="font-bold text-stone-900">Supported</span>
                      </li>
                      <li className="flex justify-between items-center">
                          <span className="text-stone-500 font-medium">{t.capabilities.limits.mixed}</span> 
                          <span className="font-bold text-stone-900">Metal/Stone</span>
                      </li>
                   </ul>
                </div>
             </div>
        </div>

        {/* OEM/ODM Section - Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 shadow-2xl mb-24">
            <div className="bg-stone-900 text-white p-12 md:p-16 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] opacity-5 text-white">
                    <PenTool size={300} strokeWidth={0.5} />
                </div>
                
                <span className="text-amber-500 font-bold uppercase tracking-widest text-xs mb-6 block">03 / {t.capabilities.oem.service}</span>
                <h3 className="font-serif text-3xl md:text-4xl mb-8">{t.capabilities.oem.title}</h3>
                <p className="text-stone-400 mb-12 leading-relaxed text-lg font-light">
                    {t.capabilities.oem.desc}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 border-t border-stone-800 pt-10 relative z-10">
                    <div>
                        <h4 className="font-bold text-white mb-3 text-sm uppercase tracking-wide border-l-2 border-amber-600 pl-3">{t.capabilities.oem.oemTitle}</h4>
                        <p className="text-xs text-stone-400 leading-relaxed">{t.capabilities.oem.oemDesc}</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-3 text-sm uppercase tracking-wide border-l-2 border-stone-600 pl-3">{t.capabilities.oem.odmTitle}</h4>
                        <p className="text-xs text-stone-400 leading-relaxed">{t.capabilities.oem.odmDesc}</p>
                    </div>
                </div>
            </div>
            
            <div className="bg-white p-12 md:p-16 flex flex-col justify-center">
                 <span className="text-stone-400 font-bold uppercase tracking-widest text-xs mb-6 block">04 / {t.capabilities.compliance.title}</span>
                 <p className="text-stone-600 mb-10 leading-relaxed text-lg">
                    {t.capabilities.compliance.desc}
                 </p>
                 <ul className="space-y-8">
                    <li className="flex items-start group">
                        <div className="mr-6 mt-1 text-stone-300 group-hover:text-amber-700 transition-colors">
                            <ShieldCheck size={32} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h4 className="font-serif text-stone-900 text-lg mb-2">{t.capabilities.compliance.safety}</h4>
                            <p className="text-sm text-stone-500 leading-relaxed">{t.capabilities.compliance.safetyDesc}</p>
                        </div>
                    </li>
                    <li className="flex items-start group">
                        <div className="mr-6 mt-1 text-stone-300 group-hover:text-amber-700 transition-colors">
                            <Scale size={32} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h4 className="font-serif text-stone-900 text-lg mb-2">{t.capabilities.compliance.sustain}</h4>
                            <p className="text-sm text-stone-500 leading-relaxed">{t.capabilities.compliance.sustainDesc}</p>
                        </div>
                    </li>
                    <li className="flex items-start group">
                        <div className="mr-6 mt-1 text-stone-300 group-hover:text-amber-700 transition-colors">
                            <BoxSelect size={32} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h4 className="font-serif text-stone-900 text-lg mb-2">{t.capabilities.compliance.pack}</h4>
                            <p className="text-sm text-stone-500 leading-relaxed">{t.capabilities.compliance.packDesc}</p>
                        </div>
                    </li>
                 </ul>
            </div>
        </div>

        {/* CTA */}
        <div className="text-center py-12">
            <h2 className="font-serif text-3xl text-stone-900 mb-8">{t.capabilities.cta.title}</h2>
            <Link 
              to="/inquire" 
              className="inline-block bg-stone-900 text-white px-12 py-5 font-bold uppercase tracking-widest text-xs hover:bg-amber-700 transition-colors shadow-xl"
            >
              {t.capabilities.cta.btn}
            </Link>
        </div>

      </div>
    </div>
  );
};

export default Capabilities;
