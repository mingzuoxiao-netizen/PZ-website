
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight, Search } from 'lucide-react';
import { NAV_ITEMS } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock Body Scroll when Search or Menu is Open
  useEffect(() => {
    if (isSearchOpen || isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSearchOpen, isMobileMenuOpen]);

  // Focus input when search opens
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

  const isHome = location.pathname === '/';

  // High-End Color Logic
  const useDarkNav = isScrolled || !isHome || isMobileMenuOpen || isSearchOpen;

  const textColor = !useDarkNav ? 'text-white' : 'text-[#1c1917]';
  const accentColor = !useDarkNav ? 'text-[#d4b996]' : 'text-[#a16207]';
  const navTextColor = !useDarkNav ? 'text-stone-200 hover:text-white' : 'text-stone-600 hover:text-[#1c1917]';
  const navHoverColor = !useDarkNav ? 'bg-white' : 'bg-[#a16207]';

  // Determine Header Background Class
  const getHeaderBackground = () => {
    // Immediate override when menu is open
    if (isMobileMenuOpen) return 'bg-[#F5F0EB] shadow-none border-transparent';
    if (isSearchOpen) return 'bg-[#F5F0EB] shadow-none border-b border-stone-300'; // Match overlay BG
    
    // Scrolled or Inner Page state
    if (useDarkNav) return 'bg-[#FDFCF8]/95 backdrop-blur-md border-b border-stone-200 shadow-sm';
    
    // Default transparent (Home Top)
    return 'bg-transparent border-b border-transparent';
  };

  // Determine Logo Text Color specifically
  const getLogoColor = () => {
    if (isMobileMenuOpen || isSearchOpen) return 'text-[#1c1917]';
    if (isHome && !isScrolled) return 'text-white';
    return 'text-[#1c1917]';
  };
  
  const getAccentColor = () => {
    if (isMobileMenuOpen || isSearchOpen) return 'text-[#a16207]';
    if (isHome && !isScrolled) return 'text-[#d4b996]';
    return 'text-[#a16207]';
  };

  const getMenuButtonColor = () => {
     if (isMobileMenuOpen || isSearchOpen) return 'text-[#1c1917]';
     if (isHome && !isScrolled) return 'text-white';
     return 'text-[#1c1917]';
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 font-sans transition-colors duration-500">
      {/* Navigation - Expanding Header Concept */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 overflow-hidden
          transition-[height,background-color] duration-[400ms] ease-out
          ${getHeaderBackground()}
          ${isMobileMenuOpen ? 'h-screen' : 'h-[80px]'}
        `}
      >
        <div className="container mx-auto px-6 md:px-12 h-[80px] flex justify-between items-center relative z-50">
          {/* Logo */}
          <Link to="/" className="group" onClick={() => { setIsMobileMenuOpen(false); setIsSearchOpen(false); }}>
            <div className="flex flex-col">
              <h1 className={`font-serif text-2xl md:text-3xl font-bold tracking-tight leading-none flex items-baseline transition-colors duration-500 ${getLogoColor()}`}>
                PENG ZHAN
                <span className={`text-4xl leading-none ml-0.5 transition-colors duration-500 ${getAccentColor()}`}>
                  .
                </span>
              </h1>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className={`hidden lg:flex items-center space-x-8 xl:space-x-12 ${isSearchOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity duration-300`}>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-xs font-bold tracking-[0.2em] uppercase transition-colors duration-300 relative group ${
                  location.pathname === item.path
                    ? isHome && !isScrolled
                      ? "text-white"
                      : "text-[#a16207]"
                    : navTextColor
                }`}
              >
                {item.label}
                <span
                  className={`absolute -bottom-2 left-0 w-0 h-px transition-all duration-300 group-hover:w-full ${navHoverColor} ${
                    location.pathname === item.path ? "w-full" : ""
                  }`}
                ></span>
              </Link>
            ))}
          </nav>

          {/* Actions: Search & Mobile Toggle */}
          <div className="flex items-center space-x-6">
            {/* Search Toggle */}
            <button 
                onClick={() => {
                    if (isSearchOpen) {
                      setIsSearchOpen(false);
                    } else {
                      setIsSearchOpen(true);
                      if (isMobileMenuOpen) setIsMobileMenuOpen(false);
                    }
                }}
                className={`focus:outline-none transition-colors duration-300 ${getMenuButtonColor()} hover:text-[#a16207]`}
                aria-label="Toggle search"
            >
                {isSearchOpen ? <X size={24} /> : <Search size={24} />}
            </button>

            {/* Mobile Menu Toggle */}
            <button
                onClick={() => {
                    setIsMobileMenuOpen(!isMobileMenuOpen);
                    if (isSearchOpen) setIsSearchOpen(false);
                }}
                className={`lg:hidden focus:outline-none transition-colors duration-300 ${getMenuButtonColor()}`}
                aria-label="Toggle navigation"
            >
                {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Content Container */}
        <div 
          className={`
            absolute inset-0 top-[80px] z-40 flex flex-col justify-center items-center pb-20
            transition-all duration-700 delay-100 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
            ${isMobileMenuOpen ? 'opacity-100 translate-y-0 scale-100 visible' : 'opacity-0 translate-y-12 scale-95 invisible'}
          `}
        >
          <nav className="flex flex-col space-y-6 text-center">
            {NAV_ITEMS.map((item, idx) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="group relative overflow-hidden inline-block p-2"
                style={{ transitionDelay: `${idx * 50}ms` }} 
              >
                <span className={`
                  block font-serif text-4xl md:text-5xl transition-colors duration-300
                  ${location.pathname === item.path ? "text-[#a16207]" : "text-[#1c1917] group-hover:text-[#a16207]"}
                `}>
                  {item.label}
                </span>
              </Link>
            ))}
            
            <div className="pt-8 flex flex-col items-center space-y-4">
               <div className="w-12 h-px bg-[#a16207]/30"></div>
               <Link 
                 to="/inquire" 
                 onClick={() => setIsMobileMenuOpen(false)}
                 className="text-xs font-bold tracking-[0.2em] uppercase text-[#a16207] hover:text-[#1c1917] transition-colors"
               >
                 Inquire Now
               </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* FIXED Search Overlay System */}
      {/* 1. The Backdrop (Covers everything below header) */}
      <div 
        className={`fixed inset-0 top-[80px] z-40 bg-stone-900/40 backdrop-blur-sm transition-opacity duration-500 ${isSearchOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={() => setIsSearchOpen(false)}
      >
        {/* 2. The Search Bar Container */}
        <div 
            onClick={(e) => e.stopPropagation()} // Prevent click from closing when clicking inside the bar
            className={`
                bg-[#F5F0EB] w-full border-b border-stone-300 shadow-2xl 
                transform transition-all duration-500 ease-out origin-top
                ${isSearchOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}
            `}
        >
            <div className="container mx-auto px-6 md:px-12 py-10 md:py-14">
                <form onSubmit={handleSearchSubmit} className="relative max-w-4xl mx-auto">
                    <label htmlFor="search-input" className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-4 ml-1">
                        Search Catalog
                    </label>
                    <div className="relative group">
                        <input 
                            id="search-input"
                            ref={searchInputRef}
                            type="text" 
                            placeholder="Type to search products..."
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
                    <div className="mt-4 flex space-x-6 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                        <span>Popular:</span>
                        <button type="button" onClick={() => setSearchQuery('Walnut')} className="hover:text-[#a16207] transition-colors">Walnut</button>
                        <button type="button" onClick={() => setSearchQuery('Dining')} className="hover:text-[#a16207] transition-colors">Dining</button>
                        <button type="button" onClick={() => setSearchQuery('Table')} className="hover:text-[#a16207] transition-colors">Table</button>
                    </div>
                </form>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer - Deep Espresso Grounding */}
      <footer className="bg-[#281815] border-t border-stone-800 pt-20 pb-10 text-stone-400">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <h2 className="font-serif text-2xl text-[#E6DDD5] mb-6 tracking-tight flex items-baseline">
                PENG ZHAN
                <span className="text-[#a16207] text-3xl leading-none ml-0.5">.</span>
              </h2>
              <p className="text-[#BCAAA4] max-w-md mb-6 leading-relaxed font-light">
                Bridging California Design with Precision Manufacturing. We create high-end solid wood furniture for global brands, designers, and commercial projects.
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
              <h3 className="text-xs font-bold tracking-widest text-[#E6DDD5] uppercase mb-6">Explore</h3>
              <ul className="space-y-4">
                {NAV_ITEMS.slice(0, 4).map(item => (
                  <li key={item.path}>
                    <Link to={item.path} className="text-[#BCAAA4] hover:text-white transition-colors text-sm">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold tracking-widest text-[#E6DDD5] uppercase mb-6">Connect</h3>
              <ul className="space-y-4">
                <li>
                  <Link to="/inquire" className="text-[#BCAAA4] hover:text-white transition-colors flex items-center group text-sm">
                    Start a Project <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </li>
                <li>
                  <a href="#" className="text-[#BCAAA4] hover:text-white transition-colors text-sm">Trade Program</a>
                </li>
                <li>
                  <Link to="/admin" className="text-[#8D6E63] hover:text-[#BCAAA4] transition-colors text-xs">
                    Admin Access
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-stone-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-[#8D6E63] tracking-wider">
            <p>&copy; {new Date().getFullYear()} Peng Zhan Furniture Studio. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
