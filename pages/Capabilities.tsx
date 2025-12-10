
import React from 'react';
import { Armchair, BoxSelect, Briefcase, PenTool, Scale, ShieldCheck, Ruler, Table, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';

const Capabilities: React.FC = () => {
  const { t } = useLanguage();

  const productCats = [
    { name: "Accent Chairs", icon: <Armchair size={24}/>, desc: "Solid wood frames, complex joinery, upholstery." },
    { name: "Bar Stools", icon: <ArrowUpRight size={24}/>, desc: "Counter & bar height, swivel mechanisms, metal footrests." },
    { name: "Cabinets & Casegoods", icon: <BoxSelect size={24}/>, desc: "Sideboards, media consoles, soft-close hardware." },
    { name: "Dining Tops", icon: <Table size={24}/>, desc: "Solid wood, butcher block, live-edge processing." },
    { name: "Work Surfaces", icon: <Ruler size={24}/>, desc: "Office desks, adjustable height tops, workbenches." },
    { name: "Hotel Furniture", icon: <Briefcase size={24}/>, desc: "Guest room FF&E, lobby seating, high-traffic finishes." },
    { name: "Custom Projects", icon: <PenTool size={24}/>, desc: "Bespoke specifications, mixed materials (stone/metal)." },
  ];

  return (
    <div className="bg-zinc-50 min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-6 md:px-12">
        
        {/* Header */}
        <div className="text-center mb-20">
          <h2 className="text-bronze-accent font-bold tracking-[0.2em] uppercase text-xs mb-4">
            {t.capabilities.subtitle}
          </h2>
          <h1 className="font-serif text-5xl md:text-6xl text-zinc-900 mb-8">
            {t.capabilities.title}
          </h1>
          <p className="text-zinc-600 text-lg leading-relaxed max-w-3xl mx-auto font-light">
            From residential accent pieces to commercial-grade contract furniture, we have the specialized machinery and expertise to execute diverse product categories.
          </p>
        </div>

        {/* Product Categories Grid */}
        <div className="mb-24">
            <h3 className="text-zinc-900 font-bold uppercase tracking-widest text-sm mb-8 border-b border-zinc-200 pb-4">Product Categories</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {productCats.map((cat, idx) => (
                    <div key={idx} className="bg-white p-8 border border-zinc-100 text-center hover:border-bronze-accent hover:shadow-lg transition-all group flex flex-col items-center">
                        <div className="text-zinc-400 group-hover:text-bronze-accent mb-4 transition-colors">{cat.icon}</div>
                        <h4 className="font-serif text-zinc-900 mb-2 text-lg">{cat.name}</h4>
                        <p className="text-xs text-zinc-500 leading-relaxed">{cat.desc}</p>
                    </div>
                ))}
            </div>
        </div>
        
        {/* Technical Limits Section */}
        <div className="mb-24 bg-zinc-100 p-8 md:p-12 border border-zinc-200">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                <div>
                   <h3 className="font-serif text-3xl text-zinc-900">Size & Technical Limits</h3>
                   <p className="text-zinc-500 mt-2">Engineering constraints for standard production lines.</p>
                </div>
                <div className="mt-4 md:mt-0">
                   <Link to="/inquire" className="text-xs font-bold uppercase tracking-widest text-bronze-accent hover:text-zinc-900 border-b border-bronze-accent pb-1 transition-colors">
                      Request Custom Assessment
                   </Link>
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-6 shadow-sm border-l-4 border-zinc-900">
                   <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Max Dimensions</h4>
                   <ul className="space-y-2 text-sm text-zinc-900 font-mono">
                      <li className="flex justify-between border-b border-zinc-100 pb-1"><span>Length</span> <span>4000mm</span></li>
                      <li className="flex justify-between border-b border-zinc-100 pb-1"><span>Width</span> <span>1220mm</span></li>
                      <li className="flex justify-between border-b border-zinc-100 pb-1"><span>Thickness</span> <span>150mm</span></li>
                   </ul>
                </div>
                <div className="bg-white p-6 shadow-sm border-l-4 border-zinc-900">
                   <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Precision</h4>
                   <ul className="space-y-2 text-sm text-zinc-900 font-mono">
                      <li className="flex justify-between border-b border-zinc-100 pb-1"><span>CNC Tolerance</span> <span>±0.1mm</span></li>
                      <li className="flex justify-between border-b border-zinc-100 pb-1"><span>Moisture</span> <span>8-10% (KD)</span></li>
                      <li className="flex justify-between border-b border-zinc-100 pb-1"><span>Gloss Level</span> <span>5° - 90°</span></li>
                   </ul>
                </div>
                <div className="bg-white p-6 shadow-sm border-l-4 border-zinc-900">
                   <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Materials</h4>
                   <ul className="space-y-2 text-sm text-zinc-900 font-mono">
                      <li className="flex justify-between border-b border-zinc-100 pb-1"><span>Solid Wood</span> <span>Yes</span></li>
                      <li className="flex justify-between border-b border-zinc-100 pb-1"><span>Veneer</span> <span>Yes</span></li>
                      <li className="flex justify-between border-b border-zinc-100 pb-1"><span>Mixed (Metal/Stone)</span> <span>Yes</span></li>
                   </ul>
                </div>
             </div>
        </div>

        {/* OEM/ODM Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
            <div className="bg-zinc-900 text-white p-12 flex flex-col justify-center rounded-sm">
                <span className="text-bronze-accent font-bold uppercase tracking-widest text-xs mb-4">Service Model</span>
                <h3 className="font-serif text-3xl mb-6">OEM & ODM Services</h3>
                <p className="text-zinc-400 mb-8 leading-relaxed">
                    Whether you have a completed CAD drawing ready for manufacturing (OEM) or need us to develop a product from a concept sketch (ODM), our engineering team is integrated into the process.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-bold text-white mb-2 text-sm">OEM (Build to Print)</h4>
                        <p className="text-xs text-zinc-500">Exact execution of your technical drawings. Material matching and strict tolerance adherence.</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-2 text-sm">ODM (Design Support)</h4>
                        <p className="text-xs text-zinc-500">We provide structural engineering, value engineering, and prototyping to realize your vision.</p>
                    </div>
                </div>
            </div>
            
            <div className="flex flex-col justify-center">
                 <h3 className="font-serif text-3xl text-zinc-900 mb-6">Technical Compliance</h3>
                 <p className="text-zinc-600 mb-8">
                    We ensure all products meet the regulatory standards of the destination market, specifically focusing on the US and EU markets.
                 </p>
                 <ul className="space-y-4">
                    <li className="flex items-start">
                        <ShieldCheck className="text-bronze-accent mr-4 mt-1" size={20} />
                        <div>
                            <h4 className="font-bold text-zinc-900 text-sm">Chemical Safety</h4>
                            <p className="text-xs text-zinc-500">TSCA Title VI (Formaldehyde), CA Prop 65 Compliance.</p>
                        </div>
                    </li>
                    <li className="flex items-start">
                        <Scale className="text-bronze-accent mr-4 mt-1" size={20} />
                        <div>
                            <h4 className="font-bold text-zinc-900 text-sm">Sustainability</h4>
                            <p className="text-xs text-zinc-500">FSC Certified lumber available upon request. EUTR compliant sourcing.</p>
                        </div>
                    </li>
                    <li className="flex items-start">
                        <BoxSelect className="text-bronze-accent mr-4 mt-1" size={20} />
                        <div>
                            <h4 className="font-bold text-zinc-900 text-sm">Packaging</h4>
                            <p className="text-xs text-zinc-500">ISTA-3A / 6A testing for e-commerce durability.</p>
                        </div>
                    </li>
                 </ul>
            </div>
        </div>

        {/* CTA */}
        <div className="text-center border-t border-zinc-200 pt-16">
            <h2 className="font-serif text-3xl text-zinc-900 mb-6">Have a custom project?</h2>
            <Link 
              to="/inquire" 
              className="inline-block bg-bronze-600 text-white px-10 py-4 font-bold uppercase tracking-widest text-xs hover:bg-zinc-900 transition-colors"
            >
              Start Development
            </Link>
        </div>

      </div>
    </div>
  );
};

export default Capabilities;
