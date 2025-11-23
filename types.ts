export interface NavItem {
  label: string;
  label_zh: string;
  path: string;
}

export interface ProductVariant {
  name: string;
  name_zh?: string;
  description?: string;
  description_zh?: string;
  image: string;
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
  { label: 'Home', label_zh: '首页', path: '/' },
  { label: 'About', label_zh: '关于我们', path: '/about' },
  { label: 'The Studio', label_zh: '设计工作室', path: '/studio' },
  { label: 'Collections', label_zh: '产品系列', path: '/collections' },
  { label: 'Global Capacity', label_zh: '全球产能', path: '/capacity' },
  { label: 'Materials', label_zh: '材质工艺', path: '/materials' },
  { label: 'Inquire', label_zh: '联系咨询', path: '/inquire' },
];