
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight, Search, ChevronDown, Globe } from 'lucide-react';
import { NAV_ITEMS } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { ASSET_KEYS } from '../utils/assets';
import { useAssets } from '../contexts/AssetContext';
import { usePublishedSiteConfig } from '../contexts/SiteConfigContext'; // New import

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mega Menu State
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  
  // Use Hook for live asset data
  const assets = useAssets();
  
  // Get Site Meta for Footer
  const { meta } = usePublishedSiteConfig();

  // --- DYNAMIC MEGA MENU DATA ---
  const megaMenuData = {
    "/collections": [ 
      {
        title: t.nav.mega.solidWoodProjects,
        items: [
          { label: t.nav.mega.diningTables, href: "/collections#solid-wood" },
          { label: t.nav.mega.butcherBlock, href: "/collections#solid-wood" },
          { label: t.nav.mega.solidComponents, href: "/collections#solid-wood" },
        ],
      },
      {
        title: t.nav.mega.seatingProjects,
        items: [
          { label: t.nav.mega.diningChairs, href: "/collections#seating" },
          { label: t.nav.mega.accentChairs, href: "/collections#seating" },
          { label: t.nav.mega.barStools, href: "/collections#seating" },
        ],
      },
      {
        title: t.nav.mega.metalMixed,
        items: [
          { label: t.nav.mega.metalBases, href: "/collections#mixed" },
          { label: t.nav.mega.mixedMaterials, href: "/collections#mixed" },
          { label: t.nav.mega.customFabrication, href: "/collections#mixed" },
        ],
      },
      {
        title: t.nav.mega.casegoods,
        items: [
          { label: t.nav.mega.mediaConsoles, href: "/collections#casegoods" },
          { label: t.nav.mega.nightstands, href: "/collections#casegoods" },
          { label: t.nav.mega.storageUnits, href: "/collections#casegoods" },
        ],
      },
    ],
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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const shouldLockScroll = isSearchOpen || isMobileMenuOpen;
    document.body.style.overflow = shouldLockScroll ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSearchOpen, isMobileMenuOpen]);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleMouseEnter = (path: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // Type assertion to access dynamic key
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

  useEffect(() => {
    setActiveMenu(null);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const isHome = location.pathname === '/';
  const isMegaMenuActive = activeMenu !== null;
  const useWhiteNav = isScrolled || !isHome || isMobileMenuOpen || isSearchOpen || isMegaMenuActive;

  const textColor = useWhiteNav ? 'text-stone-900' : 'text-white';
  const navTextColor = useWhiteNav
    ? 'text-stone-600 hover:text-safety-700'
    : 'text-stone-300 hover:text-white';
  
  const getHeaderBackground = () => {
    if (isMobileMenuOpen) return 'bg-white shadow-none';
    if (isSearchOpen) return 'bg-white shadow-none border-b border-stone-100';
    if (isMegaMenuActive) return 'bg-white border-b border-stone-200 shadow-sm';
    if (useWhiteNav) return 'bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-sm';
    return 'bg-transparent border-b border-white/10';
  };

  const getMenuImage = (path: string | null) => {
      switch(path) {
          case '/collections': return assets[ASSET_KEYS.MENU_COLLECTIONS];
          case '/manufacturing': return assets[ASSET_KEYS.MENU_MFG];
          case '/capabilities': return assets[ASSET_KEYS.MENU_CAPABILITIES];
          default: return assets[ASSET_KEYS.MENU_DEFAULT];
      }
  }

  const getFocusText = (path: string | null) => {
      switch(path) {
          case '/collections': return t.nav.mega.focusSolid;
          case '/manufacturing': return t.nav.mega.focusPrecision;
          case '/capabilities': return t.nav.mega.focusEng;
          default: return t.nav.mega.focusLogistics;
      }
  }

  const handleMenuClick = (href: string) => {
    if (href.includes('#')) {
      const [path, hash] = href.split('#');
      if (location.pathname === path) {
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
    setActiveMenu(null);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  // Dynamic grid columns based on number of items
  const getGridCols = (count: number) => {
    if (count === 2) return 'grid-cols-2';
    if (count === 3) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-stone-900 font-sans transition-colors duration-500">
      
      <header
        onMouseLeave={handleMouseLeave}
        className={`fixed top-0 left-0 right-0 z-50
          transition-all duration-500 ease-in-out
          ${getHeaderBackground()}
          ${isMobileMenuOpen ? 'h-screen' : 'h-[90px]'}
        `}
      >
        <div className="container mx-auto px-6 md:px-12 h-full flex justify-between items-center relative z-50">
          <Link
            to="/"
            className="group z-50 flex items-center gap-3"
            onClick={() => {
              setIsMobileMenuOpen(false);
              setIsSearchOpen(false);
            }}
          >
            <div className={`font-serif tracking-tight leading-none transition-colors duration-300 ${textColor}`}>
               <span className="text-2xl font-bold">PZ</span>
            </div>
          </Link>

          <nav className={`hidden lg:flex items-center space-x-12 ${isSearchOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity duration-300 h-full`}>
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path || activeMenu === item.path;
              // Check if path exists in megaMenuData
              const hasMegaMenu = !!(megaMenuData as any)[item.path];

              return (
                <div
                  key={item.path}
                  className="h-full flex items-center relative group"
                  onMouseEnter={() => handleMouseEnter(item.path)}
                >
                  <Link
                    to={item.path}
                    className={`text-[12px] font-bold tracking-[0.1em] uppercase transition-colors duration-300 flex items-center ${
                      isActive
                        ? useWhiteNav ? 'text-safety-700' : 'text-white'
                        : navTextColor
                    }`}
                  >
                    {t.nav.header[item.key]}
                    {hasMegaMenu && (
                      <ChevronDown
                        size={10}
                        className={`ml-1 transition-transform duration-300 opacity-60 ${activeMenu === item.path ? 'rotate-180' : ''}`}
                      />
                    )}
                  </Link>
                  <span
                    className={`absolute bottom-8 left-0 h-[2px] bg-safety-700 transition-all duration-300 ease-out ${
                      isActive && useWhiteNav
                        ? 'w-full'
                        : 'w-0'
                    }`}
                  ></span>
                </div>
              );
            })}
          </nav>

          <div className="flex items-center space-x-6 z-50">
            {/* Language Switcher - Desktop */}
            <button
              onClick={toggleLanguage}
              className={`hidden lg:block text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${navTextColor} hover:text-safety-700`}
            >
              {language === 'en' ? 'EN / 中' : '中 / EN'}
            </button>

            <button
              onClick={() => {
                if (isSearchOpen) {
                  setIsSearchOpen(false);
                } else {
                  setIsSearchOpen(true);
                  setActiveMenu(null);
                }
              }}
              className={`focus:outline-none transition-colors duration-300 ${navTextColor} hover:text-safety-700`}
            >
              {isSearchOpen ? <X size={20} /> : <Search size={20} />}
            </button>

            <button
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
                setIsSearchOpen(false);
                setActiveMenu(null);
              }}
              className={`lg:hidden focus:outline-none transition-colors duration-300 ${navTextColor}`}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* --- MEGA MENU PANEL --- */}
        <div
          className={`
             absolute top-[90px] left-0 w-full bg-white border-t border-stone-100 shadow-2xl overflow-hidden transition-all duration-300 ease-in-out z-40
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
                 
                 <div className={`flex-grow py-16 grid gap-6 bg-white pr-6 ${getGridCols((megaMenuData as any)[activeMenu].length)}`}>
                    {(megaMenuData as any)[activeMenu].map((group: any, idx: number) => (
                      <div 
                        key={idx} 
                        className="space-y-6 animate-fade-in"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                         <h3 className="font-serif text-xl text-stone-900 leading-tight">
                           {group.title}
                         </h3>
                         <div className="w-8 h-[2px] bg-stone-200"></div>
                         <ul className="space-y-4">
                           {group.items.map((link: any, lIdx: number) => (
                             <li key={lIdx}>
                               <Link
                                 to={link.href}
                                 onClick={() => handleMenuClick(link.href)}
                                 className="block text-xs font-bold uppercase tracking-[0.15em] text-stone-500 hover:text-safety-700 transition-colors duration-300"
                               >
                                 {link.label}
                               </Link>
                             </li>
                           ))}
                         </ul>
                      </div>
                    ))}
                 </div>

                 <div className="w-[360px] bg-stone-50 h-full relative group overflow-hidden hidden lg:block border-l border-stone-100">
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

        {/* Mobile Nav Content */}
        <div
          className={`
            absolute inset-0 top-[90px] z-40 flex flex-col justify-start items-center pb-20 overflow-y-auto bg-white
            transition-all duration-500 ease-in-out
            ${isMobileMenuOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-4 invisible'}
          `}
        >
          <nav className="flex flex-col space-y-4 text-center w-full pt-12 px-6">
            {NAV_ITEMS.map((item) => (
              <div key={item.path} className="w-full border-b border-stone-100 pb-4">
                <Link
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block font-serif text-2xl text-stone-800 hover:text-safety-700 transition-colors"
                >
                   {t.nav.header[item.key]}
                </Link>
              </div>
            ))}

            <div className="pt-8 flex flex-col items-center space-y-8">
              <button
                onClick={toggleLanguage}
                className="text-sm font-bold uppercase tracking-widest text-stone-500 hover:text-stone-900 flex items-center"
              >
                <Globe size={16} className="mr-2" />
                {language === 'en' ? 'Switch to Chinese' : '切换到中文'}
              </button>

              <Link
                to="/inquire"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-xs font-bold tracking-[0.2em] uppercase bg-stone-900 text-white px-10 py-4 hover:bg-safety-700 transition-colors"
              >
                {t.common.contactUs}
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Clean Search Overlay */}
      <div
        className={`fixed inset-0 top-[90px] z-30 bg-white/90 backdrop-blur-sm transition-opacity duration-500 ${isSearchOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={() => setIsSearchOpen(false)}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className={`
                bg-white w-full border-b border-stone-200 shadow-sm
                transform transition-all duration-500 ease-out origin-top
                ${isSearchOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}
            `}
        >
          <div className="container mx-auto px-6 md:px-12 py-12">
            <form onSubmit={handleSearchSubmit} className="relative max-w-3xl mx-auto">
              <div className="relative group">
                <input
                  id="search-input"
                  ref={searchInputRef}
                  type="text"
                  placeholder={t.common.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-3xl font-serif text-stone-900 placeholder-stone-300 border-b border-stone-300 pb-4 focus:border-stone-900 focus:outline-none transition-all"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-900 transition-colors p-2"
                >
                  <ArrowRight size={24} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <main className="flex-grow">{children}</main>

      <footer className="bg-stone-50 border-t border-stone-200 pt-24 pb-12 text-stone-500 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-wood-pattern opacity-50"></div>
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-8">
                 <div className="font-serif text-2xl text-stone-900 font-bold">
                    PZ
                 </div>
              </div>
              <p className="text-stone-500 max-w-sm mb-8 leading-relaxed text-sm font-light">
                {t.home.heroQuote} {t.home.strengthDesc1}
              </p>
              <div className="flex space-x-6 text-xs uppercase tracking-widest font-bold">
                <span className="text-stone-900">Zhaoqing</span>
                <span className="text-stone-300">/</span>
                <span className="text-stone-900">Kandal</span>
                <span className="text-stone-300">/</span>
                <span className="text-stone-900">Los Angeles</span>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold tracking-widest text-stone-900 uppercase mb-8">{t.common.explore}</h3>
              <ul className="space-y-4">
                {NAV_ITEMS.slice(0, 4).map((item) => (
                  <li key={item.path}>
                    <Link to={item.path} className="text-stone-500 hover:text-safety-700 transition-colors text-sm hover:translate-x-1 inline-block">
                      {t.nav.header[item.key]}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold tracking-widest text-stone-900 uppercase mb-8">{t.common.connect}</h3>
              <ul className="space-y-4">
                <li>
                  <Link to="/inquire" className="text-stone-500 hover:text-safety-700 transition-colors flex items-center group text-sm">
                    {t.common.startProject} <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-stone-200 pt-10 flex flex-col md:flex-row justify-between items-center text-xs text-stone-400">
            <div className="flex flex-col md:flex-row items-center gap-4">
               <p>&copy; {new Date().getFullYear()} PZ. {t.common.rights}</p>
               {meta.version !== '0.0.0' && (
                 <span className="text-stone-300 hidden md:inline">|</span>
               )}
               {meta.version !== '0.0.0' && (
                 <span className="opacity-60 font-mono text-[10px]">
                    v{meta.version} • Published: {meta.published_at ? new Date(meta.published_at).toLocaleDateString() : 'Unknown'}
                 </span>
               )}
            </div>
            
            <div className="flex space-x-8 mt-4 md:mt-0">
              <Link to="/privacy" className="hover:text-stone-600 cursor-pointer transition-colors">{t.common.privacy}</Link>
              <Link to="/terms" className="hover:text-stone-600 cursor-pointer transition-colors">{t.common.terms}</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
