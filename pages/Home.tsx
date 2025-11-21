import React from 'react';
import { ArrowRight, Layers, Globe, Hammer } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <>
      {/* Hero Section */}
      <section className="relative h-screen w-full overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat scale-105 animate-slow-pan"
          style={{ 
            backgroundImage: 'url("https://images.unsplash.com/photo-1543456973-1e958c89c018?q=80&w=2574&auto=format&fit=crop")', 
          }}
        >
          {/* Sepia/Warm Dark overlay for wood theme */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#281815]/70 via-[#281815]/40 to-[#281815]/70"></div>
        </div>

        <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-6">
          
          {/* Brand Name Centered */}
          <div className="relative mb-8 animate-fade-in-up">
             <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl text-white font-bold tracking-tight leading-none drop-shadow-lg flex items-baseline justify-center">
               PENG ZHAN
               {/* Champagne Gold Accent */}
               <span className="text-[#d4b996] text-6xl md:text-8xl lg:text-9xl leading-none ml-2">.</span>
             </h1>
             <p className="text-[#d4b996] uppercase tracking-[0.5em] text-xs md:text-sm font-bold mt-4 md:mt-6 text-center shadow-sm">
               Furniture Manufacturing
             </p>
          </div>
          
          <div className="h-px w-24 bg-[#d4b996]/60 my-8 animate-fade-in-up delay-100"></div>

          <h2 className="text-[#E6DDD5] text-lg md:text-2xl font-serif italic max-w-3xl mb-12 font-light animate-fade-in-up delay-200 drop-shadow-md">
            "Bridging California Design with Precision Manufacturing."
          </h2>

          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6 animate-fade-in-up delay-300">
            <Link 
              to="/collections" 
              className="group bg-[#F5F0EB] text-stone-900 px-10 py-4 tracking-widest uppercase text-xs font-bold flex items-center justify-center hover:bg-white transition-colors shadow-lg"
            >
              View Wood Library <ArrowRight size={16} className="ml-3 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to="/capacity" 
              className="group border border-[#F5F0EB] text-[#F5F0EB] px-10 py-4 tracking-widest uppercase text-xs font-bold flex items-center justify-center hover:bg-[#F5F0EB] hover:text-stone-900 transition-colors shadow-lg"
            >
              Factory Profile
            </Link>
          </div>
        </div>
      </section>

      {/* Intro / Positioning - Warm Oatmeal Bg */}
      <section className="py-32 bg-stone-100">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
            <div>
              <h3 className="text-[#a16207] font-bold tracking-[0.2em] uppercase text-xs mb-6">Factory Strength</h3>
              <h2 className="font-serif text-4xl md:text-5xl text-stone-900 mb-10 leading-tight">
                Engineered for <br/>High-End Retail.
              </h2>
              <p className="text-stone-700 mb-6 leading-relaxed text-lg font-light">
                Peng Zhan is not just a factory; we are a specialized solid wood studio operating at an industrial scale. We bridge the gap between the boutique quality required by leading US brands and the volume capabilities of Asian manufacturing.
              </p>
              <p className="text-stone-700 mb-12 leading-relaxed text-lg font-light">
                From our signature Butcher Block surfaces to intricate mortise-and-tenon joinery, our output is defined by warmth, depth, and precision.
              </p>
              
              <div className="flex items-center space-x-8 mb-8">
                 <div className="text-center">
                    <span className="block text-3xl font-serif text-stone-900">2</span>
                    <span className="text-[10px] uppercase tracking-widest text-stone-500">Factories (CN + KH)</span>
                 </div>
                 <div className="w-px h-12 bg-stone-300"></div>
                 <div className="text-center">
                    <span className="block text-3xl font-serif text-stone-900">10+</span>
                    <span className="text-[10px] uppercase tracking-widest text-stone-500">Years Exp.</span>
                 </div>
                 <div className="w-px h-12 bg-stone-300"></div>
                 <div className="text-center">
                    <span className="block text-3xl font-serif text-stone-900">30+</span>
                    <span className="text-[10px] uppercase tracking-widest text-stone-500">US Partners</span>
                 </div>
              </div>
            </div>
            <div className="relative h-[500px] w-full group">
               <div className="absolute inset-0 bg-[#a16207] transform translate-x-4 translate-y-4 opacity-20 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform"></div>
               <img 
                 src="https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=1000&auto=format&fit=crop" 
                 alt="Factory Detail" 
                 className="w-full h-full object-cover relative z-10 shadow-xl"
               />
            </div>
          </div>
        </div>
      </section>

      {/* Core Competencies Grid */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-6 md:px-12">
          <div className="text-center mb-20">
            <h2 className="font-serif text-4xl text-stone-900 mb-4">Core Competencies</h2>
            <div className="w-16 h-1 bg-[#a16207] mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
             <div className="group text-center">
                <div className="w-20 h-20 mx-auto bg-stone-100 rounded-full flex items-center justify-center mb-8 group-hover:bg-[#a16207] transition-colors duration-500">
                  <Layers size={32} className="text-[#a16207] group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-serif text-2xl text-stone-900 mb-4">Material Mastery</h3>
                <p className="text-stone-600 font-light leading-relaxed">
                  Specializing in North American hardwoods (Walnut, White Oak, Maple) with full chain-of-custody and moisture control.
                </p>
             </div>

             <div className="group text-center">
                <div className="w-20 h-20 mx-auto bg-stone-100 rounded-full flex items-center justify-center mb-8 group-hover:bg-[#a16207] transition-colors duration-500">
                  <Globe size={32} className="text-[#a16207] group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-serif text-2xl text-stone-900 mb-4">Dual-Shore Supply</h3>
                <p className="text-stone-600 font-light leading-relaxed">
                  Seamlessly switching production between China and Cambodia to optimize for tariffs, lead times, and capacity.
                </p>
             </div>

             <div className="group text-center">
                <div className="w-20 h-20 mx-auto bg-stone-100 rounded-full flex items-center justify-center mb-8 group-hover:bg-[#a16207] transition-colors duration-500">
                  <Hammer size={32} className="text-[#a16207] group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-serif text-2xl text-stone-900 mb-4">Advanced Joinery</h3>
                <p className="text-stone-600 font-light leading-relaxed">
                  Combining 5-axis CNC precision with traditional joinery techniques to create furniture that is both structurally sound and beautiful.
                </p>
             </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;