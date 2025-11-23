
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { NAV_ITEMS } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHome = location.pathname === '/';

  // High-End Color Logic
  const useDarkNav = isScrolled || !isHome || isMobileMenuOpen;

  const textColor = !useDarkNav ? 'text-white' : 'text-[#1c1917]';
  const accentColor = !useDarkNav ? 'text-[#d4b996]' : 'text-[#a16207]';
  const navTextColor = !useDarkNav ? 'text-stone-200 hover:text-white' : 'text-stone-600 hover:text-[#1c1917]';
  const navHoverColor = !useDarkNav ? 'bg-white' : 'bg-[#a16207]';

  // Determine Header Background Class
  const getHeaderBackground = () => {
    // Immediate override when menu is open
    if (isMobileMenuOpen) return 'bg-[#F5F0EB] shadow-none border-transparent';
    
    // Scrolled or Inner Page state
    if (useDarkNav) return 'bg-[#FDFCF8]/95 backdrop-blur-md border-b border-stone-200 shadow-sm';
    
    // Default transparent (Home Top)
    return 'bg-transparent border-b border-transparent';
  };

  // Determine Logo Text Color specifically
  const getLogoColor = () => {
    // If menu is open, always dark (to contrast with oatmeal bg)
    if (isMobileMenuOpen) return 'text-[#1c1917]';
    // If on home hero (unscrolled), white
    if (isHome && !isScrolled) return 'text-white';
    // Otherwise dark
    return 'text-[#1c1917]';
  };
  
  const getAccentColor = () => {
    if (isMobileMenuOpen) return 'text-[#a16207]';
    if (isHome && !isScrolled) return 'text-[#d4b996]';
    return 'text-[#a16207]';
  };

  const getMenuButtonColor = () => {
     if (isMobileMenuOpen) return 'text-[#1c1917]';
     if (isHome && !isScrolled) return 'text-white';
     return 'text-[#1c1917]';
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 font-sans transition-colors duration-500">
      {/* Navigation - Expanding Header Concept */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 overflow-hidden
          transition-[height,background-color] duration-[800ms] ease-[cubic-bezier(0.32,0.72,0,1)]
          ${getHeaderBackground()}
          ${isMobileMenuOpen ? 'h-screen' : 'h-[80px]'}
        `}
      >
        <div className="container mx-auto px-6 md:px-12 h-[80px] flex justify-between items-center relative z-50">
          {/* Logo */}
          <Link to="/" className="group" onClick={() => setIsMobileMenuOpen(false)}>
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
          <nav className="hidden lg:flex space-x-8 xl:space-x-12">
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

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`lg:hidden focus:outline-none transition-colors duration-300 ${getMenuButtonColor()}`}
            aria-label="Toggle navigation"
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Nav Content Container */}
        {/* We keep this mounted but hide it via opacity/translate for the animation effect */}
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
