
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
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import AuthGuard from './components/AuthGuard';
import AdminGuard from './components/AdminGuard';
import PreviewFrame from './pages/CreatorPortal/components/PreviewFrame';
import { LanguageProvider } from './contexts/LanguageContext';
import { SiteConfigProvider } from './contexts/SiteConfigContext';

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

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

          <Routes>
            
            {/* PUBLIC & ADMIN WORKSPACE (Uses Public Config) */}
            <Route element={<StandardLayout />}>
              <Route path="/" element={<AuthGuard><Layout><Home /></Layout></AuthGuard>} />
              <Route path="/about" element={<AuthGuard><Layout><About /></Layout></AuthGuard>} />
              <Route path="/manufacturing" element={<AuthGuard><Layout><Manufacturing /></Layout></AuthGuard>} />
              <Route path="/capabilities" element={<AuthGuard><Layout><Capabilities /></Layout></AuthGuard>} />
              <Route path="/portfolio" element={<AuthGuard><Layout><Portfolio /></Layout></AuthGuard>} />
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

            {/* Dispatcher */}
            <Route path="/creator" element={<AdminGuard><CreatorPortal /></AdminGuard>} />

          </Routes>
        </HashRouter>
      </LanguageProvider>
);
};

export default App;
