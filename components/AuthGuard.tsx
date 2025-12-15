
import React, { useState, useEffect } from 'react';
import { ArrowRight, KeyRound, Hammer, Ruler, Axe, Lock } from 'lucide-react';
import { ASSET_KEYS } from '../utils/assets';
import { useAssets } from '../contexts/AssetContext';

// --- CLIENT-SIDE PROTECTION CONFIG ---
const PASSWORD = "PZ2025.";
const SESSION_KEY = "pz_public_access";

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  // --- STATE MANAGEMENT ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLockScreen, setShowLockScreen] = useState(true);
  
  // Single input for Access Code
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  
  // Animation Stages: 
  // idle -> verifying -> tension -> blast -> opening -> done
  const [animStage, setAnimStage] = useState<'idle' | 'verifying' | 'tension' | 'blast' | 'opening' | 'done'>('idle');
  
  const assets = useAssets();
  // Preload Hero Image explicitly to ensure it's in browser cache
  const heroImage = assets[ASSET_KEYS.HOME_HERO_BG];

  useEffect(() => {
    // Check for the simple site-wide token in session storage
    const token = sessionStorage.getItem(SESSION_KEY);
    
    if (token === "granted") {
      setIsAuthenticated(true);
      setShowLockScreen(false); // Immediate unlock if previously logged in
      setAnimStage('done');
    }
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    
    // 1. Verifying: Lock spins (Visual Feedback)
    setAnimStage('verifying');

    // Simulate brief mechanical delay for effect
    setTimeout(() => {
        // 2. Simple Local Validation
        if (input === PASSWORD) {
            // 3. Success: Store local access flag
            sessionStorage.setItem(SESSION_KEY, "granted");
            
            // Set authenticated state (App starts rendering behind scene)
            setIsAuthenticated(true);

            // 4. Trigger Door Opening Animation Sequence
            // Tension: Mechanical Clunk
            setTimeout(() => {
                setAnimStage('tension');
            }, 500);

            // Blast: Light explosion
            setTimeout(() => {
                setAnimStage('blast');
            }, 1100);

            // Opening: Doors slide
            setTimeout(() => {
                setAnimStage('opening');
            }, 1200);

            // Cleanup: Remove lock screen from DOM
            setTimeout(() => {
                setAnimStage('done');
                setShowLockScreen(false); 
            }, 2900);
        } else {
            // Failure
            setAnimStage('idle');
            setError(true);
            setTimeout(() => setError(false), 2000);
        }
    }, 800);
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

      {/* PRELOADER */}
      {heroImage && (
          <img src={heroImage} alt="" style={{display: 'none'}} />
      )}

      {/* THE APP LAYER (Z-INDEX 0) */}
      <div 
        className={`
            relative z-0 min-h-screen bg-stone-900 
            ${animStage !== 'done' ? 'transition-all duration-[2000ms] ease-out' : ''}
            ${
              animStage === 'done' 
                ? '' 
                : animStage === 'opening' 
                  ? 'scale-100 blur-0 brightness-100' 
                  : 'scale-[0.98] blur-[2px] brightness-50 overflow-hidden h-screen'
            }
        `}
      >
        {children}
      </div>

      {/* THE LOCK SCREEN LAYER (Z-INDEX 9999) */}
      {showLockScreen && (
        <div className="fixed inset-0 z-[9999] overflow-hidden flex items-center justify-center bg-transparent perspective-[1200px]">
            
            {/* BACKGROUND BLACKOUT */}
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
                <div className="absolute left-8 top-1/2 -translate-y-1/2 w-3 h-48 bg-gradient-to-b from-[#2a2a2a] via-[#4a4a4a] to-[#2a2a2a] rounded-full shadow-[-2px_2px_10px_black] opacity-80 border-r border-white/10"></div>
            </div>

            {/* VISUAL EFFECTS */}
            <div 
                className={`
                    absolute inset-0 z-20 bg-white pointer-events-none mix-blend-overlay
                    transition-opacity duration-[800ms] ease-out
                    ${animStage === 'blast' ? 'opacity-40' : 'opacity-0'}
                `}
            ></div>
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
                    <div className="text-center mb-8">
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

                    <form onSubmit={handleUnlock} className="space-y-4">
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#57534e]">
                                <Lock size={14} />
                            </div>
                            <input
                                type="password"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="ENTER ACCESS CODE"
                                className={`
                                    w-full bg-[#0c0a09] border border-[#292524] pl-10 pr-4 py-3 text-sm text-[#d6d3d1] font-mono uppercase
                                    focus:outline-none focus:border-amber-700 transition-all placeholder-[#292524] tracking-widest
                                    ${error ? 'border-red-900 text-red-500' : ''}
                                `}
                                disabled={animStage !== 'idle'}
                                autoFocus
                            />
                        </div>

                        {error && (
                            <div className="text-red-500 text-[10px] font-bold uppercase tracking-widest text-center animate-pulse">
                                Incorrect Code
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={animStage !== 'idle'}
                            className={`
                                w-full py-4 text-[10px] font-bold uppercase tracking-[0.25em] transition-all duration-300
                                flex items-center justify-center mt-2
                                ${animStage === 'idle' 
                                    ? 'bg-[#292524] text-[#a8a29e] hover:bg-[#3E2723] hover:text-white' 
                                    : 'bg-amber-800 text-white cursor-wait'}
                            `}
                        >
                            {animStage === 'idle' ? (
                                <>Unlock Studio <ArrowRight size={12} className="ml-2 opacity-50" /></>
                            ) : (
                                <span className="animate-pulse">Verifying...</span>
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
