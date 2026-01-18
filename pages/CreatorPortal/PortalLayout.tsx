import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Factory, LogOut, Globe } from 'lucide-react';
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
  const { language } = useLanguage();

  const handleLogout = () => {
    sessionStorage.clear();
    window.location.href = '#/admin-pzf-2025';
  };

  const txt = language === 'zh' ? {
    exit: "返回官网", 
    labelAdmin: "管理员控制台", 
    labelFactory: "工厂控制台",
    logout: "退出登录"
  } : {
    exit: "Back to Site", 
    labelAdmin: "Admin Console", 
    labelFactory: "Factory Console",
    logout: "Logout"
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
       {/* INDUSTRIAL TOP BAR */}
       <header className="bg-stone-900 text-white sticky top-0 z-50 px-6 md:px-12 py-3 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center space-x-6">
              <Link to="/" className="flex items-center gap-2 group">
                  <div className="bg-amber-700 p-1.5 rounded-sm group-hover:bg-amber-600 transition-colors">
                      <Globe size={16} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-[0.3em]">{txt.exit}</span>
              </Link>
              
              <div className="h-4 w-px bg-white/10 hidden md:block"></div>
              
              <div className="flex items-center space-x-3">
                  <div className={`p-1.5 rounded-sm ${role === 'ADMIN' ? 'bg-zinc-800' : 'bg-blue-900'}`}>
                      {role === 'ADMIN' ? <Shield size={16} className="text-amber-500" /> : <Factory size={16} className="text-blue-200" />}
                  </div>
                  <div>
                      <h1 className="font-serif text-sm font-bold leading-none">{userName}</h1>
                      <p className="text-[9px] text-stone-500 uppercase tracking-widest font-bold mt-1">
                          {role === 'ADMIN' ? txt.labelAdmin : txt.labelFactory}
                      </p>
                  </div>
              </div>
          </div>
          
          <div className="flex items-center space-x-8">
             {/* Slot for Workspace Navigation (Tabs) */}
             <nav className="hidden lg:flex items-center space-x-1">
                {navActions}
             </nav>
             
             <button 
                onClick={handleLogout}
                className="text-stone-500 hover:text-red-500 transition-colors p-2"
                title={txt.logout}
             >
                <LogOut size={18} />
             </button>
          </div>
       </header>

       {/* MAIN WORKSPACE CONTENT */}
       <main className="flex-grow container mx-auto px-6 md:px-12 py-8">
          {children}
       </main>

       {/* FOOTER METADATA */}
       <footer className="px-6 py-4 border-t border-stone-200 text-center">
          <p className="text-[10px] text-stone-400 font-mono uppercase tracking-widest">
            PZ Engineering System v2.0.4 // {new Date().toLocaleDateString()} // Restricted Environment
          </p>
       </footer>
    </div>
  );
};

export default PortalLayout;