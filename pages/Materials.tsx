import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const Materials: React.FC = () => {
  const { t } = useLanguage();

  const woods = [
    { name: "White Oak", desc: "Durable hardwood with distinct grain patterns and excellent stability.", color: "#C2B280" },
    { name: "Walnut", desc: "Rich dark tones with a naturally luxurious finish.", color: "#5D4037" },
    { name: "Rubberwood", desc: "Sustainable hardwood with fine, uniform grain and eco-friendly sourcing.", color: "#E6D7B9" },
    { name: "Ash", desc: "Light-toned hardwood known for its strength, flexibility, and striking grain.", color: "#D7CCC8" },
    { name: "Beech", desc: "Smooth, fine-grained hardwood ideal for curved structures and warm, natural finishes.", color: "#D7CCC8" },
    { name: "Maple", desc: "Dense, smooth-textured hardwood with a clean, modern look and excellent durability.", color: "#D7CCC8" },
    { name: "Teak", desc: "Premium tropical hardwood with rich natural oils, exceptional durability, and timeless golden tones.", color: "#D7CCC8" },
    { name: "Acacia", desc: "Durable hardwood with bold, contrasting grain patterns and strong visual character.", color: "#D7CCC8" },
  ];

  return (
    <div className="bg-stone-50 pt-32 pb-20 min-h-screen">
      <div className="container mx-auto px-6 md:px-12">
        <h1 className="font-serif text-4xl md:text-5xl text-stone-900 mb-12">{t.materials.title}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
           <img 
             src="https://images.unsplash.com/photo-1622372738946-12a6d363fa76?q=80&w=1000&auto=format&fit=crop" 
             alt="Craftsmanship" 
             className="w-full h-[400px] object-cover shadow-xl rounded-sm"
           />
           <div className="flex flex-col justify-center">
             <h2 className="text-2xl text-stone-900 font-serif mb-6">{t.materials.precision}</h2>
             <p className="text-stone-600 mb-6 leading-relaxed">
               {t.materials.precisionDesc1}
             </p>
             <p className="text-stone-600 leading-relaxed">
               {t.materials.precisionDesc2}
             </p>
           </div>
        </div>

        <h3 className="text-amber-700 text-xs font-bold uppercase tracking-widest mb-8">{t.materials.library}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {woods.map((wood) => (
            <div key={wood.name} className="group bg-white p-4 shadow-sm hover:shadow-lg transition-shadow">
              <div 
                className="h-48 w-full mb-4 transition-transform duration-500 group-hover:scale-95 border border-stone-100"
                style={{ backgroundColor: wood.color }}
              >
                {/* Texture Overlay Simulation */}
                <div className="w-full h-full bg-gradient-to-br from-white/10 to-black/10"></div>
              </div>
              <h4 className="text-stone-900 font-serif text-lg">{wood.name}</h4>
              <p className="text-stone-500 text-sm mt-2">{wood.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Materials;