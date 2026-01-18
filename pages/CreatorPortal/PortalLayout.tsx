import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, Factory, LogOut, Globe, 
  Activity, ChevronRight 
} from 'lucide-react';

interface PortalLayoutProps {
  children: React.ReactNode;
  role: 'ADMIN' | 'FACTORY';
  userName: string;
  navItems: { id: string; label: string; icon: React.ReactNode }[];
  activeTab: string;
  onTabChange: (id: any) => void;
}

const PortalLayout: React.FC<PortalLayoutProps> = ({ 
  children, role, userName, navItems, activeTab, onTabChange 
}) => {
  const handleLogout = () => {
    if (confirm("确定要退出系统吗？")) {
        sessionStorage.clear();
        window.location.href = '#/admin-pzf-2025';
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex overflow-hidden">
       {/* 侧边栏 */}
       <aside className="w-64 bg-stone-900 text-white flex flex-col flex-shrink-0 z-50">
          <div className="p-8 border-b border-white/5 flex items-center gap-3">
              <div className="bg-safety-700 w-8 h-8 rounded flex items-center justify-center font-serif font-bold text-white shadow-lg">P</div>
              <div className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase opacity-60">PZ 系统内核</div>
          </div>

          <nav className="flex-grow p-4 space-y-1">
             {navItems.map((item) => (
                <button
                   key={item.id}
                   onClick={() => onTabChange(item.id)}
                   className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm transition-all group font-sans text-[13px] font-medium
                    ${activeTab === item.id 
                        ? 'bg-white/10 text-white shadow-[inset_3px_0_0_0_#c2410c]' 
                        : 'text-stone-500 hover:bg-white/5 hover:text-stone-300'}
                   `}
                >
                   <span className={activeTab === item.id ? 'text-safety-700' : 'text-stone-600 group-hover:text-stone-400'}>
                       {item.icon}
                   </span>
                   {item.label}
                </button>
             ))}
          </nav>

          <div className="p-4 border-t border-white/5">
             <div className="bg-stone-950 p-4 rounded-sm mb-4">
                 <div className="flex items-center gap-3 mb-1">
                    {role === 'ADMIN' ? <Shield size={14} className="text-safety-700" /> : <Factory size={14} className="text-blue-400" />}
                    <span className="text-xs font-bold text-white truncate">{userName}</span>
                 </div>
                 <p className="text-[10px] text-stone-600 uppercase tracking-widest font-mono">
                    {role === 'ADMIN' ? '系统管理员' : '工厂操作员'}
                 </p>
             </div>
             
             <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-between px-4 py-2 text-xs font-bold text-stone-500 hover:text-red-500 transition-colors"
             >
                退出登录 <LogOut size={14} />
             </button>
          </div>
       </aside>

       {/* 主视图 */}
       <div className="flex-grow flex flex-col h-screen overflow-hidden">
          {/* 顶部标题栏 */}
          <header className="bg-white border-b border-stone-200 px-8 h-20 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-4">
                  <h2 className="font-serif text-xl text-stone-900">
                    {navItems.find(i => i.id === activeTab)?.label}
                  </h2>
                  <div className="flex items-center gap-2 px-2 py-1 bg-stone-100 rounded text-[9px] font-mono text-stone-500 uppercase tracking-widest">
                    PZ-OS v2.5 // 就绪
                  </div>
              </div>

              <div className="flex items-center gap-6">
                  <Link to="/" target="_blank" className="flex items-center gap-2 text-xs font-bold text-stone-400 hover:text-stone-900 transition-colors">
                      查看公共预览 <Globe size={14} />
                  </Link>
                  <div className="h-6 w-px bg-stone-200"></div>
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                     <span className="text-[10px] font-mono font-bold text-stone-400 uppercase">实时同步中</span>
                  </div>
              </div>
          </header>

          <main className="flex-grow overflow-y-auto bg-stone-50 p-8">
             <div className="max-w-[1600px] mx-auto">
                {children}
             </div>
          </main>
       </div>
    </div>
  );
};

export default PortalLayout;