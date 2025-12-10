import React, { useState, useEffect } from 'react';
import { ArrowRight, Lock } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

// CONFIGURATION
const PASSWORD = "PZ2025"; // Change this to your desired password
const SESSION_KEY = "pz_auth_token";

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      // Check session storage on mount
      const isAuth = sessionStorage.getItem(SESSION_KEY);
      if (isAuth === 'true') {
        setIsAuthenticated(true);
      }
    } catch (e) {
      console.warn("Session storage access denied");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === PASSWORD) {
      try {
        sessionStorage.setItem(SESSION_KEY, 'true');
      } catch (e) {
        console.warn("Could not save session");
      }
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      // Shake effect or visual feedback could go here
      setTimeout(() => setError(false), 2000);
    }
  };

  if (loading) return null; // Prevent flash of content

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-[#281815] flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
        {/* Background Texture/Gradient */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1543456973-1e958c89c018?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-[#281815]/90"></div>

        <div className="relative z-10 max-w-md w-full animate-fade-in-up">
          {/* Logo */}
          <div className="mb-12">
            <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight leading-none flex items-baseline justify-center text-white">
                PZ
                <span className="text-[#d4b996] text-4xl md:text-5xl leading-none ml-1">.</span>
            </h1>
            <p className="text-[#8D6E63] text-xs uppercase tracking-[0.4em] mt-4">Private Portfolio</p>
          </div>

          {/* Login Form */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 md:p-12 rounded-sm shadow-2xl">
            <div className="flex justify-center mb-6">
                <div className="w-12 h-12 rounded-full bg-[#d4b996]/10 flex items-center justify-center text-[#d4b996]">
                    <Lock size={20} />
                </div>
            </div>
            
            <h2 className="text-[#E6DDD5] font-serif text-xl mb-6">Enter Passcode</h2>
            
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="relative">
                <input
                  type="password"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Password"
                  className={`w-full bg-black/20 border ${error ? 'border-red-500' : 'border-white/20'} text-[#E6DDD5] px-4 py-3 text-center focus:outline-none focus:border-[#d4b996] transition-colors placeholder-white/20`}
                  autoFocus
                />
              </div>
              
              {error && (
                <p className="text-red-400 text-xs uppercase tracking-widest animate-pulse">Incorrect Password</p>
              )}

              <button
                type="submit"
                className="w-full bg-[#d4b996] text-[#281815] font-bold uppercase tracking-widest py-3 hover:bg-white transition-colors flex items-center justify-center"
              >
                Enter Site <ArrowRight size={16} className="ml-2" />
              </button>
            </form>
          </div>
          
          <p className="mt-8 text-[#8D6E63] text-xs">
             &copy; {new Date().getFullYear()} PZ Furniture Studio.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;