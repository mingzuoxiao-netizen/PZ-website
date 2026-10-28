import React, { useRef, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
// Fixed: Added missing ArrowRight import
import { ChevronDown, Hash, Square, Triangle, Circle, ArrowRight } from 'lucide-react';
import { NAV_ITEMS } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePublishedSiteConfig } from '../../contexts/SiteConfigContext';
import { categories as staticCategories } from '../../data/inventory';
import { API_BASE } from '../../utils/siteConfig';
import { extractProductsArray } from '../../utils/extractProducts';

interface DesktopNavProps {
  activeMenu: string | null;
  setActiveMenu: (menu: string | null) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (v: boolean) => void;
  navTextColor: string;
  useWhiteNav: boolean;
}

const DesktopNav: React.FC<DesktopNavProps> = ({ 
  activeMenu, setActiveMenu, isSearchOpen, navTextColor, useWhiteNav 
}) => {
  const { t, language } = useLanguage();
  const location = useLocation();
  const { config } = usePublishedSiteConfig();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeCategoryIds, setActiveCategoryIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`${API_BASE}/products`)
        .then(res => res.json())
        .then(json => {
            const rawData = extractProductsArray(json);
            const ids = new Set<string>(rawData.map((p: any) => String(p.category || '').toLowerCase().trim()));
            setActiveCategoryIds(ids);
        })
        .catch(() => {});
  }, []);

  const dynamicCategories = (config?.categories && config.categories.length > 0) ? config.categories : staticCategories;
  const filteredCategories = dynamicCategories.filter(cat => 
    activeCategoryIds.has(cat.id.toLowerCase()) || activeCategoryIds.has(cat.title.toLowerCase())
  );

  const megaMenuData = {
    "/collections": [
        {
            title: "Archive Registry",
            icon: <Square size={10} className="text-safety-700" />,
            items: filteredCategories.map(cat => ({
                label: cat.title,
                href: `/collections?category=${cat.id}`
            }))
        }
    ],
    "/manufacturing": [
      {
        title: "Industrial Flow",
        icon: <Triangle size={10} className="text-safety-700" />,
        items: [
          { label: t.nav.mega.lumberPrep, href: "/manufacturing#lumber" },
          { label: t.nav.mega.cnc5Axis, href: "/manufacturing#cnc" },
          { label: t.nav.mega.autoFinishing, href: "/manufacturing#finishing" },
        ],
      },
      {
        title: "Registry Standards",
        icon: <Circle size={10} className="text-safety-700" />,
        items: [
          { label: t.nav.mega.incomingQC, href: "/manufacturing#iqc" },
          { label: t.nav.mega.inProcessQC, href: "/manufacturing#ipqc" },
          { label: t.nav.mega.finalInspection, href: "/manufacturing#fqc" },
        ],
      },
    ],
    "/capabilities": [
      {
        title: "Strategic Channels",
        icon: <Triangle size={10} className="text-safety-700" />,
        items: [
          { label: t.nav.mega.oemProduction, href: "/capabilities#oem" },
          { label: t.nav.mega.odmDesign, href: "/capabilities#odm" },
          { label: t.nav.mega.valueEngineering, href: "/capabilities#ve" },
        ],
      },
      {
        title: "Safety Protocols",
        icon: <Circle size={10} className="text-safety-700" />,
        items: [
          { label: t.nav.mega.tscaTitleVI, href: "/capabilities#tsca" },
          { label: t.nav.mega.fscCertification, href: "/capabilities#fsc" },
          { label: t.nav.mega.istaPackaging, href: "/capabilities#packaging" },
        ],
      },
    ],
  };

  const handleMouseEnter = (path: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if ((megaMenuData as any)[path]) {
      setActiveMenu(path);
    } else {
      setActiveMenu(null);
    }
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 200);
  };

  const handleMenuClick = (href: string) => {
    if (href.includes('#')) {
      const [path, hash] = href.split('#');
      if (location.pathname === path) {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setActiveMenu(null);
  };

  const getMenuImage = (path: string | null) => {
      switch(path) {
          case '/collections': return config?.menu?.feat_collections;
          case '/manufacturing': return config?.menu?.feat_mfg;
          case '/capabilities': return config?.menu?.feat_capabilities;
          default: return config?.menu?.feat_default;
      }
  }

  const getFocusText = (path: string | null) => {
      switch(path) {
          case '/collections': return "Scalable Craftsmanship";
          case '/manufacturing': return "Zero-Defect Logic";
          case '/capabilities': return "Engineering Solutions";
          default: return "Global Supply Chain";
      }
  }

  const getGridCols = (count: number) => {
    if (count === 1) return 'grid-cols-1 max-w-sm';
    return 'grid-cols-2';
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const navLinkClasses = 'text-[11px] font-bold tracking-[0.2em]';

  return (
    <>
      <nav className={`hidden lg:flex items-center space-x-10 ${isSearchOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity duration-300 h-full`}>
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path || activeMenu === item.path;
          const hasMegaMenu = !!(megaMenuData as any)[item.path];

          return (
            <div
              key={item.path}
              className="h-full flex items-center relative group"
              onMouseEnter={() => handleMouseEnter(item.path)}
              onMouseLeave={handleMouseLeave}
            >
              <Link
                to={item.path}
                className={`${navLinkClasses} uppercase transition-all duration-300 flex items-center whitespace-nowrap ${
                  isActive
                    ? 'text-safety-700' 
                    : navTextColor
                }`}
              >
                {t.nav.header[item.key]}
                {hasMegaMenu && (
                  <ChevronDown
                    size={10}
                    className={`ml-2 transition-transform duration-500 opacity-40 group-hover:opacity-100 ${activeMenu === item.path ? 'rotate-180 text-safety-700' : ''}`}
                  />
                )}
              </Link>
              {/* Active Indicator Line */}
              <div className={`absolute bottom-0 left-0 w-full h-[3px] bg-safety-700 transition-all duration-500 origin-left ${isActive ? 'scale-x-100' : 'scale-x-0'}`}></div>
            </div>
          );
        })}
      </nav>

      {/* REFINED MEGA MENU OVERLAY */}
      <div
        className={`
           fixed top-[70px] md:top-[90px] left-0 w-full bg-white border-t border-stone-100 shadow-[0_40px_80px_rgba(0,0,0,0.15)] overflow-hidden transition-all duration-500 ease-in-out z-40
           ${activeMenu ? 'opacity-100 visible translate-y-0 h-auto' : 'opacity-0 invisible -translate-y-4 h-0 pointer-events-none'}
         `}
        onMouseEnter={() => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
        }}
        onMouseLeave={handleMouseLeave}
      >
        {activeMenu && (megaMenuData as any)[activeMenu] && (
          <div className="container mx-auto px-6 md:px-12">
             <div className="flex flex-col lg:flex-row min-h-[480px]">
               {/* Left: Technical Nav Grid */}
               <div className={`flex-grow py-16 grid gap-x-16 gap-y-12 bg-white pr-12 overflow-y-auto ${getGridCols((megaMenuData as any)[activeMenu].length)}`}>
                  {(megaMenuData as any)[activeMenu].map((group: any, idx: number) => (
                    <div key={idx} className="animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                       <div className="flex items-center gap-3 mb-8">
                          {group.icon}
                          <h3 className="font-mono text-[9px] font-bold uppercase tracking-[0.4em] text-stone-400">{group.title}</h3>
                       </div>
                       <ul className="space-y-5">
                         {group.items.map((link: any, lIdx: number) => (
                           <li key={lIdx} className="group/item">
                             <Link
                               to={link.href}
                               onClick={() => handleMenuClick(link.href)}
                               className="flex items-center text-xl md:text-2xl font-serif text-stone-900 hover:text-safety-700 transition-all duration-300 transform group-hover/item:translate-x-3"
                             >
                               {link.label}
                               <ArrowRight size={14} className="ml-4 opacity-0 group-hover/item:opacity-100 transition-all -translate-x-2 group-hover/item:translate-x-0" />
                             </Link>
                           </li>
                         ))}
                       </ul>
                    </div>
                  ))}
               </div>

               {/* Right: Immersive Focus Panel */}
               <div className="w-[440px] xl:w-[520px] bg-stone-900 h-auto relative group overflow-hidden hidden lg:block border-l border-stone-50 flex-shrink-0">
                  <img src={getMenuImage(activeMenu)} className="absolute inset-0 w-full h-full object-cover transition-all duration-[4s] group-hover:scale-105 opacity-60" alt="Featured" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-stone-950 via-stone-950/20 to-transparent opacity-80 group-hover:opacity-40 transition-opacity"></div>
                  <div className="absolute inset-0 p-16 flex flex-col justify-end">
                     <div className="translate-y-6 group-hover:translate-y-0 transition-transform duration-1000">
                        <span className="inline-block bg-safety-700 text-white text-[8px] uppercase tracking-[0.5em] font-black mb-6 px-3 py-1">Registry Insight</span>
                        <p className="text-white font-serif text-5xl lg:text-6xl italic leading-tight mb-8 drop-shadow-lg">{getFocusText(activeMenu)}</p>
                        <div className="h-[2px] w-0 group-hover:w-full bg-safety-700 transition-all duration-1000 delay-300 shadow-[0_0_15px_rgba(194,65,12,0.5)]"></div>
                     </div>
                  </div>
               </div>
             </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DesktopNav;