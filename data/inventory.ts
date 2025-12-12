
import { Category } from '../types';

export const categories: Category[] = [
  {
    id: 'tables',
    title: "Tables",
    subtitle: "Coffee, Dining and Workspace",
    description: "A comprehensive collection of solid wood tables ranging from functional nesting sets to grand extending dining tables.",
    image: "https://images.unsplash.com/photo-1615873968403-89e068629265?q=80&w=1000&auto=format&fit=crop",
    colSpan: "md:col-span-1",
    subCategories: [
      { 
        name: "Coffee Table", 
        description: "Available in Round, Square, Storage, and Nesting configurations.", 
        image: "https://images.unsplash.com/photo-1532372320572-cda25653a26d?q=80&w=800&auto=format&fit=crop" 
      },
      { 
        name: "Side Table", 
        description: "Compact accent tables for living spaces.", 
        image: "https://images.unsplash.com/photo-1499933374294-4584851497cc?q=80&w=800&auto=format&fit=crop" 
      },
      { 
        name: "Console Table", 
        description: "Slim tables for entryways and corridors.", 
        image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&auto=format&fit=crop" 
      },
      { 
        name: "Dining Table", 
        description: "Solid wood centerpieces for dining rooms.", 
        image: "https://images.unsplash.com/photo-1577140917170-285929fb55b7?q=80&w=800&auto=format&fit=crop" 
      },
      { 
        name: "Extending Dining Table", 
        description: "Versatile tables with extension mechanisms.", 
        image: "https://images.unsplash.com/photo-1615873968403-89e068629265?q=80&w=800&auto=format&fit=crop" 
      },
      { 
        name: "Writing Desk", 
        description: "Elegant workspaces for home and office.", 
        image: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=800&auto=format&fit=crop" 
      }
    ]
  },
  {
    id: 'cabinetry',
    title: "Cabinetry",
    subtitle: "Storage and Casegoods",
    description: "Precision-crafted storage solutions featuring dovetail joinery and premium hardware.",
    image: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=1000&auto=format&fit=crop",
    colSpan: "md:col-span-1",
    subCategories: [
      { 
        name: "Sideboard Cabinet", 
        description: "Large format storage for dining areas.", 
        image: "https://images.unsplash.com/photo-1601366533287-59b97d47970f?q=80&w=800&auto=format&fit=crop" 
      },
      { 
        name: "Storage Cabinet", 
        description: "Vertical storage units.", 
        image: "https://images.unsplash.com/photo-1595515106968-b43729abb64b?q=80&w=800&auto=format&fit=crop" 
      },
      { 
        name: "Nightstand", 
        description: "Bedside storage with drawers.", 
        image: "https://images.unsplash.com/photo-1532323544230-7191fd510c59?q=80&w=800&auto=format&fit=crop" 
      },
      { 
        name: "Chest", 
        description: "Tall chests of drawers.", 
        image: "https://images.unsplash.com/photo-1505693416388-b03463149f13?q=80&w=800&auto=format&fit=crop" 
      },
      { 
        name: "Dresser", 
        description: "Wide drawers for bedroom storage.", 
        image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=800&auto=format&fit=crop" 
      },
      { 
        name: "Wardrobe", 
        description: "Full-height clothing storage.", 
        image: "https://images.unsplash.com/photo-1558997519-83ea9252edf8?q=80&w=800&auto=format&fit=crop" 
      }
    ]
  },
  {
    id: 'veneer',
    title: "Veneer Series",
    subtitle: "Burl and Lila Collection",
    description: "Exquisite veneer work showcasing rare wood figures, including Burl and specialized collections.",
    image: "https://images.unsplash.com/photo-1505693314120-0d443867891c?q=80&w=1000&auto=format&fit=crop",
    colSpan: "md:col-span-1",
    subCategories: [
      { 
        name: "Burl Veneer Furniture", 
        description: "Furniture featuring distinct Burl wood patterns.", 
        image: "https://images.unsplash.com/photo-1543512214-318c77a799bf?q=80&w=800&auto=format&fit=crop" 
      },
      { 
        name: "Lila Furniture", 
        description: "Signature collection including nightstands and dressers.", 
        image: "https://images.unsplash.com/photo-1505693416388-b03463149f13?q=80&w=800&auto=format&fit=crop" 
      }
    ]
  },
  {
    id: 'seating',
    title: "Seating",
    subtitle: "Accent Chairs",
    description: "Upholstered accent chairs designed for comfort and style.",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1000&auto=format&fit=crop",
    colSpan: "md:col-span-1",
    subCategories: [
      { 
        name: "Accent Chair", 
        description: "Statement seating with solid wood frames.", 
        image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?q=80&w=800&auto=format&fit=crop" 
      }
    ]
  },
  {
    id: 'surfaces',
    title: "Butcher Block",
    subtitle: "Solid Wood Tops",
    description: "Heavy-duty butcher block surfaces for industrial and kitchen applications.",
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1000&auto=format&fit=crop",
    colSpan: "md:col-span-1",
    subCategories: [
      { 
        name: "Butcher Block", 
        description: "Durable edge-grain or end-grain tops.", 
        image: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=800&auto=format&fit=crop" 
      }
    ]
  }
];
