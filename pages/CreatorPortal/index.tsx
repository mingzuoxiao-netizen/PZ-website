
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const CreatorPortal: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const role = sessionStorage.getItem('pz_user_role');
    
    // Explicit dispatch based on role
    if (role === 'ADMIN') {
        navigate('/creator/admin', { replace: true });
    } else {
        // Default to Factory for any other role or missing role (assuming AuthGuard passed)
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
