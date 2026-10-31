import React, { useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ArrowUpRight } from 'lucide-react';
import { usePublishedSiteConfig } from '../../contexts/SiteConfigContext';
import { categories as staticCategories } from '../../data/inventory';

interface DesktopNavProps {
  activeMenu: string | null;
  setActiveMenu: (menu: string | null) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (v: boolean) => void;
  navTextColor: string;
  useWhiteNav: boolean;
}

const DesktopNav: React.FC<DesktopNavProps> = ({ activeMenu, setActiveMenu, isSearchOpen }) => {
  const location = useLocation();
  const { config } = usePublishedSiteConfig();
  const closeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const productCategories = config?.categories?.length ? config.categories : staticCategories;
  const nav = [
    { label: 'Home', to: '/' },
    { label: 'Products', to: '/collections', menu: 'products' },
    { label: 'Custom Manufacturing', to: '/capabilities', menu: 'manufacturing' },
    { label: 'Our Facilities', to: '/capacity' },
    { label: 'Materials & Quality', to: '/materials' },
    { label: 'About PZ', to: '/about' }
  ];
  const submenu = activeMenu === 'products'
    ? [
        { label: 'All Products', to: '/collections' },
        ...productCategories.map(c => ({ label: c.title, to: '/collections?category=' + encodeURIComponent(c.id) }))
      ]
    : [
        { label: 'OEM / ODM Capabilities', to: '/capabilities' },
        { label: 'Manufacturing Process', to: '/manufacturing' },
        { label: 'Our Facilities', to: '/capacity' },
        { label: 'Materials & Finishes', to: '/materials' }
      ];

  const clearTimer = () => {
    if (closeRef.current) clearTimeout(closeRef.current);
    closeRef.current = null;
  };
  const closeLater = () => {
    clearTimer();
    closeRef.current = setTimeout(() => setActiveMenu(null), 180);
  };
  useEffect(() => () => clearTimer(), []);

  return (
    <div className={'hidden lg:flex flex-1 justify-center h-full ' + (isSearchOpen ? 'opacity-0 pointer-events-none' : 'opacity-100')}>
      <nav aria-label="Main navigation" className="flex items-center gap-4 xl:gap-6 2xl:gap-8 h-full">
        {nav.map(item => {
          const selected = location.pathname === item.to || (item.menu === 'products' && location.pathname === '/portfolio');
          return (
            <div key={item.to} className="h-full flex items-center"
              onMouseEnter={() => { clearTimer(); setActiveMenu(item.menu || null); }}
              onMouseLeave={closeLater}>
              <Link to={item.to} onClick={() => setActiveMenu(null)}
                className={'h-full inline-flex gap-1 items-center border-b-2 text-[11px] xl:text-[12px] font-medium whitespace-nowrap transition-colors ' +
                (selected ? 'text-[#754831] border-[#754831]' : 'text-[#5e5954] border-transparent hover:text-[#754831]')}>
                {item.label}
                {item.menu && <ChevronDown size={12} />}
              </Link>
            </div>
          );
        })}
      </nav>
      {activeMenu && (
        <div className="absolute top-full left-0 right-0 z-40 bg-[#fcfaf7] border-y border-[#e7dcd1] shadow-[0_30px_55px_rgba(31,20,13,0.13)]"
          onMouseEnter={clearTimer} onMouseLeave={closeLater}>
          <div className="max-w-[1260px] mx-auto px-10 py-9 grid grid-cols-[1fr_2fr] gap-12">
            <div>
              <span className="uppercase tracking-[0.18em] text-[#956b51] text-[10px]">Discover PZ</span>
              <h3 className="font-serif text-3xl text-[#30221b] mt-3">{activeMenu === 'products' ? 'What We Make' : 'Working with PZ'}</h3>
              <p className="text-[#7f7770] text-sm leading-relaxed mt-3 max-w-[280px]">{activeMenu === 'products' ? 'Explore our product categories and wood furniture capabilities.' : 'Learn how we support development, sampling and manufacturing.'}</p>
            </div>
            <div className="grid grid-cols-2 gap-x-7 gap-y-1">
              {submenu.map(entry => (
                <Link key={entry.to} to={entry.to} onClick={() => setActiveMenu(null)}
                  className="group flex items-center justify-between gap-3 py-3 border-b border-[#ebe3db] text-[#49362b] text-sm hover:text-[#754831]">
                  {entry.label} <ArrowUpRight size={16} className="opacity-30 group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default DesktopNav;
