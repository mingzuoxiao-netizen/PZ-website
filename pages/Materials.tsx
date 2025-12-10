
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { Layers, Droplet, Hammer, PanelTop } from 'lucide-react';

const Materials: React.FC = () => {
  const { t } = useLanguage();

  const woods = [
    { name: "White Oak", desc: "Durable hardwood with distinct grain patterns and excellent stability.", color: "#C8B78A" },
    { name: "Walnut", desc: "Rich dark tones with a naturally luxurious finish.", color: "#5B4332" },
    { name: "Rubberwood", desc: "Sustainable hardwood with fine, uniform grain and eco-friendly sourcing.", color: "#D9C9A3" },
    { name: "Ash", desc: "Light-toned hardwood known for its strength, flexibility, and striking grain.", color: "#CFC8C4" },
    { name: "Beech", desc: "Smooth, fine-grained hardwood ideal for curved structures and warm, natural finishes.", color: "#C8B1A0" },
    { name: "Maple", desc: "Dense, smooth-textured hardwood with a clean, modern look and excellent durability.", color: "#D4C6B8" },
    { name: "Teak", desc: "Premium tropical hardwood with rich natural oils, exceptional durability, and timeless golden tones.", color: "#B58A54" },
    { name: "Acacia", desc: "Durable hardwood with bold, contrasting grain patterns and strong visual character.", color: "#A08A78" },
  ];

  return (
    <div className="bg-stone-50 pt-32 pb-20 min-h-screen">
      <div className="container mx-auto px-6 md:px-12">
        <h1 className="font-serif text-4xl md:text-5xl text-stone-900 mb-12">{t.materials.title}</h1>

        {/* Construction Methods Section */}
        <div className="mb-24">
           <h3 className="text-amber-700 text-xs font-bold uppercase tracking-widest mb-8 flex items-center">
              <Hammer size={16} className="mr-2" /> Construction Methods & Panel Variations
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 border border-stone-200">
                 <h4 className="font-serif text-2xl text-stone-900 mb-4">Finger Joint</h4>
                 <div className="h-32 bg-stone-100 mb-6 relative overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover opacity-80 grayscale" alt="Finger Joint" />
                 </div>
                 <p className="text-stone-600 text-sm leading-relaxed">
                    Interlocking "fingers" cut into the ends of wood pieces to extend length. Provides immense structural strength and maximizes yield from timber. Ideal for painted frames and long countertops.
                 </p>
              </div>
              <div className="bg-white p-8 border border-stone-200">
                 <h4 className="font-serif text-2xl text-stone-900 mb-4">Edge Glue (Full Stave)</h4>
                 <div className="h-32 bg-stone-100 mb-6 relative overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover opacity-80 grayscale" alt="Edge Glue" />
                 </div>
                 <p className="text-stone-600 text-sm leading-relaxed">
                    Boards glued side-by-side running the full length of the piece. Creates a continuous, premium grain appearance. Preferred for high-end dining tables and premium visible surfaces.
                 </p>
              </div>
              <div className="bg-white p-8 border border-stone-200">
                 <h4 className="font-serif text-2xl text-stone-900 mb-4">Butcher Block</h4>
                 <div className="h-32 bg-stone-100 mb-6 relative overflow-hidden flex items-center justify-center">
                    <PanelTop size={48} className="text-stone-300" />
                 </div>
                 <p className="text-stone-600 text-sm leading-relaxed">
                    Thick strips of wood glued together. Extremely durable and stable. Commonly used for heavy-duty workbenches, kitchen islands, and industrial style tops.
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
              <h4 className="text-stone-900 font-serif text-lg">{wood.name}</h4>
              <p className="text-stone-500 text-sm mt-2">{wood.desc}</p>
            </div>
          ))}
        </div>

        {/* Technical Specs & Finishes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 border-t border-stone-200 pt-16">
           <div className="lg:col-span-2">
              <h3 className="text-amber-700 text-xs font-bold uppercase tracking-widest mb-6 flex items-center">
                 <Droplet size={16} className="mr-2" /> Finishes & Specs
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div>
                    <h4 className="font-bold text-stone-900 mb-2">Moisture Content</h4>
                    <p className="text-stone-600 text-sm">All lumber is Kiln Dried (KD) to 8-10% prior to production to prevent warping and cracking. Monitored via electric moisture meters.</p>
                 </div>
                 <div>
                    <h4 className="font-bold text-stone-900 mb-2">PU Lacquer</h4>
                    <p className="text-stone-600 text-sm">Polyurethane finish providing a durable, hard shell resistant to water, heat, and scratches. Ideal for dining tables.</p>
                 </div>
                 <div>
                    <h4 className="font-bold text-stone-900 mb-2">NC Lacquer</h4>
                    <p className="text-stone-600 text-sm">Nitrocellulose finish for a natural, thin-film look that enhances wood grain depth. Easy to repair but less water resistant.</p>
                 </div>
                 <div>
                    <h4 className="font-bold text-stone-900 mb-2">UV Coating</h4>
                    <p className="text-stone-600 text-sm">Ultraviolet cured coating for high-volume, instant-cure production lines. Extremely consistent and chemically resistant.</p>
                 </div>
              </div>
           </div>
           <div className="bg-stone-900 text-white p-8 rounded-sm">
              <h4 className="font-serif text-xl mb-4">Request Samples</h4>
              <p className="text-stone-400 text-sm mb-6">
                 We provide physical wood and finish samples for development teams.
              </p>
              <Link to="/inquire?subject=Samples" className="text-white border-b border-white pb-1 text-xs font-bold uppercase hover:text-amber-500 hover:border-amber-500 transition-colors">
                 Order Sample Kit
              </Link>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Materials;
