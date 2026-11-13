import type { ContactSettings } from './siteConfig';

export type ContactKey = keyof ContactSettings;
export interface ContactLink { key: ContactKey; value: string; href?: string }

const emailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const phoneValid = (phone: string) => /^[+\d()\s.-]+$/.test(phone) && (phone.match(/\d/g) || []).length >= 7;

/** Only expose entered, link-safe contact details; empty configuration renders no labels. */
export function publicContactLinks(contact?: ContactSettings): ContactLink[] {
  if (!contact) return [];
  const channels: ContactLink[] = [];
  const salesEmail = String(contact.salesEmail || '').trim();
  if (emailValid(salesEmail)) channels.push({ key: 'salesEmail', value: salesEmail, href: `mailto:${salesEmail}` });
  const phone = String(contact.phone || '').trim();
  if (phoneValid(phone)) channels.push({ key: 'phone', value: phone, href: `tel:${phone.replace(/[^+\d]/g, '')}` });
  const whatsapp = String(contact.whatsapp || '').trim();
  const waDigits = whatsapp.replace(/[^\d]/g, '');
  if (/^[+\d()\s.-]+$/.test(whatsapp) && /^\d{8,15}$/.test(waDigits)) {
    channels.push({ key: 'whatsapp', value: whatsapp, href: `https://wa.me/${waDigits}` });
  }
  const wechatId = String(contact.wechatId || '').trim();
  if (wechatId) channels.push({ key: 'wechatId', value: wechatId });
  return channels;
}

export function validateContactSettings(contact: ContactSettings): string | null {
  if (contact.salesEmail?.trim() && !emailValid(contact.salesEmail.trim())) return '销售邮箱格式不正确 / Invalid sales email';
  if (contact.phone?.trim() && !phoneValid(contact.phone.trim())) return '电话号码格式不正确 / Invalid phone number';
  const wa = contact.whatsapp?.trim() || '';
  if (wa && (!/^[+\d()\s.-]+$/.test(wa) || !/^\d{8,15}$/.test(wa.replace(/[^\d]/g, '')))) {
    return 'WhatsApp 请填写含国家区号的 8–15 位号码 / Enter 8–15 digits including country code';
  }
  if (contact.wechatId && contact.wechatId.length > 80) return '微信号不得超过 80 字符 / WeChat ID is too long';
  return null;
}
