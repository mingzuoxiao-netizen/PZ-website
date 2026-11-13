
import React from 'react';
import { HashRouter, Routes, Route, useLocation, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Manufacturing from './pages/Manufacturing';
import Capabilities from './pages/Capabilities';
import Portfolio from './pages/Portfolio';
import Materials from './pages/Materials';
import GlobalCapacity from './pages/GlobalCapacity';
import Inquire from './pages/Inquire';
import AdminDashboard from './pages/AdminDashboard';
import SearchResults from './pages/SearchResults';
import CreatorPortal from './pages/CreatorPortal';
import AdminWorkspace from './pages/CreatorPortal/AdminWorkspace';
import FactoryWorkspace from './pages/CreatorPortal/FactoryWorkspace';
import SupervisorWorkspace from './pages/CreatorPortal/SupervisorWorkspace';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import AuthGuard from './components/AuthGuard';
import AdminGuard from './components/AdminGuard';
import PreviewFrame from './pages/CreatorPortal/components/PreviewFrame';
import { LanguageProvider } from './contexts/LanguageContext';
import { useLanguage } from './contexts/LanguageContext';
import { SiteConfigProvider } from './contexts/SiteConfigContext';

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const ROUTE_TITLES: Record<string, [string, string]> = {
  '/': ['Home', '首页'],
  '/collections': ['Collections', '产品系列'],
  '/portfolio': ['Collections', '产品系列'],
  '/capabilities': ['Capabilities', '定制能力'],
  '/manufacturing': ['Manufacturing', '生产制造'],
  '/capacity': ['Global Capacity', '全球产能'],
  '/materials': ['Materials & Quality', '材质与品质'],
  '/about': ['About Us', '关于我们'],
  '/inquire': ['Inquire', '联系我们'],
  '/search': ['Product Search', '产品搜索'],
  '/privacy': ['Privacy Policy', '隐私政策'],
  '/terms': ['Terms of Service', '服务条款'],
};

const RouteTitle = () => {
  const { pathname } = useLocation();
  const { language } = useLanguage();
  React.useEffect(() => {
    const item = ROUTE_TITLES[pathname];
    document.title = item
      ? `${item[language === 'zh' ? 1 : 0]} | PZ Furniture Studio`
      : 'PZ Furniture Studio';
  }, [pathname, language]);
  return null;
};

// Standard Layout for Public
const StandardLayout = () => (
  <SiteConfigProvider mode="public">
    <Outlet />
  </SiteConfigProvider>
);

// Isolated Layout for Admin Preview
const PreviewLayout = () => (
  <SiteConfigProvider mode="preview">
    <PreviewFrame />
  </SiteConfigProvider>
);

const App: React.FC = () => {
return (
      <LanguageProvider>
        <HashRouter>
          <ScrollToTop />
          <RouteTitle />

          <Routes>
            
            {/* PUBLIC & ADMIN WORKSPACE (Uses Public Config) */}
            <Route element={<StandardLayout />}>
              <Route path="/" element={<AuthGuard><Layout><Home /></Layout></AuthGuard>} />
              <Route path="/about" element={<AuthGuard><Layout><About /></Layout></AuthGuard>} />
              <Route path="/manufacturing" element={<AuthGuard><Layout><Manufacturing /></Layout></AuthGuard>} />
              <Route path="/capabilities" element={<AuthGuard><Layout><Capabilities /></Layout></AuthGuard>} />
              <Route path="/collections" element={<AuthGuard><Layout><Portfolio /></Layout></AuthGuard>} />
              <Route path="/portfolio" element={<AuthGuard><Layout><Portfolio /></Layout></AuthGuard>} /> {/* Compatibility Redirect alias */}
              <Route path="/materials" element={<AuthGuard><Layout><Materials /></Layout></AuthGuard>} />
              <Route path="/capacity" element={<AuthGuard><Layout><GlobalCapacity /></Layout></AuthGuard>} />
              <Route path="/inquire" element={<AuthGuard><Layout><Inquire /></Layout></AuthGuard>} />
              <Route path="/privacy" element={<AuthGuard><Layout><PrivacyPolicy /></Layout></AuthGuard>} />
              <Route path="/terms" element={<AuthGuard><Layout><TermsOfService /></Layout></AuthGuard>} />
              <Route path="/search" element={<AuthGuard><Layout><SearchResults /></Layout></AuthGuard>} />

              <Route path="/admin-pzf-2025" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
              <Route path="/creator/admin" element={<AdminGuard requiredRole="ADMIN"><AdminWorkspace /></AdminGuard>} />
            </Route>

            {/* PREVIEW SCOPE (Strictly Isolated) */}
            <Route path="/admin-pzf-2025/preview" element={<AdminGuard requiredRole="ADMIN"><PreviewLayout /></AdminGuard>} />

            {/* FACTORY WORKSPACE */}
            <Route path="/creator/factory" element={<AdminGuard requiredRole="FACTORY"><FactoryWorkspace /></AdminGuard>} />
            <Route path="/creator/supervisor" element={<AdminGuard requiredRole="SUPERVISOR"><SupervisorWorkspace /></AdminGuard>} />

            {/* Dispatcher */}
            <Route path="/creator" element={<AdminGuard><CreatorPortal /></AdminGuard>} />

          </Routes>
        </HashRouter>
      </LanguageProvider>
);
};

export default App;
