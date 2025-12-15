
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { adminFetch } from '../../utils/adminFetch';

const CreatorPortal: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const dispatchUser = async () => {
        try {
            const user = await adminFetch<{ role: string }>('/admin/me');
            const role = (user.role || '').toUpperCase();

            if (role === 'ADMIN') {
                navigate('/creator/admin', { replace: true });
            } else if (role === 'FACTORY') {
                navigate('/creator/factory', { replace: true });
            } else {
                console.error("Unknown role:", role);
                navigate('/', { replace: true });
            }
        } catch (e) {
            console.error("Dispatch failed (likely unauth):", e);
            // Guard wrapper handles login display if token invalid
        }
    };

    dispatchUser();
  }, [navigate]);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-stone-50">
        <Loader2 className="animate-spin text-stone-400 mb-4" size={32} />
        <p className="text-xs font-bold uppercase tracking-widest text-stone-500">Routing Workspace...</p>
    </div>
  );
};

export default CreatorPortal;
