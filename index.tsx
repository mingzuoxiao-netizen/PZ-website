import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
// Scoped to .pz-backoffice; import in browser entry so Node component tests stay CSS-free.
import './pages/CreatorPortal/backoffice.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);