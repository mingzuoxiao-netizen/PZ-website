export interface NavItem {
  label: string;
  path: string;
}

export interface ProductVariant {
  name: string;
  description?: string;
  image: string;
}

export interface SubCategory {
  name: string;
  description: string;
  image: string;
  variants?: ProductVariant[];
}

export interface Category {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  subCategories: SubCategory[];
  colSpan?: string;
}

export interface Inquiry {
  id: string;
  name: string;
  company: string;
  email: string;
  type: 'General' | 'Trade Program' | 'OEM/ODM';
  message: string;
  date: string;
  status: 'New' | 'Read' | 'Replied';
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'The Studio', path: '/studio' },
  { label: 'Collections', path: '/collections' },
  { label: 'Global Capacity', path: '/capacity' },
  { label: 'Materials', path: '/materials' },
  { label: 'Inquire', path: '/inquire' },
];