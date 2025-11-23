import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const TheStudio: React.FC = () => {
  return (
    <div className="bg-stone-50 min-h-screen">
       {/* Header */}
       <div className="pt-40 pb-20 container mx-auto px-6 md:px-12 text-center">
         <h1 className="font-serif text-5xl md:text-6xl text-stone-900 mb-6">The Studio</h1>
         <p className="text-stone-500 text-xl font-light tracking-wide">Where Engineering Meets Artistry</p>
       </div>

       {/* Section 1 */}
       <div className="grid grid-cols-1 lg:grid-cols-2">
         <div className="h-[500px] lg:h-[700px]">
            <img 
              src="https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/design.jpg?raw=true" 
              alt="Workshop Design" 
              className="w-full h-full object-cover"
            />
         </div>
         <div className="flex flex-col justify-center p-12 lg:p-24 bg-white">
            <h2 className="text-amber-700 text-xs font-bold uppercase tracking-widest mb-4">Design & R&D</h2>
            <h3 className="font-serif text-3xl text-stone-900 mb-6">Original Design Capability</h3>
            <p className="text-stone-600 leading-relaxed mb-6">
              Peng Zhan is distinguished by a high degree of automation paired with a robust self-research and design capability. We maintain stable cooperation with American design teams, ensuring that every curve, joint, and finish meets the sophisticated demands of the western market.
            </p>
            <p className="text-stone-600 leading-relaxed">
              Our process bridges the gap between conceptual sketches and mass production, optimizing for cost without sacrificing the integrity of the design.
            </p>
         </div>
       </div>

       {/* Section 2 */}
       <div className="grid grid-cols-1 lg:grid-cols-2">
         <div className="flex flex-col justify-center p-12 lg:p-24 bg-stone-100 order-2 lg:order-1">
            <h2 className="text-amber-700 text-xs font-bold uppercase tracking-widest mb-4">Engineering</h2>
            <h3 className="font-serif text-3xl text-stone-900 mb-6">Material Expertise</h3>
            <p className="text-stone-600 leading-relaxed mb-6">
              We excel in complex material integration. From our signature Butcher Block solid wood surfaces to mixed-material pieces combining powder-coated metals and natural timber. 
            </p>
            <ul className="space-y-3 text-stone-600">
              <li className="flex items-center"><span className="w-2 h-2 bg-amber-700 rounded-full mr-3"></span>Pure Solid Wood Fabrication</li>
              <li className="flex items-center"><span className="w-2 h-2 bg-amber-700 rounded-full mr-3"></span>Precision CNC Machining</li>
              <li className="flex items-center"><span className="w-2 h-2 bg-amber-700 rounded-full mr-3"></span>Advanced Finishing Techniques</li>
            </ul>
         </div>
         <div className="h-[500px] lg:h-[700px] order-1 lg:order-2">
            <img 
              src="https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?q=80&w=1000&auto=format&fit=crop" 
              alt="Wood Detail" 
              className="w-full h-full object-cover"
            />
         </div>
       </div>

       {/* Section 3 - Material Focus */}
       <div className="py-24 bg-white">
         <div className="container mx-auto px-6 md:px-12 text-center">
            <h2 className="text-amber-700 text-xs font-bold uppercase tracking-widest mb-4">Raw Materials</h2>
            <h3 className="font-serif text-3xl md:text-4xl text-stone-900 mb-8">Sourcing the World's Best Timber</h3>
            <p className="text-stone-600 max-w-2xl mx-auto mb-16 leading-relaxed font-light">
              Our studio works exclusively with premium hardwoods sourced from sustainable forests in North America and Europe. 
              Understanding the distinct properties of each species—from the tannin content of White Oak to the density of Hard Maple—is crucial to our engineering process.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
               {/* Walnut Card */}
               <div className="bg-stone-50 p-8 shadow-sm border-t-4 border-[#5D4037] hover:shadow-md transition-shadow text-left group">
                  <h4 className="font-serif text-xl text-stone-900 mb-2 group-hover:text-[#5D4037] transition-colors">Black Walnut</h4>
                  <p className="text-stone-500 text-sm leading-relaxed">Prized for its rich, dark color and stability. The gold standard for luxury furniture.</p>
               </div>
               {/* White Oak Card */}
               <div className="bg-stone-50 p-8 shadow-sm border-t-4 border-[#C2B280] hover:shadow-md transition-shadow text-left group">
                  <h4 className="font-serif text-xl text-stone-900 mb-2 group-hover:text-[#C2B280] transition-colors">White Oak</h4>
                  <p className="text-stone-500 text-sm leading-relaxed">Dense and rot-resistant with a distinct grain pattern. Ideal for modern aesthetics.</p>
               </div>
               {/* Hard Maple Card */}
               <div className="bg-stone-50 p-8 shadow-sm border-t-4 border-[#E6D7B9] hover:shadow-md transition-shadow text-left group">
                  <h4 className="font-serif text-xl text-stone-900 mb-2 group-hover:text-[#E6D7B9] transition-colors">Hard Maple</h4>
                  <p className="text-stone-500 text-sm leading-relaxed">Extremely durable with a fine, consistent texture. Perfect for butcher block surfaces.</p>
               </div>
            </div>

            <Link 
              to="/materials" 
              className="inline-flex items-center border-b border-stone-900 pb-1 text-stone-900 uppercase tracking-widest text-xs font-bold hover:text-amber-700 hover:border-amber-700 transition-colors"
            >
              Explore Material Library <ArrowRight size={14} className="ml-2" />
            </Link>
         </div>
       </div>
    </div>
  );
};

export default TheStudio;
