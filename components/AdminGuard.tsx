
import React, { useState, useEffect } from 'react';
import { ADMIN_SESSION_KEY } from '../utils/adminFetch';
import AdminLogin from './AdminLogin';

interface AdminGuardProps {
  children: React.ReactNode;
}

const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // 初始化检查：页面加载时查看 Session 是否有 Token
    const token = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (token) {
      setIsAuthenticated(true);
    }
    setChecking(false);
  }, []);

  if (checking) {
    return null; 
  }

  // 1. 如果已认证，渲染受保护的子组件 (Dashboard)
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // 2. 如果未认证，渲染登录组件
  // 传递回调函数，当登录组件成功获取 Token 后调用
  return <AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} />;
};

export default AdminGuard;
