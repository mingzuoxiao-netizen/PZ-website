import React, { useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ArrowUpRight } from 'lucide-react';
import { usePublishedSiteConfig } from '../../contexts/SiteConfigContext';
import { useLanguage } from '../../contexts/LanguageContext';
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
  const { language } = useLanguage();
  const L = (en: string, zh: string) => language === 'zh' ? zh : en;
  const { config } = usePublishedSiteConfig();
  const closeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const productCategories = config?.categories?.length ? config.categories : staticCategories;
  const nav = [
    { label: 'Home', zh: '首页', to: '/' },
    { label: 'Products', zh: '产品中心', to: '/collections', menu: 'products' },
    { label: 'Custom Manufacturing', zh: '定制制造', to: '/capabilities', menu: 'manufacturing' },
    { label: 'Our Facilities', zh: '生产基地', to: '/capacity' },
    { label: 'Materials & Quality', zh: '材料与品质', to: '/materials' },
    { label: 'About PZ', zh: '关于我们', to: '/about' }
  ];
  const submenu = activeMenu === 'products'
    ? [
        { label: L('All Products','全部产品'), to: '/collections' },
        ...productCategories.map(c => ({ label: language === 'zh' ? (c.title_zh || c.title) : c.title, to: '/collections?category=' + encodeURIComponent(c.id) }))
      ]
    : [
        { label: L('OEM / ODM Capabilities','OEM / ODM 定制制造'), to: '/capabilities' },
        { label: L('Manufacturing Process','制造流程'), to: '/manufacturing' },
        { label: L('Our Facilities','生产基地'), to: '/capacity' },
        { label: L('Materials & Finishes','材料与涂装'), to: '/materials' }
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
                {language === 'zh' ? item.zh : item.label}
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
              <span className="uppercase tracking-[0.18em] text-[#956b51] text-[10px]">{L('Discover PZ','了解 PZ')}</span>
              <h3 className="font-serif text-3xl text-[#30221b] mt-3">{activeMenu === 'products' ? 'L('What We Make','产品分类') : L('Working with PZ','与 PZ 合作')}</h3>
              <p className="text-[#7f7770] text-sm leading-relaxed mt-3 max-w-[280px]">{activeMenu === 'products' ? 'L('Explore our product categories and wood furniture capabilities.','查看我们的产品系列与实木家具制造能力。') : L('Learn how we support development, sampling and manufacturing.','了解产品开发、打样和生产流程。')}</p>
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
