
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight, Search } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { usePublishedSiteConfig } from '../contexts/SiteConfigContext';
import { NAV_ITEMS } from '../types';

// Import Platform Navs
import MobileNav from './layout/MobileNav';
import DesktopNav from './layout/DesktopNav';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const { meta } = usePublishedSiteConfig();

  // Scroll Detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock Body Scroll when overlay active
  useEffect(() => {
    const shouldLockScroll = isSearchOpen || isMobileMenuOpen;
    document.body.style.overflow = shouldLockScroll ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSearchOpen, isMobileMenuOpen]);

  // Focus Search Input
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);

  // Reset state on route change
  useEffect(() => {
    setActiveMenu(null);
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
  }, [location.pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const isHome = location.pathname === '/';
  const isMegaMenuActive = activeMenu !== null;
  const useWhiteNav = isScrolled || !isHome || isMobileMenuOpen || isSearchOpen || isMegaMenuActive;

  const textColor = useWhiteNav ? 'text-stone-900' : 'text-white';
  const navTextColor = useWhiteNav
    ? 'text-stone-600 hover:text-safety-700'
    : 'text-stone-300 hover:text-white';
  
  const getHeaderBackground = () => {
    // If mobile menu is open, the menu overlay provides background. Header stays transparent or white.
    // If search is open, white background.
    if (isSearchOpen) return 'bg-white shadow-none border-b border-stone-100';
    if (isMobileMenuOpen) return 'bg-transparent'; // Mobile menu has its own blur bg
    if (isMegaMenuActive) return 'bg-white border-b border-stone-200 shadow-sm';
    if (useWhiteNav) return 'bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-sm';
    return 'bg-transparent border-b border-white/10';
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-stone-900 font-sans transition-colors duration-500">
      
      {/* 
          HEADER BAR 
          Responsive Height: 70px Mobile, 90px Desktop
          Always FIXED at top.
      */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 h-[70px] md:h-[90px] transition-all duration-500 ease-in-out ${getHeaderBackground()}`}
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
            <div className={`font-serif tracking-tight leading-none transition-colors duration-300 ${isMobileMenuOpen ? 'text-stone-900' : textColor}`}>
               <span className="text-2xl font-bold">PZ</span>
            </div>
          </Link>

          {/* DESKTOP NAV (Hidden on Mobile/Tablet) */}
          <DesktopNav 
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
            isSearchOpen={isSearchOpen}
            setIsSearchOpen={setIsSearchOpen}
            navTextColor={navTextColor}
            useWhiteNav={useWhiteNav}
          />

          {/* RIGHT ACTIONS */}
          <div className="flex items-center space-x-6 z-50">
            {/* Language Switcher - Desktop Only */}
            <button
              onClick={toggleLanguage}
              className={`hidden lg:block text-sm font-bold uppercase tracking-widest transition-colors duration-300 ${navTextColor} hover:text-safety-700`}
            >
              {language === 'en' ? 'EN / 中' : '中 / EN'}
            </button>

            {/* Search Toggle */}
            <button
              onClick={() => {
                if (isSearchOpen) setIsSearchOpen(false);
                else {
                  setIsSearchOpen(true);
                  setActiveMenu(null);
                  setIsMobileMenuOpen(false);
                }
              }}
              className={`focus:outline-none transition-colors duration-300 ${isMobileMenuOpen ? 'text-stone-900' : navTextColor} hover:text-safety-700`}
            >
              {isSearchOpen ? <X size={20} /> : <Search size={20} />}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
                setIsSearchOpen(false);
                setActiveMenu(null);
              }}
              className={`lg:hidden focus:outline-none transition-colors duration-300 ${isMobileMenuOpen ? 'text-stone-900' : navTextColor}`}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE MENU OVERLAY */}
      <MobileNav isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} textColor={textColor} />

      {/* SEARCH OVERLAY - Adjusted top position for mobile/desktop heights */}
      <div
        className={`fixed inset-0 top-[70px] md:top-[90px] z-30 bg-white/90 backdrop-blur-sm transition-opacity duration-500 ${isSearchOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
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
          <div className="container mx-auto px-6 md:px-12 py-8 md:py-12">
            <form onSubmit={handleSearchSubmit} className="relative max-w-3xl mx-auto">
              <div className="relative group">
                <input
                  id="search-input"
                  ref={searchInputRef}
                  type="text"
                  placeholder={t.common.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-2xl md:text-3xl font-serif text-stone-900 placeholder-stone-300 border-b border-stone-300 pb-4 focus:border-stone-900 focus:outline-none transition-all"
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
               {meta?.version && meta.version !== '0.0.0' && (
                 <span className="text-stone-300 hidden md:inline">|</span>
               )}
               {meta?.version && meta.version !== '0.0.0' && (
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
