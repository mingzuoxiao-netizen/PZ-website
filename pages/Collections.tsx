
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronRight, LayoutGrid, Home } from 'lucide-react';
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
    title: "Modern Casegoods",
    subtitle: "Bedroom & Storage Systems",
    description: "A comprehensive range of cabinetry and large-format furniture. Featuring precision joinery, grain-matched drawer fronts, and high-quality hardware integration.",
    image: "https://github.com/MingzuoXiao/PZ-website/blob/main/Modern%20Casegoods%20Collection.jpg?raw=true",
    colSpan: "md:col-span-1",
    subCategories: [
      { name: "Nightstands", description: "Heirloom construction with soft-close hardware.", image: "https://res.cloudinary.com/castlery/image/private/w_1995,f_auto,q_auto,b_rgb:F3F3F3,c_fit/v1638241672/crusader/variants/PB-BR0050/Seb-Bedside-Table-Lifestyle-Crop.jpg" },
      { name: "Cabinets", description: "Low-profile entertainment units with cable management.", image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/cabinet.jpg?raw=true" },
      { name: "Sideboards", description: "Dining storage with mixed material options.", image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/Sideboards.jpg?raw=true" },
      { name: "Media Consoles", description: "Streamlined storage designed to organize electronics while elevating the living space.", image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/Media%20Consoles.jpg?raw=true" },
      { name: "Bookcases", description: "Clean, structural shelving crafted for organized display and architectural presence.", image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/bookcase.jpg?raw=true" },
      { name: "Entry Cabinets", description: "Compact storage solutions built for entryways, combining utility with modern form.", image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/Entry%20Cabinets.jpg?raw=true" },
    ]
  },
  {
    id: 'seating',
    title: "Seating & Comfort",
    subtitle: "Dining, Lounge & Upholstery",
    description: "From complex 5-axis CNC shaped solid wood dining chairs to fully upholstered lounge seating. We handle the entire frame-to-fabric process.",
    image: "https://github.com/MingzuoXiao/PZ-website/blob/main/Seating%20&%20Comfort%20Series.jpg?raw=true",
    colSpan: "md:col-span-1",
    subCategories: [
      { name: "Dining Chairs", description: "Ergonomic solid wood frames.", image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/Dining%20Chair.jpg?raw=true" },
      { name: "Lounge Seating", description: "Armchairs and accent chairs.", image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/lounge%20Chair.jpg?raw=true" },
      { name: "Benches & Ottomans", description: "Versatile seating for entryways and dining.", image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/bench%20Ottoman.jpg?raw=true" },
      { name: "Accent Chairs", description: "Statement pieces with unique profiles.", image: "https://github.com/MingzuoXiao/PZ-website/blob/main/Benches%20&%20Ottomans.jpg?raw=true" },
      { name: "Bar Stools", description: "Elevated seating for counters and bars.", image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/bar%20stools.jpg?raw=true" }
    ]
  },
  {
    id: 'accent',
    title: "Accent Living",
    subtitle: "Occasional Tables & Decor",
    description: "Smaller scale items that pack a visual punch. This collection highlights our ability to mix materials—combining wood with brass, steel, and stone.",
    image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/accent%20furniture.jpg?raw=true",
    colSpan: "md:col-span-1",
    subCategories: [
      { name: "Coffee Tables", description: "Statement centerpieces.", image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/coffe%20table.jpg?raw=true" },
      { name: "End Tables", description: "Functional side storage.", image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/end%20table.jpg?raw=true" },
      { name: "Mixed Material", description: "Wood + Metal integration.", image: "https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=1000&auto=format&fit=crop" }
    ]
  },
  {
    id: 'hospitality',
    title: "Hospitality Program",
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
    title: "OEM/ODM Studio",
    subtitle: "Bespoke Manufacturing",
    description: "Your design, our factory. This service is for brands requiring ground-up product development, prototyping, and exclusive manufacturing rights.",
    image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/oem.jpg?raw=true",
    colSpan: "md:col-span-1",
    subCategories: [
      { name: "Prototyping", description: "Rapid sampling and engineering review.", image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/%E6%89%93%E6%A0%B7.jpg?raw=true" },
      { name: "Shop Drawings", description: "Detailed CAD for production approval.", image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/%E7%94%BB%E5%9B%BE.jpg?raw=true" },
      { name: "Finish Development", description: "Custom stain and lacquer matching.", image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/finish.jpg?raw=true" }
    ]
  }
];

const Collections: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeSubCategory, setActiveSubCategory] = useState<SubCategory | null>(null);

  // Scroll to top when switching main categories
  useEffect(() => {
    if (activeCategory) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeCategory]);

  const handleCategoryClick = (cat: Category) => {
    setActiveCategory(cat);
    setActiveSubCategory(null);
  };

  const handleSubCategoryClick = (sub: SubCategory) => {
    if (sub.variants && sub.variants.length > 0) {
        setActiveSubCategory(sub);
    }
  };

  const resetToOverview = () => {
    setActiveCategory(null);
    setActiveSubCategory(null);
  };

  const resetToCategory = () => {
    setActiveSubCategory(null);
  };

  // Breadcrumb Component
  const Breadcrumbs = () => (
    <div className="flex items-center text-xs font-bold uppercase tracking-widest text-stone-500 mb-8 overflow-x-auto whitespace-nowrap pb-2">
      <button onClick={resetToOverview} className="hover:text-amber-700 flex items-center transition-colors">
        <Home size={12} className="mr-2" /> Collections
      </button>
      
      {activeCategory && (
        <>
          <ChevronRight size={12} className="mx-3 text-stone-300" />
          <button 
            onClick={resetToCategory} 
            className={`transition-colors ${activeSubCategory ? 'hover:text-amber-700' : 'text-stone-900 cursor-default'}`}
          >
            {activeCategory.title}
          </button>
        </>
      )}

      {activeSubCategory && (
        <>
          <ChevronRight size={12} className="mx-3 text-stone-300" />
          <span className="text-stone-900">{activeSubCategory.name}</span>
        </>
      )}
    </div>
  );

  return (
    <div className="pt-32 pb-20 bg-stone-50 min-h-screen">
      <div className="container mx-auto px-6 md:px-12">
        
        {/* Header Section (Only shown on overview) */}
        {!activeCategory && (
          <div className="mb-16 animate-fade-in text-center md:text-left">
             <h1 className="font-serif text-4xl md:text-6xl text-stone-900 mb-4">Collections & Capabilities</h1>
             <p className="text-stone-600 max-w-2xl text-lg font-light">
               Organized by manufacturing discipline. We specialize in <span className="text-stone-900 font-normal">pure solid wood</span> fabrication for residential and commercial applications.
             </p>
          </div>
        )}

        {/* Level 1: Main Grid View (Overview) */}
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

        {/* Level 2 & 3: Category Detail View with Sidebar */}
        {activeCategory && (
          <div className="animate-fade-in">
            <Breadcrumbs />
            
            <div className="flex flex-col lg:flex-row gap-12">
                
                {/* Sidebar Navigation (Desktop) */}
                <aside className="hidden lg:block w-64 shrink-0">
                    <div className="sticky top-32">
                        <h3 className="font-serif text-2xl text-stone-900 mb-6 px-4 border-l-4 border-amber-700">{activeCategory.title}</h3>
                        <nav className="flex flex-col space-y-1">
                            <button 
                                onClick={resetToCategory}
                                className={`text-left px-4 py-3 text-sm uppercase tracking-wider font-bold transition-all border-l-2
                                    ${!activeSubCategory 
                                        ? 'border-stone-900 text-stone-900 bg-white shadow-sm' 
                                        : 'border-transparent text-stone-500 hover:text-stone-900 hover:bg-stone-100'
                                    }`}
                            >
                                Overview
                            </button>
                            {activeCategory.subCategories.map((sub, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSubCategoryClick(sub)}
                                    disabled={!sub.variants} // Disable if no variants to show? Or maybe just show details. 
                                    className={`text-left px-4 py-3 text-sm transition-all border-l-2 flex justify-between items-center group
                                        ${activeSubCategory?.name === sub.name
                                            ? 'border-stone-900 text-stone-900 bg-white shadow-sm font-bold'
                                            : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                                        }
                                        ${!sub.variants ? 'opacity-50 cursor-default' : ''}
                                    `}
                                >
                                    {sub.name}
                                    {sub.variants && (
                                        <ChevronRight size={12} className={`opacity-0 group-hover:opacity-100 transition-opacity ${activeSubCategory?.name === sub.name ? 'opacity-100 text-amber-700' : ''}`} />
                                    )}
                                </button>
                            ))}
                        </nav>
                        
                        <div className="mt-12 p-6 bg-stone-100 rounded-sm">
                            <h4 className="font-serif text-stone-900 mb-2">Need a Catalog?</h4>
                            <p className="text-xs text-stone-500 mb-4 leading-relaxed">Download our full PDF specification sheet for this collection.</p>
                            <button className="text-xs font-bold uppercase tracking-widest text-amber-700 hover:text-stone-900 transition-colors">Download PDF</button>
                        </div>
                    </div>
                </aside>

                {/* Mobile Subcategory Menu (Horizontal Scroll) */}
                <div className="lg:hidden mb-8 -mx-6 px-6 overflow-x-auto">
                    <div className="flex space-x-2">
                        <button 
                            onClick={resetToCategory}
                            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap border transition-colors
                                ${!activeSubCategory ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-600 border-stone-200'}`}
                        >
                            Overview
                        </button>
                        {activeCategory.subCategories.map((sub, idx) => sub.variants && (
                            <button
                                key={idx}
                                onClick={() => handleSubCategoryClick(sub)}
                                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap border transition-colors
                                    ${activeSubCategory?.name === sub.name ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-600 border-stone-200'}`}
                            >
                                {sub.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 min-h-[500px]">
                    {activeSubCategory ? (
                        // Level 3: Variants View
                        <div className="animate-fade-in-up">
                            <div className="mb-8 border-b border-stone-200 pb-8">
                                <h2 className="font-serif text-4xl text-stone-900 mb-4">{activeSubCategory.name}</h2>
                                <p className="text-stone-600 text-lg font-light leading-relaxed max-w-2xl">{activeSubCategory.description}</p>
                            </div>

                            <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-6">Available Specifications</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {activeSubCategory.variants?.map((variant, idx) => (
                                    <div key={idx} className="bg-white group border border-stone-100 hover:border-amber-700/20 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full">
                                        <div className="aspect-[4/3] w-full overflow-hidden bg-stone-100 relative">
                                            <img 
                                                src={variant.image} 
                                                alt={variant.name} 
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"></div>
                                        </div>
                                        <div className="p-6 flex-grow flex flex-col justify-center">
                                            <h3 className="font-serif text-xl text-stone-900 mb-2">{variant.name}</h3>
                                            <p className="text-stone-500 text-sm leading-relaxed">{variant.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        // Level 2: Subcategories Grid (Overview)
                        <div className="animate-fade-in">
                            <div className="mb-10">
                                <h2 className="font-serif text-4xl text-stone-900 mb-4">{activeCategory.title}</h2>
                                <p className="text-stone-600 text-lg font-light leading-relaxed">{activeCategory.description}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                               {activeCategory.subCategories.map((sub, idx) => (
                                 <div 
                                    key={idx} 
                                    onClick={() => handleSubCategoryClick(sub)}
                                    className={`group bg-white border border-stone-100 shadow-sm transition-all duration-300 ${sub.variants ? 'cursor-pointer hover:shadow-xl hover:border-amber-700/30' : 'opacity-80'}`}
                                 >
                                    <div className="aspect-[4/3] overflow-hidden bg-stone-100 relative">
                                       <img 
                                         src={sub.image} 
                                         alt={sub.name} 
                                         className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                       />
                                       <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                                       
                                       {sub.variants && (
                                           <div className="absolute top-4 right-4 bg-white/90 backdrop-blur text-stone-900 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                                               <LayoutGrid size={16} />
                                           </div>
                                       )}
                                    </div>
                                    <div className="p-6">
                                       <h3 className="font-serif text-xl text-stone-900 group-hover:text-amber-700 transition-colors mb-2">{sub.name}</h3>
                                       <p className="text-stone-500 text-sm leading-relaxed mb-4">{sub.description}</p>
                                       {sub.variants && (
                                           <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 flex items-center group-hover:translate-x-1 transition-transform">
                                               View {sub.variants.length} Options <ChevronRight size={12} className="ml-1" />
                                           </span>
                                       )}
                                    </div>
                                 </div>
                               ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Collections;
