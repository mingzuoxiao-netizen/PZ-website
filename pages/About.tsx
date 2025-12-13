
import React, { useState } from 'react';
import { Globe, Users, Award, Warehouse, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getAsset, ASSET_KEYS } from '../utils/assets';

const About: React.FC = () => {
  const [activeImage, setActiveImage] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useLanguage();

  const galleryImages = [
    {
      url: getAsset(ASSET_KEYS.ABOUT_GALLERY_1),
      title: "Raw Lumber Selection",
      desc: "We source primarily FAS-grade hardwood lumber, focusing on consistent grain, controlled moisture content, and suitability for furniture and architectural applications."
    },
    {
      url: getAsset(ASSET_KEYS.ABOUT_GALLERY_2),
      title: "Precision Milling",
      desc: "CNC-based milling processes are used to achieve accurate joinery, smooth profiles, and repeatable part geometry prior to assembly."
    },    
    {
      url: getAsset(ASSET_KEYS.ABOUT_GALLERY_5), // Corrected to use the Automation Asset
      title: "Production Automation",
      desc: "Selective automation is applied in machining and finishing stages to improve consistency and throughput, while retaining flexibility for custom and mixed-order production."
    },
    {
      url: getAsset(ASSET_KEYS.ABOUT_GALLERY_4),
      title: "Hand Finishing",
      desc: "Manual sanding and finishing are applied where required to refine surfaces, edges, and transitions that benefit from human inspection and adjustment."
    },
    {
      url: getAsset(ASSET_KEYS.ABOUT_GALLERY_3), // Swapped key to maintain list length if needed, or stick to QC
      title: "Quality Control",
      desc: "Quality checks are integrated across key production stages, including material intake, machining, finishing, and final inspection, to support durability and visual consistency."
    }
  ];

  const nextImage = () => setActiveImage((prev) => (prev + 1) % galleryImages.length);
  const prevImage = () => setActiveImage((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);

  const openModal = (index: number) => {
    setActiveImage(index);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const milestoneYears = ['2014', '2018', '2021', '2024', '2025'];

  return (
    <div className="bg-stone-50 min-h-screen pt-32 pb-20">
      {/* Modal Gallery Overlay */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/95 backdrop-blur-sm p-4 animate-fade-in"
          onClick={closeModal}
        >
          <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors" onClick={closeModal}>
            <X size={40} />
          </button>
          
          <button 
            className="absolute left-4 md:left-8 text-white/50 hover:text-white transition-colors hidden md:block" 
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
          >
            <ChevronLeft size={48} />
          </button>
          
          <div className="max-w-6xl w-full max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
             <img 
               src={galleryImages[activeImage].url} 
               className="max-h-[75vh] max-w-full object-contain shadow-2xl" 
               alt={galleryImages[activeImage].title}
             />
             <div className="mt-6 text-center text-white max-w-2xl">
               <h3 className="text-2xl font-serif mb-2">{galleryImages[activeImage].title}</h3>
               <p className="text-stone-400 font-light">{galleryImages[activeImage].desc}</p>
             </div>
             {/* Mobile Nav Controls */}
             <div className="flex md:hidden space-x-8 mt-6">
               <button onClick={(e) => {e.stopPropagation(); prevImage();}} className="text-white"><ChevronLeft size={32} /></button>
               <button onClick={(e) => {e.stopPropagation(); nextImage();}} className="text-white"><ChevronRight size={32} /></button>
             </div>
          </div>

          <button 
            className="absolute right-4 md:right-8 text-white/50 hover:text-white transition-colors hidden md:block" 
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
          >
            <ChevronRight size={48} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="container mx-auto px-6 md:px-12 mb-20 text-center">
        <h3 className="text-amber-700 font-bold tracking-[0.2em] uppercase text-xs mb-6">{t.about.since}</h3>
        <h1 className="font-serif text-4xl md:text-6xl text-stone-900 mb-8 leading-tight">
          {t.about.title}
        </h1>
        <p className="text-stone-600 max-w-3xl mx-auto text-lg leading-relaxed font-light">
          {t.about.intro}
        </p>
      </div>

      {/* Cinematic Image Strip / Banner */}
      <div className="w-full h-[60vh] relative overflow-hidden mb-24 group">
        <div className="absolute inset-0 bg-stone-900/20 z-10"></div>
        {/* Factory Floor Image */}
        <img 
          src={getAsset(ASSET_KEYS.ABOUT_BANNER)}
          alt="Factory Floor" 
          className="w-full h-full object-cover transition-all duration-1000 ease-in-out"
        />
        <div className="absolute bottom-12 left-6 md:left-12 z-20">
           <div className="bg-white/90 backdrop-blur-sm p-6 shadow-lg">
             <p className="text-stone-900 font-serif text-2xl italic">{t.about.bannerText}</p>
           </div>
        </div>
      </div>

      {/* NEW: Brand Story Section */}
      <section className="py-24 bg-white mb-24 border-y border-stone-100">
        <div className="container mx-auto px-6 md:px-12 max-w-4xl text-center">
           <span className="text-amber-700 font-bold tracking-[0.2em] uppercase text-xs mb-8 block">
              {t.about.storyTitle}
           </span>
           <p className="font-serif text-2xl md:text-3xl text-stone-900 leading-relaxed mb-12">
              {t.about.storyP1}
           </p>
           <div className="text-stone-600 text-lg leading-relaxed space-y-8 font-light">
              <p>{t.about.storyP2}</p>
              <p>{t.about.storyP3}</p>
           </div>
           
           <div className="w-16 h-1 bg-[#281815] mx-auto mt-16 opacity-10"></div>
        </div>
      </section>

      {/* Core Pillars */}
      <div className="container mx-auto px-6 md:px-12 mb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="border-l-2 border-amber-700/30 pl-8">
             <Award className="text-amber-700 mb-6" size={32} />
             <h3 className="text-xl font-serif text-stone-900 mb-4">{t.about.pillars.elite}</h3>
             <p className="text-stone-600 text-sm leading-relaxed">
               {t.about.pillars.eliteDesc}
             </p>
          </div>
          <div className="border-l-2 border-amber-700/30 pl-8">
             <Globe className="text-amber-700 mb-6" size={32} />
             <h3 className="text-xl font-serif text-stone-900 mb-4">{t.about.pillars.dual}</h3>
             <p className="text-stone-600 text-sm leading-relaxed">
               {t.about.pillars.dualDesc}
             </p>
          </div>
          <div className="border-l-2 border-amber-700/30 pl-8">
             <Warehouse className="text-amber-700 mb-6" size={32} />
             <h3 className="text-xl font-serif text-stone-900 mb-4">{t.about.pillars.logistics}</h3>
             <p className="text-stone-600 text-sm leading-relaxed">
               {t.about.pillars.logisticsDesc}
             </p>
          </div>
        </div>
      </div>

      {/* Manufacturing Process Gallery */}
      <div className="bg-white py-24 mb-24 border-y border-stone-100">
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex flex-wrap justify-between items-end mb-12 gap-4">
            <div>
               <h3 className="text-amber-700 font-bold tracking-widest uppercase text-xs mb-4">{t.about.process.label}</h3>
               <h2 className="font-serif text-3xl md:text-4xl text-stone-900">{t.about.process.title}</h2>
               <p className="text-stone-500 mt-2 text-sm italic">{t.about.process.clickExpand}</p>
            </div>
            <div className="flex space-x-4">
               <button onClick={prevImage} className="p-3 rounded-full border border-stone-200 text-stone-600 hover:bg-stone-100 transition-colors">
                 <ChevronLeft size={20} />
               </button>
               <button onClick={nextImage} className="p-3 rounded-full border border-stone-200 text-stone-600 hover:bg-stone-100 transition-colors">
                 <ChevronRight size={20} />
               </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* Main Active Image - Fixed Height */}
             <div 
                className="lg:col-span-2 relative h-[500px] lg:h-[600px] bg-stone-100 group overflow-hidden cursor-zoom-in shadow-xl"
                onClick={() => openModal(activeImage)}
             >
                <img 
                  src={galleryImages[activeImage].url} 
                  alt={galleryImages[activeImage].title}
                  className="w-full h-full object-cover transition-all duration-700 transform group-hover:scale-105"
                />
                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-8">
                   <h3 className="text-white font-serif text-2xl mb-2">{galleryImages[activeImage].title}</h3>
                   <p className="text-stone-200">{galleryImages[activeImage].desc}</p>
                </div>
             </div>

             {/* Thumbnails / List */}
             <div className="flex flex-col justify-center space-y-4 h-[600px] overflow-y-auto pr-2">
                {galleryImages.map((img, idx) => (
                  <div 
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`p-6 cursor-pointer transition-all border-l-4 shadow-sm ${activeImage === idx ? 'border-amber-700 bg-white' : 'border-transparent bg-stone-50 hover:bg-stone-100'}`}
                  >
                     <h4 className={`font-serif text-lg mb-1 ${activeImage === idx ? 'text-stone-900' : 'text-stone-500'}`}>{img.title}</h4>
                     <p className="text-stone-600 text-xs mt-1 leading-relaxed line-clamp-2">{img.desc}</p>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* Timeline / Milestones - Optimized Layout */}
      <div className="bg-stone-50 py-12 md:py-24">
        <div className="container mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl text-stone-900 mb-4">{t.about.journey}</h2>
            <div className="w-16 h-1 bg-amber-700 mx-auto"></div>
          </div>
          
          <div className="relative">
             {/* Desktop Horizontal Line */}
             <div className="hidden md:block absolute top-[27px] left-0 w-full h-[2px] bg-stone-200"></div>
             
             {/* Mobile Vertical Line */}
             <div className="md:hidden absolute top-0 bottom-0 left-[27px] w-[2px] bg-stone-200"></div>

             {/* Updated Grid for 5 Columns */}
             <div className="grid grid-cols-1 md:grid-cols-5 gap-12 md:gap-8">
                {milestoneYears.map((year, idx) => {
                  const milestone = t.about.milestones[year];
                  return (
                    <div key={year} className="relative pl-16 md:pl-0 md:pt-16 group">
                      
                      {/* Timeline Dot */}
                      <div className="absolute left-[20px] top-0 md:top-[20px] md:left-1/2 md:-translate-x-1/2 w-4 h-4 rounded-full bg-stone-50 border-[3px] border-stone-300 group-hover:border-amber-700 group-hover:scale-125 transition-all duration-300 z-10"></div>

                      {/* Content Card - Swapped Hierarchy */}
                      <div className="md:text-center transition-transform duration-500 group-hover:-translate-y-2">
                         {/* Year is now subtle/eyebrow */}
                         <span className="block text-xs font-mono text-stone-400 mb-2 tracking-widest border border-stone-200 inline-block px-2 py-0.5 rounded-sm">
                           {year}
                         </span>
                         
                         {/* Title is now dominant */}
                         <h4 className="font-serif text-xl md:text-2xl text-stone-900 mb-4 group-hover:text-amber-700 transition-colors leading-tight">
                           {milestone.title}
                         </h4>

                         <p className="text-stone-600 text-sm leading-relaxed border-l-2 md:border-l-0 md:border-t-2 border-stone-100 pt-0 md:pt-4 pl-4 md:pl-0">
                           {milestone.desc}
                         </p>
                      </div>
                    </div>
                  );
                })}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
