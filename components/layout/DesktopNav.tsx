
import React, { useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { NAV_ITEMS } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePublishedSiteConfig } from '../../contexts/SiteConfigContext';

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
  const { t } = useLanguage();
  const location = useLocation();
  const { config } = usePublishedSiteConfig();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- MEGA MENU DATA ---
  // Portfolio (/collections) removed from dropdown as requested
  const megaMenuData = {
    "/manufacturing": [
      {
        title: t.nav.mega.process,
        items: [
          { label: t.nav.mega.lumberPrep, href: "/manufacturing#lumber" },
          { label: t.nav.mega.cnc5Axis, href: "/manufacturing#cnc" },
          { label: t.nav.mega.autoFinishing, href: "/manufacturing#finishing" },
        ],
      },
      {
        title: t.nav.mega.standards,
        items: [
          { label: t.nav.mega.incomingQC, href: "/manufacturing#iqc" },
          { label: t.nav.mega.inProcessQC, href: "/manufacturing#ipqc" },
          { label: t.nav.mega.finalInspection, href: "/manufacturing#fqc" },
        ],
      },
    ],
    "/capabilities": [
      {
        title: t.nav.mega.services,
        items: [
          { label: t.nav.mega.oemProduction, href: "/capabilities#oem" },
          { label: t.nav.mega.odmDesign, href: "/capabilities#odm" },
          { label: t.nav.mega.valueEngineering, href: "/capabilities#ve" },
        ],
      },
      {
        title: t.nav.mega.compliance,
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
          case '/manufacturing': return config?.menu?.feat_mfg;
          case '/capabilities': return config?.menu?.feat_capabilities;
          default: return config?.menu?.feat_default;
      }
  }

  const getFocusText = (path: string | null) => {
      switch(path) {
          case '/manufacturing': return t.nav.mega.focusPrecision;
          case '/capabilities': return t.nav.mega.focusEng;
          default: return t.nav.mega.focusLogistics;
      }
  }

  const getGridCols = (count: number) => {
    if (count === 2) return 'grid-cols-2';
    if (count === 3) return 'grid-cols-3';
    if (count === 4) return 'grid-cols-4';
    if (count >= 5) return 'grid-cols-5';
    return 'grid-cols-4';
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <>
      <nav className={`hidden lg:flex items-center space-x-8 lg:space-x-10 xl:space-x-12 ${isSearchOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity duration-300 h-full`}>
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
                className={`text-[15px] font-bold tracking-[0.15em] uppercase transition-colors duration-300 flex items-center whitespace-nowrap ${
                  isActive
                    ? useWhiteNav ? 'text-safety-700' : 'text-white'
                    : navTextColor
                }`}
              >
                {t.nav.header[item.key]}
                {hasMegaMenu && (
                  <ChevronDown
                    size={14}
                    className={`ml-1 transition-transform duration-300 opacity-60 ${activeMenu === item.path ? 'rotate-180' : ''}`}
                  />
                )}
              </Link>
              <span
                className={`absolute bottom-8 left-0 h-[2px] bg-safety-700 transition-all duration-300 ease-out ${
                  isActive && useWhiteNav ? 'w-full' : 'w-0'
                }`}
              ></span>
            </div>
          );
        })}
      </nav>

      <div
        className={`
           fixed top-[90px] left-0 w-full bg-white border-t border-stone-100 shadow-2xl overflow-hidden transition-all duration-300 ease-in-out z-40
           ${activeMenu ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2 pointer-events-none'}
         `}
        onMouseEnter={() => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
        }}
        onMouseLeave={handleMouseLeave}
      >
        {activeMenu && (megaMenuData as any)[activeMenu] && (
          <div className="container mx-auto px-6 md:px-12">
             <div className="flex flex-col lg:flex-row h-[420px]">
               
               <div className={`flex-grow py-16 grid gap-x-4 gap-y-8 bg-white pr-6 overflow-y-auto ${getGridCols((megaMenuData as any)[activeMenu].length)}`}>
                  {(megaMenuData as any)[activeMenu].map((group: any, idx: number) => (
                    <div 
                      key={idx} 
                      className="space-y-4 animate-fade-in"
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                       <h3 className="font-serif text-lg text-stone-900 leading-tight">
                         {group.title}
                       </h3>
                       <div className="w-6 h-[1px] bg-stone-200"></div>
                       <ul className="space-y-2.5">
                         {group.items.map((link: any, lIdx: number) => (
                           <li key={lIdx}>
                             <Link
                               to={link.href}
                               onClick={() => handleMenuClick(link.href)}
                               className="block text-sm font-bold uppercase tracking-[0.1em] text-stone-500 hover:text-safety-700 transition-colors duration-300 truncate"
                             >
                               {link.label}
                             </Link>
                           </li>
                         ))}
                       </ul>
                    </div>
                  ))}
               </div>

               <div className="w-[300px] xl:w-[360px] bg-stone-50 h-full relative group overflow-hidden hidden lg:block border-l border-stone-100 flex-shrink-0">
                  <img
                    src={getMenuImage(activeMenu)}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-100"
                    alt="Featured"
                  />
                  <div className="absolute inset-0 bg-stone-900/10 group-hover:bg-transparent transition-colors"></div>
                  
                  <div className="absolute bottom-0 left-0 p-10 w-full bg-gradient-to-t from-stone-900/90 to-transparent">
                     <span className="block text-safety-700 text-xs uppercase tracking-[0.3em] font-bold mb-2">
                        FOCUS
                     </span>
                     <p className="text-white font-serif text-2xl italic">
                        {getFocusText(activeMenu)}
                     </p>
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
