import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadScripts } from './load.mjs';

const load = (url = 'https://x/?lang=tr') => loadScripts(
  ['js/boot.js', 'js/config.js', 'js/core.js', 'js/lang/en.js', 'js/lang/tr.js', 'js/site.js'],
  { page: 'none', url }
);

test('doğrulayıcılar', () => {
  const { run } = load();
  const v = (name, value) => run(`OCS.site.validators.${name}(${JSON.stringify(value)})`);
  assert.equal(v('name', 'A'), false);
  assert.equal(v('name', ' Ada '), true);
  assert.equal(v('email', 'a@b'), false);
  assert.equal(v('email', 'a@b.co'), true);
  assert.equal(v('details', '123456789'), false);
  assert.equal(v('details', '1234567890'), true);
  assert.equal(v('site', 'abc'), false);
  assert.equal(v('site', 'abcd'), true);
});

test('teklif formunun maili: tüm alanlar, dil, para ve onaylar', () => {
  const { run } = load();
  const payload = run(`OCS.site.buildPayload('quote',
    { name: ' Ada ', email: 'a@b.co', business: '  ', pkgLabel: 'Site Yenileme (redesign)', budgetLabel: '₺67.000 altı', details: 'Yeni site istiyorum.' },
    { lang: 'tr', currency: 'TRY', now: new Date('2026-10-24T10:00:00Z') })`);
  assert.deepEqual(payload, {
    _subject: '[TR] Quote Request — Site Yenileme (redesign) — Ada',
    _template: 'table',
    _captcha: 'false',
    'Name': 'Ada',
    'Email': 'a@b.co',
    'Business / website': '—',
    'Interested in': 'Site Yenileme (redesign)',
    'Budget': '₺67.000 altı',
    'Project details': 'Yeni site istiyorum.',
    'Language': 'tr',
    'Currency': 'TRY',
    'Privacy notice': 'Acknowledged',
    'Transfer consent': 'Given',
    'Consent time': '2026-10-24T10:00:00.000Z'
  });
});

test('inceleme formunun maili', () => {
  const { run } = load();
  const payload = run(`OCS.site.buildPayload('audit',
    { name: 'Ada', email: 'a@b.co', website: 'ornek.com', notes: '' },
    { lang: 'en', currency: 'USD', now: new Date('2026-10-24T10:00:00Z') })`);
  assert.deepEqual(payload, {
    _subject: '[EN] Free Audit Request — ornek.com',
    _template: 'table',
    _captcha: 'false',
    'Name': 'Ada',
    'Email': 'a@b.co',
    'Website': 'ornek.com',
    'Notes': '—',
    'Language': 'en',
    'Currency': 'USD',
    'Privacy notice': 'Acknowledged',
    'Transfer consent': 'Given',
    'Consent time': '2026-10-24T10:00:00.000Z'
  });
});

test('hukuki metin: şirket bilgileri yerleşir ve HTML olarak kaçışlanır', () => {
  const { run } = load('https://x/?lang=en');
  const html = run(`OCS.legalText('privacy')`);
  // Adres boşken sorumlu satırında virgül ya da yer tutucu kalmaz
  assert.ok(html.includes('Data controller: <bdi>OptiCodeStudio</bdi>. Contact:'), 'sorumlu satırı');
  assert.ok(html.includes('opticodestudio@gmail.com'));
  assert.ok(html.includes('2026-10'));
  assert.doesNotMatch(html, /\{(company|address|email|updated)\}|DOLDURULACAK/);
  run(`CONFIG.legal.companyTitle = 'A & B <Ltd>'`);
  assert.ok(run(`OCS.legalText('privacy')`).includes('A &amp; B &lt;Ltd&gt;'));
  assert.equal(run(`OCS.legalText('nope')`), '');
});

test('hukuki metin: adres boşsa Arapça virgül de kalkar', () => {
  const { run } = loadScripts(['js/boot.js', 'js/config.js', 'js/core.js', 'js/lang/ar.js'], { page: 'none', url: 'https://x/?lang=ar' });
  assert.ok(run(`OCS.legalText('privacy')`).includes('المسؤول عن البيانات: <bdi>OptiCodeStudio</bdi>. للتواصل'));
});

test('hukuki metin: şirket unvanı ve adres kendi yazı yönünde kalır (Arapça metinde Latin unvan)', () => {
  const { run } = load('https://x/?lang=en');
  run(`CONFIG.legal.address = 'Örnek Sk. 1, İstanbul'`);
  const html = run(`OCS.legalText('privacy')`);
  assert.ok(html.includes('<bdi>OptiCodeStudio</bdi>, <bdi>Örnek Sk. 1, İstanbul</bdi>.'), 'unvan ve adres yalıtılmadı');
  assert.ok(html.includes('href="mailto:opticodestudio@gmail.com"'), 'e-posta bağlantısı bozuldu');
});
