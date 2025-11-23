
import { Category } from '../types';

export const categories: Category[] = [
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
