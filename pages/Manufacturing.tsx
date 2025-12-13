
import React, { useState } from 'react';
import { Settings, Cpu, Layers, CheckCircle2, Hammer, Package, Cog, Ruler, Wrench, Factory } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { usePublishedSiteConfig } from '../contexts/SiteConfigContext';

const Manufacturing: React.FC = () => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'process' | 'machinery' | 'qc'>('process');
  const { config } = usePublishedSiteConfig(); // ✅ Updated

  const processes = [
    {
  title: "Lumber Selection & Moisture Control",
  title_zh: "木材筛选与含水率控制",
  icon: <Layers size={24} />,
  desc: "Incoming lumber is graded for structural integrity and grain consistency. Moisture levels are stabilized through controlled drying to ensure long-term dimensional stability.",
  desc_zh: "对来料木材进行结构强度与纹理一致性筛选，通过受控干燥稳定含水率，确保长期尺寸稳定性。"
},
{
  title: "Panel Jointing & Structural Bonding",
  title_zh: "拼板与结构胶合",
  icon: <Hammer size={24} />,
  desc: "Panels and butcher blocks are engineered through controlled color matching and high-strength bonding systems to ensure uniform stress distribution and durability.",
  desc_zh: "通过色泽匹配与高强度结构胶合工艺，对板材进行工程化处理，确保受力均匀与整体耐久性。"
},
{
  title: "Precision CNC Machining",
  title_zh: "高精度数控加工",
  icon: <Cpu size={24} />,
  desc: "Digitally programmed machining workflows execute complex joinery and shaping operations with tight dimensional control and repeatable accuracy.",
  desc_zh: "采用数字化编程的数控加工流程，实现复杂榫卯与造型加工，确保尺寸精度与批量一致性。"
},
{
  title: "Surface Preparation & Finishing",
  title_zh: "表面处理与涂装",
  icon: <Layers size={24} />,
  desc: "Surface preparation and finishing processes are engineered for consistent texture, color stability, and coating performance across production runs.",
  desc_zh: "通过系统化的表面处理与涂装流程，确保产品在不同批次中保持一致的手感、色泽与涂层性能。"
},
{
  title: "Assembly & Final Integration",
  title_zh: "组装与整体集成",
  icon: <Settings size={24} />,
  desc: "Components are assembled using engineered joinery methods reinforced with modern adhesives and hardware systems for structural reliability and serviceability.",
  desc_zh: "采用工程化榫卯结构，并结合现代胶合与五金系统完成组装，兼顾结构可靠性与后期维护需求。"
},
{
  title: "Quality Control & Packaging",
  title_zh: "质量控制与包装",
  icon: <Package size={24} />,
  desc: "Each finished unit undergoes final inspection against structural, dimensional, and aesthetic standards. Packaging systems are designed to protect products through long-distance logistics.",
  desc_zh: "所有成品均经过结构、尺寸与外观的最终检验，包装系统针对长途运输与终端交付进行防护设计。"
},

  ];

  const machinery = [
    { 
      name: "CNC MACHINING SYSTEMS", 
      name_zh: "CNC 加工系统",
      type: "Processing", 
      type_zh: "加工", 
      desc: "Multi-axis CNC routing platforms supporting complex 3D shaping, precision joinery, and repeatable dimensional control.", 
      desc_zh: "多轴 CNC 路由平台，支持复杂的 3D 成型、精密榫卯和可重复的尺寸控制。" 
    },
    { 
      name: "PROFILE MILLING", 
      name_zh: "型材铣削",
      type: "Milling", 
      type_zh: "铣削", 
      desc: "High-speed moulding and profiling systems for consistent edge geometry and surface definition across long production runs.", 
      desc_zh: "高速成型和轮廓系统，用于在长期生产运行中保持一致的边缘几何形状和表面清晰度。" 
    },
    { 
      name: "AUTOMATED SURFACE FINISHING", 
      name_zh: "自动化表面涂装",
      type: "Finishing", 
      type_zh: "涂装", 
      desc: "Continuous finishing lines integrating spray application, controlled drying, and curing processes for uniform surface quality.", 
      desc_zh: "集成喷涂、受控干燥和固化工艺的连续涂装线，以获得均匀的表面质量。" 
    },
    { 
      name: "PRECISION SANDING & CALIBRATION", 
      name_zh: "精密砂光与定厚",
      type: "Sanding", 
      type_zh: "砂光", 
      desc: "Automated sanding and surface calibration systems ensuring thickness accuracy and finish readiness prior to coating.", 
      desc_zh: "自动砂光和表面定厚系统，确保涂装前的厚度精度和表面准备。" 
    },
    { 
      name: "PANEL BONDING & ASSEMBLY", 
      name_zh: "板材拼合与组装",
      type: "Assembly", 
      type_zh: "组装", 
      desc: "Engineered bonding and pressing systems designed for structural stability in laminated panels and mixed-material assemblies.", 
      desc_zh: "工程化的粘合和压制系统，专为层压板和混合材料组件的结构稳定性而设计。" 
    },
    { 
      name: "CENTRALIZED FACILITY SYSTEMS", 
      name_zh: "中央设施系统",
      type: "Infrastructure", 
      type_zh: "基础设施", 
      desc: "Plant-wide dust extraction, air filtration, and environmental control infrastructure supporting process consistency and operator safety.", 
      desc_zh: "全厂除尘、空气过滤和环境控制基础设施，支持工艺一致性和操作员安全。" 
    }
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
        <div className="mb-12 md:mb-16 text-center max-w-4xl mx-auto">
          <span className="text-safety-700 font-bold tracking-[0.2em] uppercase text-xs mb-4 block">
            {t.manufacturing.subtitle}
          </span>
          <h1 className="font-serif text-4xl md:text-6xl text-stone-900 mb-6 md:mb-8">
            {t.manufacturing.title}
          </h1>
          <p className="text-stone-600 text-base md:text-lg font-light leading-relaxed">
            {t.manufacturing.intro}
          </p>
        </div>

        {/* Minimal Tab Nav - Scrollable on Mobile */}
        <div className="mb-16 md:mb-20 border-b border-stone-200 overflow-x-auto scrollbar-hide">
           <div className="flex justify-start md:justify-center gap-8 min-w-max px-2">
             {['process', 'machinery', 'qc'].map((tab) => (
               <button
                 key={tab}
                 onClick={() => setActiveTab(tab as any)}
                 className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all whitespace-nowrap
                   ${activeTab === tab 
                      ? 'border-b-2 border-safety-700 text-stone-900' 
                      : 'text-stone-400 hover:text-stone-600'}
                 `}
               >
                  {t.manufacturing.tabs[tab]}
               </button>
             ))}
           </div>
        </div>

        {/* CONTENT: Process */}
        {activeTab === 'process' && (
          <div className="animate-fade-in">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                {processes.map((proc, idx) => (
                  <div key={idx} className="group">
                     <div className="flex items-center justify-between mb-4 md:mb-6 border-b border-stone-100 pb-2">
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
             <div className="bg-stone-50 p-8 md:p-12 mb-16 rounded-sm flex flex-col md:flex-row items-center gap-12">
                <div className="flex-1">
                   <h3 className="font-serif text-2xl md:text-3xl text-stone-900 mb-6">{t.manufacturing.machinery.title}</h3>
                   <p className="text-stone-600 leading-relaxed mb-8 text-sm md:text-base">
                      {t.manufacturing.machinery.desc}
                   </p>
                   <ul className="space-y-4">
                      <li className="flex items-center text-xs md:text-sm font-bold uppercase tracking-wide text-stone-800">
                         <div className="w-8 h-[1px] bg-safety-700 mr-4"></div> {t.manufacturing.machinery.highPrecision}
                      </li>
                      <li className="flex items-center text-xs md:text-sm font-bold uppercase tracking-wide text-stone-800">
                         <div className="w-8 h-[1px] bg-safety-700 mr-4"></div> {t.manufacturing.machinery.autoFinish}
                      </li>
                      <li className="flex items-center text-xs md:text-sm font-bold uppercase tracking-wide text-stone-800">
                         <div className="w-8 h-[1px] bg-safety-700 mr-4"></div> {t.manufacturing.machinery.climate}
                      </li>
                   </ul>
                </div>
                <div className="flex-1 w-full h-[250px] md:h-[300px] bg-white border border-stone-200 p-2 shadow-sm">
                   <img 
                      src={config.manufacturing?.hero_machinery} // ✅ Dynamic
                      className="w-full h-full object-cover grayscale opacity-90" 
                      alt="Machinery" 
                   />
                </div>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {machinery.map((m, idx) => (
                   <div key={idx} className="bg-white border border-stone-200 p-8 hover:shadow-lg transition-shadow">
                      <div className="text-[10px] font-bold uppercase text-safety-700 mb-2 tracking-widest">{getStr(m, 'type')}</div>
                      <h4 className="text-stone-900 font-serif text-lg md:text-xl mb-3">{getStr(m, 'name')}</h4>
                      <p className="text-stone-500 text-xs md:text-sm">{getStr(m, 'desc')}</p>
                   </div>
                ))}
             </div>
          </div>
        )}

        {/* CONTENT: QC */}
        {activeTab === 'qc' && (
          <div className="animate-fade-in">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-start">
                <div className="order-2 lg:order-1">
                   <h3 className="font-serif text-3xl text-stone-900 mb-6">{t.manufacturing.qc.title}</h3>
                   <p className="text-stone-600 mb-10 leading-relaxed text-sm md:text-base">
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
                
                <div className="order-1 lg:order-2 bg-stone-100 h-[400px] md:h-[600px] relative overflow-hidden group">
                   <img 
                     src={config.manufacturing?.hero_qc} // ✅ Dynamic
                     className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                     alt="QC Lab"
                   />
                   
                   <div className="absolute bottom-4 left-4 right-4 md:bottom-8 md:left-8 md:right-8 bg-white/90 backdrop-blur p-6 shadow-lg">
                      <p className="font-bold uppercase tracking-widest text-xs mb-2 text-stone-500">
                          {t.manufacturing.qc.compliance}
                      </p>
                      <p className="font-serif text-lg md:text-xl text-stone-900">CARB P2 • TSCA Title VI • FSC Available</p>
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
