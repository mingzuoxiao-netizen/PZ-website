
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { usePublishedSiteConfig } from '../contexts/SiteConfigContext';

const TheStudio: React.FC = () => {
  const { t } = useLanguage();
  const { config, loading } = usePublishedSiteConfig();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-stone-50 text-stone-400">
        <Loader2 className="animate-spin mr-2" size={24} /> Loading...
      </div>
    );
  }

  return (
    <div className="bg-stone-50 min-h-screen">
       {/* Header */}
       <div className="pt-32 pb-12 md:pt-40 md:pb-20 container mx-auto px-6 md:px-12 text-center">
         <h1 className="font-serif text-4xl md:text-6xl text-stone-900 mb-6">{t.studio.title}</h1>
         <p className="text-stone-500 text-lg md:text-xl font-light tracking-wide">{t.studio.subtitle}</p>
       </div>

       {/* Section 1 */}
       <div className="grid grid-cols-1 lg:grid-cols-2">
         {/* Mobile: Aspect Ratio, Desktop: Height */}
         <div className="aspect-[4/3] lg:aspect-auto lg:h-[700px] w-full relative">
            <img 
              src={config.studio?.hero} 
              alt="Workshop Design" 
              className="w-full h-full object-cover absolute inset-0"
            />
         </div>
         <div className="flex flex-col justify-center p-10 md:p-12 lg:p-24 bg-white">
            <h2 className="text-amber-700 text-xs font-bold uppercase tracking-widest mb-4">{t.studio.design}</h2>
            <h3 className="font-serif text-3xl text-stone-900 mb-6">{t.studio.designTitle}</h3>
            <p className="text-stone-600 leading-relaxed mb-6 text-sm md:text-base">
              {t.studio.designDesc1}
            </p>
            <p className="text-stone-600 leading-relaxed text-sm md:text-base">
              {t.studio.designDesc2}
            </p>
         </div>
       </div>

       {/* Section 2 */}
       <div className="grid grid-cols-1 lg:grid-cols-2">
         <div className="flex flex-col justify-center p-10 md:p-12 lg:p-24 bg-stone-100 order-2 lg:order-1">
            <h2 className="text-amber-700 text-xs font-bold uppercase tracking-widest mb-4">{t.studio.eng}</h2>
            <h3 className="font-serif text-3xl text-stone-900 mb-6">{t.studio.engTitle}</h3>
            <p className="text-stone-600 leading-relaxed mb-6 text-sm md:text-base">
              {t.studio.engDesc}
            </p>
            <ul className="space-y-3 text-stone-600 text-sm md:text-base">
              <li className="flex items-center"><span className="w-2 h-2 bg-amber-700 rounded-full mr-3"></span>Pure Solid Wood Fabrication</li>
              <li className="flex items-center"><span className="w-2 h-2 bg-amber-700 rounded-full mr-3"></span>Precision CNC Machining</li>
              <li className="flex items-center"><span className="w-2 h-2 bg-amber-700 rounded-full mr-3"></span>Advanced Finishing Techniques</li>
            </ul>
         </div>
         <div className="aspect-[4/3] lg:aspect-auto lg:h-[700px] order-1 lg:order-2 w-full relative">
            <img 
              src={config.studio?.design}
              alt="Wood Detail" 
              className="w-full h-full object-cover absolute inset-0"
            />
         </div>
       </div>

       {/* Section 3 - Material Focus */}
       <div className="py-20 md:py-24 bg-white">
         <div className="container mx-auto px-6 md:px-12 text-center">
            <h2 className="text-amber-700 text-xs font-bold uppercase tracking-widest mb-4">{t.studio.raw}</h2>
            <h3 className="font-serif text-3xl md:text-4xl text-stone-900 mb-8">{t.studio.rawTitle}</h3>
            <p className="text-stone-600 max-w-2xl mx-auto mb-16 leading-relaxed font-light text-sm md:text-base">
              {t.studio.rawDesc}
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
              {t.studio.exploreMat} <ArrowRight size={14} className="ml-2" />
            </Link>
         </div>
       </div>
    </div>
  );
};

export default TheStudio;
