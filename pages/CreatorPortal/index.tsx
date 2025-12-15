
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const CreatorPortal: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const role = sessionStorage.getItem('pz_user_role');
    
    // Safety check: redirect based on role if user manually hits /creator
    if (role === 'ADMIN') {
        navigate('/creator/admin', { replace: true });
    } else if (role === 'FACTORY') {
        navigate('/creator/factory', { replace: true });
    } else {
        // Fallback or if token exists but role missing
        navigate('/creator/factory', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-stone-50">
        <Loader2 className="animate-spin text-stone-400 mb-4" size={32} />
        <p className="text-xs font-bold uppercase tracking-widest text-stone-500">Redirecting to Workspace...</p>
    </div>
  );
};

export default CreatorPortal;
