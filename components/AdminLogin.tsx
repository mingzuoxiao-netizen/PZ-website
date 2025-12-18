
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
      // ✅ Normalized Path: "login"
      const data = await adminFetch<{
        token: string;
        user: {
          id: string;
          username: string;
          role: "ADMIN" | "FACTORY";
          org_id: string | null;
        };
      }>("login", {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify({ username, password }),
      });

      if (!data.token || !data.user) {
        throw new Error("Invalid login response");
      }

      sessionStorage.setItem(ADMIN_SESSION_KEY, data.token);
      sessionStorage.setItem("pz_user_role", data.user.role);
      sessionStorage.setItem("pz_user_name", data.user.username);

      navigate("/creator", { replace: true });

    } catch (err) {
      console.error("Login error:", err);
      setError(true);
      setTimeout(() => setError(false), 3000);
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
        <h2 className="font-serif text-3xl text-stone-900 mb-2">System Login</h2>
        <p className="text-stone-500 text-sm mb-10 tracking-wide">Restricted Access.</p>
        <form onSubmit={handleLogin} className="space-y-6">
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="w-full bg-stone-50 border border-stone-200 pl-4 pr-4 py-4 text-stone-900 focus:outline-none focus:border-[#a16207] transition-all" disabled={loading} autoComplete="username" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className={`w-full bg-stone-50 border ${error ? 'border-red-400' : 'border-stone-200'} pl-4 pr-4 py-4 text-stone-900 focus:outline-none focus:border-[#a16207] transition-all`} disabled={loading} autoComplete="current-password" />
            {error && <div className="text-red-500 text-xs font-bold uppercase tracking-widest animate-pulse">Access Denied</div>}
            <button type="submit" disabled={loading} className="w-full bg-[#281815] text-white font-bold uppercase tracking-[0.2em] py-4 hover:bg-[#a16207] transition-colors flex items-center justify-center disabled:opacity-70">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <>Sign In <ArrowRight size={16} className="ml-3" /></>}
            </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
