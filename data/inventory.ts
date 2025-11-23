import { Category } from '../types';

export const categories: Category[] = [
  {
    id: 'essentials',
    title: "Solid Wood Essentials",
    title_zh: "实木基础系列",
    subtitle: "Butcher Block & Surfaces",
    subtitle_zh: "层压实木 & 台面",
    description: "The foundation of our manufacturing capability. We process FAS grade North American lumber into premium architectural surfaces, countertops, and heavy-duty workbenches.",
    description_zh: "我们制造能力的基础。我们将 FAS 级北美木材加工成优质的建筑表面、台面和重型工作台。",
    image: "https://images.unsplash.com/photo-1628797285815-453c1d0d21e3?q=80&w=774&auto=format&fit=crop",
    colSpan: "md:col-span-1",
    subCategories: [
      { 
        name: "Butcher Block Tops", 
        name_zh: "层压砧板台面",
        description: "Edge-grain and End-grain construction. Click to view material options.", 
        description_zh: "直纹和端纹结构。点击查看材质选项。",
        image: "https://d332p1w15mxdmm.cloudfront.net/15-thick-walnut-blended-grain-countertop-25-wide-5fdbde66e3a22.jpg",
        variants: [
            {
                name: "Black Walnut",
                name_zh: "黑胡桃木",
                description: "North American Black Walnut. Rich, dark chocolate tones. The gold standard for luxury kitchen islands and workbench tops.",
                description_zh: "北美黑胡桃。浓郁的黑巧克力色调。豪华厨房岛台和工作台面的黄金标准。",
                image: "https://d332p1w15mxdmm.cloudfront.net/15-thick-walnut-blended-grain-countertop-25-wide-5fdbde66e3a22.jpg"
            },
            {
                name: "White Oak",
                name_zh: "白橡木",
                description: "American White Oak. Heavy, dense, and rot-resistant. Features distinctive straight grain patterns popular in modern design.",
                description_zh: "美国白橡。厚重、致密且防腐。具有现代设计中流行的独特直纹图案。",
                image: "https://i8.amplience.net/i/flooranddecor/100020619_white-oak-butcher-block-countertop-8ft_1?fmt=auto&qlt=85"
            },
            {
                name: "Hard Maple",
                name_zh: "硬枫木",
                description: "Rock Maple. The traditional choice for professional butcher blocks due to its extreme density, sanitary properties, and light color.",
                description_zh: "岩枫。因其极高的密度、卫生特性和浅色调，成为专业砧板的传统选择。",
                image: "https://github.com/MingzuoXiao/PZ-website/blob/main/maple.png?raw=true"
            },
            {
                name: "Acacia",
                name_zh: "相思木",
                description: "Sustainable Plantation Acacia. A cost-effective hardwood with dynamic, contrasting grain patterns and warm golden hues.",
                description_zh: "可持续种植相思木。一种性价比高的硬木，具有动态、对比鲜明的纹理和温暖的金色调。",
                image: "https://lumberliquidators.com/cdn/shop/files/10049364_sw_jofirv.jpg?v=1763537742&width=900"
            },
            {
                name: "Teak",
                name_zh: "柚木",
                description: "Golden Teak. Naturally high oil content makes it incredibly water resistant. Ideal for wet environments and bathroom vanities.",
                description_zh: "金柚木。天然的高含油量使其具有惊人的防水性。非常适合潮湿环境和浴室柜。",
                image: "https://lumberliquidators.com/cdn/shop/files/10041887_sw.jpg?v=1763537456&width=900"
            },
            {
                name: "Birch",
                name_zh: "桦木",
                description: "Light, clean, and strong—ideal for minimal and Scandinavian designs.",
                description_zh: "轻盈、干净且坚固——极简主义和斯堪的纳维亚设计的理想选择。",
                image: "https://cabinetstogo.com/cdn/shop/products/AMBB12_main-01_600x.jpg?v=1575351887"
            },
            {
                name: "Bamboo",
                name_zh: "竹材",
                description: "Eco-friendly, strong, and sleek with a contemporary uniform texture.",
                description_zh: "环保、坚固且时尚，具有现代统一的质感。",
                image: "https://i8.amplience.net/i/flooranddecor/100892876_premium-carbonized-solid-bamboo_display?fmt=auto&qlt=85"
            },
            {
                name: "Saman w/t Live Edge",
                name_zh: "雨豆木 (自然边)",
                description: "Saman hardwood meets a sculpted live edge, blending refined craftsmanship with the untouched beauty of nature.",
                description_zh: "雨豆硬木结合雕刻般的自然边缘，将精致工艺与大自然的原始之美融为一体。",
                image: "https://github.com/MingzuoXiao/PZ-website/blob/main/saman.png?raw=true"
            }
            
        ]
      },
      { 
          name: "Floating Shelves", 
          name_zh: "悬浮搁板",
          description: "Solid architectural shelving with concealed hardware.", 
          description_zh: "带有隐藏式五金件的实木建筑搁板。",
          image: "https://cdn-media.cabinetparts.com/74c6b1cb-6338-4793-9934-56a163f28079.jpg?p=port-xl" 
      }
    ]
  },
  {
    id: 'casegoods',
    title: "Modern Casegoods",
    title_zh: "现代柜类",
    subtitle: "Bedroom & Storage Systems",
    subtitle_zh: "卧室 & 收纳系统",
    description: "A comprehensive range of cabinetry and large-format furniture. Featuring precision joinery, grain-matched drawer fronts, and high-quality hardware integration.",
    description_zh: "全面的橱柜和大尺寸家具系列。特点包括精密榫卯、纹理匹配的抽屉面板和高品质五金集成。",
    image: "https://github.com/MingzuoXiao/PZ-website/blob/main/Modern%20Casegoods%20Collection.jpg?raw=true",
    colSpan: "md:col-span-1",
    subCategories: [
      { name: "Nightstands", name_zh: "床头柜", description: "Heirloom construction with soft-close hardware.", description_zh: "传世结构，配有缓冲五金。", image: "https://res.cloudinary.com/castlery/image/private/w_1995,f_auto,q_auto,b_rgb:F3F3F3,c_fit/v1638241672/crusader/variants/PB-BR0050/Seb-Bedside-Table-Lifestyle-Crop.jpg" },
      { name: "Cabinets", name_zh: "储物柜", description: "Low-profile entertainment units with cable management.", description_zh: "带理线功能的低调娱乐单元。", image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/cabinet.jpg?raw=true" },
      { name: "Sideboards", name_zh: "餐边柜", description: "Dining storage with mixed material options.", description_zh: "多种材质选择的餐厅收纳。", image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/Sideboards.jpg?raw=true" },
      { name: "Media Consoles", name_zh: "电视柜", description: "Streamlined storage designed to organize electronics while elevating the living space.", description_zh: "流线型收纳设计，整理电子设备的同时提升生活空间。", image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/Media%20Consoles.jpg?raw=true" },
      { name: "Bookcases", name_zh: "书柜", description: "Clean, structural shelving crafted for organized display and architectural presence.", description_zh: "简洁、结构化的搁架，专为有序展示和建筑感而打造。", image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/bookcase.jpg?raw=true" },
      { name: "Entry Cabinets", name_zh: "玄关柜", description: "Compact storage solutions built for entryways, combining utility with modern form.", description_zh: "专为玄关打造的紧凑收纳方案，结合了实用性与现代形态。", image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/Entry%20Cabinets.jpg?raw=true" },
    ]
  },
  {
    id: 'seating',
    title: "Seating & Comfort",
    title_zh: "座椅与舒适",
    subtitle: "Dining, Lounge & Upholstery",
    subtitle_zh: "餐厅、休闲 & 软体",
    description: "From complex 5-axis CNC shaped solid wood dining chairs to fully upholstered lounge seating. We handle the entire frame-to-fabric process.",
    description_zh: "从复杂的五轴 CNC 成型实木餐椅到全软包休闲座椅。我们处理从框架到面料的整个过程。",
    image: "https://github.com/MingzuoXiao/PZ-website/blob/main/Seating%20&%20Comfort%20Series.jpg?raw=true",
    colSpan: "md:col-span-1",
    subCategories: [
      { name: "Dining Chairs", name_zh: "餐椅", description: "Ergonomic solid wood frames.", description_zh: "人体工学实木框架。", image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/Dining%20Chair.jpg?raw=true" },
      { name: "Lounge Seating", name_zh: "休闲椅", description: "Armchairs and accent chairs.", description_zh: "扶手椅和休闲椅。", image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/lounge%20Chair.jpg?raw=true" },
      { name: "Benches & Ottomans", name_zh: "长凳 & 脚踏", description: "Versatile seating for entryways and dining.", description_zh: "适用于玄关和餐厅的多功能座椅。", image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/bench%20Ottoman.jpg?raw=true" },
      { name: "Accent Chairs", name_zh: "单人沙发椅", description: "Statement pieces with unique profiles.", description_zh: "具有独特轮廓的标志性单品。", image: "https://github.com/MingzuoXiao/PZ-website/blob/main/Benches%20&%20Ottomans.jpg?raw=true" },
      { name: "Bar Stools", name_zh: "吧台椅", description: "Elevated seating for counters and bars.", description_zh: "适用于柜台和酒吧的高脚座椅。", image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/bar%20stools.jpg?raw=true" }
    ]
  },
  {
    id: 'accent',
    title: "Accent Living",
    title_zh: "点缀生活",
    subtitle: "Occasional Tables & Decor",
    subtitle_zh: "茶几 & 装饰",
    description: "Smaller scale items that pack a visual punch. This collection highlights our ability to mix materials—combining wood with brass, steel, and stone.",
    description_zh: "视觉冲击力强的小型单品。该系列突显了我们要混合材质的能力——将木材与黄铜、钢材和石材结合。",
    image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/accent%20furniture.jpg?raw=true",
    colSpan: "md:col-span-1",
    subCategories: [
      { name: "Coffee Tables", name_zh: "咖啡桌", description: "Statement centerpieces.", description_zh: "客厅的焦点中心。", image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/coffe%20table.jpg?raw=true" },
      { name: "End Tables", name_zh: "边几", description: "Functional side storage.", description_zh: "功能性侧边收纳。", image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/end%20table.jpg?raw=true" },
      { name: "Mixed Material", name_zh: "混合材质", description: "Wood + Metal integration.", description_zh: "木材 + 金属集成。", image: "https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=1000&auto=format&fit=crop" }
    ]
  },
  {
    id: 'hospitality',
    title: "Hospitality Program",
    title_zh: "酒店工程",
    subtitle: "Commercial & Hotel Solutions",
    subtitle_zh: "商业 & 酒店解决方案",
    description: "Durability meets design. We supply FF&E for hotel projects, providing contract-grade finishes, high-traffic construction, and scalable volume production.",
    description_zh: "耐用性与设计的结合。我们为酒店项目供应家具（FF&E），提供工程级表面处理、高流量结构和可扩展的量产能力。",
    image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=1000&auto=format&fit=crop",
    colSpan: "md:col-span-1",
    subCategories: [
      { name: "Guest Room Desks", name_zh: "客房书桌", description: "Hard-wearing surfaces for hotel rooms.", description_zh: "适用于酒店房间的耐磨表面。", image: "https://images.unsplash.com/photo-1555212697-194d092e3b8f?q=80&w=800&auto=format&fit=crop" },
      { name: "Luggage Racks", name_zh: "行李架", description: "Solid wood functional accessories.", description_zh: "实木功能性配件。", image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=800&auto=format&fit=crop" },
      { name: "Contract Tables", name_zh: "工程桌", description: "Restaurant and lobby tables.", description_zh: "餐厅和大堂桌子。", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop" }
    ]
  },
  {
    id: 'custom',
    title: "OEM/ODM Studio",
    title_zh: "OEM/ODM 工作室",
    subtitle: "Bespoke Manufacturing",
    subtitle_zh: "定制制造",
    description: "Your design, our factory. This service is for brands requiring ground-up product development, prototyping, and exclusive manufacturing rights.",
    description_zh: "您的设计，我们的工厂。此服务专为需要从零开始进行产品开发、打样和独家制造权的品牌而设。",
    image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/oem.jpg?raw=true",
    colSpan: "md:col-span-1",
    subCategories: [
      { name: "Prototyping", name_zh: "快速打样", description: "Rapid sampling and engineering review.", description_zh: "快速打样和工程评审。", image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/%E6%89%93%E6%A0%B7.jpg?raw=true" },
      { name: "Shop Drawings", name_zh: "深化图纸", description: "Detailed CAD for production approval.", description_zh: "用于生产审批的详细 CAD 图纸。", image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/%E7%94%BB%E5%9B%BE.jpg?raw=true" },
      { name: "Finish Development", name_zh: "涂装研发", description: "Custom stain and lacquer matching.", description_zh: "定制色漆和清漆匹配。", image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/finish.jpg?raw=true" }
    ]
  }
];