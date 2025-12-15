
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ADMIN_SESSION_KEY, adminFetch } from "../utils/adminFetch";
import AdminLogin from "./AdminLogin";
import { Loader2 } from "lucide-react";

interface AdminGuardProps {
  children: React.ReactNode;
  requiredRole?: 'ADMIN' | 'FACTORY';
}

const AdminGuard: React.FC<AdminGuardProps> = ({ children, requiredRole }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  const validateSession = useCallback(async () => {
    const token = sessionStorage.getItem(ADMIN_SESSION_KEY);
    
    if (!token) {
      setStatus('unauthenticated');
      return;
    }

    try {
      // 1. Verify Identity against Backend (Single Source of Truth)
      const user = await adminFetch<{ username: string; role: string }>('/admin/me', { method: 'GET' });
      
      const backendRole = (user.role || '').toUpperCase();

      // 2. Enforce Workspace Isolation
      if (requiredRole && backendRole !== requiredRole) {
          console.warn(`[Guard] Role mismatch. User: ${backendRole}, Required: ${requiredRole}`);
          // Redirect to correct workspace
          const target = backendRole === 'ADMIN' ? '/creator/admin' : '/creator/factory';
          navigate(target, { replace: true });
          return;
      }

      // 3. Cache Display Info (UI Only)
      sessionStorage.setItem("pz_user_role", backendRole);
      sessionStorage.setItem("pz_user_name", user.username);
      
      setStatus('authenticated');
    } catch (e) {
      console.warn("[Guard] Session invalid:", e);
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      sessionStorage.removeItem("pz_user_role");
      sessionStorage.removeItem("pz_user_name");
      setStatus('unauthenticated');
    }
  }, [navigate, requiredRole]);

  useEffect(() => {
    validateSession();
  }, [validateSession, location.pathname]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
        <Loader2 className="animate-spin text-stone-400 mb-4" size={32} />
        <p className="text-xs font-bold uppercase tracking-widest text-stone-500">Verifying Identity...</p>
      </div>
    );
  }

  if (status === 'authenticated') {
    return <>{children}</>;
  }

  return (
    <AdminLogin
      onLoginSuccess={() => setStatus('loading')} 
    />
  );
};

export default AdminGuard;
