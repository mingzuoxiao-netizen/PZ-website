
import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Factory, Globe } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface PortalLayoutProps {
  children: React.ReactNode;
  role: 'ADMIN' | 'FACTORY';
  userName: string;
  // Allows injecting specific nav items
  navActions?: React.ReactNode;
}

const PortalLayout: React.FC<PortalLayoutProps> = ({ 
  children, role, userName, navActions 
}) => {
  // Use global language context
  const { t, language, toggleLanguage } = useLanguage();
  
  const txt = {
    en: { exit: "Exit System", roleAdmin: "Decision Maker", roleFactory: "Factory Editor" },
    zh: { exit: "退出系统", roleAdmin: "管理员", roleFactory: "内容创作者" }
  }[language];

  return (
    <div className="min-h-screen bg-stone-100 pb-20">
       {/* TOP NAV */}
       <div className="bg-white border-b border-stone-200 sticky top-0 z-40 px-6 md:px-12 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center">
              <Link to="/admin-pzf-2025" className="text-stone-400 hover:text-stone-900 mr-4 font-bold text-xs uppercase tracking-widest transition-colors">
                 ← {txt.exit}
              </Link>
              <div className="flex items-center space-x-3 border-l border-stone-200 pl-4">
                  <div className={`p-1.5 rounded-sm ${role === 'ADMIN' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {role === 'ADMIN' ? <Shield size={16} /> : <Factory size={16} />}
                  </div>
                  <div>
                      <h1 className="font-serif text-sm font-bold text-stone-900 leading-none">{userName}</h1>
                      <p className="text-[10px] text-stone-500 uppercase tracking-widest">
                          {role === 'ADMIN' ? txt.roleAdmin : txt.roleFactory}
                      </p>
                  </div>
              </div>
          </div>
          
          <div className="flex items-center space-x-8">
             {/* Language Switcher */}
             <button 
                onClick={toggleLanguage}
                className="flex items-center text-xs font-bold text-stone-500 hover:text-stone-900 uppercase tracking-widest border border-stone-200 px-3 py-1.5 rounded-sm transition-colors"
             >
                <Globe size={14} className="mr-2" />
                {language === 'en' ? 'EN / 中文' : '中文 / EN'}
             </button>

             {/* Dynamic Workspace Tabs */}
             {navActions}
          </div>
       </div>

       <div className="container mx-auto px-6 md:px-12 py-12">
          {children}
       </div>
    </div>
  );
};

export default PortalLayout;
