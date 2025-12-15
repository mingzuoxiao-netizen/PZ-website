
import React from 'react';
import { Link } from 'react-router-dom';
import { NAV_ITEMS } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  textColor: string; // For the toggle button if we needed to pass it down
}

const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();

  return (
    <>
      {/* 
         Overlay Container 
         - Fixed position independent of Header
         - Controls its own Z-index to sit below Header Bar but above Content
      */}
      <div 
        className={`
          fixed inset-0 z-40 bg-white/95 backdrop-blur-sm transition-all duration-500 ease-in-out
          flex flex-col pt-[80px] md:pt-[100px] pb-12 px-6
          ${isOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-4 pointer-events-none'}
        `}
      >
        <nav className="flex flex-col flex-grow items-center space-y-6 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            // Filter out 'Inquire' from the list as we have a dedicated button below
            if (item.path === '/inquire') return null;

            return (
              <div key={item.path} className="w-full text-center border-b border-stone-100 pb-4 last:border-0">
                <Link
                  to={item.path}
                  onClick={onClose}
                  className="block font-serif text-2xl text-stone-800 hover:text-safety-700 transition-colors"
                >
                   {t.nav.header[item.key]}
                </Link>
              </div>
            );
          })}

          <div className="mt-auto pt-8 w-full flex flex-col items-center gap-6">
            <Link
              to="/inquire"
              onClick={onClose}
              className="w-full max-w-xs text-center text-xs font-bold tracking-[0.2em] uppercase bg-stone-900 text-white py-4 hover:bg-safety-700 transition-colors shadow-lg"
            >
              {/* Updated to match Desktop Nav 'Inquire' */}
              {t.nav.header.inquire}
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
};

export default MobileNav;
