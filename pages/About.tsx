import React, { useState } from 'react';
import { Globe, Users, Award, Warehouse, ChevronRight, ChevronLeft, X, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { usePublishedSiteConfig } from '../contexts/SiteConfigContext';

const About: React.FC = () => {
  const [activeImage, setActiveImage] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useLanguage();
  
  const { config: site, loading } = usePublishedSiteConfig();

  if (loading || !site) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-stone-900 text-stone-500">
        <Loader2 className="animate-spin mr-2" size={24} /> Loading...
      </div>
    );
  }

  const galleryImages = [
    {
      url: site.about?.gallery?.raw,
      title: t.about.galleryItems.raw.title,
      desc: t.about.galleryItems.raw.desc
    },
    {
      url: site.about?.gallery?.milling,
      title: t.about.galleryItems.milling.title,
      desc: t.about.galleryItems.milling.desc
    },    
    {
      url: site.about?.gallery?.automation, 
      title: t.about.galleryItems.automation.title,
      desc: t.about.galleryItems.automation.desc
    },
    {
      url: site.about?.gallery?.finishing,
      title: t.about.galleryItems.finishing.title,
      desc: t.about.galleryItems.finishing.desc
    },
    {
      url: site.about?.gallery?.qc,
      title: t.about.galleryItems.qc.title,
      desc: t.about.galleryItems.qc.desc
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
    <div className="bg-stone-50 min-h-screen pt-24 md:pt-32 pb-0">
      {/* Modal Gallery Overlay */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/95 backdrop-blur-sm p-4 animate-fade-in"
          onClick={closeModal}
        >
          <button className="absolute top-6 right-6 text-white/80 hover:text-white transition-colors bg-black/20 p-2 rounded-full z-50" onClick={closeModal}>
            <X size={32} />
          </button>
          
          <button 
            className="absolute left-2 md:left-8 text-white/50 hover:text-white transition-colors hidden md:block" 
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
          >
            <ChevronLeft size={48} />
          </button>
          
          <div className="max-w-6xl w-full max-h-[90vh] flex flex-col items-center justify-center h-full" onClick={(e) => e.stopPropagation()}>
             <img 
               src={galleryImages[activeImage].url} 
               className="max-h-[60vh] md:max-h-[75vh] max-w-full object-contain shadow-2xl" 
               alt={galleryImages[activeImage].title}
             />
             <div className="mt-6 text-center text-white max-w-2xl px-4">
               <h3 className="text-xl md:text-2xl font-serif mb-2">{galleryImages[activeImage].title}</h3>
               <p className="text-stone-400 font-light text-sm md:text-base">{galleryImages[activeImage].desc}</p>
             </div>
             {/* Mobile Nav Controls */}
             <div className="flex md:hidden space-x-12 mt-8">
               <button onClick={(e) => {e.stopPropagation(); prevImage();}} className="text-white bg-white/10 p-3 rounded-full"><ChevronLeft size={28} /></button>
               <button onClick={(e) => {e.stopPropagation(); nextImage();}} className="text-white bg-white/10 p-3 rounded-full"><ChevronRight size={28} /></button>
             </div>
          </div>

          <button 
            className="absolute right-2 md:right-8 text-white/50 hover:text-white transition-colors hidden md:block" 
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
          >
            <ChevronRight size={48} />
          </button>
        </div>
      )}

      {/* Header - Transparent/Clean Look */}
      <div className="container mx-auto px-6 md:px-12 mb-16 md:mb-24 text-center">
        <h3 className="text-amber-700 font-bold tracking-[0.2em] uppercase text-xs mb-6 inline-block border-b border-amber-700 pb-1">{t.about.since}</h3>
        <h1 className="font-serif text-4xl md:text-7xl text-stone-900 mb-8 leading-tight tracking-tight">
          {t.about.title}
        </h1>
        <p className="text-stone-600 max-w-3xl mx-auto text-lg md:text-xl leading-relaxed font-light">
          {t.about.intro}
        </p>
      </div>

      {/* Cinematic Image Strip / Banner - Full Bleed */}
      <div className="w-full h-[50vh] md:h-[70vh] relative overflow-hidden group">
        <div className="absolute inset-0 bg-stone-900/10 z-10 mix-blend-multiply"></div>
        <img 
          src={site.about?.banner}
          alt="Factory Floor" 
          className="w-full h-full object-cover transition-all duration-[20s] ease-linear transform scale-100 group-hover:scale-105"
        />
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 z-20 bg-gradient-to-t from-stone-900/80 to-transparent">
           <div className="container mx-auto">
             <p className="text-white font-serif text-2xl md:text-4xl italic max-w-2xl">{t.about.bannerText}</p>
           </div>
        </div>
      </div>

      {/* Story Section - Warm Grey Background with Paper Texture */}
      <section className="py-20 md:py-32 bg-[#e7e5e4]">
        <div className="container mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
           <div>
              <span className="text-amber-800 font-bold tracking-[0.2em] uppercase text-xs mb-6 block border-l-2 border-amber-800 pl-4">
                  {t.about.storyTitle}
              </span>
              <h2 className="font-serif text-3xl md:text-5xl text-stone-900 leading-tight mb-8">
                  {t.about.storyP1}
              </h2>
           </div>
           <div className="text-stone-700 text-base md:text-lg leading-relaxed space-y-6 font-light">
              <p>{t.about.storyP2}</p>
              <p>{t.about.storyP3}</p>
              <p className="font-medium text-stone-900">{t.about.storyP4}</p>
           </div>
        </div>
      </section>

      {/* Core Pillars - White Cards on Stone Background */}
      <div className="bg-stone-50 py-24">
        <div className="container mx-auto px-6 md:px-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-10 shadow-sm hover:shadow-xl transition-shadow duration-500 border-t-4 border-stone-900">
                <Award className="text-amber-700 mb-6" size={32} />
                <h3 className="text-xl font-serif text-stone-900 mb-4">{t.about.pillars.elite}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">
                {t.about.pillars.eliteDesc}
                </p>
            </div>
            <div className="bg-white p-10 shadow-sm hover:shadow-xl transition-shadow duration-500 border-t-4 border-stone-900">
                <Globe className="text-amber-700 mb-6" size={32} />
                <h3 className="text-xl font-serif text-stone-900 mb-4">{t.about.pillars.dual}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">
                {t.about.pillars.dualDesc}
                </p>
            </div>
            <div className="bg-white p-10 shadow-sm hover:shadow-xl transition-shadow duration-500 border-t-4 border-stone-900">
                <Warehouse className="text-amber-700 mb-6" size={32} />
                <h3 className="text-xl font-serif text-stone-900 mb-4">{t.about.pillars.logistics}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">
                {t.about.pillars.logisticsDesc}
                </p>
            </div>
            </div>
        </div>
      </div>

      {/* Manufacturing Process Gallery - Dark Mode Section */}
      <div className="bg-stone-900 text-white py-24">
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex flex-wrap justify-between items-end mb-12 gap-4 border-b border-stone-800 pb-8">
            <div>
               <h3 className="text-amber-500 font-bold tracking-widest uppercase text-xs mb-2">{t.about.process.label}</h3>
               <h2 className="font-serif text-3xl md:text-4xl text-white">{t.about.process.title}</h2>
            </div>
            <div className="flex space-x-4">
               <button onClick={prevImage} className="p-3 rounded-full border border-stone-700 text-stone-400 hover:text-white hover:border-white transition-colors">
                 <ChevronLeft size={20} />
               </button>
               <button onClick={nextImage} className="p-3 rounded-full border border-stone-700 text-stone-400 hover:text-white hover:border-white transition-colors">
                 <ChevronRight size={20} />
               </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* Main Active Image */}
             <div 
                className="lg:col-span-2 relative h-[300px] md:h-[500px] lg:h-[600px] bg-stone-800 group overflow-hidden cursor-zoom-in"
                onClick={() => openModal(activeImage)}
             >
                <img 
                  src={galleryImages[activeImage].url} 
                  alt={galleryImages[activeImage].title}
                  className="w-full h-full object-cover transition-all duration-700 transform group-hover:scale-105 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black to-transparent p-8">
                   <h3 className="text-white font-serif text-2xl mb-2">{galleryImages[activeImage].title}</h3>
                   <p className="text-stone-300 text-sm">{galleryImages[activeImage].desc}</p>
                </div>
             </div>

             {/* Dark Thumbnails List */}
             <div className="flex lg:flex-col overflow-x-auto lg:overflow-y-auto space-x-4 lg:space-x-0 lg:space-y-0 h-auto lg:h-[600px] pb-4 lg:pb-0 border-l border-stone-800">
                {galleryImages.map((img, idx) => (
                  <div 
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`min-w-[200px] lg:min-w-0 p-6 cursor-pointer transition-all border-l-4 ${activeImage === idx ? 'border-amber-500 bg-stone-800' : 'border-transparent hover:bg-stone-800/50'}`}
                  >
                     <span className="block text-[10px] font-mono text-stone-500 mb-1">0{idx + 1}</span>
                     <h4 className={`font-serif text-sm md:text-lg mb-1 ${activeImage === idx ? 'text-white' : 'text-stone-400'}`}>{img.title}</h4>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* Timeline - Grid Background */}
      <div className="bg-stone-50 py-24 bg-grid relative overflow-hidden">
        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl text-stone-900 mb-4">{t.about.journey}</h2>
            <div className="w-16 h-1 bg-stone-200 mx-auto"></div>
          </div>
          
          <div className="relative pl-2 md:pl-0">
             {/* Timeline Track */}
             <div className="hidden md:block absolute top-[27px] left-0 w-full h-[1px] bg-stone-300"></div>
             <div className="md:hidden absolute top-0 bottom-0 left-[27px] w-[1px] bg-stone-300"></div>

             <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                {milestoneYears.map((year, idx) => {
                  const milestone = t.about.milestones[year];
                  return (
                    <div key={year} className="relative pl-16 md:pl-0 md:pt-16 group">
                      
                      {/* Timeline Dot */}
                      <div className="absolute left-[23px] top-0 md:top-[23px] md:left-1/2 md:-translate-x-1/2 w-3 h-3 rounded-full bg-stone-900 border-2 border-white shadow-md z-10 transition-transform group-hover:scale-150 group-hover:bg-amber-600"></div>

                      <div className="md:text-center transition-all duration-500 group-hover:-translate-y-2 pb-8 md:pb-0">
                         <span className="block text-4xl font-mono text-stone-200 font-bold mb-2 absolute -z-10 top-0 left-12 md:left-1/2 md:-translate-x-1/2 md:-top-6 group-hover:text-stone-300 transition-colors">
                           {year}
                         </span>
                         
                         <h4 className="font-serif text-xl text-stone-900 mb-3 pt-2 md:pt-4 group-hover:text-amber-700 transition-colors">
                           {milestone.title}
                         </h4>

                         <p className="text-stone-500 text-sm leading-relaxed">
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