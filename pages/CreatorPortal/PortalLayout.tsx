
import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Factory, Globe } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface PortalLayoutProps {
  children: React.ReactNode;
  role: 'ADMIN' | 'FACTORY';
  userName: string;
  navActions?: React.ReactNode;
}

const PortalLayout: React.FC<PortalLayoutProps> = ({ 
  children, role, userName, navActions 
}) => {
  const { language, toggleLanguage } = useLanguage();
  
  const txt = {
    en: { exit: "Exit System", labelAdmin: "Admin Workspace", labelFactory: "Factory Workspace" },
    zh: { exit: "退出系统", labelAdmin: "管理员工作区", labelFactory: "工厂工作区" }
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
                  <div className={`p-1.5 rounded-sm ${role === 'ADMIN' ? 'bg-stone-900 text-white' : 'bg-blue-600 text-white'}`}>
                      {role === 'ADMIN' ? <Shield size={16} /> : <Factory size={16} />}
                  </div>
                  <div>
                      <h1 className="font-serif text-sm font-bold text-stone-900 leading-none">{userName}</h1>
                      <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold mt-0.5">
                          {role === 'ADMIN' ? txt.labelAdmin : txt.labelFactory}
                      </p>
                  </div>
              </div>
          </div>
          
          <div className="flex items-center space-x-8">
             <button 
                onClick={toggleLanguage}
                className="flex items-center text-xs font-bold text-stone-500 hover:text-stone-900 uppercase tracking-widest border border-stone-200 px-3 py-1.5 rounded-sm transition-colors"
             >
                <Globe size={14} className="mr-2" />
                {language === 'en' ? 'EN / 中文' : '中文 / EN'}
             </button>

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
