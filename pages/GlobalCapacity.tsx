
import React, { useState } from 'react';
import { Globe, Truck, MapPin, Factory, X, ChevronRight, Calendar, Anchor } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// 1. Data Structure for Map Pins
interface MapLocationDetails {
  title: string;
  title_zh?: string;
  description: string;
  description_zh?: string;
  stats?: string[];
  stats_zh?: string[];
  image?: string;
}

interface MapLocation {
  id: string;
  label: string;
  label_zh?: string;
  x: number; // Left %
  y: number; // Top %
  type: 'HQ' | 'Factory' | 'Market';
  highlight?: boolean; // For special styling (e.g., USA)
  details: MapLocationDetails;
}

const GlobalCapacity: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const { t, language } = useLanguage();

  const getStr = (obj: any, key: string) => {
    if (language === 'zh' && obj[`${key}_zh`]) {
      return obj[`${key}_zh`];
    }
    return obj[key];
  };

  const getArrayStr = (obj: any, key: string) => {
    if (language === 'zh' && obj[`${key}_zh`]) {
      return obj[`${key}_zh`];
    }
    return obj[key];
  }

  const LOCATIONS: MapLocation[] = [
    { 
      id: 'usa', 
      label: 'USA (Major Market)',
      label_zh: '美国（主要市场）', 
      x: 23.1, 
      y: 28.9, 
      type: 'Market', 
      highlight: true,
      details: {
        title: "United States Market",
        title_zh: "美国市场",
        description: "Our largest market. We support 30+ major US brands with both direct container programs and domestic inventory solutions via our LA warehouse.",
        description_zh: "我们最大的市场。通过洛杉矶仓库，我们为30多个主要美国品牌提供直接集装箱项目和国内库存解决方案。",
        stats: ["Primary Export Market", "LA Logistics Hub", "Domestic Fulfillment"],
        stats_zh: ["主要出口市场", "洛杉矶物流中心", "国内履约"],
        image: "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?q=80&w=800&auto=format&fit=crop"
      }
    },
    { 
      id: 'can', 
      label: 'Canada',
      label_zh: '加拿大', 
      x: 23.3, 
      y: 17.5, 
      type: 'Market',
      details: {
        title: "Canadian Market",
        title_zh: "加拿大市场",
        description: "Serving Canadian retailers with high-quality solid wood furniture, capable of cold-climate resistant finishes and construction.",
        description_zh: "为加拿大零售商提供高品质实木家具，具备耐寒冷气候的涂装和结构。",
        stats: ["Cold-Chain Logistics", "Retail Partnerships"],
        stats_zh: ["冷链物流", "零售合作伙伴"],
        image: "https://images.unsplash.com/photo-1517935706615-2717063c2225?q=80&w=800&auto=format&fit=crop"
      }
    },
    { 
      id: 'uk', 
      label: 'UK',
      label_zh: '英国', 
      x: 47.4, 
      y: 18.5, 
      type: 'Market',
      details: {
        title: "United Kingdom",
        title_zh: "英国",
        description: "Exporting distinct British-standard joinery and fire-retardant upholstery compliant furniture to UK distributors.",
        description_zh: "向英国分销商出口符合英国标准榫卯结构和阻燃软包的家具。",
        stats: ["UKFR Compliant", "FOB Shipping"],
        stats_zh: ["符合 UKFR 标准", "FOB 运输"],
        image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=800&auto=format&fit=crop"
      }
    },
    { 
      id: 'de', 
      label: 'Germany',
      label_zh: '德国', 
      x: 50.9, 
      y: 19.6, 
      type: 'Market',
      details: {
        title: "European Union (Germany)",
        title_zh: "欧盟 (德国)",
        description: "Meeting strict EU sustainability (EUTR) and chemical safety standards for discerning European clients.",
        description_zh: "为挑剔的欧洲客户满足严格的欧盟可持续性 (EUTR) 和化学安全标准。",
        stats: ["EUTR Compliant", "Sustainable Sourcing"],
        stats_zh: ["符合 EUTR", "可持续采购"],
        image: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?q=80&w=800&auto=format&fit=crop"
      }
    },
    { 
      id: 'me', 
      label: 'Middle East',
      label_zh: '中东', 
      x: 58.3, 
      y: 32.6, 
      type: 'Market',
      details: {
        title: "Middle East",
        title_zh: "中东",
        description: "Supplying luxury hospitality projects and high-end residential developments across the region.",
        description_zh: "为该地区的豪华酒店项目和高端住宅开发项目提供家具。",
        stats: ["Hospitality Projects", "Luxury Finishes"],
        stats_zh: ["酒店项目", "奢华涂装"],
        image: "https://images.unsplash.com/photo-1495833066942-79abe24b0c1f?q=80&w=1714&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
      }
    },
    { 
      id: 'cn', 
      label: 'Zhaoqing (HQ)',
      label_zh: '肇庆 (总部)', 
      x: 77.2, 
      y: 35.2, 
      type: 'HQ',
      details: {
        title: "Zhaoqing Headquarters",
        title_zh: "肇庆总部",
        description: "Our primary campus specializing in complex R&D, mixed-material fabrication, and master craftsmanship. The center of our engineering excellence.",
        description_zh: "我们的主要园区，专注于复杂的研发、混合材料制造和大师级工艺。我们的工程卓越中心。",
        stats: ["645,835 sq.ft Facility", "50k+ Monthly Capacity", "R&D Center"],
        stats_zh: ["645,835 平方英尺设施", "50k+ 月产能", "研发中心"],
        image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800&auto=format&fit=crop"
      }
    },
    { 
      id: 'kh', 
      label: 'Kandal (Factory)',
      label_zh: '干拉 (工厂)', 
      x: 76.2, 
      y: 42.8, 
      type: 'Factory',
      details: {
        title: "Cambodia Factory",
        title_zh: "柬埔寨工厂",
        description: "A strategic tariff-free manufacturing hub in Kandal Province, tailored for high-volume production runs and cost-effective scalability.",
        description_zh: "位于干拉省的战略性免关税制造中心，专为大批量生产和具有成本效益的可扩展性而量身定制。",
        stats: ["398,000 sq.ft Facility", "Tariff-Free", "High Volume Lines"],
        stats_zh: ["398,000 平方英尺设施", "免关税", "大批量生产线"],
        image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=800&auto=format&fit=crop"
      }
    },
  ];

  // 2. Reusable Pin Component
  const LocationMarker: React.FC<{ location: MapLocation; onClick: (loc: MapLocation) => void }> = ({ location, onClick }) => {
    const isFactory = location.type === 'HQ' || location.type === 'Factory';
    const anchorTransform = isFactory ? 'translate(-50%, -50%)' : 'translate(-50%, -100%)';

    return (
      <div 
        className="absolute flex flex-col items-center group cursor-pointer z-10 hover:z-50 transition-all duration-300"
        onClick={(e) => { e.stopPropagation(); onClick(location); }}
        style={{ 
          left: `${location.x}%`, 
          top: `${location.y}%`, 
          transform: anchorTransform 
        }}
      >
         {/* Marker Visual */}
         <div className="relative transition-transform duration-300 group-hover:scale-110">
            {isFactory ? (
               // Factory Dot
               <div className={`
                 relative flex items-center justify-center rounded-full border-2 border-white shadow-md transition-all duration-500
                 ${location.type === 'HQ' ? 'w-5 h-5 bg-[#a16207] animate-pulse' : 'w-3 h-3 bg-stone-800 group-hover:bg-[#a16207]'}
               `}>
               </div>
            ) : (
               // Market Pin
               <MapPin 
                 className={`
                   drop-shadow-md transition-all duration-300
                   ${location.highlight ? 'text-[#a16207] animate-bounce' : 'text-stone-700 group-hover:text-[#a16207] group-hover:-translate-y-1'}
                 `} 
                 size={location.highlight ? 32 : 24} 
                 fill="currentColor" 
                 strokeWidth={1.5}
               />
            )}
         </div>

         {/* Label Tooltip - Always visible now */}
         <div className={`
           absolute whitespace-nowrap px-3 py-1 rounded shadow-xl text-[10px] font-bold uppercase tracking-wide pointer-events-none
           transition-all duration-300 transform
           ${isFactory 
              ? 'top-full mt-2 bg-stone-900 text-white translate-y-0'
              : 'bottom-full mb-1 bg-white text-stone-900 border border-stone-100 translate-y-0 group-hover:-translate-y-1'
           }
           opacity-100
         `}>
           {getStr(location, 'label')}
         </div>
      </div>
    );
  };

  return (
    <div className="bg-stone-50 pt-32 pb-20">
       {/* Location Detail Modal */}
       {selectedLocation && (
         <div 
           className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-fade-in"
           onClick={() => setSelectedLocation(null)}
         >
           <div 
             className="bg-white w-full max-w-lg rounded-sm shadow-2xl overflow-hidden animate-fade-in-up"
             onClick={(e) => e.stopPropagation()}
           >
              <div className="relative h-48 bg-stone-200">
                <img 
                  src={selectedLocation.details.image} 
                  alt={getStr(selectedLocation, 'label')}
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <button 
                  onClick={() => setSelectedLocation(null)}
                  className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 p-2 rounded-full text-white transition-colors backdrop-blur-md"
                >
                  <X size={20} />
                </button>
                <div className="absolute bottom-4 left-6 text-white">
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-[#a16207] px-2 py-1 rounded mb-2 inline-block">
                    {selectedLocation.type === 'HQ' ? 'Headquarters' : selectedLocation.type}
                  </span>
                  <h3 className="font-serif text-2xl">{getStr(selectedLocation.details, 'title')}</h3>
                </div>
              </div>
              <div className="p-8">
                 <p className="text-stone-600 leading-relaxed mb-6">{getStr(selectedLocation.details, 'description')}</p>
                 
                 {selectedLocation.details.stats && (
                   <div className="space-y-3 border-t border-stone-100 pt-6">
                     {getArrayStr(selectedLocation.details, 'stats')?.map((stat: string, idx: number) => (
                       <div key={idx} className="flex items-center text-sm text-stone-700">
                         <ChevronRight size={14} className="text-[#a16207] mr-2" />
                         {stat}
                       </div>
                     ))}
                   </div>
                 )}
              </div>
           </div>
         </div>
       )}

       <div className="container mx-auto px-6 md:px-12">
         <div className="max-w-3xl mb-20">
           <h3 className="text-[#a16207] font-bold tracking-widest uppercase text-xs mb-4">{t.capacity.footprint}</h3>
           <h1 className="font-serif text-4xl md:text-6xl text-stone-900 mb-8">{t.capacity.title}</h1>
           <p className="text-stone-600 text-lg leading-relaxed">
             {t.capacity.desc}
           </p>
         </div>

         {/* Locations Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
            {/* China Facility */}
            <div className="bg-white p-10 border border-stone-200 shadow-lg hover:border-[#a16207]/30 transition-all group">
              <div className="flex items-start justify-between mb-8">
                <Factory className="text-[#a16207]" size={32} />
                <span className="text-stone-400 text-xs uppercase tracking-widest">{t.home.chinaLoc}</span>
              </div>
              <h2 className="font-serif text-3xl text-stone-900 mb-2">{t.common.location_cn}</h2>
              <p className="text-xs text-stone-500 mb-4 uppercase tracking-wide leading-relaxed font-bold">
                 Deqing Industrial Zone, Zhaoqing City,<br/>Guangdong Province, China
              </p>
              <p className="text-stone-600 mb-6 leading-relaxed text-sm">
                 {LOCATIONS.find(l => l.id === 'cn') ? getStr(LOCATIONS.find(l => l.id === 'cn')!.details, 'description') : ''}
              </p>
              <ul className="text-stone-500 text-sm space-y-2 mb-6">
                 <li>• 645,835 sq.ft Facility</li>
                 <li>• 3 Automated Production Lines</li>
                 <li>• 50k+ Monthly Capacity</li>
              </ul>
              <div className="w-full h-48 overflow-hidden mt-6 rounded-sm">
                 <img src="https://images.unsplash.com/photo-1565538810643-b5bdb714032a?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" alt="China Factory" />
              </div>
            </div>

            {/* Cambodia Facility */}
            <div className="bg-white p-10 border border-stone-200 shadow-lg hover:border-[#a16207]/30 transition-all group">
              <div className="flex items-start justify-between mb-8">
                <Factory className="text-[#a16207]" size={32} />
                <span className="text-stone-400 text-xs uppercase tracking-widest">{t.home.cambodiaLoc}</span>
              </div>
              <h2 className="font-serif text-3xl text-stone-900 mb-2">{t.common.location_kh}</h2>
              <p className="text-xs text-stone-500 mb-4 uppercase tracking-wide leading-relaxed font-bold">
                 Svay Chhrum Village, Baek Chan Commune,<br/>Ang Snuol District, Kandal Province
              </p>
              <p className="text-stone-600 mb-6 leading-relaxed text-sm">
                 {LOCATIONS.find(l => l.id === 'kh') ? getStr(LOCATIONS.find(l => l.id === 'kh')!.details, 'description') : ''}
              </p>
              <ul className="text-stone-500 text-sm space-y-2 mb-6">
                 <li>• 398,000 sq.ft Facility</li>
                 <li>• 0% Tariff Impact</li>
                 <li>• Specialized in High-Volume SKU Runs</li>
              </ul>
              <div className="w-full h-48 overflow-hidden mt-6 rounded-sm">
                 <img src="https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" alt="Cambodia Factory" />
              </div>
            </div>
         </div>
         
         {/* Lead Time & Logistics - NEW SECTION */}
         <div className="mb-24 grid grid-cols-1 md:grid-cols-2 gap-12 bg-white border border-stone-200 p-8 md:p-12">
            <div>
               <div className="flex items-center mb-6">
                   <Calendar className="text-[#a16207] mr-4" size={28} />
                   <h3 className="font-serif text-2xl text-stone-900">{t.capacity.leadTime}</h3>
               </div>
               <div className="space-y-6">
                   <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                       <span className="text-sm font-bold text-stone-600">{t.capacity.sampleDev}</span>
                       <span className="text-sm font-mono text-stone-900">7 - 14 Days</span>
                   </div>
                   <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                       <span className="text-sm font-bold text-stone-600">{t.capacity.initProd}</span>
                       <span className="text-sm font-mono text-stone-900">60 Days</span>
                   </div>
                   <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                       <span className="text-sm font-bold text-stone-600">{t.capacity.reOrder}</span>
                       <span className="text-sm font-mono text-stone-900">45 Days</span>
                   </div>
                   <p className="text-xs text-stone-400 mt-4 italic">{t.capacity.leadTimeNote}</p>
               </div>
            </div>
            
            <div>
               <div className="flex items-center mb-6">
                   <Anchor className="text-[#a16207] mr-4" size={28} />
                   <h3 className="font-serif text-2xl text-stone-900">{t.capacity.logisticsTitle}</h3>
               </div>
               <div className="space-y-4">
                   <div className="bg-stone-50 p-4 border-l-4 border-stone-300">
                       <span className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">{t.capacity.chinaOrigin}</span>
                       <span className="block text-stone-900 font-bold">FOB Shenzhen / Nansha</span>
                   </div>
                   <div className="bg-stone-50 p-4 border-l-4 border-stone-300">
                       <span className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">{t.capacity.khOrigin}</span>
                       <span className="block text-stone-900 font-bold">FOB Sihanoukville</span>
                   </div>
                   <div className="flex items-start mt-6">
                       <Truck className="text-stone-400 mr-3 mt-1" size={16} />
                       <p className="text-sm text-stone-500">
                          {t.capacity.shippingDesc}
                       </p>
                   </div>
               </div>
            </div>
         </div>
         
         {/* Client Distribution Map */}
         <div className="mb-24">
            <h2 className="font-serif text-3xl text-stone-900 mb-8 text-center">{t.capacity.clientDist}</h2>
            <p className="text-stone-600 text-center max-w-2xl mx-auto mb-12">
               {t.capacity.clientDesc}
            </p>
            
            <div className="relative w-full aspect-[2/1] bg-[#e8e6e3] border border-stone-200 rounded-lg overflow-hidden shadow-inner">
               <img 
                src="https://upload.wikimedia.org/wikipedia/commons/4/4d/BlankMap-World.svg" 
                className="absolute inset-0 w-full h-full object-fill opacity-20 grayscale mix-blend-multiply" 
                alt="World Map" 
              />
               {LOCATIONS.map((loc) => (
                 <LocationMarker key={loc.id} location={loc} onClick={setSelectedLocation} />
               ))}
            </div>
         </div>

         {/* Stats Bar */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-24 border-y border-stone-200 py-12 bg-white">
            <div className="text-center md:text-left px-6">
              <span className="block text-5xl font-serif text-stone-900 mb-2">1M+</span>
              <span className="text-xs uppercase tracking-widest text-stone-500">{t.capacity.stats.sqft}</span>
            </div>
            <div className="text-center md:text-left px-6">
              <span className="block text-5xl font-serif text-stone-900 mb-2">30+</span>
              <span className="text-xs uppercase tracking-widest text-stone-500">{t.capacity.stats.brands}</span>
            </div>
            <div className="text-center md:text-left px-6">
              <span className="block text-5xl font-serif text-stone-900 mb-2">50k</span>
              <span className="text-xs uppercase tracking-widest text-stone-500">{t.capacity.stats.units}</span>
            </div>
            <div className="text-center md:text-left px-6">
              <span className="block text-5xl font-serif text-stone-900 mb-2">LA</span>
              <span className="text-xs uppercase tracking-widest text-stone-500">{t.capacity.stats.logistics}</span>
            </div>
         </div>

         {/* Supply Chain Section */}
         <div className="relative overflow-hidden bg-stone-900 text-white rounded-xl p-12 md:p-20">
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
               <div>
                 <h2 className="font-serif text-3xl text-white mb-8">{t.capacity.supplyChain}</h2>
                 <p className="text-stone-400 mb-8 leading-relaxed">
                   {t.capacity.supplyChainDesc}
                 </p>
                 
                 <div className="space-y-8">
                    <div className="flex items-start">
                       <Globe className="text-[#a16207] mt-1 mr-4" size={24} />
                       <div>
                         <h4 className="text-white font-bold text-sm uppercase tracking-wide mb-2">{t.capacity.flexible}</h4>
                         <p className="text-stone-500 text-sm">{t.capacity.flexibleDesc}</p>
                       </div>
                    </div>
                    <div className="flex items-start">
                       <Truck className="text-[#a16207] mt-1 mr-4" size={24} />
                       <div>
                         <h4 className="text-white font-bold text-sm uppercase tracking-wide mb-2">{t.capacity.warehouse}</h4>
                         <p className="text-stone-500 text-sm">{t.capacity.warehouseDesc}</p>
                       </div>
                    </div>
                 </div>
               </div>
            </div>
         </div>
       </div>
    </div>
  );
};

export default GlobalCapacity;
