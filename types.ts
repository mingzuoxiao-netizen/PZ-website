

export interface NavItem {
  label: string;
  path: string;
}

export interface ProductVariant {
  name: string;
  name_zh?: string;
  description?: string;
  description_zh?: string;
  image: string;
  images?: string[]; 
  material?: string;
  dimensions?: string;
  code?: string;
  status?: string;
  subCategoryName?: string; 
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
  { label: 'Home', path: '/' },
  { label: 'Capabilities', path: '/capabilities' },
  { label: 'Manufacturing', path: '/manufacturing' },
  { label: 'Materials', path: '/materials' },
  { label: 'Portfolio', path: '/collections' },
  { label: 'Global Capacity', path: '/capacity' },
  { label: 'About', path: '/about' },
  { label: 'Inquire', path: '/inquire' },
];