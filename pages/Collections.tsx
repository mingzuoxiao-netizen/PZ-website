import React, { useState } from 'react';
import { ArrowLeft, ChevronRight, LayoutGrid } from 'lucide-react';
import { Category, SubCategory } from '../types';

// Reorganized Data Structure based on new hierarchy
const categories: Category[] = [
  {
    id: 'essentials',
    title: "Solid Wood Essentials",
    subtitle: "Butcher Block & Surfaces",
    description: "The foundation of our manufacturing capability. We process FAS grade North American lumber into premium architectural surfaces, countertops, and heavy-duty workbenches.",
    image: "https://images.unsplash.com/photo-1628797285815-453c1d0d21e3?q=80&w=774&auto=format&fit=crop",
    colSpan: "md:col-span-1",
    subCategories: [
      { 
        name: "Butcher Block Tops", 
        description: "Edge-grain and End-grain construction. Click to view material options.", 
        image: "https://d332p1w15mxdmm.cloudfront.net/15-thick-walnut-blended-grain-countertop-25-wide-5fdbde66e3a22.jpg",
        variants: [
            {
                name: "Black Walnut",
                description: "North American Black Walnut. Rich, dark chocolate tones. The gold standard for luxury kitchen islands and workbench tops.",
                image: "https://d332p1w15mxdmm.cloudfront.net/15-thick-walnut-blended-grain-countertop-25-wide-5fdbde66e3a22.jpg"
            },
            {
                name: "White Oak",
                description: "American White Oak. Heavy, dense, and rot-resistant. Features distinctive straight grain patterns popular in modern design.",
                image: "https://i8.amplience.net/i/flooranddecor/100020619_white-oak-butcher-block-countertop-8ft_1?fmt=auto&qlt=85"
            },
            {
                name: "Hard Maple",
                description: "Rock Maple. The traditional choice for professional butcher blocks due to its extreme density, sanitary properties, and light color.",
                image: "https://github.com/MingzuoXiao/PZ-website/blob/main/maple.png?raw=true"
            },
            {
                name: "Acacia",
                description: "Sustainable Plantation Acacia. A cost-effective hardwood with dynamic, contrasting grain patterns and warm golden hues.",
                image: "https://lumberliquidators.com/cdn/shop/files/10049364_sw_jofirv.jpg?v=1763537742&width=900"
            },
            {
                name: "Teak",
                description: "Golden Teak. Naturally high oil content makes it incredibly water resistant. Ideal for wet environments and bathroom vanities.",
                image: "https://lumberliquidators.com/cdn/shop/files/10041887_sw.jpg?v=1763537456&width=900"
            },
            {
                name: "Birch",
                description: "Light, clean, and strong—ideal for minimal and Scandinavian designs.",
                image: "https://cabinetstogo.com/cdn/shop/products/AMBB12_main-01_600x.jpg?v=1575351887"
            },
            {
                name: "Bamboo",
                description: "Eco-friendly, strong, and sleek with a contemporary uniform texture.",
                image: "https://i8.amplience.net/i/flooranddecor/100892876_premium-carbonized-solid-bamboo_display?fmt=auto&qlt=85"
            },
            {
                name: "Saman w/t Live Edge",
                description: "Saman hardwood meets a sculpted live edge, blending refined craftsmanship with the untouched beauty of nature.",
                image: "https://github.com/MingzuoXiao/PZ-website/blob/main/saman.png?raw=true"
            }
            
        ]
      },
      { name: "Floating Shelves", description: "Solid architectural shelving with concealed hardware.", image: "https://cdn-media.cabinetparts.com/74c6b1cb-6338-4793-9934-56a163f28079.jpg?p=port-xl" }
    ]
  },
  {
    id: 'casegoods',
    title: "Modern Casegoods Collection",
    subtitle: "Bedroom & Storage Systems",
    description: "A comprehensive range of cabinetry and large-format furniture. Featuring precision joinery, grain-matched drawer fronts, and high-quality hardware integration.",
    image: "https://github.com/MingzuoXiao/PZ-website/blob/main/Modern%20Casegoods%20Collection.jpg?raw=true",
    colSpan: "md:col-span-1",
    subCategories: [
      { name: "Nightstands", description: "Heirloom construction with soft-close hardware.", image: "https://res.cloudinary.com/castlery/image/private/w_1995,f_auto,q_auto,b_rgb:F3F3F3,c_fit/v1638241672/crusader/variants/PB-BR0050/Seb-Bedside-Table-Lifestyle-Crop.jpg" },
      { name: "Cabinets", description: "Low-profile entertainment units with cable management.", image: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?q=80&w=800&auto=format&fit=crop" },
      { name: "Sideboards", description: "Dining storage with mixed material options.", image: "https://github.com/MingzuoXiao/PZ-website/blob/main/sideboads.jpg?raw=true" },
      { name: "Media consoles", description: "Streamlined storage designed to organize electronics while elevating the living space.", image: "https://github.com/MingzuoXiao/PZ-website/blob/main/sideboads.jpg?raw=true" },
      { name: "Bookcases", description: "Clean, structural shelving crafted for organized display and architectural presence.", image: "https://github.com/MingzuoXiao/PZ-website/blob/main/sideboads.jpg?raw=true" },
      { name: "Entry cabinets", description: "Compact storage solutions built for entryways, combining utility with modern form.", image: "https://github.com/MingzuoXiao/PZ-website/blob/main/sideboads.jpg?raw=true" },
    ]
  },
  {
    id: 'seating',
    title: "Seating & Comfort Series",
    subtitle: "Dining, Lounge & Upholstery",
    description: "From complex 5-axis CNC shaped solid wood dining chairs to fully upholstered lounge seating. We handle the entire frame-to-fabric process.",
    image: "https://github.com/MingzuoXiao/PZ-website/blob/main/Seating%20&%20Comfort%20Series.jpg?raw=true",
    colSpan: "md:col-span-1",
    subCategories: [
      { name: "Dining Chairs", description: "Ergonomic solid wood frames.", image: "https://images.unsplash.com/photo-1602872030490-4a484a7b3ba6?q=80&w=1740&auto=format&fit=crop" },
      { name: "Lounge Seating", description: "Armchairs and accent chairs.", image: "https://github.com/MingzuoXiao/PZ-website/blob/main/Lounge%20Seating.jpg?raw=true" },
      { name: "Benches & Ottomans", description: "Versatile seating for entryways and dining.", image: "https://github.com/MingzuoXiao/PZ-website/blob/main/Benches%20&%20Ottomans.jpg?raw=true" },
      { name: "Accent Chairs", description: "Versatile seating for entryways and dining.", image: "https://github.com/MingzuoXiao/PZ-website/blob/main/Benches%20&%20Ottomans.jpg?raw=true" },
      { name: "Bar stools", description: "Versatile seating for entryways and dining.", image: "https://github.com/MingzuoXiao/PZ-website/blob/main/Benches%20&%20Ottomans.jpg?raw=true" }
    ]
  },
  {
    id: 'accent',
    title: "Accent Furniture Line",
    subtitle: "Occasional Tables & Decor",
    description: "Smaller scale items that pack a visual punch. This collection highlights our ability to mix materials—combining wood with brass, steel, and stone.",
    image: "https://images.unsplash.com/photo-1577140917170-285929db55cc?q=80&w=1000&auto=format&fit=crop",
    colSpan: "md:col-span-1",
    subCategories: [
      { name: "Coffee Tables", description: "Statement centerpieces.", image: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=800&auto=format&fit=crop" },
      { name: "End Tables", description: "Functional side storage.", image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=800&auto=format&fit=crop" },
      { name: "Mixed Material", description: "Wood + Metal integration.", image: "https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=1000&auto=format&fit=crop" }
    ]
  },
  {
    id: 'hospitality',
    title: "Hospitality Casegoods Program",
    subtitle: "Commercial & Hotel Solutions",
    description: "Durability meets design. We supply FF&E for hotel projects, providing contract-grade finishes, high-traffic construction, and scalable volume production.",
    image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=1000&auto=format&fit=crop",
    colSpan: "md:col-span-1",
    subCategories: [
      { name: "Guest Room Desks", description: "Hard-wearing surfaces for hotel rooms.", image: "https://images.unsplash.com/photo-1555212697-194d092e3b8f?q=80&w=800&auto=format&fit=crop" },
      { name: "Luggage Racks", description: "Solid wood functional accessories.", image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=800&auto=format&fit=crop" },
      { name: "Contract Tables", description: "Restaurant and lobby tables.", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop" }
    ]
  },
  {
    id: 'custom',
    title: "Custom OEM/ODM Studio",
    subtitle: "Bespoke Manufacturing",
    description: "Your design, our factory. This service is for brands requiring ground-up product development, prototyping, and exclusive manufacturing rights.",
    image: "https://images.unsplash.com/photo-1581092921461-eab62e97a782?q=80&w=1000&auto=format&fit=crop",
    colSpan: "md:col-span-1",
    subCategories: [
      { name: "Prototyping", description: "Rapid sampling and engineering review.", image: "https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?q=80&w=800&auto=format&fit=crop" },
      { name: "Shop Drawings", description: "Detailed CAD for production approval.", image: "https://images.unsplash.com/photo-1581093588402-e850230e670c?q=80&w=800&auto=format&fit=crop" },
      { name: "Finish Development", description: "Custom stain and lacquer matching.", image: "https://images.unsplash.com/photo-1617364852223-75f57e78dc96?q=80&w=800&auto=format&fit=crop" }
    ]
  }
];

const Collections: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeSubCategory, setActiveSubCategory] = useState<SubCategory | null>(null);

  const handleCategoryClick = (cat: Category) => {
    setActiveCategory(cat);
    setActiveSubCategory(null); // Reset subcategory when changing main category
  };

  const handleSubCategoryClick = (sub: SubCategory) => {
    if (sub.variants && sub.variants.length > 0) {
        setActiveSubCategory(sub);
    }
  };

  const handleBack = () => {
    if (activeSubCategory) {
        setActiveSubCategory(null);
    } else {
        setActiveCategory(null);
    }
  };

  return (
    <div className="pt-32 pb-20 bg-stone-50 min-h-screen">
      <div className="container mx-auto px-6 md:px-12">
        
        {/* Header Section */}
        {!activeCategory ? (
          <div className="mb-16 animate-fade-in text-center md:text-left">
             <h1 className="font-serif text-4xl md:text-6xl text-stone-900 mb-4">Collections & Capabilities</h1>
             <p className="text-stone-600 max-w-2xl text-lg font-light">
               Organized by manufacturing discipline. We specialize in <span className="text-stone-900 font-normal">pure solid wood</span> fabrication for residential and commercial applications.
             </p>
          </div>
        ) : (
          <div className="mb-12 animate-fade-in">
            <button 
              onClick={handleBack}
              className="flex items-center text-stone-500 hover:text-amber-700 transition-colors mb-6 uppercase tracking-widest text-xs font-bold"
            >
              <ArrowLeft size={16} className="mr-2" /> {activeSubCategory ? `Back to ${activeCategory.title}` : "Back to Overview"}
            </button>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between">
                <div>
                    {activeSubCategory ? (
                        <>
                            <div className="flex items-center text-amber-700 text-xs font-bold uppercase tracking-widest mb-2">
                                {activeCategory.title} <ChevronRight size={12} className="mx-2" /> {activeSubCategory.name}
                            </div>
                            <h1 className="font-serif text-4xl md:text-5xl text-stone-900 mb-2">{activeSubCategory.name}</h1>
                            <p className="text-stone-600 text-lg font-light max-w-3xl">Select a material specification below.</p>
                        </>
                    ) : (
                        <>
                            <h1 className="font-serif text-4xl md:text-5xl text-stone-900 mb-2">{activeCategory.title}</h1>
                            <p className="text-stone-600 text-lg font-light max-w-3xl">{activeCategory.description}</p>
                        </>
                    )}
                </div>
            </div>
          </div>
        )}

        {/* Level 1: Main Grid View */}
        {!activeCategory && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((cat) => (
              <div 
                key={cat.id} 
                onClick={() => handleCategoryClick(cat)}
                className="group cursor-pointer relative overflow-hidden bg-white shadow-sm hover:shadow-2xl transition-all duration-500 aspect-[4/5] md:aspect-[3/4]"
              >
                {/* Image Container */}
                <div className="absolute inset-0 w-full h-full overflow-hidden">
                  <div className="absolute inset-0 bg-stone-900/10 group-hover:bg-stone-900/0 transition-colors z-10"></div>
                  <img 
                    src={cat.image} 
                    alt={cat.title} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                </div>
                
                {/* Content Overlay */}
                <div className="absolute inset-0 z-20 flex flex-col justify-end p-8 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-transparent opacity-90 hover:opacity-100 transition-opacity">
                   <span className="text-amber-200 text-[10px] uppercase tracking-[0.2em] font-bold mb-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">0{categories.indexOf(cat) + 1} — Collection</span>
                   <h2 className="text-white font-serif text-2xl md:text-3xl mb-2 leading-tight">{cat.title}</h2>
                   <p className="text-stone-300 text-xs font-light mb-6 opacity-80 line-clamp-2">{cat.subtitle}</p>
                   
                   <div className="flex items-center text-white text-xs uppercase tracking-widest font-bold group-hover:text-amber-200 transition-colors">
                     View Products <ChevronRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Level 2: Sub Categories View */}
        {activeCategory && !activeSubCategory && (
          <div className="animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {activeCategory.subCategories.map((sub, idx) => (
                 <div 
                    key={idx} 
                    onClick={() => handleSubCategoryClick(sub)}
                    className={`group bg-white border border-stone-100 shadow-sm transition-all duration-300 ${sub.variants ? 'cursor-pointer hover:shadow-xl hover:border-amber-700/30' : ''}`}
                 >
                    <div className="aspect-[4/3] overflow-hidden bg-stone-100 relative">
                       <img 
                         src={sub.image} 
                         alt={sub.name} 
                         className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                       />
                       <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                       
                       {/* Indicator that it's clickable */}
                       {sub.variants && (
                           <div className="absolute top-4 right-4 bg-white/90 backdrop-blur text-stone-900 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                               <LayoutGrid size={16} />
                           </div>
                       )}
                    </div>
                    <div className="p-6">
                       <div className="flex justify-between items-start mb-2">
                           <h3 className="font-serif text-xl text-stone-900 group-hover:text-amber-700 transition-colors">{sub.name}</h3>
                       </div>
                       <p className="text-stone-500 text-sm leading-relaxed mb-4">{sub.description}</p>
                       {sub.variants && (
                           <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 flex items-center">
                               View {sub.variants.length} Options <ChevronRight size={12} className="ml-1" />
                           </span>
                       )}
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* Level 3: Variants View (e.g. Butcher Block Materials) */}
        {activeSubCategory && activeSubCategory.variants && (
            <div className="animate-fade-in-up">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {activeSubCategory.variants.map((variant, idx) => (
                        <div key={idx} className="bg-white border border-stone-100 shadow-sm p-6 flex flex-col h-full hover:shadow-md transition-shadow">
                            <div className="aspect-square w-full mb-6 overflow-hidden rounded-sm bg-stone-100 border border-stone-200">
                                <img 
                                    src={variant.image} 
                                    alt={variant.name} 
                                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" 
                                />
                            </div>
                            <div>
                                <h3 className="font-serif text-xl text-stone-900 mb-2">{variant.name}</h3>
                                <p className="text-stone-500 text-sm leading-relaxed">{variant.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default Collections;