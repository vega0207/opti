import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setup, openPage, overflowReport, choose, ctlValue } from './helpers.mjs';
import { loadScripts } from '../unit/load.mjs';

let ctx;
before(async () => { ctx = await setup(); });
after(async () => { await ctx?.close(); });

const EN = loadScripts(['js/boot.js', 'js/lang/en.js']).run('OCS.langs.en');
const TR = loadScripts(['js/boot.js', 'js/lang/tr.js']).run('OCS.langs.tr');
const clean = s => s.trim().replace(/[  ]/g, ' ');
const price = async page => clean(await page.$eval('[data-pkg="essential"] .pkg-price', el => el.textContent));
const waitLang = (page, code) => page.waitForFunction(c => document.documentElement.lang === c, { timeout: 4000 }, code);

test('dil seçimi sayfayı yenilemeden değiştirir', async () => {
  const { page, close } = await openPage(ctx, '/?lang=en');
  await page.evaluate(() => { window.__marker = 1; });
  await choose(page, '#navControls', 'lang', 'tr');
  await waitLang(page, 'tr');
  assert.equal(await page.$eval('.nav-links a[href="#work"]', el => el.textContent), TR.ui['nav.work']);
  assert.match(await page.evaluate(() => location.search), /lang=tr/);
  assert.equal(await price(page), '₺67.000 ve üzeri');
  assert.equal(await page.evaluate(() => window.__marker), 1);
  assert.equal(await page.evaluate(() => localStorage.getItem('ocs.lang')), 'tr');
  // Mobil menüdeki kopya da eşitlenir
  assert.equal(await ctlValue(page, '#navMobileControls', 'lang'), 'tr');
  assert.equal(await ctlValue(page, '#navControls', 'currency'), 'TRY');
  await close();
});

test('para seçimi fiyatları, bütçeyi ve SSS cevabını değiştirir', async () => {
  const { page, close } = await openPage(ctx, '/?lang=en');
  await choose(page, '#navControls', 'currency', 'EUR');
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
  await choose(page, '#navControls', 'currency', 'EUR');
  await choose(page, '#navControls', 'lang', 'tr');
  await waitLang(page, 'tr');
  assert.equal(await price(page), '₺67.000 ve üzeri');
  await choose(page, '#navControls', 'lang', 'en');
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
  assert.equal(await visible('#navMobileControls [data-ctl="lang"] .ctl-btn'), true);
  // Açık liste telefonda ekrandan taşmaz
  await page.click('#navMobileControls [data-ctl="lang"] .ctl-btn');
  await page.waitForSelector('#navMobileControls [data-ctl="lang"] .ctl-pop', { visible: true });
  assert.deepEqual(await overflowReport(page), []);
  await page.click('#navMobileControls [data-ctl="lang"] .ctl-opt[data-value="tr"]');
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

// Bayraklar çizim olarak gömülü: Windows bayrak emojisini göstermez.
const flagsIn = (page, sel) => page.$$eval(sel, els => els.map(el => {
  const use = el.querySelector('svg.flag use');
  const b = use && use.getBBox();
  return [el.dataset.value, use && use.getAttribute('href'), Boolean(b && b.width * b.height > 0)];
}));

test('dil ve para menülerinde her seçenekte doğru ülkenin bayrağı, düğmede seçili olanınki', async () => {
  const { page, close } = await openPage(ctx, '/?lang=tr');
  const btnFlag = kind => page.$eval(`#navControls [data-ctl="${kind}"] .ctl-btn svg.flag use`, u => u.getAttribute('href'));
  assert.equal(await btnFlag('lang'), '#f-tr');
  assert.equal(await btnFlag('currency'), '#f-tr');
  await page.click('#navControls [data-ctl="lang"] .ctl-btn');
  assert.deepEqual(await flagsIn(page, '#navControls [data-ctl="lang"] .ctl-opt'), [
    ['tr', '#f-tr', true], ['en', '#f-gb', true], ['de', '#f-de', true], ['ar', '#f-kw', true], ['ru', '#f-ru', true]
  ]);
  await page.click('#navControls [data-ctl="currency"] .ctl-btn');
  assert.deepEqual(await flagsIn(page, '#navControls [data-ctl="currency"] .ctl-opt'), [
    ['USD', '#f-us', true], ['TRY', '#f-tr', true], ['EUR', '#f-eu', true], ['RUB', '#f-ru', true], ['KWD', '#f-kw', true]
  ]);
  await page.click('#navControls [data-ctl="currency"] .ctl-btn');
  await choose(page, '#navControls', 'lang', 'de');
  await waitLang(page, 'de');
  assert.equal(await btnFlag('lang'), '#f-de');
  assert.equal(await btnFlag('currency'), '#f-eu');
  await close();
});

test('menü: aynı anda tek liste açık; dışarı tıklayınca ve Escape ile kapanır', async () => {
  const { page, close } = await openPage(ctx, '/?lang=en');
  const state = () => page.$$eval('#navControls .ctl', cs => cs.map(c => [
    c.dataset.ctl, c.querySelector('.ctl-btn').getAttribute('aria-expanded'), c.querySelector('.ctl-pop').checkVisibility()
  ]));
  assert.deepEqual(await state(), [['lang', 'false', false], ['currency', 'false', false]]);
  await page.click('#navControls [data-ctl="lang"] .ctl-btn');
  assert.deepEqual(await state(), [['lang', 'true', true], ['currency', 'false', false]]);
  await page.click('#navControls [data-ctl="currency"] .ctl-btn');
  assert.deepEqual(await state(), [['lang', 'false', false], ['currency', 'true', true]]);
  await page.click('.hero h1');
  assert.deepEqual(await state(), [['lang', 'false', false], ['currency', 'false', false]]);
  await page.click('#navControls [data-ctl="lang"] .ctl-btn');
  await page.keyboard.press('Escape');
  assert.deepEqual(await state(), [['lang', 'false', false], ['currency', 'false', false]]);
  assert.equal(await page.evaluate(() => document.activeElement.matches('#navControls [data-ctl="lang"] .ctl-btn')), true);
  assert.equal(await page.evaluate(() => document.documentElement.lang), 'en');
  await close();
});

test('menü klavyeyle: aşağı ok açar ve seçili dile gider, ok gezer, Enter seçer', async () => {
  const { page, close } = await openPage(ctx, '/?lang=en');
  const focused = () => page.evaluate(() => document.activeElement.dataset.value || document.activeElement.className);
  await page.focus('#navControls [data-ctl="lang"] .ctl-btn');
  await page.keyboard.press('ArrowDown');
  assert.equal(await focused(), 'en');
  await page.keyboard.press('ArrowDown');
  assert.equal(await focused(), 'de');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  assert.equal(await focused(), 'tr');
  await page.keyboard.press('ArrowUp');
  assert.equal(await focused(), 'ru', 'baştan sona sarar');
  await page.keyboard.press('Enter');
  await waitLang(page, 'ru');
  assert.equal(await page.$eval('#navControls [data-ctl="lang"] .ctl-pop', el => el.checkVisibility()), false);
  assert.equal(await page.evaluate(() => document.activeElement.matches('#navControls [data-ctl="lang"] .ctl-btn')), true);
  await close();
});

// Site sahibi ☰ düğmesini menü olarak fark etmedi: telefonda yanında dilin "Menü" yazısı görünür ve sığar.
test('telefonda menü düğmesinde "Menü" yazısı görünür, bar taşmaz', async () => {
  const LANGS = loadScripts(['js/boot.js', 'js/lang/en.js', 'js/lang/tr.js', 'js/lang/de.js', 'js/lang/ru.js', 'js/lang/ar.js']).run('OCS.langs');
  for (const [lang, width] of [['tr', 390], ['tr', 360], ['de', 360], ['ru', 360], ['ar', 360], ['en', 1024]]) {
    const { page, close } = await openPage(ctx, `/?lang=${lang}`, { width, height: 800 });
    const text = await page.$eval('#burger', b => b.innerText.trim());
    assert.equal(text, LANGS[lang].ui['nav.menu'], `${lang} ${width}px`);
    assert.deepEqual(await overflowReport(page), [], `${lang} ${width}px`);
    assert.equal(await page.$eval('nav .nav-in', el => el.scrollWidth <= el.clientWidth), true, `${lang} ${width}px bar sığmıyor`);
    await close();
  }
});
