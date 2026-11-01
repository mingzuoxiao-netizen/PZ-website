import { SITE_SCHEMA } from './siteSchema';
import { getByPath, setByPath } from './objectPath';

/**
 * Site imagery is edited separately from product category covers (which use
 * their own approval workflow). Only actual image-field differences may be
 * merged into the current saved site-config draft.
 */
export const SITE_IMAGE_PATHS = SITE_SCHEMA.flatMap(section =>
  section.fields.filter(field => field.type === 'image').map(field => field.path)
);

const imageAt = (config: any, path: string): string =>
  String(getByPath(config, path) ?? '');

export function getSiteImageChanges(baseline: any, edited: any) {
  return SITE_IMAGE_PATHS.filter(path =>
    imageAt(baseline, path) !== imageAt(edited, path)
  ).map(path => ({ path, previous: imageAt(baseline, path), next: imageAt(edited, path) }));
}

export function siteImagesMatch(one: any, two: any): boolean {
  return getSiteImageChanges(one, two).length === 0;
}

/**
 * Merge changed image refs against a fresh backend draft, preserving any other
 * concurrent edits (text, categories, PDF, other image fields).
 * If another operator changed the SAME image field, don't silently overwrite.
 */
export function mergeSiteMediaDraft(live: any, baseline: any, edited: any) {
  if (!live || typeof live !== 'object' || Array.isArray(live)) {
    throw new Error('网站草稿读取失败，已停止保存以保护原有内容。');
  }
  const changes = getSiteImageChanges(baseline, edited);
  if (!changes.length) return live;
  const conflicting = changes.filter(change => {
    const actual = imageAt(live, change.path);
    return actual !== change.previous && actual !== change.next;
  });
  if (conflicting.length) {
    throw new Error('其他管理员已更改以下网站图片，请刷新并检查：' + conflicting.map(c => c.path).join('、'));
  }
  return changes.reduce((next, change) => setByPath(next, change.path, change.next), live);
}
