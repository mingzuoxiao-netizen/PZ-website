import React from 'react';
import type { ContactSettings } from '../utils/siteConfig';
import { publicContactLinks, ContactKey } from '../utils/contactChannels';

interface Props {
  contact?: ContactSettings;
  language: 'en' | 'zh';
  variant?: 'dark' | 'light';
}

const LABELS: Record<ContactKey, [string, string]> = {
  salesEmail: ['Email', '销售邮箱'],
  phone: ['Phone', '电话'],
  whatsapp: ['WhatsApp', 'WhatsApp'],
  wechatId: ['WeChat', '微信'],
};

const ContactChannels: React.FC<Props> = ({ contact, language, variant = 'light' }) => {
  const links = publicContactLinks(contact);
  if (!links.length) return null;
  const dark = variant === 'dark';
  return (
    <dl className={`space-y-3 text-sm ${dark ? 'text-stone-200' : 'text-[#4b382d]'}`}>
      {links.map(item => (
        <div key={item.key} className="min-w-0">
          <dt className={`text-[11px] font-semibold uppercase tracking-widest ${dark ? 'text-stone-300' : 'text-[#66594f]'}`}>
            {LABELS[item.key][language === 'zh' ? 1 : 0]}
          </dt>
          <dd className="mt-1 break-all">
            {item.href ? <a href={item.href} rel={item.key === 'whatsapp' ? 'noopener noreferrer' : undefined}
              target={item.key === 'whatsapp' ? '_blank' : undefined}
              className="underline underline-offset-4 hover:opacity-75">{item.value}</a> : item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
};

export default ContactChannels;
