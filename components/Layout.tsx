
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight, Search, ChevronDown } from 'lucide-react';
import { NAV_ITEMS } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface LayoutProps {
  children: React.ReactNode;
}

// --- MEGA MENU DATA STRUCTURE (CURATED & PREMIUM) ---
// Reduced items, focused on key categories
const MEGA_MENU_DATA: Record<
  string,
  { title: string; items: { label: string; href: string }[] }[]
> = {
  "/collections": [
    {
      title: "Living",
      items: [
        { label: "Coffee Tables", href: "/collections?cat=living&sub=Coffee%20Tables" },
        { label: "Media Consoles", href: "/collections?cat=living&sub=Media%20Consoles" },
        { label: "Sideboards", href: "/collections?cat=living&sub=Sideboards" },
      ],
    },
    {
      title: "Dining",
      items: [
        { label: "Dining Tables", href: "/collections?cat=dining" },
        { label: "Dining Chairs", href: "/collections?cat=seating&sub=Dining%20Chairs" },
        { label: "Bar Stools", href: "/collections?cat=seating&sub=Bar%20Stools" },
      ],
    },
    {
      title: "Workspace",
      items: [
        { label: "Executive Desks", href: "/collections?cat=workspace" },
        { label: "Meeting Tables", href: "/collections?cat=workspace" },
        { label: "Storage Units", href: "/collections?cat=workspace" },
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
  const { language, setLanguage, t } = useLanguage();

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

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
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

  const isHome = location.pathname === '/';
  const isMegaMenuActive = activeMenu !== null;
  const useDarkNav = isScrolled || !isHome || isMobileMenuOpen || isSearchOpen || isMegaMenuActive;

  const textColor = !useDarkNav ? 'text-white' : 'text-[#1c1917]';
  const navTextColor = !useDarkNav
    ? 'text-stone-200 hover:text-white'
    : 'text-stone-600 hover:text-[#1c1917]';
  const logoColor = !useDarkNav ? 'text-white' : 'text-[#1c1917]';
  const accentColor = !useDarkNav ? 'text-[#d4b996]' : 'text-[#a16207]';

  const getHeaderBackground = () => {
    if (isMobileMenuOpen) return 'bg-[#F5F0EB] shadow-none border-transparent';
    if (isSearchOpen) return 'bg-[#F5F0EB] shadow-none border-b border-stone-300';
    if (isMegaMenuActive) return 'bg-white border-b border-stone-100 shadow-sm';
    if (useDarkNav) return 'bg-[#FDFCF8]/95 backdrop-blur-md border-b border-stone-200 shadow-sm';
    return 'bg-transparent border-b border-transparent';
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 font-sans transition-colors duration-500">
      
      <header
        onMouseLeave={handleMouseLeave}
        className={`fixed top-0 left-0 right-0 z-50
          transition-all duration-300 ease-out
          ${getHeaderBackground()}
          ${isMobileMenuOpen ? 'h-screen' : 'h-[80px]'}
        `}
      >
        <div className="container mx-auto px-6 md:px-12 h-[80px] flex justify-between items-center relative z-50">
          <Link
            to="/"
            className="group z-50"
            onClick={() => {
              setIsMobileMenuOpen(false);
              setIsSearchOpen(false);
            }}
          >
            <div className="flex flex-col">
              <h1 className={`font-serif text-2xl md:text-3xl font-bold tracking-tight leading-none flex items-baseline transition-colors duration-300 ${logoColor}`}>
                PZ
                <span className={`text-4xl leading-none ml-0.5 transition-colors duration-300 ${accentColor}`}>.</span>
              </h1>
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
                    className={`text-xs font-bold tracking-[0.2em] uppercase transition-colors duration-300 flex items-center ${
                      isActive
                        ? isHome && !isScrolled && !isMegaMenuActive
                          ? 'text-white'
                          : 'text-[#a16207]'
                        : navTextColor
                    }`}
                  >
                    {language === 'zh' ? item.label_zh : item.label}
                    {hasMegaMenu && (
                      <ChevronDown
                        size={10}
                        className={`ml-1 transition-transform duration-300 ${activeMenu === item.path ? 'rotate-180' : ''}`}
                      />
                    )}
                  </Link>
                  <span
                    className={`absolute bottom-0 left-0 h-[2px] bg-[#a16207] transition-all duration-300 ease-out ${
                      isActive && (isScrolled || isMegaMenuActive || !isHome)
                        ? 'w-full'
                        : 'w-0'
                    }`}
                  ></span>
                </div>
              );
            })}
          </nav>

          <div className="flex items-center space-x-6 z-50">
            <button
              onClick={toggleLanguage}
              className={`text-xs font-bold uppercase tracking-wider focus:outline-none transition-colors duration-300 ${navTextColor} hover:text-[#a16207]`}
            >
              {language === 'en' ? '中' : 'EN'}
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
              className={`focus:outline-none transition-colors duration-300 ${navTextColor} hover:text-[#a16207]`}
            >
              {isSearchOpen ? <X size={24} /> : <Search size={24} />}
            </button>

            <button
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
                setIsSearchOpen(false);
                setActiveMenu(null);
              }}
              className={`lg:hidden focus:outline-none transition-colors duration-300 ${navTextColor}`}
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* --- REFINED MEGA MENU PANEL --- */}
        <div
          className={`
             absolute top-[80px] left-0 w-full bg-white shadow-2xl border-t border-stone-100 overflow-hidden transition-all duration-300 ease-in-out z-40
             ${activeMenu ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2 pointer-events-none'}
           `}
          onMouseEnter={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
          }}
          onMouseLeave={handleMouseLeave}
        >
          {activeMenu && MEGA_MENU_DATA[activeMenu] && (
            <div className="container mx-auto px-6 md:px-12">
               <div className="flex flex-col lg:flex-row h-[400px]">
                 
                 {/* Links Section - Flexible Width based on items */}
                 <div className="flex-grow py-16 flex gap-16">
                    {MEGA_MENU_DATA[activeMenu].map((group, idx) => (
                      <div 
                        key={idx} 
                        className="flex-1 min-w-[200px] border-l border-stone-100 pl-8 first:border-none first:pl-0 space-y-8 animate-fade-in"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                         <h3 className="font-bold text-xs uppercase tracking-[0.2em] text-stone-900">
                           {group.title}
                         </h3>
                         <ul className="space-y-4">
                           {group.items.map((link, lIdx) => (
                             <li key={lIdx}>
                               <Link
                                 to={link.href}
                                 className="block font-serif text-xl text-stone-500 hover:text-amber-800 transition-colors duration-200"
                               >
                                 {link.label}
                               </Link>
                             </li>
                           ))}
                         </ul>
                      </div>
                    ))}
                 </div>

                 {/* Featured Section - Fixed Width & Visual Impact */}
                 <div className="w-[400px] bg-stone-50 h-full relative group overflow-hidden hidden xl:block">
                    <img
                      src={
                        activeMenu === '/collections'
                          ? 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=600&auto=format&fit=crop'
                          : activeMenu === '/manufacturing'
                          ? 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=600&auto=format&fit=crop'
                          : activeMenu === '/capabilities'
                          ? 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=600&auto=format&fit=crop'
                          : 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=600&auto=format&fit=crop'
                      }
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                      alt="Featured"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                    <div className="absolute bottom-0 left-0 p-10 w-full">
                       <span className="block text-white/80 text-[10px] uppercase tracking-widest font-bold mb-2">Featured</span>
                       <p className="text-white font-serif text-2xl leading-tight border-l-2 border-amber-500 pl-4">
                          {activeMenu === '/collections'
                             ? '2025 Living Collection'
                             : activeMenu === '/manufacturing'
                             ? 'Precision Engineering'
                             : 'Global Capabilities'}
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
            absolute inset-0 top-[80px] z-40 flex flex-col justify-start items-center pb-20 overflow-y-auto bg-[#F5F0EB]
            transition-all duration-500 ease-in-out
            ${isMobileMenuOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-4 invisible'}
          `}
        >
          <nav className="flex flex-col space-y-2 text-center w-full pt-10 px-6">
            {NAV_ITEMS.map((item) => (
              <div key={item.path} className="w-full border-b border-stone-200/50 pb-2">
                <Link
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block font-serif text-3xl md:text-5xl py-4 text-[#1c1917] hover:text-[#a16207] transition-colors"
                >
                  {language === 'zh' ? item.label_zh : item.label}
                </Link>
              </div>
            ))}

            <div className="pt-8 flex flex-col items-center space-y-6">
              <Link
                to="/inquire"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-sm font-bold tracking-[0.2em] uppercase bg-[#281815] text-white px-8 py-4 w-full max-w-xs hover:bg-[#a16207] transition-colors"
              >
                {language === 'zh' ? '立即咨询' : 'Inquire Now'}
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* FIXED Search Overlay System */}
      <div
        className={`fixed inset-0 top-[80px] z-30 bg-stone-900/40 backdrop-blur-sm transition-opacity duration-500 ${isSearchOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={() => setIsSearchOpen(false)}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className={`
                bg-[#F5F0EB] w-full border-b border-stone-300 shadow-2xl 
                transform transition-all duration-500 ease-out origin-top
                ${isSearchOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}
            `}
        >
          <div className="container mx-auto px-6 md:px-12 py-10 md:py-14">
            <form onSubmit={handleSearchSubmit} className="relative max-w-4xl mx-auto">
              <label htmlFor="search-input" className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-4 ml-1">
                {t.common.search}
              </label>
              <div className="relative group">
                <input
                  id="search-input"
                  ref={searchInputRef}
                  type="text"
                  placeholder={t.common.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-2xl md:text-4xl font-serif text-[#281815] placeholder-stone-400/60 placeholder:italic border-b-[2px] border-stone-300 pb-3 focus:border-[#a16207] focus:outline-none transition-all"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-[#a16207] hover:text-[#281815] transition-colors p-2"
                >
                  <ArrowRight size={32} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <main className="flex-grow">{children}</main>

      <footer className="bg-[#281815] border-t border-stone-800 pt-20 pb-10 text-stone-400">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <h2 className="font-serif text-2xl text-[#E6DDD5] mb-6 tracking-tight flex items-baseline">
                PZ
                <span className="text-[#a16207] text-3xl leading-none ml-0.5">.</span>
              </h2>
              <p className="text-[#BCAAA4] max-w-md mb-6 leading-relaxed font-light">
                {t.home.heroQuote} {t.home.strengthDesc1}
              </p>
              <div className="flex space-x-4 text-[#8D6E63] text-sm">
                <span>China</span>
                <span>|</span>
                <span>Cambodia</span>
                <span>|</span>
                <span>Est. 2014</span>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold tracking-widest text-[#E6DDD5] uppercase mb-6">{t.common.explore}</h3>
              <ul className="space-y-4">
                {NAV_ITEMS.slice(0, 4).map((item) => (
                  <li key={item.path}>
                    <Link to={item.path} className="text-[#BCAAA4] hover:text-white transition-colors text-sm">
                      {language === 'zh' ? item.label_zh : item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold tracking-widest text-[#E6DDD5] uppercase mb-6">{t.common.connect}</h3>
              <ul className="space-y-4">
                <li>
                  <Link to="/inquire" className="text-[#BCAAA4] hover:text-white transition-colors flex items-center group text-sm">
                    {t.common.startProject} <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </li>
                <li>
                  <a href="#" className="text-[#BCAAA4] hover:text-white transition-colors text-sm">{t.common.tradeProgram}</a>
                </li>
                <li className="flex space-x-4">
                  <Link to="/admin" className="text-[#8D6E63] hover:text-[#BCAAA4] transition-colors text-xs">
                    Admin
                  </Link>
                  <span className="text-[#8D6E63]">/</span>
                  <Link to="/creator" className="text-[#8D6E63] hover:text-[#BCAAA4] transition-colors text-xs">
                    Operator
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-stone-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-[#8D6E63] tracking-wider">
            <p>&copy; {new Date().getFullYear()} PZ Furniture Studio. {t.common.rights}</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <span>{t.common.privacy}</span>
              <span>{t.common.terms}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
