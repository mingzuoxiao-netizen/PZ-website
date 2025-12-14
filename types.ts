
export interface NavItem {
  label: string;
  path: string;
  key: string;
}

export interface ProductVariant {
  id?: string;
  name: string;
  name_cn?: string;
  description?: string;
  description_cn?: string;
  image: string; // Legacy fallback
  images: string[]; // Primary Source of Truth
  material?: string;
  size?: string;
  code?: string;
  status?: string;
  sub_category?: string;
  // Category ID reference for flat structure
  category?: string;
  // New field for color variants (kept for frontend state, even if not in minimal schema)
  colors?: {
    name: string;
    image: string;
  }[];
  date?: string;
}

export interface SubCategory {
  name: string;
  name_zh?: string;
  description: string;
  description_zh?: string;
  image: string;
  variants?: ProductVariant[];
}

export interface Category {
  id: string;
  title: string;
  title_zh?: string;
  subtitle: string;
  subtitle_zh?: string;
  description: string;
  description_zh?: string;
  image: string;
  subCategories: SubCategory[];
  colSpan?: string;
}

export interface Inquiry {
  id: string;
  name: string;
  company: string;
  email: string;
  type: 'General' | 'Trade Program' | 'OEM/ODM' | 'Catalog Request';
  message: string;
  date: string;
  status: 'New' | 'Read' | 'Replied';
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', path: '/', key: 'home' },
  { label: 'Capabilities', path: '/capabilities', key: 'capabilities' },
  { label: 'Manufacturing', path: '/manufacturing', key: 'manufacturing' },
  { label: 'Materials', path: '/materials', key: 'materials' },
  { label: 'Portfolio', path: '/portfolio', key: 'portfolio' },
  { label: 'Global Capacity', path: '/capacity', key: 'capacity' },
  { label: 'About', path: '/about', key: 'about' },
  { label: 'Inquire', path: '/inquire', key: 'inquire' },
];
    