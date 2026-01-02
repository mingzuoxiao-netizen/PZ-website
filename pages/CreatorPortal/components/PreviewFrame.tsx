
import React, { useState } from 'react';
import { Eye, AlertTriangle, Monitor, Smartphone, Layout, ChevronLeft, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePublishedSiteConfig } from '../../../contexts/SiteConfigContext';

// Import public pages for frame-based preview
import Home from '../../Home';
import About from '../../About';
import Manufacturing from '../../Manufacturing';
import GlobalCapacity from '../../GlobalCapacity';
import Materials from '../../Materials';
import Portfolio from '../../Portfolio';

type PreviewPage = 'home' | 'about' | 'manufacturing' | 'capacity' | 'materials' | 'portfolio';

const PreviewFrame: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<PreviewPage>('home');
    const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
    const { loading, error } = usePublishedSiteConfig();

    const renderPage = () => {
        switch (currentPage) {
            case 'home': return <Home />;
            case 'about': return <About />;
            case 'manufacturing': return <Manufacturing />;
            case 'capacity': return <GlobalCapacity />;
            case 'materials': return <Materials />;
            case 'portfolio': return <Portfolio />;
            default: return <Home />;
        }
    };

    if (error) {
        return (
            <div className="h-screen bg-stone-100 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                    <AlertTriangle size={40} />
                </div>
                <h1 className="font-serif text-3xl text-stone-900 mb-2">Preview Unavailable</h1>
                <p className="text-stone-500 max-w-md mb-8">
                    The preview snapshot could not be loaded. This typically means there is no active draft or the configuration service is temporarily unavailable.
                </p>
                <Link to="/creator/admin" className="px-8 py-3 bg-stone-900 text-white font-bold uppercase tracking-widest text-xs hover:bg-amber-700 transition-colors">
                    Back to Admin
                </Link>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-stone-100 overflow-hidden">
            {/* 1. Global Safety Warning Bar */}
            <div className="bg-amber-600 text-white px-6 py-2 flex items-center justify-between shadow-lg relative z-[100]">
                <div className="flex items-center gap-3">
                    <AlertTriangle size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Preview Mode &bull; Not Live &bull; Changes are not published</span>
                </div>
                <div className="hidden md:flex items-center gap-4 text-[10px] font-bold uppercase">
                    <span className="opacity-60">Source: GET /admin/preview/site-config</span>
                </div>
            </div>

            {/* 2. Admin Preview Controls */}
            <div className="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between shadow-sm relative z-50">
                <div className="flex items-center gap-6">
                    <Link to="/creator/admin" className="text-stone-400 hover:text-stone-900 flex items-center transition-colors">
                        <ChevronLeft size={20} className="mr-1"/>
                        <span className="text-xs font-bold uppercase tracking-widest">Exit Preview</span>
                    </Link>
                    <div className="h-8 w-px bg-stone-200"></div>
                    <nav className="flex gap-4">
                        {(['home', 'about', 'manufacturing', 'capacity', 'materials', 'portfolio'] as PreviewPage[]).map(page => (
                            <button 
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm transition-all
                                    ${currentPage === page ? 'bg-stone-900 text-white' : 'text-stone-400 hover:bg-stone-50 hover:text-stone-600'}
                                `}
                            >
                                {page}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex border border-stone-200 rounded-sm overflow-hidden">
                        <button 
                            onClick={() => setViewMode('desktop')}
                            className={`p-2 transition-colors ${viewMode === 'desktop' ? 'bg-stone-100 text-stone-900' : 'text-stone-400 hover:bg-stone-50'}`}
                            title="Desktop View"
                        >
                            <Monitor size={18} />
                        </button>
                        <button 
                            onClick={() => setViewMode('mobile')}
                            className={`p-2 transition-colors ${viewMode === 'mobile' ? 'bg-stone-100 text-stone-900' : 'text-stone-400 hover:bg-stone-50'}`}
                            title="Mobile View"
                        >
                            <Smartphone size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* 3. The Preview Surface */}
            <div className="flex-grow overflow-auto bg-stone-200 p-4 md:p-12 flex justify-center">
                <div 
                    className={`bg-white shadow-2xl transition-all duration-500 overflow-auto h-full
                        ${viewMode === 'mobile' ? 'w-[375px] max-h-[812px] border-[12px] border-stone-900 rounded-[3rem]' : 'w-full'}
                    `}
                >
                    {loading ? (
                        <div className="h-full w-full flex flex-col items-center justify-center text-stone-400">
                            <Layout className="animate-pulse mb-4" size={48} />
                            <p className="text-xs font-bold uppercase tracking-widest">Building Preview Snapshot...</p>
                        </div>
                    ) : (
                        <div className="relative pointer-events-none select-none">
                            {/* Force internal scroll for preview content */}
                            {renderPage()}
                        </div>
                    )}
                </div>
            </div>

            {/* 4. Help / Info Bar */}
            <div className="bg-stone-900 text-stone-500 px-6 py-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                <div className="flex items-center gap-2">
                    <Info size={14} className="text-amber-500" />
                    <span>This view uses current Draft data. Interactive elements are disabled for safety.</span>
                </div>
                <div>Peng-Zhan Studio v1.0.0-PREVIEW</div>
            </div>
        </div>
    );
};

export default PreviewFrame;
