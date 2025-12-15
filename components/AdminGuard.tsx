
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
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const validateSession = useCallback(async () => {
    const token = sessionStorage.getItem(ADMIN_SESSION_KEY);
    
    // 1. Strict Token Check (Pre-Fetch)
    if (!token) {
      setChecking(false);
      setAuthorized(false);
      return;
    }

    try {
      // 2. Token Exists -> Verify with Backend
      const user = await adminFetch<{ username: string; role: string }>('/admin/me', { method: 'GET' });
      const backendRole = (user.role || '').toUpperCase();

      // 3. Enforce Workspace Isolation
      if (requiredRole && backendRole !== requiredRole) {
          console.warn(`[Guard] Role mismatch. User: ${backendRole}, Required: ${requiredRole}`);
          // Redirect to correct workspace
          const target = backendRole === 'ADMIN' ? '/creator/admin' : '/creator/factory';
          navigate(target, { replace: true });
          return;
      }

      // 4. Cache Display Info (UI Only)
      sessionStorage.setItem("pz_user_role", backendRole);
      sessionStorage.setItem("pz_user_name", user.username);
      
      setAuthorized(true);
    } catch (e) {
      console.warn("[Guard] Session invalid or expired:", e);
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      sessionStorage.removeItem("pz_user_role");
      sessionStorage.removeItem("pz_user_name");
      setAuthorized(false);
    } finally {
      setChecking(false);
    }
  }, [navigate, requiredRole]);

  useEffect(() => {
    validateSession();
  }, [validateSession, location.pathname]);

  if (checking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
        <Loader2 className="animate-spin text-stone-400 mb-4" size={32} />
        <p className="text-xs font-bold uppercase tracking-widest text-stone-500">Verifying Identity...</p>
      </div>
    );
  }

  if (authorized) {
    return <>{children}</>;
  }

  // Fallback to Login if no token or invalid token
  return <AdminLogin />;
};

export default AdminGuard;
