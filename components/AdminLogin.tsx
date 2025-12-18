
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowRight, Lock, Loader2, Factory } from "lucide-react";
import { ADMIN_SESSION_KEY, adminFetch } from "../utils/adminFetch";

const AdminLogin: React.FC = () => {
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
      // 1. Using unified fetcher with skipAuth: true for login
      // Path 'login' will be prefixed with ADMIN_API_BASE automatically
      const data = await adminFetch('login', {
        method: "POST",
        body: JSON.stringify({ username, password }),
        skipAuth: true
      });
      
      // 2. Map fields based on API_CONTRACT.md (v1.0)
      // Contract says { "token": "...", "user": { "role": "...", "username": "..." } }
      if (!data.token) {
        throw new Error("Missing token in response");
      }

      // 3. Write Token & User Context (Atomic Sync)
      sessionStorage.setItem(ADMIN_SESSION_KEY, data.token);
      
      if (data.user) {
        sessionStorage.setItem("pz_user_role", (data.user.role || '').toUpperCase());
        sessionStorage.setItem("pz_user_name", data.user.username || username);
      }

      // 4. Navigate Immediately
      navigate("/creator", { replace: true });

    } catch (err) {
      console.error("Login error:", err);
      setError(true);
      setTimeout(() => setError(false), 3000);
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
            Restricted Access.
        </p>

        <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
                <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    className="w-full bg-stone-50 border border-stone-200 pl-4 pr-4 py-4 text-stone-900 focus:outline-none focus:border-[#a16207] focus:ring-1 focus:ring-[#a16207] transition-all placeholder-stone-400 font-sans"
                    disabled={loading}
                    autoComplete="username"
                />
            </div>

            <div className="relative">
                <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className={`w-full bg-stone-50 border ${error ? 'border-red-400' : 'border-stone-200'} pl-4 pr-4 py-4 text-stone-900 focus:outline-none focus:border-[#a16207] focus:ring-1 focus:ring-[#a16207] transition-all placeholder-stone-400 font-sans`}
                    disabled={loading}
                    autoComplete="current-password"
                />
            </div>
            
            {error && (
                <div className="text-red-500 text-xs font-bold uppercase tracking-widest animate-pulse">
                    Access Denied. Check credentials.
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
    </div>
  );
};

export default AdminLogin;
