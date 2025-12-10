
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
      <AuthGuard>
        <HashRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Layout><Home /></Layout>} />
            <Route path="/about" element={<Layout><About /></Layout>} />
            <Route path="/manufacturing" element={<Layout><Manufacturing /></Layout>} />
            <Route path="/capabilities" element={<Layout><Capabilities /></Layout>} />
            <Route path="/collections" element={<Layout><Collections /></Layout>} />
            <Route path="/materials" element={<Layout><Materials /></Layout>} />
            <Route path="/capacity" element={<Layout><GlobalCapacity /></Layout>} />
            <Route path="/inquire" element={<Layout><Inquire /></Layout>} />
            <Route path="/admin" element={
              <Layout>
                <AdminGuard>
                  <AdminDashboard />
                </AdminGuard>
              </Layout>
            } />
            <Route path="/creator" element={
              <Layout>
                <AdminGuard>
                  <CreatorPortal />
                </AdminGuard>
              </Layout>
            } />
            <Route path="/search" element={<Layout><SearchResults /></Layout>} />
          </Routes>
        </HashRouter>
      </AuthGuard>
    </LanguageProvider>
  );
};

export default App;
