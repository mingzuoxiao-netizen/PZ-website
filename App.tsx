
import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Manufacturing from './pages/Manufacturing';
import Capabilities from './pages/Capabilities';
import Collections from './pages/Collections';
import Materials from './pages/Materials';
import GlobalCapacity from './pages/GlobalCapacity';
import Inquire from './pages/Inquire';
import AdminDashboard from './pages/AdminDashboard';
import SearchResults from './pages/SearchResults';
import CreatorPortal from './pages/CreatorPortal';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import AuthGuard from './components/AuthGuard';
import AdminGuard from './components/AdminGuard';
import { LanguageProvider } from './contexts/LanguageContext';

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const App: React.FC = () => {
return (
  <LanguageProvider>
    <HashRouter>
      <ScrollToTop />

      <Routes>

        {/* ===================== */}
        {/* Public & User Routes */}
        {/* ===================== */}
        <Route
          path="/"
          element={
            <AuthGuard>
              <Layout>
                <Home />
              </Layout>
            </AuthGuard>
          }
        />

        <Route
          path="/about"
          element={
            <AuthGuard>
              <Layout>
                <About />
              </Layout>
            </AuthGuard>
          }
        />

        <Route
          path="/manufacturing"
          element={
            <AuthGuard>
              <Layout>
                <Manufacturing />
              </Layout>
            </AuthGuard>
          }
        />

        <Route
          path="/capabilities"
          element={
            <AuthGuard>
              <Layout>
                <Capabilities />
              </Layout>
            </AuthGuard>
          }
        />

        <Route
          path="/collections"
          element={
            <AuthGuard>
              <Layout>
                <Collections />
              </Layout>
            </AuthGuard>
          }
        />

        <Route
          path="/materials"
          element={
            <AuthGuard>
              <Layout>
                <Materials />
              </Layout>
            </AuthGuard>
          }
        />

        <Route
          path="/capacity"
          element={
            <AuthGuard>
              <Layout>
                <GlobalCapacity />
              </Layout>
            </AuthGuard>
          }
        />

        <Route
          path="/inquire"
          element={
            <AuthGuard>
              <Layout>
                <Inquire />
              </Layout>
            </AuthGuard>
          }
        />

        <Route
          path="/privacy"
          element={
            <AuthGuard>
              <Layout>
                <PrivacyPolicy />
              </Layout>
            </AuthGuard>
          }
        />

        <Route
          path="/terms"
          element={
            <AuthGuard>
              <Layout>
                <TermsOfService />
              </Layout>
            </AuthGuard>
          }
        />

        <Route
          path="/search"
          element={
            <AuthGuard>
              <Layout>
                <SearchResults />
              </Layout>
            </AuthGuard>
          }
        />

        {/* ===================== */}
        {/* Admin / Creator Routes */}
        {/* ===================== */}

        {/* Hidden Admin Dashboard */}
        <Route
          path="/admin-pzf-2025"
          element={
            <Layout>
              <AdminGuard>
                <AdminDashboard />
              </AdminGuard>
            </Layout>
          }
        />

        {/* Creator Portal */}
        <Route
          path="/creator"
          element={
            <Layout>
              <AdminGuard>
                <CreatorPortal />
              </AdminGuard>
            </Layout>
          }
        />

      </Routes>
    </HashRouter>
  </LanguageProvider>
);
};


export default App;