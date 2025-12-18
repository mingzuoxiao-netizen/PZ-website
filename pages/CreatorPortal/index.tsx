
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const CreatorPortal: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const dispatchUser = () => {
        // ✅ Frozen API v1.0: Section 8 forbids /admin/me.
        // We use the role metadata saved in sessionStorage during the 'login' response.
        const role = (sessionStorage.getItem("pz_user_role") || '').toUpperCase();

        if (role === 'ADMIN') {
            navigate('/creator/admin', { replace: true });
        } else if (role === 'FACTORY') {
            navigate('/creator/factory', { replace: true });
        } else {
            console.warn("[Portal] No role found in session, redirecting to login.");
            navigate('/admin-pzf-2025', { replace: true });
        }
    };

    // Small timeout to ensure Guard has completed (optional UX)
    const timer = setTimeout(dispatchUser, 300);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-stone-50">
        <Loader2 className="animate-spin text-stone-400 mb-4" size={32} />
        <p className="text-xs font-bold uppercase tracking-widest text-stone-500">Routing Workspace...</p>
    </div>
  );
};

export default CreatorPortal;
