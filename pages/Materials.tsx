
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { Layers, Droplet, Hammer, PanelTop } from 'lucide-react';

const Materials: React.FC = () => {
  const { t, language } = useLanguage();

  const woods = [
    { name: "White Oak", name_zh: "白橡木", desc: "Durable hardwood with distinct grain patterns and excellent stability.", desc_zh: "耐用的硬木，具有独特的纹理和优异的稳定性。", color: "#C8B78A" },
    { name: "Walnut", name_zh: "黑胡桃", desc: "Rich dark tones with a naturally luxurious finish.", desc_zh: "丰富的深色调，具有天然的奢华质感。", color: "#5B4332" },
    { name: "Rubberwood", name_zh: "橡胶木", desc: "Sustainable hardwood with fine, uniform grain and eco-friendly sourcing.", desc_zh: "可持续硬木，纹理细腻均匀，环保采购。", color: "#D9C9A3" },
    { name: "Ash", name_zh: "白蜡木", desc: "Light-toned hardwood known for its strength, flexibility, and striking grain.", desc_zh: "浅色硬木，以强度、柔韧性和醒目的纹理著称。", color: "#CFC8C4" },
    { name: "Beech", name_zh: "榉木", desc: "Smooth, fine-grained hardwood ideal for curved structures and warm, natural finishes.", desc_zh: "光滑细腻的硬木，非常适合弯曲结构和温暖自然的涂装。", color: "#C8B1A0" },
    { name: "Maple", name_zh: "硬枫木", desc: "Dense, smooth-textured hardwood with a clean, modern look and excellent durability.", desc_zh: "致密光滑的硬木，外观干净现代，耐用性极佳。", color: "#D4C6B8" },
    { name: "Teak", name_zh: "柚木", desc: "Premium tropical hardwood with rich natural oils, exceptional durability, and timeless golden tones.", desc_zh: "优质热带硬木，富含天然油脂，极其耐用，具有永恒的金色色调。", color: "#B58A54" },
    { name: "Acacia", name_zh: "相思木", desc: "Durable hardwood with bold, contrasting grain patterns and strong visual character.", desc_zh: "耐用硬木，具有大胆的对比纹理和强烈的视觉特征。", color: "#A08A78" },
  ];

  const getStr = (obj: any, key: string) => {
    if (language === 'zh' && obj[`${key}_zh`]) {
      return obj[`${key}_zh`];
    }
    return obj[key];
  };

  return (
    <div className="bg-stone-50 pt-32 pb-20 min-h-screen">
      <div className="container mx-auto px-6 md:px-12">
        <h1 className="font-serif text-4xl md:text-5xl text-stone-900 mb-12">{t.materials.title}</h1>

        {/* Construction Methods Section */}
        <div className="mb-24">
           <h3 className="text-amber-700 text-xs font-bold uppercase tracking-widest mb-8 flex items-center">
              <Hammer size={16} className="mr-2" /> {t.materials.construction}
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 border border-stone-200">
                 <h4 className="font-serif text-2xl text-stone-900 mb-4">{t.materials.fingerJoint}</h4>
                 <div className="h-32 bg-stone-100 mb-6 relative overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover opacity-80 grayscale" alt="Finger Joint" />
                 </div>
                 <p className="text-stone-600 text-sm leading-relaxed">
                    {t.materials.fingerJointDesc}
                 </p>
              </div>
              <div className="bg-white p-8 border border-stone-200">
                 <h4 className="font-serif text-2xl text-stone-900 mb-4">{t.materials.edgeGlue}</h4>
                 <div className="h-32 bg-stone-100 mb-6 relative overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover opacity-80 grayscale" alt="Edge Glue" />
                 </div>
                 <p className="text-stone-600 text-sm leading-relaxed">
                    {t.materials.edgeGlueDesc}
                 </p>
              </div>
              <div className="bg-white p-8 border border-stone-200">
                 <h4 className="font-serif text-2xl text-stone-900 mb-4">{t.materials.butcherBlock}</h4>
                 <div className="h-32 bg-stone-100 mb-6 relative overflow-hidden flex items-center justify-center">
                    <PanelTop size={48} className="text-stone-300" />
                 </div>
                 <p className="text-stone-600 text-sm leading-relaxed">
                    {t.materials.butcherBlockDesc}
                 </p>
              </div>
           </div>
        </div>

        {/* Wood Library */}
        <h3 className="text-amber-700 text-xs font-bold uppercase tracking-widest mb-8 flex items-center">
             <Layers size={16} className="mr-2" /> {t.materials.library}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-24">
          {woods.map((wood) => (
            <div key={wood.name} className="group bg-white p-4 shadow-sm hover:shadow-lg transition-shadow">
              <div 
                className="h-48 w-full mb-4 transition-transform duration-500 group-hover:scale-95 border border-stone-100"
                style={{ backgroundColor: wood.color }}
              >
                <div className="w-full h-full bg-gradient-to-br from-white/10 to-black/10"></div>
              </div>
              <h4 className="text-stone-900 font-serif text-lg">{getStr(wood, 'name')}</h4>
              <p className="text-stone-500 text-sm mt-2">{getStr(wood, 'desc')}</p>
            </div>
          ))}
        </div>

        {/* Technical Specs & Finishes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 border-t border-stone-200 pt-16">
           <div className="lg:col-span-2">
              <h3 className="text-amber-700 text-xs font-bold uppercase tracking-widest mb-6 flex items-center">
                 <Droplet size={16} className="mr-2" /> {t.materials.finishes}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div>
                    <h4 className="font-bold text-stone-900 mb-2">{t.materials.moisture}</h4>
                    <p className="text-stone-600 text-sm">{t.materials.moistureDesc}</p>
                 </div>
                 <div>
                    <h4 className="font-bold text-stone-900 mb-2">{t.materials.pu}</h4>
                    <p className="text-stone-600 text-sm">{t.materials.puDesc}</p>
                 </div>
                 <div>
                    <h4 className="font-bold text-stone-900 mb-2">{t.materials.nc}</h4>
                    <p className="text-stone-600 text-sm">{t.materials.ncDesc}</p>
                 </div>
                 <div>
                    <h4 className="font-bold text-stone-900 mb-2">{t.materials.uv}</h4>
                    <p className="text-stone-600 text-sm">{t.materials.uvDesc}</p>
                 </div>
              </div>
           </div>
           <div className="bg-stone-900 text-white p-8 rounded-sm">
              <h4 className="font-serif text-xl mb-4">{t.materials.request}</h4>
              <p className="text-stone-400 text-sm mb-6">
                 {t.materials.requestDesc}
              </p>
              <Link to="/inquire?subject=Samples" className="text-white border-b border-white pb-1 text-xs font-bold uppercase hover:text-amber-500 hover:border-amber-500 transition-colors">
                 {t.materials.orderKit}
              </Link>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Materials;
