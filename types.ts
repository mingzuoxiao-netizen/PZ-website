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
  category?: string;
  colors?: {
    name: string;
    image: string;
  }[];
  date?: string;
}

export interface CategoryRequest {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  status: 'awaiting_review' | 'approved' | 'rejected';
  created_at: string;
  user_id: string;
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
  { label: 'Portfolio', path: '/collections', key: 'collections' },
  { label: 'Capabilities', path: '/capabilities', key: 'capabilities' },
  { label: 'Manufacturing', path: '/manufacturing', key: 'manufacturing' },
  { label: 'Resources', path: '/materials', key: 'materials' },
  { label: 'Process', path: '/capacity', key: 'capacity' },
  { label: 'About', path: '/about', key: 'about' },
  { label: 'Contact', path: '/inquire', key: 'inquire' },
];