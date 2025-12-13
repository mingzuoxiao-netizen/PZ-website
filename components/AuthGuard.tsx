
import React, { useState, useEffect } from 'react';
import { ArrowRight, KeyRound, Hammer, Ruler, Axe } from 'lucide-react';
import { ASSET_KEYS } from '../utils/assets';
import { useAssets } from '../contexts/AssetContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

// CONFIGURATION
const PASSWORD = "PZ2025."; 
const SESSION_KEY = "pz_auth_token";

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  // --- STATE MANAGEMENT ---
  // We no longer conditionally render 'children'. They are always rendered behind the scenes.
  // We only control the visibility of the Lock Screen Overlay.
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLockScreen, setShowLockScreen] = useState(true);

  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  
  // Animation Stages: 
  // idle -> verifying -> tension -> blast -> opening -> done
  const [animStage, setAnimStage] = useState<'idle' | 'verifying' | 'tension' | 'blast' | 'opening' | 'done'>('idle');
  
  const assets = useAssets();
  // Preload Hero Image explicitly to ensure it's in browser cache
  const heroImage = assets[ASSET_KEYS.HOME_HERO_BG];

  useEffect(() => {
    // Check previous session
    try {
      const isAuth = sessionStorage.getItem(SESSION_KEY);
      if (isAuth === 'true') {
        setIsAuthenticated(true);
        setShowLockScreen(false); // Immediate unlock if previously logged in
        setAnimStage('done');
      }
    } catch (e) {
      console.warn("Session storage access denied");
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === PASSWORD) {
      // 1. Verifying: Lock spins
      setAnimStage('verifying');
      
      try { sessionStorage.setItem(SESSION_KEY, 'true'); } catch (e) {}
      // We set authenticated true here to allow any interaction logic to prep,
      // but the overlay is still covering everything.
      setIsAuthenticated(true);

      // 2. Tension: Mechanical Clunk
      setTimeout(() => {
          setAnimStage('tension');
      }, 800);

      // 3. Blast: Light explosion
      setTimeout(() => {
          setAnimStage('blast');
      }, 1400);

      // 4. Opening: Doors slide
      // Since the app is ALREADY mounted behind, this reveal will be instant.
      setTimeout(() => {
          setAnimStage('opening');
      }, 1500);

      // 5. Cleanup: Remove lock screen from DOM entirely to free up resources
      setTimeout(() => {
          setAnimStage('done');
          setShowLockScreen(false); 
      }, 3200);

    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <>
      <style>{`
        .wood-panel {
            background-color: #1a120b; 
            background-image: 
                url("https://www.transparenttextures.com/patterns/wood-pattern.png"),
                linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.6));
            background-blend-mode: overlay, multiply;
            box-shadow: inset 0 0 150px rgba(0,0,0,0.9);
        }
        
        .noise-overlay {
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
            opacity: 0.4;
            pointer-events: none;
        }
      `}</style>

      {/* 
          1. PRELOADER 
          Force browser to download Hero Image immediately on page load, 
          so it's ready in cache when the doors open.
      */}
      {heroImage && (
          <img src={heroImage} alt="" style={{display: 'none'}} />
      )}

      {/* 
          2. THE APP LAYER (Z-INDEX 0)
          CRITICAL CHANGE: This is now ALWAYS rendered.
          It sits behind the lock screen.
          We add a subtle scale/blur effect that transitions to normal when unlocked.
      */}
      <div 
        className={`
            relative z-0 min-h-screen bg-stone-900 transition-all duration-[2000ms] ease-out
            ${animStage === 'done' || animStage === 'opening' 
                ? 'scale-100 blur-0 brightness-100' 
                : 'scale-[0.98] blur-[2px] brightness-50 overflow-hidden h-screen'}
        `}
      >
        {children}
      </div>

      {/* 
          3. THE LOCK SCREEN LAYER (Z-INDEX 9999)
          This covers the App. We only unmount it (showLockScreen) after animation is fully done.
      */}
      {showLockScreen && (
        <div className="fixed inset-0 z-[9999] overflow-hidden flex items-center justify-center bg-transparent perspective-[1200px]">
            
            {/* BACKGROUND BLACKOUT (Prevents peeking edges during scale effect) */}
            <div className={`absolute inset-0 bg-black transition-opacity duration-1000 ${animStage === 'opening' ? 'opacity-0' : 'opacity-100'}`}></div>

            {/* LEFT DOOR */}
            <div 
                className={`
                    absolute top-0 left-0 w-[51%] h-full wood-panel z-30 border-r border-[#0f0a06]
                    will-change-transform
                    transition-transform duration-[1400ms] cubic-bezier(0.25, 1, 0.5, 1)
                    ${animStage === 'opening' ? '-translate-x-[102%]' : 'translate-x-0'}
                    ${animStage === 'tension' ? 'translate-x-[4px]' : ''}
                `}
            >
                <div className="absolute inset-0 noise-overlay"></div>
                {/* Hardware */}
                <div className="absolute right-8 top-1/2 -translate-y-1/2 w-3 h-48 bg-gradient-to-b from-[#2a2a2a] via-[#4a4a4a] to-[#2a2a2a] rounded-full shadow-[2px_2px_10px_black] opacity-80 border-l border-white/10"></div>
            </div>

            {/* RIGHT DOOR */}
            <div 
                className={`
                    absolute top-0 right-0 w-[51%] h-full wood-panel z-30 border-l border-[#0f0a06]
                    will-change-transform
                    transition-transform duration-[1400ms] cubic-bezier(0.25, 1, 0.5, 1)
                    ${animStage === 'opening' ? 'translate-x-[102%]' : 'translate-x-0'}
                    ${animStage === 'tension' ? '-translate-x-[4px]' : ''}
                `}
            >
                <div className="absolute inset-0 noise-overlay"></div>
                {/* Hardware */}
                <div className="absolute left-8 top-1/2 -translate-y-1/2 w-3 h-48 bg-gradient-to-b from-[#2a2a2a] via-[#4a4a4a] to-[#2a2a2a] rounded-full shadow-[-2px_2px_10px_black] opacity-80 border-r border-white/10"></div>
            </div>

            {/* LIGHT BLOOM (Hides the seam during opening) */}
            <div 
                className={`
                    absolute inset-0 z-20 bg-white pointer-events-none mix-blend-overlay
                    transition-opacity duration-[800ms] ease-out
                    ${animStage === 'blast' ? 'opacity-40' : 'opacity-0'}
                `}
            ></div>
            
            {/* GOD RAY (The burst) */}
            <div className={`
                absolute top-0 bottom-0 left-1/2 w-[4px] -translate-x-1/2 z-10 bg-amber-500 blur-[20px] pointer-events-none
                transition-all duration-300
                ${animStage === 'tension' ? 'opacity-50 scale-x-[10]' : 'opacity-0'}
                ${animStage === 'blast' ? '!opacity-100 !scale-x-[50] !blur-[40px]' : ''}
                ${animStage === 'opening' ? '!opacity-0 scale-x-[100]' : ''}
            `}></div>

            {/* LOGIN FORM */}
            <div 
                className={`
                    relative z-50 w-full max-w-sm
                    transition-all duration-500 ease-in-out
                    ${animStage === 'opening' || animStage === 'blast' ? 'opacity-0 scale-110 translate-y-4 blur-sm' : 'opacity-100 scale-100'}
                    ${animStage === 'tension' ? 'scale-95 brightness-50' : ''}
                `}
            >
                <div className="bg-[#1c1917]/90 backdrop-blur-md border border-[#44403c] p-10 shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
                    <div className="text-center mb-10">
                         <div className={`
                            w-16 h-16 mx-auto bg-[#292524] rounded-full border border-[#57534e] flex items-center justify-center mb-6 text-stone-300 shadow-inner
                            transition-all duration-500
                            ${animStage === 'verifying' ? 'border-amber-600 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : ''}
                         `}>
                             <KeyRound size={28} className={`transition-transform duration-700 ${animStage === 'verifying' ? 'rotate-180' : ''}`} />
                         </div>
                         <h1 className="font-serif text-2xl text-[#e7e5e4] tracking-tight mb-2">PZ</h1>
                         <p className="text-[#a8a29e] text-[10px] uppercase tracking-[0.3em]">Restricted Access</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="relative group">
                            <input
                                type="password"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="ENTER CODE"
                                className={`
                                    w-full bg-[#0c0a09] border-l-2 text-center text-lg text-[#d6d3d1] font-serif py-4
                                    focus:outline-none focus:bg-black transition-all placeholder-[#292524] tracking-widest
                                    ${error ? 'border-red-500 text-red-500' : 'border-[#57534e] focus:border-amber-700'}
                                `}
                                autoFocus
                                disabled={animStage !== 'idle'}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={animStage !== 'idle'}
                            className={`
                                w-full py-4 text-[10px] font-bold uppercase tracking-[0.25em] transition-all duration-300
                                flex items-center justify-center
                                ${animStage === 'idle' 
                                    ? 'bg-[#292524] text-[#a8a29e] hover:bg-[#3E2723] hover:text-white' 
                                    : 'bg-amber-800 text-white cursor-wait'}
                            `}
                        >
                            {animStage === 'idle' ? (
                                <>Unlock Studio <ArrowRight size={12} className="ml-2 opacity-50" /></>
                            ) : (
                                <span className="animate-pulse">Authorizing...</span>
                            )}
                        </button>
                    </form>
                    
                    <div className="mt-8 pt-8 border-t border-[#292524] flex justify-between text-[#44403c]">
                         <Hammer size={14} />
                         <Ruler size={14} />
                         <Axe size={14} />
                    </div>
                </div>
            </div>

        </div>
      )}
    </>
  );
};

export default AuthGuard;
