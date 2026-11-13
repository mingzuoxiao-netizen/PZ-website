import type { Category } from '../types';

/** Text supplied by an editor takes priority; otherwise use the visible category name. */
export function categoryImageAlt(category: Pick<Category, 'title' | 'title_cn' | 'title_zh' | 'alt_en' | 'alt_zh'>, language: string): string {
  const englishName = category.title?.trim() || '';
  const chineseName = category.title_zh?.trim() || category.title_cn?.trim() || englishName;
  return language === 'zh'
    ? category.alt_zh?.trim() || chineseName
    : category.alt_en?.trim() || englishName;
}
