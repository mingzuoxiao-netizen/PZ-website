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
      
      if (!token) {
        setAuthorized(false);
        setChecking(false);
        return;
      }

      if (location.pathname === '/creator') {
          setAuthorized(true);
          setChecking(false);
          return;
      }

      if (requiredRole && role !== requiredRole) {
          const target = role === 'ADMIN' ? '/creator/admin' : '/creator/factory';
          navigate(target, { replace: true });
          return;
      }

      setAuthorized(true);
      setChecking(false);
    };

    validateToken();
  }, [navigate, requiredRole, location.pathname]);

  if (checking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
        <Loader2 className="animate-spin text-stone-400 mb-4" size={32} />
        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 font-mono">Authenticating Registry Session...</p>
      </div>
    );
  }

  if (authorized) {
    return <>{children}</>;
  }

  return <AdminLogin />;
};

export default AdminGuard;