import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ContactChannels from '../components/ContactChannels';
import { publicContactLinks, validateContactSettings } from '../utils/contactChannels';

test('empty settings produce no public labels or placeholders', () => {
  assert.deepEqual(publicContactLinks({}), []);
  assert.equal(renderToStaticMarkup(<ContactChannels contact={{}} language="en" />), '');
});

test('configured email, WhatsApp, phone and WeChat are safe and bilingual', () => {
  const contact = { salesEmail: 'sales@example.com', phone: '+1 (555) 123-4567',
    whatsapp: '+1 555 123 4567', wechatId: 'PZ-Sales' };
  assert.equal(validateContactSettings(contact), null);
  const en = renderToStaticMarkup(<ContactChannels contact={contact} language="en" />);
  const zh = renderToStaticMarkup(<ContactChannels contact={contact} language="zh" />);
  assert.match(en, /mailto:sales@example\.com/);
  assert.match(en, /https:\/\/wa\.me\/15551234567/);
  assert.match(en, /tel:\+15551234567/);
  assert.match(zh, /销售邮箱/);
  assert.match(zh, /微信/);
  assert.match(zh, /PZ-Sales/);
});

test('unsafe links never become clickable URLs', () => {
  assert.ok(validateContactSettings({salesEmail:'javascript:alert(1)',whatsapp:'evil'}) !== null);
  assert.deepEqual(publicContactLinks({salesEmail:'javascript:alert(1)',whatsapp:'evil'}), []);
});
