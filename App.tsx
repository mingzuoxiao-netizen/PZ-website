
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
import { LanguageProvider } from './contexts/LanguageContext';
import { AssetProvider } from './contexts/AssetContext'; 
import { SiteConfigProvider } from './contexts/SiteConfigContext';

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// ✅ Standard Layout: Wraps Public Pages & Admin Workspace
// Provides SiteConfig context strictly to these routes.
const StandardLayout = () => (
  <SiteConfigProvider>
    <Outlet />
  </SiteConfigProvider>
);

const App: React.FC = () => {
return (
  <AssetProvider>
      <LanguageProvider>
        <HashRouter>
          <ScrollToTop />

          <Routes>
            
            {/* ============================================================== */}
            {/* GROUP 1: ROUTES WITH SITE CONFIG (Public + Admin Workspace)    */}
            {/* ============================================================== */}
            <Route element={<StandardLayout />}>
              
              {/* Public Website */}
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

              {/* Admin Dashboard (Uses Config for links/preview) */}
              <Route
                path="/admin-pzf-2025"
                element={
                  <AdminGuard>
                    <AdminDashboard />
                  </AdminGuard>
                }
              />

              {/* Admin Workspace (The Editor) */}
              <Route
                path="/creator/admin"
                element={
                  <AdminGuard requiredRole="ADMIN">
                    <AdminWorkspace />
                  </AdminGuard>
                }
              />
            </Route>

            {/* ============================================================== */}
            {/* GROUP 2: ISOLATED FACTORY WORKSPACE (NO SITE CONFIG)           */}
            {/* Strictly prevents Config Provider loading states in factory    */}
            {/* ============================================================== */}

            <Route
              path="/creator/factory"
              element={
                <AdminGuard requiredRole="FACTORY">
                  <FactoryWorkspace />
                </AdminGuard>
              }
            />

            {/* Dispatcher (No Config needed) */}
            <Route
              path="/creator"
              element={
                <AdminGuard>
                  <CreatorPortal />
                </AdminGuard>
              }
            />

          </Routes>
        </HashRouter>
      </LanguageProvider>
  </AssetProvider>
);
};

export default App;
