import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import TheStudio from './pages/TheStudio';
import Collections from './pages/Collections';
import Materials from './pages/Materials';
import GlobalCapacity from './pages/GlobalCapacity';
import Inquire from './pages/Inquire';
import AdminDashboard from './pages/AdminDashboard';

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
    <HashRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/about" element={<Layout><About /></Layout>} />
        <Route path="/studio" element={<Layout><TheStudio /></Layout>} />
        <Route path="/collections" element={<Layout><Collections /></Layout>} />
        <Route path="/materials" element={<Layout><Materials /></Layout>} />
        <Route path="/capacity" element={<Layout><GlobalCapacity /></Layout>} />
        <Route path="/inquire" element={<Layout><Inquire /></Layout>} />
        <Route path="/admin" element={<Layout><AdminDashboard /></Layout>} />
      </Routes>
    </HashRouter>
  );
};

export default App;
