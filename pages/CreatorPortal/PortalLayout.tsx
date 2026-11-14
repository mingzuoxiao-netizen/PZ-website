import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Factory, LogOut, Globe, Menu, ChevronDown } from 'lucide-react';
import NotificationBell from './components/NotificationBell';
import SupportCenter from './components/SupportCenter';
import { ConfirmDialog } from './ui/BackofficeComponents';

interface PortalLayoutProps {
  children: React.ReactNode;
  role: 'ADMIN' | 'FACTORY' | 'SUPERVISOR';
  userName: string;
  navItems: { id: string; label: string; icon: React.ReactNode; group?: string }[];
  activeTab: string;
  onTabChange: (id: any) => void;
}

const PortalLayout: React.FC<PortalLayoutProps> = ({
  children, role, userName, navItems, activeTab, onTabChange
}) => {
  const [showLogout,setShowLogout]=React.useState(false);
  const handleLogout = () => setShowLogout(true);
  const confirmLogout=()=>{
    sessionStorage.clear();
    window.location.href = '#/admin-pzf-2025';
  };

  const [expandedGroups,setExpandedGroups]=React.useState<Record<string,boolean>>({});
  // All roles share four navigation groups; only the supplied role-specific items are visible.
  const groupFor=(item:typeof navItems[number])=>{
    if(['review','reviews'].includes(item.id))return '待办';
    if(['inventory','bulk-import','categories'].includes(item.id))return '产品';
    if(item.id==='inquiries')return '询盘';
    return '系统';
  };
  const groupedItems=navItems.map(item=>({...item,group:groupFor(item)}));
  const groupNames=['待办','产品','询盘','系统'].filter(group=>groupedItems.some(item=>item.group===group));
  const hasGroups=groupNames.length>0;
  const navList = (mobile: boolean, items: typeof navItems = navItems) => items.map(item => (
    <button
      type="button"
      key={item.id}
      onClick={() => onTabChange(item.id)}
      aria-current={activeTab === item.id ? 'page' : undefined}
      className={mobile
        ? 'flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8b5c43] ' +
          (activeTab === item.id ? 'border-[#805036] text-[#754831]' : 'border-transparent text-stone-600 hover:text-stone-900')
        : 'flex w-full items-center gap-3 rounded-sm px-4 py-3 text-left text-[13px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white ' +
          (activeTab === item.id ? 'bg-white/15 text-white shadow-[inset_3px_0_0_0_#c79b7b]' : 'text-[#c5cbd1] hover:bg-white/10 hover:text-white')
      }
    >
      <span className={mobile ? 'shrink-0' : 'text-[#d6c0b0]'}>{item.icon}</span>
      <span className="whitespace-nowrap">{item.label}</span>
    </button>
  ));

  return (
    <div className="pz-backoffice flex min-h-screen flex-col bg-stone-50 lg:flex-row">
      <aside className="hidden lg:sticky lg:top-0 lg:z-20 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col bg-[#1e3045] text-white">
        <div className="flex items-center gap-3 border-b border-white/10 p-7">
          <div className="flex h-9 w-9 items-center justify-center rounded bg-[#476b9a] font-serif font-bold text-white">P</div>
          <div className="text-[11px] font-bold tracking-[0.1em]">PZ 中文管理后台</div>
        </div>
        <nav aria-label="后台功能" className="flex-grow space-y-2 overflow-y-auto p-4">
          {groupNames.map(group=><details key={group}
            open={expandedGroups[group] ?? groupedItems.some(item=>item.group===group&&item.id===activeTab)}
            onToggle={event=>{
              const isOpen=event.currentTarget.open;
              setExpandedGroups(prev=>prev[group]===isOpen?prev:{...prev,[group]:isOpen});
            }}
            className="group rounded border border-white/10">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs font-semibold text-[#c5cbd1] hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
              {group}
              <ChevronDown size={15} aria-hidden="true" className="transition-transform group-open:rotate-180"/>
            </summary>
            <div className="space-y-1 border-t border-white/10 p-1">
              {navList(false,groupedItems.filter(item=>item.group===group))}
            </div>
          </details>)}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 rounded-sm bg-[#152335] p-4">
            <div className="mb-1 flex items-center gap-2">
              {role === 'ADMIN' ? <Shield size={15} className="text-[#d7af90]" /> : <Factory size={15} className="text-[#d7af90]" />}
              <span className="truncate text-xs font-semibold">{userName}</span>
            </div>
            <p className="text-[11px] text-[#b8c4d0]">{role === 'ADMIN' ? '网站管理员' : role === 'SUPERVISOR' ? '部门主管' : '工厂操作员'}</p>
          </div>
          <button type="button" onClick={handleLogout}
            className="flex w-full items-center justify-between px-4 py-2 text-xs font-semibold text-[#ccd3db] hover:text-white">
            安全退出 <LogOut size={15} aria-hidden="true" />
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:h-screen">
        <header className="flex min-h-[72px] flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 py-4 md:px-8 lg:min-h-20 lg:py-0">
          <div className="flex min-w-0 items-center gap-3">
            <label htmlFor="pz-mobile-backoffice-section" className="lg:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded bg-[#1e3045] text-white"><Menu size={19} aria-hidden="true" /><span className="sr-only">选择后台功能</span></label>
            <h1 className="min-w-0 truncate font-serif text-xl text-stone-900">
              {navItems.find(i => i.id === activeTab)?.label || '管理后台'}
            </h1>
            <span className="hidden sm:inline-flex rounded bg-stone-100 px-2 py-1 text-[11px] text-stone-600">
              {role === 'ADMIN' ? '管理员' : role === 'SUPERVISOR' ? '主管' : '工厂账号'} · {userName}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell role={role}/>
            <Link to="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-semibold text-[#754831] hover:text-stone-900">
              查看网站 <Globe size={15} aria-hidden="true" />
            </Link>
            <button type="button" onClick={handleLogout}
              className="flex items-center gap-1 text-xs font-semibold text-stone-600 hover:text-stone-900 lg:hidden">
              退出 <LogOut size={15} aria-hidden="true" />
            </button>
          </div>
        </header>

        {hasGroups
          ? <div className="border-b border-stone-200 bg-white px-4 py-3 lg:hidden">
              <label htmlFor="pz-mobile-backoffice-section" className="mb-1 block text-xs font-semibold text-stone-600">当前功能</label>
              <select id="pz-mobile-backoffice-section" aria-label="手机端后台功能"
                value={activeTab} onChange={event=>onTabChange(event.target.value)}
                className="w-full rounded border border-stone-300 bg-white px-3 py-3 text-sm text-stone-900">
                {groupedItems.map(item=><option key={item.id} value={item.id}>
                  {item.group+' · '}{item.label}
                </option>)}
              </select>
            </div>
          : <nav aria-label="手机端后台功能" className="flex gap-1 overflow-x-auto border-b border-stone-200 bg-white px-2 sm:px-4 lg:hidden">
              {navList(true)}
            </nav>}

        <main className="min-w-0 flex-1 bg-stone-50 p-4 md:p-8 lg:overflow-y-auto">
          <div className="mx-auto max-w-[1600px] min-w-0">
            {activeTab === 'support' ? <SupportCenter role={role} onNavigate={onTabChange} /> : children}
          </div>
        </main>
      </div>
      <ConfirmDialog open={showLogout} title="确认退出" description="确认退出当前登录账号吗？" confirmLabel="安全退出" onConfirm={confirmLogout} onCancel={()=>setShowLogout(false)}/>
    </div>
  );
};

export default PortalLayout;
