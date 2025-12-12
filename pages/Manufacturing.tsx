
import React, { useState } from 'react';
import { Settings, Cpu, Layers, CheckCircle2, Hammer, Package, Cog, Ruler, Wrench, Factory } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getAsset, ASSET_KEYS } from '../utils/assets';

const Manufacturing: React.FC = () => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'process' | 'machinery' | 'qc'>('process');

  const processes = [
    { title: "Lumber Selection and KD", title_zh: "木材精选与窑干", icon: <Layers size={24} />, desc: "Incoming inspection of FAS grade lumber. Kiln drying to 8-10% moisture content to ensure stability.", desc_zh: "FAS 级木材的来料检验。窑干至 8-10% 含水率以确保稳定性。" },
    { title: "Panel Jointing and Gluing", title_zh: "拼板与胶合", icon: <Hammer size={24} />, desc: "Color matching and RF (Radio Frequency) gluing for high-strength butcher block and panel construction.", desc_zh: "色泽匹配和高频拼板，用于高强度的层压和板材结构。" },
    { title: "CNC Machining", title_zh: "CNC 加工", icon: <Cpu size={24} />, desc: "5-Axis routers execute complex joinery and shaping with 0.1mm tolerance precision.", desc_zh: "五轴路由器执行复杂的榫卯和成型，精度公差为 0.1mm。" },
    { title: "Sanding and Finishing", title_zh: "砂光与涂装", icon: <Layers size={24} />, desc: "Automated wide-belt sanding followed by hand-touchups. Cefla flat-lines apply consistent coating.", desc_zh: "自动宽带砂光后进行手工修补。Cefla 平板涂装线确保涂层均匀。" },
    { title: "Assembly", title_zh: "组装", icon: <Settings size={24} />, desc: "Traditional joinery assembly reinforced with modern adhesives and hardware.", desc_zh: "传统榫卯组装，辅以现代粘合剂和五金。" },
    { title: "Packaging and QC", title_zh: "包装与质检", icon: <Package size={24} />, desc: "Final 100% inspection. ISTA-3A compliant packaging for drop-ship capability.", desc_zh: "最终 100% 检验。符合 ISTA-3A 标准的包装，支持一件代发。" },
  ];

  const machinery = [
    { name: "Homag 5-Axis CNC", type: "Router", type_zh: "路由器", desc: "Complex 3D shaping", desc_zh: "复杂 3D 成型" },
    { name: "Cefla Flat-line", type: "Finishing", type_zh: "涂装", desc: "Automated spray and UV cure", desc_zh: "自动喷涂与 UV 固化" },
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
    <div className="bg-white min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-6 md:px-12">
        
        {/* Header */}
        <div className="mb-16 text-center max-w-4xl mx-auto">
          <span className="text-safety-700 font-bold tracking-[0.2em] uppercase text-xs mb-4 block">
            {t.manufacturing.subtitle}
          </span>
          <h1 className="font-serif text-4xl md:text-6xl text-stone-900 mb-8">
            {t.manufacturing.title}
          </h1>
          <p className="text-stone-600 text-lg font-light leading-relaxed">
            {t.manufacturing.intro}
          </p>
        </div>

        {/* Minimal Tab Nav */}
        <div className="flex justify-center gap-8 mb-20 border-b border-stone-200">
           {['process', 'machinery', 'qc'].map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab as any)}
               className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all
                 ${activeTab === tab 
                    ? 'border-b-2 border-safety-700 text-stone-900' 
                    : 'text-stone-400 hover:text-stone-600'}
               `}
             >
                {t.manufacturing.tabs[tab]}
             </button>
           ))}
        </div>

        {/* CONTENT: Process */}
        {activeTab === 'process' && (
          <div className="animate-fade-in">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                {processes.map((proc, idx) => (
                  <div key={idx} className="group">
                     <div className="flex items-center justify-between mb-6 border-b border-stone-100 pb-2">
                        <span className="text-3xl font-serif text-stone-200 group-hover:text-safety-700 transition-colors">0{idx + 1}</span>
                        <div className="text-stone-400 group-hover:text-stone-900 transition-colors">
                           {proc.icon}
                        </div>
                     </div>
                     <h3 className="font-bold text-lg text-stone-900 mb-3 uppercase tracking-wide">{getStr(proc, 'title')}</h3>
                     <p className="text-stone-500 text-sm leading-relaxed">
                        {getStr(proc, 'desc')}
                     </p>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* CONTENT: Machinery */}
        {activeTab === 'machinery' && (
          <div className="animate-fade-in">
             <div className="bg-stone-50 p-12 mb-16 rounded-sm flex flex-col md:flex-row items-center gap-12">
                <div className="flex-1">
                   <h3 className="font-serif text-3xl text-stone-900 mb-6">{t.manufacturing.machinery.title}</h3>
                   <p className="text-stone-600 leading-relaxed mb-8">
                      {t.manufacturing.machinery.desc}
                   </p>
                   <ul className="space-y-4">
                      <li className="flex items-center text-sm font-bold uppercase tracking-wide text-stone-800">
                         <div className="w-8 h-[1px] bg-safety-700 mr-4"></div> {t.manufacturing.machinery.highPrecision}
                      </li>
                      <li className="flex items-center text-sm font-bold uppercase tracking-wide text-stone-800">
                         <div className="w-8 h-[1px] bg-safety-700 mr-4"></div> {t.manufacturing.machinery.autoFinish}
                      </li>
                      <li className="flex items-center text-sm font-bold uppercase tracking-wide text-stone-800">
                         <div className="w-8 h-[1px] bg-safety-700 mr-4"></div> {t.manufacturing.machinery.climate}
                      </li>
                   </ul>
                </div>
                <div className="flex-1 w-full h-[300px] bg-white border border-stone-200 p-2 shadow-sm">
                   <img src="https://images.unsplash.com/photo-1565514020125-63b7e43d2266?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover grayscale opacity-90" alt="Machinery" />
                </div>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {machinery.map((m, idx) => (
                   <div key={idx} className="bg-white border border-stone-200 p-8 hover:shadow-lg transition-shadow">
                      <div className="text-[10px] font-bold uppercase text-safety-700 mb-2 tracking-widest">{getStr(m, 'type')}</div>
                      <h4 className="text-stone-900 font-serif text-xl mb-3">{m.name}</h4>
                      <p className="text-stone-500 text-sm">{getStr(m, 'desc')}</p>
                   </div>
                ))}
             </div>
          </div>
        )}

        {/* CONTENT: QC */}
        {activeTab === 'qc' && (
          <div className="animate-fade-in">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                <div className="order-2 lg:order-1">
                   <h3 className="font-serif text-3xl text-stone-900 mb-6">{t.manufacturing.qc.title}</h3>
                   <p className="text-stone-600 mb-10 leading-relaxed">
                      {t.manufacturing.qc.desc}
                   </p>
                   
                   <div className="space-y-8">
                      <div className="flex gap-6">
                         <div className="flex-shrink-0 mt-1 text-stone-300">
                             <CheckCircle2 size={32} />
                         </div>
                         <div>
                            <h4 className="font-bold text-stone-900 text-sm uppercase tracking-widest mb-2">{t.manufacturing.qc.iqc}</h4>
                            <p className="text-stone-500 text-sm">{t.manufacturing.qc.iqcDesc}</p>
                         </div>
                      </div>
                      <div className="flex gap-6">
                         <div className="flex-shrink-0 mt-1 text-stone-300">
                             <Ruler size={32} />
                         </div>
                         <div>
                            <h4 className="font-bold text-stone-900 text-sm uppercase tracking-widest mb-2">{t.manufacturing.qc.ipqc}</h4>
                            <p className="text-stone-500 text-sm">{t.manufacturing.qc.ipqcDesc}</p>
                         </div>
                      </div>
                      <div className="flex gap-6">
                         <div className="flex-shrink-0 mt-1 text-stone-300">
                             <Package size={32} />
                         </div>
                         <div>
                            <h4 className="font-bold text-stone-900 text-sm uppercase tracking-widest mb-2">{t.manufacturing.qc.fqc}</h4>
                            <p className="text-stone-500 text-sm">{t.manufacturing.qc.fqcDesc}</p>
                         </div>
                      </div>
                   </div>
                </div>
                
                <div className="order-1 lg:order-2 bg-stone-100 h-[600px] relative overflow-hidden group">
                   <img 
                     src={getAsset(ASSET_KEYS.MFG_QC_HERO)}
                     className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                     alt="QC Lab"
                   />
                   
                   <div className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur p-6 shadow-lg">
                      <p className="font-bold uppercase tracking-widest text-xs mb-2 text-stone-500">
                          {t.manufacturing.qc.compliance}
                      </p>
                      <p className="font-serif text-xl text-stone-900">CARB P2 • TSCA Title VI • FSC Available</p>
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
