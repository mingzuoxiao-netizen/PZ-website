
import { Category } from '../types';

export const categories: Category[] = [
  {
    id: 'living',
    title: "Living",
    title_zh: "客厅系列",
    subtitle: "Coffee Tables, Consoles & Storage",
    subtitle_zh: "咖啡桌、控制台 & 收纳",
    description: "Centerpieces for the home. Our living room collections blend architectural forms with functional storage, utilizing solid wood construction and premium hardware.",
    description_zh: "家庭的核心。我们的客厅系列将建筑形态与功能性收纳相结合，采用实木结构和优质五金。",
    image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/accent%20furniture.jpg?raw=true",
    colSpan: "md:col-span-1",
    subCategories: [
      { name: "Coffee Tables", name_zh: "咖啡桌", description: "Statement solid wood tables.", description_zh: "实木咖啡桌。", image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/coffe%20table.jpg?raw=true" },
      { name: "Media Consoles", name_zh: "电视柜", description: "Low-profile media storage.", description_zh: "低调的媒体收纳。", image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/Media%20Consoles.jpg?raw=true" },
      { name: "Sideboards", name_zh: "餐边柜", description: "Large format storage units.", description_zh: "大尺寸收纳单元。", image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/Sideboards.jpg?raw=true" },
      { name: "End Tables", name_zh: "边几", description: "Accent side tables.", description_zh: "装饰边几。", image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/end%20table.jpg?raw=true" },
      { name: "Entry Cabinets", name_zh: "玄关柜", description: "Console tables and cabinets.", description_zh: "控制台和储物柜。", image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/Entry%20Cabinets.jpg?raw=true" }
    ]
  },
  {
    id: 'dining',
    title: "Dining",
    title_zh: "餐厅系列",
    subtitle: "Tables & Serving",
    subtitle_zh: "餐桌 & 配餐",
    description: "Heirloom quality dining tables crafted from FAS grade North American hardwoods. Engineered for stability and finished for durability.",
    description_zh: "采用 FAS 级北美硬木打造的传世品质餐桌。结构稳固，涂装耐用。",
    image: "https://images.unsplash.com/photo-1615873968403-89e068629265?q=80&w=1000&auto=format&fit=crop",
    colSpan: "md:col-span-1",
    subCategories: [
      { name: "Dining Tables", name_zh: "餐桌", description: "Solid wood dining tables.", description_zh: "实木餐桌。", image: "https://images.unsplash.com/photo-1577140917170-285929fb55b7?q=80&w=800&auto=format&fit=crop" },
      { name: "Dining Storage", name_zh: "餐厅收纳", description: "Buffets and hutches.", description_zh: "自助餐柜和陈列柜。", image: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=800&auto=format&fit=crop" }
    ]
  },
  {
    id: 'seating',
    title: "Seating",
    title_zh: "座椅系列",
    subtitle: "Chairs, Stools & Lounge",
    subtitle_zh: "椅子、凳子 & 休闲椅",
    description: "Complex joinery meets ergonomic comfort. From 5-axis CNC machined dining chairs to upholstered lounge seating.",
    description_zh: "复杂榫卯与人体工学舒适度的结合。从五轴 CNC 加工的餐椅到软包休闲座椅。",
    image: "https://github.com/MingzuoXiao/PZ-website/blob/main/Seating%20&%20Comfort%20Series.jpg?raw=true",
    colSpan: "md:col-span-1",
    subCategories: [
      { name: "Dining Chairs", name_zh: "餐椅", description: "CNC crafted frames.", description_zh: "CNC 工艺框架。", image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/Dining%20Chair.jpg?raw=true" },
      { name: "Lounge Chairs", name_zh: "休闲椅", description: "Armchairs and accent seating.", description_zh: "扶手椅和休闲座椅。", image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/lounge%20Chair.jpg?raw=true" },
      { name: "Bar Stools", name_zh: "吧台椅", description: "Counter and bar height.", description_zh: "吧台高度。", image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/bar%20stools.jpg?raw=true" },
      { name: "Benches", name_zh: "长凳", description: "Entry and dining benches.", description_zh: "玄关和餐厅长凳。", image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/bench%20Ottoman.jpg?raw=true" }
    ]
  },
  {
    id: 'workspace',
    title: "Workspace",
    title_zh: "办公系列",
    subtitle: "Desks & Meeting Tables",
    subtitle_zh: "书桌 & 会议桌",
    description: "Productivity meets craftsmanship. Solid wood desks and work surfaces designed for the modern office and home study.",
    description_zh: "生产力与工艺的相遇。专为现代办公室和家庭书房设计的实木书桌和工作台面。",
    image: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=1000&auto=format&fit=crop",
    colSpan: "md:col-span-1",
    subCategories: [
      { name: "Desks", name_zh: "书桌", description: "Writing and executive desks.", description_zh: "书写桌和行政桌。", image: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=800&auto=format&fit=crop" },
      { name: "Work Surfaces", name_zh: "工作台面", description: "Butcher block tops.", description_zh: "层压实木台面。", image: "https://d332p1w15mxdmm.cloudfront.net/15-thick-walnut-blended-grain-countertop-25-wide-5fdbde66e3a22.jpg" },
      { name: "Shelving", name_zh: "置物架", description: "Bookcases and wall shelves.", description_zh: "书柜和墙面搁板。", image: "https://github.com/mingzuoxiao-netizen/pz-picture/blob/main/bookcase.jpg?raw=true" }
    ]
  },
  {
    id: 'hospitality',
    title: "Hospitality",
    title_zh: "酒店工程",
    subtitle: "Contract Grade FF&E",
    subtitle_zh: "工程级 FF&E",
    description: "Scalable manufacturing for hotels and commercial projects. Durable finishes and construction meeting contract standards.",
    description_zh: "面向酒店和商业项目的可扩展制造。符合工程标准的耐用涂装和结构。",
    image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=1000&auto=format&fit=crop",
    colSpan: "md:col-span-1",
    subCategories: [
      { name: "Guest Room", name_zh: "客房家具", description: "Desks, headboards, nightstands.", description_zh: "书桌、床头板、床头柜。", image: "https://images.unsplash.com/photo-1555212697-194d092e3b8f?q=80&w=800&auto=format&fit=crop" },
      { name: "Lobby & Public", name_zh: "大堂 & 公共区域", description: "Lounge seating and tables.", description_zh: "休息座椅和桌子。", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop" },
      { name: "Accessories", name_zh: "配件", description: "Luggage racks, mirrors.", description_zh: "行李架、镜子。", image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=800&auto=format&fit=crop" }
    ]
  }
];
