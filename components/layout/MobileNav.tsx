import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, ChevronDown, MapPin } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePublishedSiteConfig } from '../../contexts/SiteConfigContext';
import { publishedSiteCategories } from '../../utils/catalogCategories';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  textColor: string;
}

/**
 * Mobile counterpart to DesktopNav. Only approved site categories appear here;
 * the links reuse the existing public routes and do not alter backend access.
 */
const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const { config } = usePublishedSiteConfig();
  const [expanded, setExpanded] = useState<'products' | 'manufacturing' | null>(null);
  const L = (en: string, zh: string) => language === 'zh' ? zh : en;
  const categories = publishedSiteCategories(config?.categories);

  const nav = [
    { to: '/', en: 'Home', zh: '首页' },
    { to: '/collections', en: 'Products', zh: '产品中心', submenu: 'products' as const },
    { to: '/capabilities', en: 'Custom Manufacturing', zh: '定制制造', submenu: 'manufacturing' as const },
    { to: '/capacity', en: 'Our Facilities', zh: '生产基地' },
    { to: '/materials', en: 'Materials & Quality', zh: '材料与品质' },
    { to: '/about', en: 'About PZ', zh: '关于我们' }
  ];

  const details = {
    products: [
      { to: '/collections', en: 'All Products', zh: '全部产品' },
      ...categories.map(category => ({
        to: '/collections?category=' + encodeURIComponent(category.id),
        en: category.title,
        zh: category.title_zh || category.title
      }))
    ],
    manufacturing: [
      { to: '/capabilities', en: 'OEM / ODM Capabilities', zh: 'OEM / ODM 定制能力' },
      { to: '/manufacturing', en: 'Manufacturing Process', zh: '制造流程' },
      { to: '/capacity', en: 'Our Facilities', zh: '生产基地' },
      { to: '/materials', en: 'Materials & Finishes', zh: '材料与涂装' }
    ]
  };

  return (
    <div
      id="pz-mobile-navigation"
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-40 flex flex-col bg-[#30221b] transition-opacity duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
    >
      <nav aria-label={L('Mobile navigation','移动导航')} className="flex-1 overflow-y-auto px-6 sm:px-10 pt-[92px] md:pt-[104px] pb-10">
        <p className="mb-7 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#c4a68f]">
          {L('Explore PZ Furniture Studio','探索鹏展家具制造')}
        </p>
        <div className="border-t border-white/15">
          {nav.map((item, index) => (
            <div key={item.to} className="border-b border-white/15">
              <div className="flex items-center gap-3 py-2 min-h-[66px]">
                <span className="w-5 text-[10px] font-mono text-white/45">{String(index + 1).padStart(2, '0')}</span>
                <Link
                  to={item.to}
                  onClick={onClose}
                  className="flex-1 py-3 font-serif text-[clamp(1.4rem,5.4vw,2rem)] leading-tight text-[#f8f3ec] hover:text-[#ddb99b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ddb99b]"
                >
                  {L(item.en, item.zh)}
                </Link>
                {item.submenu && (
                  <button
                    type="button"
                    aria-label={L('Show '+ item.en + ' categories','展开' + item.zh + '子菜单')}
                    aria-expanded={expanded === item.submenu}
                    aria-controls={'pz-mobile-submenu-' + item.submenu}
                    onClick={() => setExpanded(expanded === item.submenu ? null : item.submenu)}
                    className="p-3 text-[#f8f3ec] hover:text-[#ddb99b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ddb99b]"
                  >
                    <ChevronDown size={20} aria-hidden="true" className={`transition-transform ${expanded === item.submenu ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
              {item.submenu && (
                <div id={'pz-mobile-submenu-' + item.submenu} hidden={expanded !== item.submenu} className="pb-5 pl-8">
                  {details[item.submenu].map(link => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={onClose}
                      className="flex items-center justify-between py-2.5 text-sm text-[#d3c4b7] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ddb99b]"
                    >
                      {L(link.en, link.zh)} <ArrowUpRight size={15} aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <Link
          to="/inquire"
          onClick={onClose}
          className="mt-8 flex items-center justify-between bg-[#9a6848] px-5 py-4 text-white font-semibold text-sm hover:bg-[#a97854] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
        >
          {L('Request a Quote','获取报价')} <ArrowRight size={18} aria-hidden="true" />
        </Link>
        <p className="mt-8 flex items-center gap-2 text-[11px] tracking-wide text-[#c8b3a2]">
          <MapPin size={14} aria-hidden="true" /> {L('Manufacturing in China & Cambodia','中国与柬埔寨生产基地')}
        </p>
      </nav>
    </div>
  );
};

export default MobileNav;
