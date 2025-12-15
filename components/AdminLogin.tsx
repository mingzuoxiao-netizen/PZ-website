
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowRight, Lock, Loader2, User, Factory } from "lucide-react";
import { ADMIN_SESSION_KEY, ADMIN_API_BASE } from "../utils/adminFetch";

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    try {
      // 1. POST Credentials to Backend
      const response = await fetch(`${ADMIN_API_BASE}/admin/login-db`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) throw new Error("Authentication failed");

      const data = await response.json();

      if (data.token) {
        // 2. Store Session Data
        sessionStorage.setItem(ADMIN_SESSION_KEY, data.token);
        
        const uiRole = data.user?.role || 'FACTORY';
        const uiName = data.user?.username || username;

        sessionStorage.setItem("pz_user_role", uiRole);
        sessionStorage.setItem("pz_user_name", uiName);
        
        // 3. Trigger State Update
        onLoginSuccess();

        // 4. IMMEDIATE DIVERSION (The "Right Door" Logic)
        if (uiRole === 'ADMIN') {
            navigate("/creator/admin");
        } else {
            navigate("/creator/factory");
        }

      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(true);
      setTimeout(() => setError(false), 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-stone-50 px-6">
      <div className="bg-white p-10 md:p-16 shadow-2xl border border-stone-200 max-w-md w-full text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-stone-400 to-stone-600"></div>
        
        <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-8 text-stone-700">
           {username.toLowerCase().includes('factory') ? <Factory size={40} strokeWidth={1.5}/> : <ShieldCheck size={40} strokeWidth={1.5} />}
        </div>
        
        <h2 className="font-serif text-3xl text-stone-900 mb-2">
            System Login
        </h2>
        <p className="text-stone-500 text-sm mb-10 tracking-wide">
            Restricted Access. Identity Verification Required.
        </p>

        <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
                    <User size={18} />
                </div>
                <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    className="w-full bg-stone-50 border border-stone-200 pl-12 pr-4 py-4 text-stone-900 focus:outline-none focus:border-[#a16207] focus:ring-1 focus:ring-[#a16207] transition-all placeholder-stone-400 font-sans"
                    disabled={loading}
                />
            </div>

            <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
                    <Lock size={18} />
                </div>
                <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className={`w-full bg-stone-50 border ${error ? 'border-red-400' : 'border-stone-200'} pl-12 pr-4 py-4 text-stone-900 focus:outline-none focus:border-[#a16207] focus:ring-1 focus:ring-[#a16207] transition-all placeholder-stone-400 font-sans`}
                    disabled={loading}
                />
            </div>
            
            {error && (
                <div className="text-red-500 text-xs font-bold uppercase tracking-widest animate-pulse">
                    Access Denied
                </div>
            )}
            
            <button 
                type="submit"
                disabled={loading}
                className="w-full bg-[#281815] text-white font-bold uppercase tracking-[0.2em] py-4 hover:bg-[#a16207] transition-colors flex items-center justify-center group disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {loading ? (
                  <span className="flex items-center">
                    Verifying <Loader2 size={16} className="ml-2 animate-spin" />
                  </span>
                ) : (
                  <>
                    Sign In <ArrowRight size={16} className="ml-3 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
            </button>
        </form>
      </div>
      <p className="mt-8 text-stone-400 text-xs uppercase tracking-widest">
        System: Secure RBAC Login
      </p>
    </div>
  );
};

export default AdminLogin;
