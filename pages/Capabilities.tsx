
import React from 'react';
import { Armchair, BoxSelect, Briefcase, PenTool, Scale, ShieldCheck, Ruler, Table, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';

const Capabilities: React.FC = () => {
  const { t, language } = useLanguage();

  const productCats = [
    { name: "Accent Chairs", name_zh: "休闲椅", icon: <Armchair size={24}/>, desc: "Solid wood frames, complex joinery, upholstery.", desc_zh: "实木框架，复杂榫卯，软包。" },
    { name: "Bar Stools", name_zh: "吧台椅", icon: <ArrowUpRight size={24}/>, desc: "Counter and bar height, swivel mechanisms, metal footrests.", desc_zh: "吧台/柜台高度，旋转机制，金属脚踏。" },
    { name: "Cabinets and Casegoods", name_zh: "柜类 & 箱体家具", icon: <BoxSelect size={24}/>, desc: "Sideboards, media consoles, soft-close hardware.", desc_zh: "餐边柜，电视柜，缓冲五金。" },
    { name: "Dining Tops", name_zh: "餐桌台面", icon: <Table size={24}/>, desc: "Solid wood, butcher block, live-edge processing.", desc_zh: "实木，层压木，自然边工艺。" },
    { name: "Work Surfaces", name_zh: "工作台面", icon: <Ruler size={24}/>, desc: "Office desks, adjustable height tops, workbenches.", desc_zh: "办公桌，升降桌台面，工作台。" },
    { name: "Hotel Furniture", name_zh: "酒店家具", icon: <Briefcase size={24}/>, desc: "Guest room FF&E, lobby seating, high-traffic finishes.", desc_zh: "客房 FF&E，大堂座椅，耐磨涂装。" },
    { name: "Custom Projects", name_zh: "定制项目", icon: <PenTool size={24}/>, desc: "Bespoke specifications, mixed materials (stone/metal).", desc_zh: "定制规格，混合材质（石材/金属）。" },
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
        <div className="text-center mb-20">
          <h2 className="text-safety-700 font-bold tracking-[0.2em] uppercase text-xs mb-4">
            {t.capabilities.subtitle}
          </h2>
          <h1 className="font-serif text-5xl md:text-6xl text-stone-900 mb-8">
            {t.capabilities.title}
          </h1>
          <p className="text-stone-600 text-lg leading-relaxed max-w-3xl mx-auto font-light">
            {t.capabilities.intro}
          </p>
          
          {/* Added Link Note */}
          <Link 
            to="/collections" 
            className="inline-block mt-8 text-xs font-mono text-stone-400 hover:text-safety-700 transition-colors border-b border-transparent hover:border-safety-700 pb-1"
          >
            For selected projects realizing these capabilities, please refer to our Portfolio.
          </Link>
        </div>

        {/* Product Categories Grid */}
        <div className="mb-24">
            <h3 className="text-stone-900 font-bold uppercase tracking-widest text-sm mb-8 border-b border-stone-200 pb-4">{t.capabilities.categories}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {productCats.map((cat, idx) => (
                    <div key={idx} className="bg-white p-8 border border-stone-200 text-center hover:border-safety-700 hover:shadow-lg transition-all group flex flex-col items-center rounded-sm">
                        <div className="text-stone-400 group-hover:text-safety-700 mb-4 transition-colors p-3 bg-stone-50 rounded-full">{cat.icon}</div>
                        <h4 className="font-serif text-stone-900 mb-2 text-lg">{getStr(cat, 'name')}</h4>
                        <p className="text-xs text-stone-500 leading-relaxed font-medium">{getStr(cat, 'desc')}</p>
                    </div>
                ))}
            </div>
        </div>
        
        {/* Technical Limits Section */}
        <div className="mb-24 bg-stone-100 p-8 md:p-12 border border-stone-200 rounded-sm">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
                <div>
                   <h3 className="font-serif text-3xl text-stone-900">{t.capabilities.limits.title}</h3>
                   <p className="text-stone-500 mt-2">{t.capabilities.limits.subtitle}</p>
                </div>
                <div className="mt-6 md:mt-0">
                   <Link to="/inquire" className="text-xs font-bold uppercase tracking-widest text-safety-700 hover:text-stone-900 border-b-2 border-safety-700 pb-1 transition-colors">
                      {t.capabilities.limits.request}
                   </Link>
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 shadow-sm border-l-4 border-stone-900">
                   <h4 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">{t.capabilities.limits.maxDim}</h4>
                   <ul className="space-y-3 text-sm text-stone-900 font-bold">
                      <li className="flex justify-between border-b border-stone-100 pb-2">
                          <span className="text-stone-500 font-normal">{t.capabilities.limits.length}</span> 
                          <span>4000mm</span>
                      </li>
                      <li className="flex justify-between border-b border-stone-100 pb-2">
                          <span className="text-stone-500 font-normal">{t.capabilities.limits.width}</span> 
                          <span>1220mm</span>
                      </li>
                      <li className="flex justify-between border-b border-stone-100 pb-2">
                          <span className="text-stone-500 font-normal">{t.capabilities.limits.thickness}</span> 
                          <span>150mm</span>
                      </li>
                   </ul>
                </div>
                <div className="bg-white p-8 shadow-sm border-l-4 border-stone-900">
                   <h4 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">{t.capabilities.limits.precision}</h4>
                   <ul className="space-y-3 text-sm text-stone-900 font-bold">
                      <li className="flex justify-between border-b border-stone-100 pb-2">
                          <span className="text-stone-500 font-normal">{t.capabilities.limits.cncTol}</span> 
                          <span>±0.1mm</span>
                      </li>
                      <li className="flex justify-between border-b border-stone-100 pb-2">
                          <span className="text-stone-500 font-normal">{t.capabilities.limits.moisture}</span> 
                          <span>8-10% (KD)</span>
                      </li>
                      <li className="flex justify-between border-b border-stone-100 pb-2">
                          <span className="text-stone-500 font-normal">{t.capabilities.limits.gloss}</span> 
                          <span>5° - 90°</span>
                      </li>
                   </ul>
                </div>
                <div className="bg-white p-8 shadow-sm border-l-4 border-stone-900">
                   <h4 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">{t.capabilities.limits.materials}</h4>
                   <ul className="space-y-3 text-sm text-stone-900 font-bold">
                      <li className="flex justify-between border-b border-stone-100 pb-2">
                          <span className="text-stone-500 font-normal">{t.capabilities.limits.solidWood}</span> 
                          <span>Yes</span>
                      </li>
                      <li className="flex justify-between border-b border-stone-100 pb-2">
                          <span className="text-stone-500 font-normal">{t.capabilities.limits.veneer}</span> 
                          <span>Yes</span>
                      </li>
                      <li className="flex justify-between border-b border-stone-100 pb-2">
                          <span className="text-stone-500 font-normal">{t.capabilities.limits.mixed}</span> 
                          <span>Yes</span>
                      </li>
                   </ul>
                </div>
             </div>
        </div>

        {/* OEM/ODM Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
            <div className="bg-stone-900 text-white p-12 flex flex-col justify-center rounded-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <PenTool size={120} />
                </div>
                <span className="text-safety-500 font-bold uppercase tracking-widest text-xs mb-4">{t.capabilities.oem.service}</span>
                <h3 className="font-serif text-3xl mb-6">{t.capabilities.oem.title}</h3>
                <p className="text-stone-400 mb-10 leading-relaxed">
                    {t.capabilities.oem.desc}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 border-t border-stone-800 pt-8">
                    <div>
                        <h4 className="font-bold text-white mb-2 text-sm uppercase tracking-wide">{t.capabilities.oem.oemTitle}</h4>
                        <p className="text-xs text-stone-500 leading-relaxed">{t.capabilities.oem.oemDesc}</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-2 text-sm uppercase tracking-wide">{t.capabilities.oem.odmTitle}</h4>
                        <p className="text-xs text-stone-500 leading-relaxed">{t.capabilities.oem.odmDesc}</p>
                    </div>
                </div>
            </div>
            
            <div className="flex flex-col justify-center px-4">
                 <h3 className="font-serif text-3xl text-stone-900 mb-6">{t.capabilities.compliance.title}</h3>
                 <p className="text-stone-600 mb-10 leading-relaxed">
                    {t.capabilities.compliance.desc}
                 </p>
                 <ul className="space-y-6">
                    <li className="flex items-start group">
                        <div className="mr-4 mt-1 text-stone-400 group-hover:text-safety-700 transition-colors">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-stone-900 text-sm mb-1">{t.capabilities.compliance.safety}</h4>
                            <p className="text-xs text-stone-500">{t.capabilities.compliance.safetyDesc}</p>
                        </div>
                    </li>
                    <li className="flex items-start group">
                        <div className="mr-4 mt-1 text-stone-400 group-hover:text-safety-700 transition-colors">
                            <Scale size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-stone-900 text-sm mb-1">{t.capabilities.compliance.sustain}</h4>
                            <p className="text-xs text-stone-500">{t.capabilities.compliance.sustainDesc}</p>
                        </div>
                    </li>
                    <li className="flex items-start group">
                        <div className="mr-4 mt-1 text-stone-400 group-hover:text-safety-700 transition-colors">
                            <BoxSelect size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-stone-900 text-sm mb-1">{t.capabilities.compliance.pack}</h4>
                            <p className="text-xs text-stone-500">{t.capabilities.compliance.packDesc}</p>
                        </div>
                    </li>
                 </ul>
            </div>
        </div>

        {/* CTA - Fixed transparency issue */}
        <div className="text-center border-t border-stone-200 pt-20">
            <h2 className="font-serif text-3xl text-stone-900 mb-8">{t.capabilities.cta.title}</h2>
            <Link 
              to="/inquire" 
              className="inline-block bg-stone-900 text-white px-12 py-5 font-bold uppercase tracking-widest text-xs hover:bg-safety-700 transition-colors shadow-lg"
            >
              {t.capabilities.cta.btn}
            </Link>
        </div>

      </div>
    </div>
  );
};

export default Capabilities;
