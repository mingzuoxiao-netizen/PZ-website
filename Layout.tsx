import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight, Search, Hash, ShieldCheck } from 'lucide-react';
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
  const { t } = useLanguage();
  const { meta } = usePublishedSiteConfig();

  // Scroll Detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock Body Scroll
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
    ? 'text-stone-500 hover:text-stone-900'
    : 'text-stone-300 hover:text-white';
  
  const getHeaderBackground = () => {
    if (isSearchOpen) return 'bg-white border-b border-stone-100 shadow-sm';
    if (isMobileMenuOpen) return 'bg-transparent'; 
    if (isMegaMenuActive) return 'bg-white border-b border-stone-200';
    if (useWhiteNav) return 'bg-white/90 backdrop-blur-xl border-b border-stone-200 shadow-[0_2px_15px_rgba(0,0,0,0.03)]';
    return 'bg-transparent border-b border-white/10';
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-stone-900 font-sans transition-colors duration-500">
      
      {/* GLOBAL STATUS BAR (Desktop Only) */}
      <div className={`hidden lg:flex fixed top-0 left-0 right-0 h-1 z-[60] transition-all duration-700 ${isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'}`}>
          <div className="h-full bg-safety-700 animate-[progress_3s_ease-in-out_infinite]" style={{ width: '25%' }}></div>
      </div>

      {/* HEADER BAR */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 h-[70px] md:h-[90px] transition-all duration-500 ease-in-out ${getHeaderBackground()}`}
      >
        <div className="container mx-auto px-6 md:px-12 h-full flex justify-between items-center relative z-50">
          <Link
            to="/"
            className="group z-50 flex items-center gap-4"
            onClick={() => {
              setIsMobileMenuOpen(false);
              setIsSearchOpen(false);
            }}
          >
            <div className={`font-serif tracking-tighter leading-none transition-all duration-500 ${isMobileMenuOpen ? 'text-stone-100' : textColor}`}>
               <span className="text-3xl font-black group-hover:text-safety-700 transition-colors">PZ</span>
            </div>
            {/* Removed vertical separator and Registry OS text as requested */}
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
          <div className="flex items-center space-x-6 md:space-x-8 z-50">
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
              className={`focus:outline-none transition-colors duration-500 ${isMobileMenuOpen ? 'text-stone-100 hover:text-safety-700' : navTextColor} hover:text-safety-700`}
            >
              {isSearchOpen ? <X size={18} /> : <Search size={18} />}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
                setIsSearchOpen(false);
                setActiveMenu(null);
              }}
              className={`lg:hidden focus:outline-none transition-all duration-500 ${isMobileMenuOpen ? 'text-stone-100' : navTextColor} hover:scale-110 active:scale-95`}
            >
              {isMobileMenuOpen ? <X size={28} strokeWidth={1.5} /> : <Menu size={28} strokeWidth={1.5} />}
            </button>
            
            {/* CTA Button (Desktop) */}
            <Link 
                to="/inquire" 
                className={`hidden lg:flex items-center px-7 py-3 text-[9px] font-bold uppercase tracking-[0.3em] transition-all duration-500 rounded-sm group
                    ${useWhiteNav ? 'bg-stone-900 text-white hover:bg-safety-700' : 'bg-white/5 text-white backdrop-blur-md border border-white/10 hover:bg-white hover:text-stone-900'}
                `}
            >
                Inquire <ArrowRight size={12} className="ml-3 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </header>

      {/* MOBILE MENU */}
      <MobileNav isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} textColor={textColor} />

      {/* SEARCH OVERLAY */}
      <div
        className={`fixed inset-0 top-[70px] md:top-[90px] z-30 bg-stone-950/90 backdrop-blur-md transition-opacity duration-700 ${isSearchOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={() => setIsSearchOpen(false)}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className={`
                bg-white w-full border-b border-stone-200 shadow-2xl
                transform transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1)
                ${isSearchOpen ? 'translate-y-0' : '-translate-y-full'}
            `}
        >
          <div className="container mx-auto px-6 md:px-12 py-16 md:py-24">
            <form onSubmit={handleSearchSubmit} className="relative max-w-5xl mx-auto">
              <div className="relative group">
                <span className="absolute -top-10 left-0 font-mono text-[9px] text-stone-400 uppercase tracking-[0.5em] font-bold">Archive Search Registry</span>
                <input
                  id="search-input"
                  ref={searchInputRef}
                  type="text"
                  placeholder="EX: SOLID WALNUT DINING TABLE"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-3xl md:text-7xl font-serif text-stone-900 placeholder-stone-100 border-b border-stone-100 pb-8 focus:border-safety-700 focus:outline-none transition-all duration-700 uppercase"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="absolute right-0 bottom-8 text-stone-200 hover:text-safety-700 transition-all p-2"
                >
                  <ArrowRight size={48} strokeWidth={1} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <main className="flex-grow">{children}</main>

      {/* FOOTER */}
      <footer className="bg-stone-950 pt-32 pb-12 text-stone-500 relative overflow-hidden">
        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-y-20 gap-x-12 mb-32">
            <div className="md:col-span-5">
              <Link to="/" className="inline-block font-serif text-4xl text-white font-bold tracking-tighter mb-10 group">
                 PZ<span className="text-safety-700 group-hover:animate-pulse">.</span>
              </Link>
              <p className="text-stone-400 max-w-sm mb-12 leading-relaxed text-lg font-light">
                Engineering high-capacity wood solutions for the world's most exacting brands. <br/>
                <span className="text-stone-600 italic mt-6 block text-sm border-l border-white/10 pl-6">Industrial precision. Natural material artistry.</span>
              </p>
              <div className="flex flex-wrap gap-8 text-[9px] uppercase tracking-[0.4em] font-black text-stone-600">
                <div className="space-y-2"><span className="text-stone-800 block">CHINA HQ</span> Zhaoqing Terminal</div>
                <div className="space-y-2"><span className="text-stone-800 block">CAMBODIA</span> Kandal Terminal</div>
                <div className="space-y-2"><span className="text-stone-800 block">LOGISTICS</span> Los Angeles</div>
              </div>
            </div>

            <div className="md:col-span-2"></div>

            <div className="md:col-span-2">
              <h3 className="text-[9px] font-black tracking-[0.5em] text-white uppercase mb-12 pb-5 border-b border-white/5">{t.common.explore}</h3>
              <ul className="space-y-6">
                {NAV_ITEMS.slice(0, 6).map((item) => (
                  <li key={item.path}>
                    <Link 
                      to={item.path} 
                      className="text-stone-500 hover:text-safety-700 transition-all text-xs font-bold uppercase tracking-widest"
                    >
                      {t.nav.header[item.key]}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-3">
              <h3 className="text-[9px] font-black tracking-[0.5em] text-white uppercase mb-12 pb-5 border-b border-white/5">{t.common.connect}</h3>
              <ul className="space-y-8">
                <li>
                  <Link to="/inquire" className="text-white hover:text-safety-700 transition-all flex items-center group text-lg font-serif italic">
                    {t.common.startProject} <ArrowRight size={20} className="ml-4 group-hover:translate-x-2 transition-transform" />
                  </Link>
                </li>
                <li className="pt-12">
                   <Link to="/admin-pzf-2025" className="inline-flex items-center gap-2 text-stone-800 hover:text-stone-600 transition-colors text-[8px] font-mono uppercase tracking-[0.5em] border border-stone-900/50 px-4 py-2 rounded-sm">
                      <ShieldCheck size={12} /> {t.common.adminAccess}
                   </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-12 flex flex-col md:flex-row justify-between items-center text-[9px] font-mono text-stone-700 uppercase tracking-[0.4em] gap-8">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-12 text-center md:text-left">
               <p>&copy; {new Date().getFullYear()} PZ Industrial Group.</p>
               <p>{t.common.rights}</p>
               {meta?.version && (
                 <span className="bg-white/5 px-4 py-1 rounded-sm text-stone-600 border border-white/5">
                    Kernel OS v{meta.version}
                 </span>
               )}
            </div>
            
            <div className="flex space-x-12">
              <Link to="/privacy" className="hover:text-stone-400 transition-colors">{t.common.privacy}</Link>
              <Link to="/terms" className="hover:text-stone-400 transition-colors">{t.common.terms}</Link>
            </div>
          </div>
        </div>
        
        {/* Subtle Bottom Accent */}
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-safety-700/30"></div>
      </footer>
    </div>
  );
};

export default Layout;