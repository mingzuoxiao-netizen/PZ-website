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
  // Scrolled/Inner: Deep Charcoal Text + Muted Bronze Accent
  // Home/Transparent: White Text + Champagne Gold Accent
  const textColor = isHome && !isScrolled ? 'text-white' : 'text-[#1c1917]';
  const accentColor = isHome && !isScrolled ? 'text-[#d4b996]' : 'text-[#a16207]';
  const navTextColor = isHome && !isScrolled ? 'text-stone-200 hover:text-white' : 'text-stone-600 hover:text-[#1c1917]';
  const navHoverColor = isHome && !isScrolled ? 'bg-white' : 'bg-[#a16207]';

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 font-sans transition-colors duration-500">
      {/* Navigation */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled || !isHome 
            ? 'bg-[#FDFCF8]/95 backdrop-blur-md border-b border-stone-200 py-4 shadow-sm' 
            : 'bg-transparent py-8'
        }`}
      >
        <div className="container mx-auto px-6 md:px-12 flex justify-between items-center relative z-50">
          <Link to="/" className="group">
            <div className="flex flex-col">
              <h1 className={`font-serif text-2xl md:text-3xl font-bold tracking-tight leading-none flex items-baseline ${textColor} transition-colors duration-300`}>
                PENG ZHAN
                <span className={`text-4xl leading-none ml-0.5 ${accentColor} transition-colors duration-300`}>.</span>
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
                    ? (isHome && !isScrolled ? 'text-white' : 'text-[#a16207]')
                    : navTextColor
                }`}
              >
                {item.label}
                <span className={`absolute -bottom-2 left-0 w-0 h-px transition-all duration-300 group-hover:w-full ${navHoverColor} ${location.pathname === item.path ? 'w-full' : ''}`}></span>
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`lg:hidden focus:outline-none ${isHome && !isScrolled && !isMobileMenuOpen ? 'text-white' : 'text-stone-900'}`}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Nav Overlay */}
        {/* Fixed layout using padding-top and overflow-auto to prevent clipping on small screens */}
        <div className={`fixed inset-0 bg-[#F5F0EB] z-40 transform transition-transform duration-500 ease-in-out lg:hidden pt-32 pb-10 flex flex-col items-center overflow-y-auto ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <nav className="flex flex-col space-y-8 text-center">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-3xl font-serif text-stone-900 hover:text-[#a16207] transition-colors"
              >
                {item.label}
              </Link>
            ))}
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
                 <span>Zhaoqing, CN</span>
                 <span>|</span>
                 <span>Kandal, KH</span>
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