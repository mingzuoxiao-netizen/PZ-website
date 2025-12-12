
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight, Search, ChevronDown, Globe } from 'lucide-react';
import { NAV_ITEMS } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { getAsset, ASSET_KEYS } from '../utils/assets';

interface LayoutProps {
  children: React.ReactNode;
}

// --- MEGA MENU DATA STRUCTURE ---
const MEGA_MENU_DATA: Record<
  string,
  { 
    title: string; 
    items: { label: string; href: string }[] 
  }[]
> = {
  "/collections": [ 
    {
      title: "Solid Wood Projects",
      items: [
        { label: "Dining Tables", href: "/collections#solid-wood" },
        { label: "Butcher Block", href: "/collections#solid-wood" },
        { label: "Solid Components", href: "/collections#solid-wood" },
      ],
    },
    {
      title: "Seating Projects",
      items: [
        { label: "Dining Chairs", href: "/collections#seating" },
        { label: "Accent Chairs", href: "/collections#seating" },
        { label: "Bar Stools", href: "/collections#seating" },
      ],
    },
    {
      title: "Metal & Mixed",
      items: [
        { label: "Metal Bases", href: "/collections#mixed" },
        { label: "Mixed Materials", href: "/collections#mixed" },
        { label: "Custom Fabrication", href: "/collections#mixed" },
      ],
    },
    {
      title: "Casegoods",
      items: [
        { label: "Media Consoles", href: "/collections#casegoods" },
        { label: "Nightstands", href: "/collections#casegoods" },
        { label: "Storage Units", href: "/collections#casegoods" },
      ],
    },
  ],
  "/manufacturing": [
    {
      title: "Process",
      items: [
        { label: "Lumber Prep", href: "/manufacturing#lumber" },
        { label: "5-Axis CNC", href: "/manufacturing#cnc" },
        { label: "Auto-Finishing", href: "/manufacturing#finishing" },
      ],
    },
    {
      title: "Standards",
      items: [
        { label: "Incoming QC", href: "/manufacturing#iqc" },
        { label: "In-Process QC", href: "/manufacturing#ipqc" },
        { label: "Final Inspection", href: "/manufacturing#fqc" },
      ],
    },
  ],
  "/capabilities": [
    {
      title: "Services",
      items: [
        { label: "OEM Production", href: "/capabilities#oem" },
        { label: "ODM Design", href: "/capabilities#odm" },
        { label: "Value Engineering", href: "/capabilities#ve" },
      ],
    },
    {
      title: "Compliance",
      items: [
        { label: "TSCA Title VI", href: "/capabilities#tsca" },
        { label: "FSC Certification", href: "/capabilities#fsc" },
        { label: "ISTA Packaging", href: "/capabilities#packaging" },
      ],
    },
  ],
};

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
    if (MEGA_MENU_DATA[path]) {
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

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

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
          case '/collections': return getAsset(ASSET_KEYS.MENU_COLLECTIONS);
          case '/manufacturing': return getAsset(ASSET_KEYS.MENU_MFG);
          case '/capabilities': return getAsset(ASSET_KEYS.MENU_CAPABILITIES);
          default: return getAsset(ASSET_KEYS.MENU_DEFAULT);
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
        <div className="absolute top-0 left-0 w-full h-1 bg-wood-pattern opacity-80 z-[60]"></div>

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
               <span className="text-sm italic ml-1 opacity-80">Precision</span>
            </div>
          </Link>

          <nav className={`hidden lg:flex items-center space-x-12 ${isSearchOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity duration-300 h-full`}>
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path || activeMenu === item.path;
              const hasMegaMenu = !!MEGA_MENU_DATA[item.path];

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
                    {item.label}
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
            {/* Language Switcher */}
            <button
                onClick={toggleLanguage}
                className={`text-[10px] font-bold tracking-widest uppercase transition-colors duration-300 hover:text-safety-700 ${navTextColor}`}
            >
                {language === 'en' ? 'EN' : '中'} <span className="opacity-50 mx-1">/</span> {language === 'en' ? '中' : 'EN'}
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
             absolute top-[90px] left-0 w-full bg-white border-t border-stone-100 shadow-xl overflow-hidden transition-all duration-300 ease-in-out z-40
             ${activeMenu ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2 pointer-events-none'}
           `}
          onMouseEnter={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
          }}
          onMouseLeave={handleMouseLeave}
        >
          {activeMenu && MEGA_MENU_DATA[activeMenu] && (
            <div className="container mx-auto px-6 md:px-12">
               <div className="flex flex-col lg:flex-row h-[350px]">
                 
                 <div className="flex-grow py-12 flex gap-16 bg-white">
                    {MEGA_MENU_DATA[activeMenu].map((group, idx) => (
                      <div 
                        key={idx} 
                        className="min-w-[140px] space-y-6 animate-fade-in"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                         <h3 className="font-serif text-lg text-stone-900 italic border-b border-stone-100 pb-2">
                           {group.title}
                         </h3>
                         <ul className="space-y-3">
                           {group.items.map((link, lIdx) => (
                             <li key={lIdx}>
                               <Link
                                 to={link.href}
                                 onClick={() => handleMenuClick(link.href)}
                                 className="block font-medium text-xs text-stone-500 hover:text-safety-700 hover:translate-x-1 transition-all duration-200 uppercase tracking-wider"
                               >
                                 {link.label}
                               </Link>
                             </li>
                           ))}
                         </ul>
                      </div>
                    ))}
                 </div>

                 <div className="w-[300px] bg-stone-50 h-full relative group overflow-hidden hidden xl:block">
                    <img
                      src={getMenuImage(activeMenu)}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-90"
                      alt="Featured"
                    />
                    <div className="absolute inset-0 bg-stone-900/10"></div>
                    
                    <div className="absolute bottom-0 left-0 p-8 w-full bg-gradient-to-t from-black/60 to-transparent">
                       <span className="block text-white/80 text-[10px] uppercase tracking-widest font-bold mb-1">
                          Focus
                       </span>
                       <p className="text-white font-serif text-xl italic">
                          {activeMenu === '/collections'
                             ? 'Solid Wood'
                             : activeMenu === '/manufacturing'
                             ? 'Precision'
                             : 'Logistics'}
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
                   {item.label}
                </Link>
              </div>
            ))}

            <button
                onClick={() => {
                    toggleLanguage();
                    setIsMobileMenuOpen(false);
                }}
                className="w-full border-b border-stone-100 pb-4 block font-serif text-2xl text-stone-800 hover:text-safety-700 transition-colors"
            >
                {language === 'en' ? 'Switch to Chinese' : 'Switch to English'}
            </button>

            <div className="pt-12 flex flex-col items-center space-y-6">
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
                    PZ Precision
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
                      {item.label}
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
            <p>&copy; {new Date().getFullYear()} PZ Precision Woodworks. {t.common.rights}</p>
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
