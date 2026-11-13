import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormSkeleton } from './ui/BackofficeComponents';

const CreatorPortal: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const dispatchUser = () => {
        const role = (sessionStorage.getItem("pz_user_role") || '').toUpperCase();

        if (role === 'ADMIN') {
            navigate('/creator/admin', { replace: true });
        } else if (role === 'SUPERVISOR') {
            navigate('/creator/supervisor', { replace: true });
        } else if (role === 'FACTORY') {
            navigate('/creator/factory', { replace: true });
        } else {
            navigate('/admin-pzf-2025', { replace: true });
        }
    };
    dispatchUser();
  }, [navigate]);

  return (
    <div className="mx-auto max-w-xl space-y-4 p-6" aria-label="正在进入后台工作台">
        <p className="text-sm text-stone-700">正在进入后台工作台…</p>
        <FormSkeleton />
    </div>
  );
};

export default CreatorPortal;
