import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setup, openPage } from './helpers.mjs';
import { loadScripts } from '../unit/load.mjs';

let ctx;
before(async () => { ctx = await setup(); });
after(async () => { await ctx?.close(); });

const EN = loadScripts(['js/boot.js', 'js/lang/en.js']).run('OCS.langs.en');
const TR = loadScripts(['js/boot.js', 'js/lang/tr.js']).run('OCS.langs.tr');
const LANG_SEL = '#navControls select[data-ctl="lang"]';
const CUR_SEL = '#navControls select[data-ctl="currency"]';
const clean = s => s.trim().replace(/[  ]/g, ' ');
const price = async page => clean(await page.$eval('[data-pkg="essential"] .pkg-price', el => el.textContent));
const waitLang = (page, code) => page.waitForFunction(c => document.documentElement.lang === c, { timeout: 4000 }, code);

test('dil seçimi sayfayı yenilemeden değiştirir', async () => {
  const { page, close } = await openPage(ctx, '/?lang=en');
  await page.evaluate(() => { window.__marker = 1; });
  await page.select(LANG_SEL, 'tr');
  await waitLang(page, 'tr');
  assert.equal(await page.$eval('.nav-links a[href="#work"]', el => el.textContent), TR.ui['nav.work']);
  assert.match(await page.evaluate(() => location.search), /lang=tr/);
  assert.equal(await price(page), '₺67.000 ve üzeri');
  assert.equal(await page.evaluate(() => window.__marker), 1);
  assert.equal(await page.evaluate(() => localStorage.getItem('ocs.lang')), 'tr');
  // Mobil menüdeki kopya da eşitlenir
  assert.equal(await page.$eval('#navMobileControls select[data-ctl="lang"]', s => s.value), 'tr');
  assert.equal(await page.$eval(CUR_SEL, s => s.value), 'TRY');
  await close();
});

test('para seçimi fiyatları, bütçeyi ve SSS cevabını değiştirir', async () => {
  const { page, close } = await openPage(ctx, '/?lang=en');
  await page.select(CUR_SEL, 'EUR');
  await page.waitForFunction(() => document.querySelector('[data-pkg="essential"] .pkg-price').textContent.includes('€'), { timeout: 3000 });
  assert.equal(await price(page), 'From €1,200');
  const budgets = await page.$$eval('#f-budget option', os => os.slice(1).map(o => o.textContent));
  assert.ok(budgets.every(b => b.includes('€')), budgets.join(' | '));
  assert.match(await page.$eval('#faqList .faq-a', el => el.textContent), /€1,200/);
  assert.equal(await page.evaluate(() => localStorage.getItem('ocs.currency')), 'EUR');
  await close();
});

test('dil değişince para birimi o dilin parasına döner', async () => {
  const { page, close } = await openPage(ctx, '/?lang=en');
  await page.select(CUR_SEL, 'EUR');
  await page.select(LANG_SEL, 'tr');
  await waitLang(page, 'tr');
  assert.equal(await price(page), '₺67.000 ve üzeri');
  await page.select(LANG_SEL, 'en');
  await waitLang(page, 'en');
  assert.equal(await price(page), 'From $1,350');
  assert.equal(await page.evaluate(() => localStorage.getItem('ocs.currency')), null);
  await close();
});

test('kayıtlı tercihler: dil + elle seçilen para korunur; başka dil linki parayı sıfırlar', async () => {
  const a = await openPage(ctx, '/', { local: { 'ocs.lang': 'tr', 'ocs.currency': 'EUR' } });
  assert.equal(await a.page.evaluate(() => document.documentElement.lang), 'tr');
  assert.equal(await price(a.page), '€1.200 ve üzeri');
  await a.close();
  const b = await openPage(ctx, '/?lang=tr', { local: { 'ocs.lang': 'ru', 'ocs.currency': 'USD' } });
  assert.equal(await price(b.page), '₺67.000 ve üzeri');
  await b.close();
});

test('dil dosyası gecikirse sayfa bekler, gelince görünür', async () => {
  const { page, close } = await openPage(ctx, '/?lang=tr', { delay: { '/js/lang/tr.js': 1500 }, wait: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 400));
  assert.equal(await page.$eval('.page', el => getComputedStyle(el).visibility), 'hidden');
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.page')).visibility === 'visible', { timeout: 4000 });
  assert.equal(await page.$eval('.nav-links a[href="#work"]', el => el.textContent), TR.ui['nav.work']);
  await close();
});

test('dil dosyası yüklenemezse 2,5 sn içinde İngilizce açılır (Review Focus 3)', async () => {
  const { page, close } = await openPage(ctx, '/?lang=tr', { block: ['/js/lang/tr.js'], wait: 'domcontentloaded' });
  await page.waitForFunction(() => !document.documentElement.classList.contains('i18n-pending'), { timeout: 3000 });
  assert.equal(await page.$eval('.page', el => getComputedStyle(el).visibility), 'visible');
  assert.equal(await page.$eval('.nav-links a[href="#work"]', el => el.textContent), EN.ui['nav.work']);
  await close();
});

test('mobilde dil ve para seçimi hamburger menüde, tema düğmesi barda', async () => {
  const { page, close } = await openPage(ctx, '/?lang=en', { width: 390, height: 844 });
  const visible = sel => page.$eval(sel, el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; });
  assert.equal(await visible('#navControls'), false);
  assert.equal(await visible('nav .theme-toggle'), true);
  await page.click('#burger');
  assert.equal(await visible('#navMobileControls select[data-ctl="lang"]'), true);
  await page.select('#navMobileControls select[data-ctl="lang"]', 'tr');
  await waitLang(page, 'tr');
  await close();
});

test('masaüstünde 1025 px ve üstünde menü sığar', async () => {
  for (const width of [1025, 1180, 1440]) {
    for (const lang of ['en', 'tr']) {
      const { page, close } = await openPage(ctx, `/?lang=${lang}`, { width, height: 900 });
      const fit = await page.$eval('nav .nav-in', el => el.scrollWidth <= el.clientWidth);
      assert.equal(fit, true, `${width}px ${lang}`);
      await close();
    }
  }
});

test('hreflang bağlantıları', async () => {
  const { page, close } = await openPage(ctx, '/?lang=en');
  const links = await page.$$eval('link[rel="alternate"][hreflang]', ls => ls.map(l => [l.hreflang, l.getAttribute('href')]));
  assert.deepEqual(links, [
    ['tr', 'https://opticodestudio.com/?lang=tr'],
    ['en', 'https://opticodestudio.com/?lang=en'],
    ['de', 'https://opticodestudio.com/?lang=de'],
    ['ar', 'https://opticodestudio.com/?lang=ar'],
    ['ru', 'https://opticodestudio.com/?lang=ru'],
    ['x-default', 'https://opticodestudio.com/']
  ]);
  await close();
});
