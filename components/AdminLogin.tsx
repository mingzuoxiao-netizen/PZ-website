
import React, { useState } from "react";
import { ShieldCheck, ArrowRight, Lock, Loader2 } from "lucide-react";
import { ADMIN_SESSION_KEY, ADMIN_API_BASE } from "../utils/adminFetch";

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    try {
      // Submit password to backend for verification
      const response = await fetch(`${ADMIN_API_BASE}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: input }),
      });

      if (!response.ok) {
        throw new Error("Authentication failed");
      }

      const data = await response.json();

      if (data.token) {
        // Store the token received from the backend
        sessionStorage.setItem(ADMIN_SESSION_KEY, data.token);
        onLoginSuccess();
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(true);
      // Reset error state after animation
      setTimeout(() => setError(false), 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-stone-50 px-6">
      <div className="bg-white p-10 md:p-16 shadow-2xl border border-stone-200 max-w-md w-full text-center relative overflow-hidden">
        {/* Decorative Top Bar */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-stone-400 to-stone-600"></div>
        
        <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-8 text-stone-700">
           <ShieldCheck size={40} strokeWidth={1.5} />
        </div>
        
        <h2 className="font-serif text-3xl text-stone-900 mb-2">Admin Portal</h2>
        <p className="text-stone-500 text-sm mb-10 tracking-wide">Restricted Access. Identity Verification Required.</p>

        <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
                    <Lock size={18} />
                </div>
                <input 
                    type="password" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter Admin Password"
                    className={`w-full bg-stone-50 border ${error ? 'border-red-400' : 'border-stone-200'} pl-12 pr-4 py-4 text-stone-900 focus:outline-none focus:border-[#a16207] focus:ring-1 focus:ring-[#a16207] transition-all placeholder-stone-400 font-sans`}
                    autoFocus
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
                    Dashboard <ArrowRight size={16} className="ml-3 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
            </button>
        </form>
      </div>
      <p className="mt-8 text-stone-400 text-xs uppercase tracking-widest">Secure Connection</p>
    </div>
  );
};

export default AdminLogin;
