import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ADMIN_SESSION_KEY } from "../utils/adminFetch";
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

  useEffect(() => {
    const validateToken = () => {
      const token = sessionStorage.getItem(ADMIN_SESSION_KEY);
      const role = sessionStorage.getItem("pz_user_role") as 'ADMIN' | 'FACTORY' | null;
      
      // 1. Basic Token Presence Check
      if (!token) {
        setAuthorized(false);
        setChecking(false);
        return;
      }

      // 2. Strict Role Diversion
      // If we are at the base /creator route, let the dispatcher handle it
      if (location.pathname === '/creator') {
          setAuthorized(true);
          setChecking(false);
          return;
      }

      // Block cross-access regardless of manual URL entry
      if (requiredRole && role !== requiredRole) {
          console.warn(`[Guard] Role mismatch. User: ${role}, Required: ${requiredRole}. Redirecting to correct workspace.`);
          const target = role === 'ADMIN' ? '/creator/admin' : '/creator/factory';
          navigate(target, { replace: true });
          return;
      }

      // 3. Authorization Granted
      setAuthorized(true);
      setChecking(false);
    };

    validateToken();
  }, [navigate, requiredRole, location.pathname]);

  if (checking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
        <Loader2 className="animate-spin text-stone-400 mb-4" size={32} />
        <p className="text-xs font-bold uppercase tracking-widest text-stone-500">验证会话中...</p>
      </div>
    );
  }

  if (authorized) {
    return <>{children}</>;
  }

  // Fallback to Login
  return <AdminLogin />;
};

export default AdminGuard;