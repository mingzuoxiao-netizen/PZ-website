
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { Layers, Droplet, Hammer, PanelTop, ArrowRight, Box } from 'lucide-react';
import { usePublishedSiteConfig } from '../contexts/SiteConfigContext';

const Materials: React.FC = () => {
  const { t, language } = useLanguage();
  const { config } = usePublishedSiteConfig(); // ✅ Updated

  const woods = [
    { 
      name: "White Oak", 
      name_zh: "白橡木", 
      desc: "Durable hardwood with distinct grain patterns and excellent stability.", 
      desc_zh: "耐用的硬木，具有独特的纹理和优异的稳定性。", 
      image: config.materials?.wood_oak
    },
    { 
      name: "Walnut", 
      name_zh: "黑胡桃", 
      desc: "Rich dark tones with a naturally luxurious finish.", 
      desc_zh: "丰富的深色调，具有天然的奢华质感。", 
      image: config.materials?.wood_walnut
    },
    { 
      name: "Rubberwood", 
      name_zh: "橡胶木", 
      desc: "Sustainable hardwood with fine, uniform grain and eco-friendly sourcing.", 
      desc_zh: "可持续硬木，纹理细腻均匀，环保采购。", 
      image: config.materials?.wood_rubber
    },
    { 
      name: "Ash", 
      name_zh: "白蜡木", 
      desc: "Light-toned hardwood known for its strength, flexibility, and striking grain.", 
      desc_zh: "浅色硬木，以强度、柔韧性和醒目的纹理著称。", 
      image: config.materials?.wood_ash
    },
    { 
      name: "Beech", 
      name_zh: "榉木", 
      desc: "Smooth, fine-grained hardwood ideal for curved structures and warm, natural finishes.", 
      desc_zh: "光滑细腻的硬木，非常适合弯曲结构和温暖自然的涂装。", 
      image: config.materials?.wood_beech
    },
    { 
      name: "Maple", 
      name_zh: "硬枫木", 
      desc: "Dense, smooth-textured hardwood with a clean, modern look and excellent durability.", 
      desc_zh: "致密光滑的硬木，外观干净现代，耐用性极佳。", 
      image: config.materials?.wood_maple
    },
    { 
      name: "Birch", 
      name_zh: "桦木", 
      desc: "Light-toned hardwood known for its fine, even grain, excellent formability, and clean modern aesthetic.", 
      desc_zh: "质地坚实的浅色硬木，纹理细腻均匀，易于加工成型，呈现清爽现代的自然质感。", 
      image: config.materials?.wood_birch
    },
    { 
      name: "Teak", 
      name_zh: "柚木", 
      desc: "Premium tropical hardwood with rich natural oils, exceptional durability, and timeless golden tones.", 
      desc_zh: "优质热带硬木，富含天然油脂，极其耐用，具有永恒的金色色调。", 
      image: config.materials?.wood_teak
    },
    { 
      name: "Acacia", 
      name_zh: "相思木", 
      desc: "Durable hardwood with bold, contrasting grain patterns and strong visual character.", 
      desc_zh: "耐用硬木，具有大胆的对比纹理和强烈的视觉特征。", 
      image: config.materials?.wood_acacia
    },
    { 
      name: "Bamboo", 
      name_zh: "竹子", 
      desc: "Sustainable, fast-growing material with high hardness and distinct linear grain.", 
      desc_zh: "可持续、快速生长的材料，具有高硬度和独特的线性纹理。", 
      image: config.materials?.wood_bamboo
    },
  ];

  const getStr = (obj: any, key: string) => {
    if (language === 'zh' && obj[`${key}_zh`]) {
      return obj[`${key}_zh`];
    }
    return obj[key];
  };

  const butcherBlockImg = config.materials?.const_butcher;

  return (
    <div className="bg-stone-50 pt-32 pb-20 min-h-screen">
      <div className="container mx-auto px-6 md:px-12">
        <h1 className="font-display font-black text-4xl md:text-7xl text-stone-900 mb-12 md:mb-16 uppercase tracking-tighter border-l-8 border-safety-700 pl-6 md:pl-8">{t.materials.title}</h1>

        {/* Construction Methods Section */}
        <div className="mb-20 md:mb-24">
           <h3 className="text-safety-700 text-xs font-bold uppercase tracking-widest mb-8 flex items-center">
              <Hammer size={16} className="mr-2" /> {t.materials.construction}
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 border border-stone-200 hover:border-stone-900 transition-colors group shadow-sm">
                 <h4 className="font-display font-bold text-xl text-stone-900 mb-6 uppercase tracking-wide">{t.materials.fingerJoint}</h4>
                 <div className="h-48 bg-stone-100 mb-6 relative overflow-hidden border border-stone-100">
                    <img src={config.materials?.const_finger} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Finger Joint" />
                 </div>
                 <p className="text-stone-600 text-sm leading-relaxed">
                    {t.materials.fingerJointDesc}
                 </p>
              </div>
              <div className="bg-white p-8 border border-stone-200 hover:border-stone-900 transition-colors group shadow-sm">
                 <h4 className="font-display font-bold text-xl text-stone-900 mb-6 uppercase tracking-wide">{t.materials.edgeGlue}</h4>
                 <div className="h-48 bg-stone-100 mb-6 relative overflow-hidden border border-stone-100">
                    <img src={config.materials?.const_edge} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Edge Glue" />
                 </div>
                 <p className="text-stone-600 text-sm leading-relaxed">
                    {t.materials.edgeGlueDesc}
                 </p>
              </div>
              <div className="bg-white p-8 border border-stone-200 hover:border-stone-900 transition-colors group shadow-sm">
                 <h4 className="font-display font-bold text-xl text-stone-900 mb-6 uppercase tracking-wide">{t.materials.butcherBlock}</h4>
                 <div className="h-48 bg-stone-100 mb-6 relative overflow-hidden flex items-center justify-center border border-stone-100">
                    {butcherBlockImg ? (
                        <img src={butcherBlockImg} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Butcher Block" />
                    ) : (
                        <PanelTop size={48} className="text-stone-300" />
                    )}
                 </div>
                 <p className="text-stone-600 text-sm leading-relaxed">
                    {t.materials.butcherBlockDesc}
                 </p>
              </div>
           </div>
        </div>

        {/* Wood Library - Industrial Samples */}
        <h3 className="text-safety-700 text-xs font-bold uppercase tracking-widest mb-8 flex items-center">
             <Layers size={16} className="mr-2" /> {t.materials.library}
        </h3>
        
        {/* Mobile: Grid-cols-2, Tablet/Desktop: Grid-cols-4/5 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-24">
          {woods.map((wood) => (
            <div key={wood.name} className="group bg-white border border-stone-200 hover:border-safety-700 transition-all cursor-default shadow-sm">
              <div className="aspect-square w-full relative overflow-hidden">
                 <img 
                    src={wood.image} 
                    alt={getStr(wood, 'name')} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                 />
                 <div className="absolute inset-0 bg-stone-900/90 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center p-4 md:p-6 text-center">
                    <p className="text-white text-[10px] md:text-xs leading-relaxed font-medium">{getStr(wood, 'desc')}</p>
                 </div>
              </div>
              <div className="p-3 md:p-4 border-t border-stone-100 bg-stone-50 group-hover:bg-white transition-colors">
                 <h4 className="text-stone-900 font-display font-bold text-xs md:text-sm uppercase tracking-wide text-center truncate">{getStr(wood, 'name')}</h4>
              </div>
            </div>
          ))}
        </div>

        {/* Technical Specs & Finishes - Blueprint Style */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 shadow-xl">
           <div className="lg:col-span-2 bg-white p-8 md:p-12 border-t-4 border-stone-900">
              {/* Refined Header with proper Ampersand styling */}
              <h3 className="text-stone-900 text-sm font-bold uppercase tracking-widest mb-10 flex items-center border-b border-stone-200 pb-4">
                 <Droplet size={18} className="mr-3 text-safety-700" /> 
                 Finishes <span className="font-serif italic mx-2 text-safety-700 text-lg">&</span> Specs
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
                 <div>
                    <h4 className="font-bold text-stone-900 mb-3 uppercase text-xs tracking-wider border-l-2 border-safety-700 pl-3">{t.materials.moisture}</h4>
                    {/* Changed from font-mono/xs to font-sans/sm for readability */}
                    <p className="text-stone-600 text-sm leading-relaxed">{t.materials.moistureDesc}</p>
                 </div>
                 <div>
                    <h4 className="font-bold text-stone-900 mb-3 uppercase text-xs tracking-wider border-l-2 border-safety-700 pl-3">{t.materials.pu}</h4>
                    <p className="text-stone-600 text-sm leading-relaxed">{t.materials.puDesc}</p>
                 </div>
                 <div>
                    <h4 className="font-bold text-stone-900 mb-3 uppercase text-xs tracking-wider border-l-2 border-safety-700 pl-3">{t.materials.nc}</h4>
                    <p className="text-stone-600 text-sm leading-relaxed">{t.materials.ncDesc}</p>
                 </div>
                 <div>
                    <h4 className="font-bold text-stone-900 mb-3 uppercase text-xs tracking-wider border-l-2 border-safety-700 pl-3">{t.materials.uv}</h4>
                    <p className="text-stone-600 text-sm leading-relaxed">{t.materials.uvDesc}</p>
                 </div>
              </div>
           </div>
           
           <div className="bg-stone-900 text-white p-12 flex flex-col justify-center relative overflow-hidden border-t-4 border-safety-700">
              {/* Graphic Element */}
              <Box className="absolute top-[-20px] right-[-20px] text-white w-40 h-40 opacity-5 rotate-12" />
              
              <h4 className="font-serif text-3xl mb-6 z-10">{t.materials.request}</h4>
              <p className="text-stone-400 text-sm mb-10 z-10 font-medium leading-relaxed">
                 {t.materials.requestDesc}
              </p>
              <Link 
                to="/inquire?subject=Samples" 
                className="inline-flex items-center bg-white text-stone-900 px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-safety-700 hover:text-white transition-all z-10 w-fit shadow-lg"
              >
                 {t.materials.orderKit} <ArrowRight size={14} className="ml-3"/>
              </Link>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Materials;
