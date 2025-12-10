
import React, { useState } from 'react';
import { Settings, Cpu, Layers, CheckCircle2, Hammer, Package, ArrowRight, Cog, Ruler } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Manufacturing: React.FC = () => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'process' | 'machinery' | 'qc'>('process');

  const processes = [
    { title: "Lumber Selection & KD", title_zh: "木材精选与窑干", icon: <Layers size={24} />, desc: "Incoming inspection of FAS grade lumber. Kiln drying to 8-10% moisture content to ensure stability.", desc_zh: "FAS 级木材的来料检验。窑干至 8-10% 含水率以确保稳定性。" },
    { title: "Panel Jointing & Gluing", title_zh: "拼板与胶合", icon: <Hammer size={24} />, desc: "Color matching and RF (Radio Frequency) gluing for high-strength butcher block and panel construction.", desc_zh: "色泽匹配和高频拼板，用于高强度的层压和板材结构。" },
    { title: "CNC Machining", title_zh: "CNC 加工", icon: <Cpu size={24} />, desc: "5-Axis routers execute complex joinery and shaping with 0.1mm tolerance precision.", desc_zh: "五轴路由器执行复杂的榫卯和成型，精度公差为 0.1mm。" },
    { title: "Sanding & Finishing", title_zh: "砂光与涂装", icon: <Layers size={24} />, desc: "Automated wide-belt sanding followed by hand-touchups. Cefla flat-lines apply consistent coating.", desc_zh: "自动宽带砂光后进行手工修补。Cefla 平板涂装线确保涂层均匀。" },
    { title: "Assembly", title_zh: "组装", icon: <Settings size={24} />, desc: "Traditional joinery assembly reinforced with modern adhesives and hardware.", desc_zh: "传统榫卯组装，辅以现代粘合剂和五金。" },
    { title: "Packaging & QC", title_zh: "包装与质检", icon: <Package size={24} />, desc: "Final 100% inspection. ISTA-3A compliant packaging for drop-ship capability.", desc_zh: "最终 100% 检验。符合 ISTA-3A 标准的包装，支持一件代发。" },
  ];

  const machinery = [
    { name: "Homag 5-Axis CNC", type: "Router", type_zh: "路由器", desc: "Complex 3D shaping", desc_zh: "复杂 3D 成型" },
    { name: "Cefla Flat-line", type: "Finishing", type_zh: "涂装", desc: "Automated spray & UV cure", desc_zh: "自动喷涂与 UV 固化" },
    { name: "Weinig Moulders", type: "Milling", type_zh: "铣削", desc: "High-speed profile moulding", desc_zh: "高速型材成型" },
    { name: "Timesavers Sanders", type: "Sanding", type_zh: "砂光", desc: "Precision calibration sanding", desc_zh: "精密定厚砂光" },
    { name: "RF Press", type: "Gluing", type_zh: "胶合", desc: "Radio frequency panel bonding", desc_zh: "射频板材粘合" },
    { name: "Dust Collection", type: "Facility", type_zh: "设施", desc: "Centralized eco-system", desc_zh: "中央集尘生态系统" }
  ];

  const getStr = (obj: any, key: string) => {
    if (language === 'zh' && obj[`${key}_zh`]) {
      return obj[`${key}_zh`];
    }
    return obj[key];
  };

  return (
    <div className="bg-zinc-50 min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-6 md:px-12">
        
        {/* Header */}
        <div className="mb-16">
          <h2 className="text-bronze-accent font-bold tracking-[0.2em] uppercase text-xs mb-4">
            {t.manufacturing.subtitle}
          </h2>
          <h1 className="font-serif text-5xl md:text-6xl text-zinc-900 mb-8 max-w-4xl">
            {t.manufacturing.title}
          </h1>
          <p className="text-zinc-600 text-xl font-light leading-relaxed max-w-3xl border-l-2 border-bronze-accent pl-6">
            {t.manufacturing.intro}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-200 mb-16 overflow-x-auto">
           {['process', 'machinery', 'qc'].map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab as any)}
               className={`px-8 py-4 text-sm font-bold uppercase tracking-widest transition-colors border-b-2 whitespace-nowrap
                 ${activeTab === tab ? 'border-bronze-accent text-bronze-accent' : 'border-transparent text-zinc-400 hover:text-zinc-600'}
               `}
             >
                {t.manufacturing.tabs[tab]}
             </button>
           ))}
        </div>

        {/* CONTENT: Process */}
        {activeTab === 'process' && (
          <div className="animate-fade-in">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {processes.map((proc, idx) => (
                  <div key={idx} className="bg-white p-8 border border-zinc-100 shadow-sm hover:shadow-lg transition-shadow relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-10 font-serif text-6xl text-zinc-300 select-none group-hover:scale-110 transition-transform">
                        {idx + 1}
                     </div>
                     <div className="text-bronze-accent mb-6 group-hover:scale-110 transition-transform origin-left">
                        {proc.icon}
                     </div>
                     <h3 className="font-serif text-xl text-zinc-900 mb-4 relative z-10">{getStr(proc, 'title')}</h3>
                     <p className="text-zinc-500 text-sm leading-relaxed relative z-10">
                        {getStr(proc, 'desc')}
                     </p>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* CONTENT: Machinery */}
        {activeTab === 'machinery' && (
          <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-12">
             <div className="bg-zinc-900 text-white p-12 flex flex-col justify-center">
                <h3 className="font-serif text-3xl mb-6">{t.manufacturing.machinery.title}</h3>
                <p className="text-zinc-400 mb-8 leading-relaxed">
                   {t.manufacturing.machinery.desc}
                </p>
                <ul className="space-y-4">
                   <li className="flex items-center text-sm"><Cog className="text-bronze-accent mr-3" size={16}/> {t.manufacturing.machinery.highPrecision}</li>
                   <li className="flex items-center text-sm"><Cog className="text-bronze-accent mr-3" size={16}/> {t.manufacturing.machinery.autoFinish}</li>
                   <li className="flex items-center text-sm"><Cog className="text-bronze-accent mr-3" size={16}/> {t.manufacturing.machinery.climate}</li>
                </ul>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {machinery.map((m, idx) => (
                   <div key={idx} className="bg-white border border-zinc-200 p-6 hover:border-bronze-accent transition-colors">
                      <div className="text-[10px] font-bold uppercase text-zinc-400 mb-1">{getStr(m, 'type')}</div>
                      <h4 className="text-zinc-900 font-bold mb-2">{m.name}</h4>
                      <p className="text-zinc-500 text-xs">{getStr(m, 'desc')}</p>
                   </div>
                ))}
             </div>
          </div>
        )}

        {/* CONTENT: QC */}
        {activeTab === 'qc' && (
          <div className="animate-fade-in">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div>
                   <h3 className="font-serif text-3xl text-zinc-900 mb-6">{t.manufacturing.qc.title}</h3>
                   <p className="text-zinc-600 mb-8 leading-relaxed">
                      {t.manufacturing.qc.desc}
                   </p>
                   
                   <div className="space-y-6">
                      <div className="flex">
                         <div className="flex-shrink-0 mt-1"><CheckCircle2 className="text-bronze-accent" size={20} /></div>
                         <div className="ml-4">
                            <h4 className="font-bold text-zinc-900 text-sm uppercase tracking-wide">{t.manufacturing.qc.iqc}</h4>
                            <p className="text-zinc-500 text-sm mt-1">{t.manufacturing.qc.iqcDesc}</p>
                         </div>
                      </div>
                      <div className="flex">
                         <div className="flex-shrink-0 mt-1"><Ruler className="text-bronze-accent" size={20} /></div>
                         <div className="ml-4">
                            <h4 className="font-bold text-zinc-900 text-sm uppercase tracking-wide">{t.manufacturing.qc.ipqc}</h4>
                            <p className="text-zinc-500 text-sm mt-1">{t.manufacturing.qc.ipqcDesc}</p>
                         </div>
                      </div>
                      <div className="flex">
                         <div className="flex-shrink-0 mt-1"><Package className="text-bronze-accent" size={20} /></div>
                         <div className="ml-4">
                            <h4 className="font-bold text-zinc-900 text-sm uppercase tracking-wide">{t.manufacturing.qc.fqc}</h4>
                            <p className="text-zinc-500 text-sm mt-1">{t.manufacturing.qc.fqcDesc}</p>
                         </div>
                      </div>
                   </div>
                </div>
                <div className="bg-zinc-100 h-[500px] relative overflow-hidden">
                   <img 
                     src="https://images.unsplash.com/photo-1581093458791-9f302e683800?q=80&w=2069&auto=format&fit=crop" 
                     className="w-full h-full object-cover" 
                     alt="QC Lab"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent flex items-end p-8">
                      <div className="text-white">
                         <p className="font-bold uppercase tracking-widest text-xs mb-2">{t.manufacturing.qc.compliance}</p>
                         <p className="font-serif text-2xl">CARB P2 • TSCA Title VI • FSC Available</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Manufacturing;
