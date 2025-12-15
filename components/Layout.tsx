
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight, Search, Globe } from 'lucide-react';
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
  const { t, language, toggleLanguage } = useLanguage();
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
    if (isSearchOpen) return 'bg-white shadow-none border-b border-stone-100';
    if (isMobileMenuOpen) return 'bg-transparent'; 
    if (isMegaMenuActive) return 'bg-white border-b border-stone-200 shadow-sm';
    if (useWhiteNav) return 'bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-sm';
    return 'bg-transparent border-b border-white/10';
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-stone-900 font-sans transition-colors duration-500">
      
      {/* HEADER BAR */}
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

          {/* DESKTOP NAV */}
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
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className={`flex items-center text-xs font-bold uppercase tracking-wider focus:outline-none transition-colors duration-300 ${isMobileMenuOpen ? 'text-stone-900' : navTextColor} hover:text-safety-700`}
            >
               <Globe size={14} className="mr-1.5" />
               {language === 'en' ? 'EN / 中文' : '中文 / EN'}
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

      {/* MOBILE MENU */}
      <MobileNav isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} textColor={textColor} />

      {/* SEARCH OVERLAY */}
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

      {/* REFINED FOOTER */}
      <footer className="bg-stone-50 border-t border-stone-200 pt-24 pb-12 text-stone-500 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-wood-pattern opacity-50"></div>
        <div className="container mx-auto px-6 md:px-12">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-y-12 gap-x-8 mb-20">
            
            {/* 1. Brand Identity (Span 4) */}
            <div className="md:col-span-4 flex flex-col justify-between h-full">
              <div>
                <Link to="/" className="inline-block font-serif text-3xl text-stone-900 font-bold tracking-tight mb-6">
                   PZ
                </Link>
                <p className="text-stone-500 max-w-xs mb-8 leading-relaxed text-sm font-light">
                  {t.home.heroQuote} <br/>
                  <span className="opacity-70 mt-4 block">{t.home.strengthDesc1.split('.')[0]}.</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] uppercase tracking-widest font-bold text-stone-400">
                <span className="text-stone-900">Zhaoqing</span>
                <span className="text-stone-300">/</span>
                <span className="text-stone-900">Kandal</span>
                <span className="text-stone-300">/</span>
                <span className="text-stone-900">Los Angeles</span>
              </div>
            </div>

            {/* Spacer (Span 2) */}
            <div className="hidden md:block md:col-span-2"></div>

            {/* 2. Explore Navigation (Span 3) */}
            <div className="md:col-span-3">
              <h3 className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase mb-8 border-b border-stone-200 pb-4 inline-block w-full">{t.common.explore}</h3>
              <ul className="space-y-4">
                {NAV_ITEMS.slice(0, 5).map((item) => (
                  <li key={item.path}>
                    <Link 
                      to={item.path} 
                      className="text-stone-500 hover:text-safety-700 transition-colors text-sm font-medium hover:pl-2 duration-300 block"
                    >
                      {t.nav.header[item.key]}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* 3. Connect & Legal (Span 3) */}
            <div className="md:col-span-3">
              <h3 className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase mb-8 border-b border-stone-200 pb-4 inline-block w-full">{t.common.connect}</h3>
              <ul className="space-y-4">
                <li>
                  <Link to="/inquire" className="text-stone-900 hover:text-safety-700 transition-colors flex items-center group text-sm font-bold">
                    {t.common.startProject} <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </li>
                <li className="pt-4">
                   <Link to="/admin-pzf-2025" className="text-stone-400 hover:text-stone-600 transition-colors text-xs font-mono">
                      {t.common.adminAccess}
                   </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-stone-200 pt-8 flex flex-col-reverse md:flex-row justify-between items-center text-xs text-stone-400 gap-6">
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6">
               <p className="font-medium text-stone-500">&copy; {new Date().getFullYear()} PZ.</p>
               <span className="hidden md:inline text-stone-200">|</span>
               <p>{t.common.rights}</p>
               
               {meta?.version && meta.version !== '0.0.0' && (
                 <>
                   <span className="hidden md:inline text-stone-200">|</span>
                   <span className="opacity-60 font-mono text-[10px] bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                      v{meta.version}
                   </span>
                 </>
               )}
            </div>
            
            <div className="flex space-x-8">
              <Link to="/privacy" className="hover:text-stone-900 cursor-pointer transition-colors border-b border-transparent hover:border-stone-300 pb-0.5">{t.common.privacy}</Link>
              <Link to="/terms" className="hover:text-stone-900 cursor-pointer transition-colors border-b border-transparent hover:border-stone-300 pb-0.5">{t.common.terms}</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
