import React, { useState, useEffect } from "react";
import { ADMIN_SESSION_KEY } from "../utils/adminFetch";
import AdminLogin from "./AdminLogin";

interface AdminGuardProps {
  children: React.ReactNode;
}

const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);

  useEffect(() => {
    const token = sessionStorage.getItem(ADMIN_SESSION_KEY);
    setIsAuthenticated(!!token);
    setChecking(false);
  }, []);

  /* ===============================
     🚫 关键修复点：不再 return null
     =============================== */

  // 1️⃣ 校验中：给一个最简单的 Loading
  if (checking) {
    return (
      <div style={{ padding: "60px", textAlign: "center" }}>
        Checking admin access…
      </div>
    );
  }

  // 2️⃣ 已登录：放行
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // 3️⃣ 未登录：显示登录页
  return (
    <AdminLogin
      onLoginSuccess={() => {
        setIsAuthenticated(true);
      }}
    />
  );
};

export default AdminGuard;
