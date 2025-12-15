
import React, { useState, useEffect } from "react";
import { ADMIN_SESSION_KEY, adminFetch } from "../utils/adminFetch";
import AdminLogin from "./AdminLogin";
import { Loader2 } from "lucide-react";

interface AdminGuardProps {
  children: React.ReactNode;
}

const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);

  useEffect(() => {
    const validateSession = async () => {
      const token = sessionStorage.getItem(ADMIN_SESSION_KEY);
      
      if (!token) {
        setChecking(false);
        setIsAuthenticated(false);
        return;
      }

      try {
        // Validate token with backend. 
        // We use a lightweight call like /auth/check or just reuse /products with a low limit to check 401s
        // If this throws (401/403), we know the token is invalid.
        await adminFetch('/products?limit=1', { method: 'GET' });
        
        setIsAuthenticated(true);
      } catch (e) {
        console.warn("Session validation failed:", e);
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
        setIsAuthenticated(false);
      } finally {
        setChecking(false);
      }
    };

    validateSession();
  }, []);

  // 1️⃣ Checking: Show secure loader
  if (checking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
        <Loader2 className="animate-spin text-stone-400 mb-4" size={32} />
        <p className="text-xs font-bold uppercase tracking-widest text-stone-500">Verifying Security Token...</p>
      </div>
    );
  }

  // 2️⃣ Authenticated: Render App
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // 3️⃣ Not Authenticated: Render Login
  return (
    <AdminLogin
      onLoginSuccess={() => {
        setIsAuthenticated(true);
      }}
    />
  );
};

export default AdminGuard;
