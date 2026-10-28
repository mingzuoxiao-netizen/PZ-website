import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { NAV_ITEMS } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { ArrowRight, Globe, Factory, MapPin, Plus, Minus, ChevronRight } from 'lucide-react';
import { usePublishedSiteConfig } from '../../contexts/SiteConfigContext';
import { categories as staticCategories } from '../../data/inventory';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  textColor: string; 
}

const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { config } = usePublishedSiteConfig();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const dynamicCategories = (config?.categories && config.categories.length > 0) ? config.categories : staticCategories;

  const toggleExpand = (key: string) => {
    setExpandedItems(prev => 
      prev.includes(key) ? prev.filter(i => i !== key) : [...prev, key]
    );
  };

  const menuDetails: Record<string, { label: string; href: string }[]> = {
    collections: dynamicCategories.map(cat => ({
      label: cat.title,
      href: `/collections?category=${cat.id}`
    })),
    manufacturing: [
      { label: t.nav.mega.lumberPrep, href: "/manufacturing#lumber" },
      { label: t.nav.mega.cnc5Axis, href: "/manufacturing#cnc" },
      { label: t.nav.mega.autoFinishing, href: "/manufacturing#finishing" },
      { label: t.nav.mega.incomingQC, href: "/manufacturing#iqc" },
      { label: t.nav.mega.inProcessQC, href: "/manufacturing#ipqc" },
      { label: t.nav.mega.finalInspection, href: "/manufacturing#fqc" },
    ],
    capabilities: [
      { label: t.nav.mega.oemProduction, href: "/capabilities#oem" },
      { label: t.nav.mega.odmDesign, href: "/capabilities#odm" },
      { label: t.nav.mega.valueEngineering, href: "/capabilities#ve" },
      { label: t.nav.mega.tscaTitleVI, href: "/capabilities#tsca" },
      { label: t.nav.mega.fscCertification, href: "/capabilities#fsc" },
      { label: t.nav.mega.istaPackaging, href: "/capabilities#packaging" },
    ]
  };

  return (
    <div 
      className={`
        fixed inset-0 z-40 bg-stone-900 transition-all duration-700 ease-in-out
        flex flex-col
        ${isOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-full pointer-events-none'}
      `}
    >
      {/* Background Graphic */}
      <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Factory size={400} />
      </div>

      <nav className="flex flex-col flex-grow pt-[100px] pb-12 px-6 relative z-10 overflow-y-auto custom-scrollbar">
        <div className="space-y-4 mb-12">
          {NAV_ITEMS.map((item, idx) => {
            if (item.path === '/inquire') return null;
            const hasSubItems = !!menuDetails[item.key];
            const isExpanded = expandedItems.includes(item.key);

            return (
              <div 
                key={item.path} 
                className={`border-b border-white/5 pb-4 transition-all duration-500 ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
                style={{ transitionDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-center justify-between group">
                  <Link
                    to={item.path}
                    onClick={onClose}
                    className="flex items-center gap-4 flex-grow"
                  >
                    <span className="font-mono text-[9px] text-stone-600 font-bold">0{idx + 1}</span>
                    <span className="font-serif text-3xl text-stone-100 group-hover:text-safety-700 transition-colors">
                        {t.nav.header[item.key]}
                    </span>
                  </Link>
                  
                  {hasSubItems && (
                    <button 
                      onClick={() => toggleExpand(item.key)}
                      className="p-4 -mr-4 text-stone-500 hover:text-white transition-colors"
                    >
                      {isExpanded ? <Minus size={20} /> : <Plus size={20} />}
                    </button>
                  )}
                </div>

                {/* Sub-menu items */}
                {hasSubItems && (
                  <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[500px] mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="pl-10 space-y-4 py-2 border-l border-white/5 ml-2">
                      {menuDetails[item.key].map((sub, sIdx) => (
                        <Link 
                          key={sIdx}
                          to={sub.href}
                          onClick={onClose}
                          className="flex items-center justify-between text-stone-400 text-sm font-bold uppercase tracking-widest hover:text-safety-700 transition-colors"
                        >
                          {sub.label}
                          <ChevronRight size={14} className="opacity-30" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className={`mt-auto space-y-6 transition-all duration-700 delay-500 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
          <Link
            to="/inquire"
            onClick={onClose}
            className="w-full flex items-center justify-between bg-safety-700 text-white p-6 font-bold uppercase tracking-[0.2em] text-[10px] shadow-2xl group"
          >
            Start New Project Run 
            <div className="bg-white/20 p-2 rounded-full group-hover:translate-x-2 transition-transform">
              <ArrowRight size={16} />
            </div>
          </Link>

          <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6 pb-4">
              <div className="space-y-1">
                  <span className="flex items-center gap-2 text-[9px] font-mono text-stone-500 uppercase tracking-widest">
                      <MapPin size={10} className="text-safety-700" /> HQ / RD
                  </span>
                  <p className="text-stone-300 text-[10px] font-bold">Zhaoqing, China</p>
              </div>
              <div className="space-y-1 text-right">
                  <span className="flex items-center gap-2 justify-end text-[9px] font-mono text-stone-500 uppercase tracking-widest">
                      <Globe size={10} className="text-safety-700" /> STATUS
                  </span>
                  <p className="text-green-500 text-[10px] font-bold">Systems Online</p>
              </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default MobileNav;