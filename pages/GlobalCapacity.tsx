
import React, { useState } from 'react';
import { Globe, Truck, MapPin, Factory, X, ChevronRight, Calendar, Anchor } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { usePublishedSiteConfig } from '../contexts/SiteConfigContext';

// 1. Data Structure for Map Pins
interface MapLocationDetails {
  title: string;
  description: string;
  stats?: string[];
  imageSrc: string; // Changed to direct src from config
}

interface MapLocation {
  id: string;
  label: string;
  x: number; // Left %
  y: number; // Top %
  type: 'HQ' | 'Factory' | 'Market';
  highlight?: boolean; // For special styling (e.g., USA)
  details: MapLocationDetails;
}

const GlobalCapacity: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const { t } = useLanguage();
  const { config } = usePublishedSiteConfig(); // ✅ Updated

  const LOCATIONS: MapLocation[] = [
    { 
      id: 'usa', 
      label: 'USA (Major Market)',
      x: 23.1, 
      y: 28.9, 
      type: 'Market', 
      highlight: true,
      details: {
        title: "United States Market",
        description: "Our largest market. We support 30+ major US brands with both direct container programs and domestic inventory solutions via our LA warehouse.",
        stats: ["Primary Export Market", "LA Logistics Hub", "Domestic Fulfillment"],
        imageSrc: config.capacity?.loc_usa
      }
    },
    { 
      id: 'can', 
      label: 'Canada',
      x: 23.3, 
      y: 17.5, 
      type: 'Market',
      details: {
        title: "Canadian Market",
        description: "Serving Canadian retailers with high-quality solid wood furniture, capable of cold-climate resistant finishes and construction.",
        stats: ["Cold-Chain Logistics", "Retail Partnerships"],
        imageSrc: config.capacity?.loc_can
      }
    },
    { 
      id: 'uk', 
      label: 'UK',
      x: 47.4, 
      y: 18.5, 
      type: 'Market',
      details: {
        title: "United Kingdom",
        description: "Exporting distinct British-standard joinery and fire-retardant upholstery compliant furniture to UK distributors.",
        stats: ["UKFR Compliant", "FOB Shipping"],
        imageSrc: config.capacity?.loc_uk
      }
    },
    { 
      id: 'de', 
      label: 'Germany',
      x: 50.9, 
      y: 19.6, 
      type: 'Market',
      details: {
        title: "European Union (Germany)",
        description: "Meeting strict EU sustainability (EUTR) and chemical safety standards for discerning European clients.",
        stats: ["EUTR Compliant", "Sustainable Sourcing"],
        imageSrc: config.capacity?.loc_de
      }
    },
    { 
      id: 'me', 
      label: 'Middle East',
      x: 58.3, 
      y: 32.6, 
      type: 'Market',
      details: {
        title: "Middle East",
        description: "Supplying luxury hospitality projects and high-end residential developments across the region.",
        stats: ["Hospitality Projects", "Luxury Finishes"],
        imageSrc: config.capacity?.loc_me
      }
    },
    { 
      id: 'cn', 
      label: 'Zhaoqing (HQ)',
      x: 77.2, 
      y: 35.2, 
      type: 'HQ',
      details: {
        title: "Zhaoqing Headquarters",
        description: "Our primary campus specializing in complex R&D, mixed-material fabrication, and master craftsmanship. The center of our engineering excellence.",
        stats: ["645,835 sq.ft Facility", "50k+ Monthly Capacity", "R&D Center"],
        imageSrc: config.capacity?.card_cn
      }
    },
    { 
      id: 'kh', 
      label: 'Kandal (Factory)',
      x: 76.2, 
      y: 42.8, 
      type: 'Factory',
      details: {
        title: "Cambodia Factory",
        description: "A strategic low-tariff manufacturing hub in Kandal Province, tailored for high-volume production runs and cost-effective scalability.",
        stats: ["398,000 sq.ft Facility", "Low Tariff", "High Volume Lines"],
        imageSrc: config.capacity?.card_kh
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
         <div className="relative transition-transform duration-300 group-hover:scale-110">
            {isFactory ? (
               <div className={`
                 relative flex items-center justify-center rounded-full border-2 border-white shadow-md transition-all duration-500
                 ${location.type === 'HQ' ? 'w-5 h-5 bg-[#a16207] animate-pulse' : 'w-3 h-3 bg-stone-800 group-hover:bg-[#a16207]'}
               `}>
               </div>
            ) : (
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

         <div className={`
           absolute whitespace-nowrap px-3 py-1 rounded shadow-xl text-[10px] font-bold uppercase tracking-wide pointer-events-none
           transition-all duration-300 transform
           ${isFactory 
              ? 'top-full mt-2 bg-stone-900 text-white translate-y-0'
              : 'bottom-full mb-1 bg-white text-stone-900 border border-stone-100 translate-y-0 group-hover:-translate-y-1'
           }
           opacity-100
         `}>
           {location.label}
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
                  src={selectedLocation.details.imageSrc} 
                  alt={selectedLocation.label}
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
                  <h3 className="font-serif text-2xl">{selectedLocation.details.title}</h3>
                </div>
              </div>
              <div className="p-8">
                 <p className="text-stone-600 leading-relaxed mb-6">{selectedLocation.details.description}</p>
                 
                 {selectedLocation.details.stats && (
                   <div className="space-y-3 border-t border-stone-100 pt-6">
                     {selectedLocation.details.stats?.map((stat: string, idx: number) => (
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
                 {LOCATIONS.find(l => l.id === 'cn')?.details.description}
              </p>
              <ul className="text-stone-500 text-sm space-y-2 mb-6">
                 <li>• 645,835 sq.ft Facility</li>
                 <li>• 3 Automated Production Lines</li>
                 <li>• 50k+ Monthly Capacity</li>
              </ul>
              <div className="w-full h-48 overflow-hidden mt-6 rounded-sm">
                 <img src={config.capacity?.card_cn} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" alt="China Factory" />
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
                 {LOCATIONS.find(l => l.id === 'kh')?.details.description}
              </p>
              <ul className="text-stone-500 text-sm space-y-2 mb-6">
                 <li>• 398,000 sq.ft Facility</li>
                 <li>• 0% Tariff Impact</li>
                 <li>• Specialized in High-Volume SKU Runs</li>
              </ul>
              <div className="w-full h-48 overflow-hidden mt-6 rounded-sm">
                 <img src={config.capacity?.card_kh} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" alt="Cambodia Factory" />
              </div>
            </div>
         </div>
         
         {/* Lead Time & Logistics */}
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
                src={config.capacity?.map_bg} // ✅ Dynamic
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
