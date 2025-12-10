
import React, { useState } from 'react';
import { Settings, Cpu, Layers, CheckCircle2, Hammer, Package, ArrowRight, Cog, Ruler } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Manufacturing: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'process' | 'machinery' | 'qc'>('process');

  const processes = [
    { title: "Lumber Selection & KD", icon: <Layers size={24} />, desc: "Incoming inspection of FAS grade lumber. Kiln drying to 8-10% moisture content to ensure stability." },
    { title: "Panel Jointing & Gluing", icon: <Hammer size={24} />, desc: "Color matching and RF (Radio Frequency) gluing for high-strength butcher block and panel construction." },
    { title: "CNC Machining", icon: <Cpu size={24} />, desc: "5-Axis routers execute complex joinery and shaping with 0.1mm tolerance precision." },
    { title: "Sanding & Finishing", icon: <Layers size={24} />, desc: "Automated wide-belt sanding followed by hand-touchups. Cefla flat-lines apply consistent coating." },
    { title: "Assembly", icon: <Settings size={24} />, desc: "Traditional joinery assembly reinforced with modern adhesives and hardware." },
    { title: "Packaging & QC", icon: <Package size={24} />, desc: "Final 100% inspection. ISTA-3A compliant packaging for drop-ship capability." },
  ];

  const machinery = [
    { name: "Homag 5-Axis CNC", type: "Router", desc: "Complex 3D shaping" },
    { name: "Cefla Flat-line", type: "Finishing", desc: "Automated spray & UV cure" },
    { name: "Weinig Moulders", type: "Milling", desc: "High-speed profile moulding" },
    { name: "Timesavers Sanders", type: "Sanding", desc: "Precision calibration sanding" },
    { name: "RF Press", type: "Gluing", desc: "Radio frequency panel bonding" },
    { name: "Dust Collection", type: "Facility", desc: "Centralized eco-system" }
  ];

  return (
    <div className="bg-zinc-50 min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-6 md:px-12">
        
        {/* Header */}
        <div className="mb-16">
          <h2 className="text-bronze-accent font-bold tracking-[0.2em] uppercase text-xs mb-4">
            {t.manufacturing.subtitle}
          </h2>
          <h1 className="font-serif text-5xl md:text-6xl text-zinc-900 mb-8 max-w-4xl">
            {t.manufacturing.title}
          </h1>
          <p className="text-zinc-600 text-xl font-light leading-relaxed max-w-3xl border-l-2 border-bronze-accent pl-6">
            {t.manufacturing.intro}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-200 mb-16 overflow-x-auto">
           {['process', 'machinery', 'qc'].map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab as any)}
               className={`px-8 py-4 text-sm font-bold uppercase tracking-widest transition-colors border-b-2 whitespace-nowrap
                 ${activeTab === tab ? 'border-bronze-accent text-bronze-accent' : 'border-transparent text-zinc-400 hover:text-zinc-600'}
               `}
             >
                {tab === 'process' && "Production Process"}
                {tab === 'machinery' && "Machinery & Tech"}
                {tab === 'qc' && "Quality Control"}
             </button>
           ))}
        </div>

        {/* CONTENT: Process */}
        {activeTab === 'process' && (
          <div className="animate-fade-in">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {processes.map((proc, idx) => (
                  <div key={idx} className="bg-white p-8 border border-zinc-100 shadow-sm hover:shadow-lg transition-shadow relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-10 font-serif text-6xl text-zinc-300 select-none group-hover:scale-110 transition-transform">
                        {idx + 1}
                     </div>
                     <div className="text-bronze-accent mb-6 group-hover:scale-110 transition-transform origin-left">
                        {proc.icon}
                     </div>
                     <h3 className="font-serif text-xl text-zinc-900 mb-4 relative z-10">{proc.title}</h3>
                     <p className="text-zinc-500 text-sm leading-relaxed relative z-10">
                        {proc.desc}
                     </p>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* CONTENT: Machinery */}
        {activeTab === 'machinery' && (
          <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-12">
             <div className="bg-zinc-900 text-white p-12 flex flex-col justify-center">
                <h3 className="font-serif text-3xl mb-6">World-Class Equipment</h3>
                <p className="text-zinc-400 mb-8 leading-relaxed">
                   We invest in the best German and Italian machinery to ensure consistency. Our automated lines reduce human error for volume production, while our 5-axis routers allow for intricate design realization.
                </p>
                <ul className="space-y-4">
                   <li className="flex items-center text-sm"><Cog className="text-bronze-accent mr-3" size={16}/> High-Precision Routing</li>
                   <li className="flex items-center text-sm"><Cog className="text-bronze-accent mr-3" size={16}/> Automated Finishing</li>
                   <li className="flex items-center text-sm"><Cog className="text-bronze-accent mr-3" size={16}/> Climate Controlled Facility</li>
                </ul>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {machinery.map((m, idx) => (
                   <div key={idx} className="bg-white border border-zinc-200 p-6 hover:border-bronze-accent transition-colors">
                      <div className="text-[10px] font-bold uppercase text-zinc-400 mb-1">{m.type}</div>
                      <h4 className="text-zinc-900 font-bold mb-2">{m.name}</h4>
                      <p className="text-zinc-500 text-xs">{m.desc}</p>
                   </div>
                ))}
             </div>
          </div>
        )}

        {/* CONTENT: QC */}
        {activeTab === 'qc' && (
          <div className="animate-fade-in">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div>
                   <h3 className="font-serif text-3xl text-zinc-900 mb-6">Rigorous Standards</h3>
                   <p className="text-zinc-600 mb-8 leading-relaxed">
                      Quality is not an afterthought; it is embedded in every step. We follow strict AQL standards and U.S. compliance regulations.
                   </p>
                   
                   <div className="space-y-6">
                      <div className="flex">
                         <div className="flex-shrink-0 mt-1"><CheckCircle2 className="text-bronze-accent" size={20} /></div>
                         <div className="ml-4">
                            <h4 className="font-bold text-zinc-900 text-sm uppercase tracking-wide">Incoming QC (IQC)</h4>
                            <p className="text-zinc-500 text-sm mt-1">Lumber grading, moisture content checks (8-12%), and hardware validation.</p>
                         </div>
                      </div>
                      <div className="flex">
                         <div className="flex-shrink-0 mt-1"><Ruler className="text-bronze-accent" size={20} /></div>
                         <div className="ml-4">
                            <h4 className="font-bold text-zinc-900 text-sm uppercase tracking-wide">In-Process QC (IPQC)</h4>
                            <p className="text-zinc-500 text-sm mt-1">First-article inspection, dimensional checks at CNC, and sanding quality review.</p>
                         </div>
                      </div>
                      <div className="flex">
                         <div className="flex-shrink-0 mt-1"><Package className="text-bronze-accent" size={20} /></div>
                         <div className="ml-4">
                            <h4 className="font-bold text-zinc-900 text-sm uppercase tracking-wide">Final QC (FQC)</h4>
                            <p className="text-zinc-500 text-sm mt-1">Pre-shipment inspection based on AQL 2.5/4.0. Assembly testing and carton drop tests.</p>
                         </div>
                      </div>
                   </div>
                </div>
                <div className="bg-zinc-100 h-[500px] relative overflow-hidden">
                   <img 
                     src="https://images.unsplash.com/photo-1581093458791-9f302e683800?q=80&w=2069&auto=format&fit=crop" 
                     className="w-full h-full object-cover" 
                     alt="QC Lab"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent flex items-end p-8">
                      <div className="text-white">
                         <p className="font-bold uppercase tracking-widest text-xs mb-2">Compliance</p>
                         <p className="font-serif text-2xl">CARB P2 • TSCA Title VI • FSC Available</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Manufacturing;
