
import { Category } from '../types';

export const categories: Category[] = [
  {
    id: 'tables',
    title: "Tables",
    title_zh: "桌类系列",
    subtitle: "Coffee, Dining and Workspace",
    subtitle_zh: "咖啡桌、餐桌 & 工作台",
    description: "A comprehensive collection of solid wood tables ranging from functional nesting sets to grand extending dining tables.",
    description_zh: "一系列实木桌类产品，涵盖功能性套桌到大型伸缩餐桌。",
    image: "https://images.unsplash.com/photo-1615873968403-89e068629265?q=80&w=1000&auto=format&fit=crop",
    colSpan: "md:col-span-1",
    subCategories: [
      { 
        name: "Coffee Table", 
        name_zh: "咖啡桌", 
        description: "Available in Round, Square, Storage, and Nesting configurations.", 
        description_zh: "提供圆形、方形、带储物及套桌配置。", 
        image: "https://images.unsplash.com/photo-1532372320572-cda25653a26d?q=80&w=800&auto=format&fit=crop" 
      },
      { 
        name: "Side Table", 
        name_zh: "边几", 
        description: "Compact accent tables for living spaces.", 
        description_zh: "适用于生活空间的紧凑型装饰边几。", 
        image: "https://images.unsplash.com/photo-1499933374294-4584851497cc?q=80&w=800&auto=format&fit=crop" 
      },
      { 
        name: "Console Table", 
        name_zh: "玄关台", 
        description: "Slim tables for entryways and corridors.", 
        description_zh: "适用于入口和走廊的细长桌。", 
        image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&auto=format&fit=crop" 
      },
      { 
        name: "Dining Table", 
        name_zh: "餐桌", 
        description: "Solid wood centerpieces for dining rooms.", 
        description_zh: "餐厅的实木核心家具。", 
        image: "https://images.unsplash.com/photo-1577140917170-285929fb55b7?q=80&w=800&auto=format&fit=crop" 
      },
      { 
        name: "Extending Dining Table", 
        name_zh: "伸缩餐桌", 
        description: "Versatile tables with extension mechanisms.", 
        description_zh: "带有伸缩机制的多功能餐桌。", 
        image: "https://images.unsplash.com/photo-1615873968403-89e068629265?q=80&w=800&auto=format&fit=crop" 
      },
      { 
        name: "Writing Desk", 
        name_zh: "书桌", 
        description: "Elegant workspaces for home and office.", 
        description_zh: "适用于家庭和办公室的优雅工作空间。", 
        image: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=800&auto=format&fit=crop" 
      }
    ]
  },
  {
    id: 'cabinetry',
    title: "Cabinetry",
    title_zh: "储物柜类",
    subtitle: "Storage and Casegoods",
    subtitle_zh: "收纳 & 箱体家具",
    description: "Precision-crafted storage solutions featuring dovetail joinery and premium hardware.",
    description_zh: "采用燕尾榫工艺和优质五金打造的精密收纳解决方案。",
    image: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=1000&auto=format&fit=crop",
    colSpan: "md:col-span-1",
    subCategories: [
      { 
        name: "Sideboard Cabinet", 
        name_zh: "餐边柜", 
        description: "Large format storage for dining areas.", 
        description_zh: "餐厅区域的大尺寸收纳柜。", 
        image: "https://images.unsplash.com/photo-1601366533287-59b97d47970f?q=80&w=800&auto=format&fit=crop" 
      },
      { 
        name: "Storage Cabinet", 
        name_zh: "储物柜", 
        description: "Vertical storage units.", 
        description_zh: "垂直收纳单元。", 
        image: "https://images.unsplash.com/photo-1595515106968-b43729abb64b?q=80&w=800&auto=format&fit=crop" 
      },
      { 
        name: "Nightstand", 
        name_zh: "床头柜", 
        description: "Bedside storage with drawers.", 
        description_zh: "带抽屉的床头收纳。", 
        image: "https://images.unsplash.com/photo-1532323544230-7191fd510c59?q=80&w=800&auto=format&fit=crop" 
      },
      { 
        name: "Chest", 
        name_zh: "斗柜", 
        description: "Tall chests of drawers.", 
        description_zh: "高斗柜。", 
        image: "https://images.unsplash.com/photo-1505693416388-b03463149f13?q=80&w=800&auto=format&fit=crop" 
      },
      { 
        name: "Dresser", 
        name_zh: "梳妆台", 
        description: "Wide drawers for bedroom storage.", 
        description_zh: "用于卧室收纳的宽抽屉柜。", 
        image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=800&auto=format&fit=crop" 
      },
      { 
        name: "Wardrobe", 
        name_zh: "衣柜", 
        description: "Full-height clothing storage.", 
        description_zh: "全高衣物收纳。", 
        image: "https://images.unsplash.com/photo-1558997519-83ea9252edf8?q=80&w=800&auto=format&fit=crop" 
      }
    ]
  },
  {
    id: 'veneer',
    title: "Veneer Series",
    title_zh: "高端木皮系列",
    subtitle: "Burl and Lila Collection",
    subtitle_zh: "树瘤木皮 & Lila 系列",
    description: "Exquisite veneer work showcasing rare wood figures, including Burl and specialized collections.",
    description_zh: "展示珍稀木材纹理的精致木皮工艺，包括树瘤木皮和特色系列。",
    image: "https://images.unsplash.com/photo-1505693314120-0d443867891c?q=80&w=1000&auto=format&fit=crop",
    colSpan: "md:col-span-1",
    subCategories: [
      { 
        name: "Burl Veneer Furniture", 
        name_zh: "树瘤木皮家具", 
        description: "Furniture featuring distinct Burl wood patterns.", 
        description_zh: "具有独特树瘤纹理的家具。", 
        image: "https://images.unsplash.com/photo-1543512214-318c77a799bf?q=80&w=800&auto=format&fit=crop" 
      },
      { 
        name: "Lila Furniture", 
        name_zh: "Lila 系列", 
        description: "Signature collection including nightstands and dressers.", 
        description_zh: "包含床头柜和梳妆台的标志性系列。", 
        image: "https://images.unsplash.com/photo-1505693416388-b03463149f13?q=80&w=800&auto=format&fit=crop" 
      }
    ]
  },
  {
    id: 'seating',
    title: "Seating",
    title_zh: "座椅系列",
    subtitle: "Accent Chairs",
    subtitle_zh: "休闲椅",
    description: "Upholstered accent chairs designed for comfort and style.",
    description_zh: "专为舒适和风格设计的软包休闲椅。",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1000&auto=format&fit=crop",
    colSpan: "md:col-span-1",
    subCategories: [
      { 
        name: "Accent Chair", 
        name_zh: "休闲椅", 
        description: "Statement seating with solid wood frames.", 
        description_zh: "带实木框架的特色座椅。", 
        image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?q=80&w=800&auto=format&fit=crop" 
      }
    ]
  },
  {
    id: 'surfaces',
    title: "Butcher Block",
    title_zh: "层压木台面",
    subtitle: "Solid Wood Tops",
    subtitle_zh: "实木台面",
    description: "Heavy-duty butcher block surfaces for industrial and kitchen applications.",
    description_zh: "用于工业和厨房应用的重型层压木台面。",
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1000&auto=format&fit=crop",
    colSpan: "md:col-span-1",
    subCategories: [
      { 
        name: "Butcher Block", 
        name_zh: "层压木", 
        description: "Durable edge-grain or end-grain tops.", 
        description_zh: "耐用的侧纹或端纹台面。", 
        image: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=800&auto=format&fit=crop" 
      }
    ]
  }
];
