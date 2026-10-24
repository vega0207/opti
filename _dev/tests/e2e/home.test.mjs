import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { setup, openPage, overflowReport } from './helpers.mjs';
import { REPO_ROOT } from '../../tools/serve.mjs';
import { loadScripts } from '../unit/load.mjs';

let ctx;
before(async () => { ctx = await setup(); });
after(async () => { await ctx?.close(); });

const EN = loadScripts(['js/boot.js', 'js/lang/en.js']).run('OCS.langs.en');
const html = page => page.evaluate(() => ({
  lang: document.documentElement.lang,
  dir: document.documentElement.dir,
  theme: document.documentElement.dataset.theme,
  pending: document.documentElement.classList.contains('i18n-pending')
}));

test('dış istek ve hata yok, bölümler sırayla, iki manzara penceresi', async () => {
  const { page, external, errors, close } = await openPage(ctx, '/?lang=en');
  assert.deepEqual(external, []);
  assert.deepEqual(errors, []);
  const order = await page.evaluate(sels => {
    const els = sels.map(s => document.querySelector(s));
    const missing = sels.filter((s, i) => !els[i]);
    if (missing.length) return 'eksik: ' + missing.join(', ');
    for (let i = 1; i < els.length; i++) {
      if (!(els[i - 1].compareDocumentPosition(els[i]) & Node.DOCUMENT_POSITION_FOLLOWING)) return `sıra: ${sels[i - 1]} > ${sels[i]}`;
    }
    return 'ok';
  }, ['nav#nav', 'header.hero', '.marquee', '#work', '#packages', '#process', '#faq', '#contact', 'footer']);
  assert.equal(order, 'ok');
  assert.equal(await page.$$eval('main .window', els => els.length), 2);
  await close();
});

test('kaldırılan yapay zekâ izleri yok', async () => {
  const { page, close } = await openPage(ctx, '/?lang=en');
  const text = await page.evaluate(() => document.body.innerText);
  assert.doesNotMatch(text, /ACCEPTING NEW PROJECTS/i);
  assert.doesNotMatch(text, /Sound Familiar/i);
  assert.ok(!text.includes('—'), 'sayfada uzun tire var');
  assert.match(await page.$eval('h1', el => getComputedStyle(el).fontFamily), /^"?Manrope/);
  const glass = await page.evaluate(() => [...document.querySelectorAll('*')]
    .filter(el => { const s = getComputedStyle(el); return s.backdropFilter !== 'none' || (s.filter || '').includes('blur'); })
    .map(el => el.className || el.tagName));
  assert.deepEqual(glass, [], 'cam/bulanıklık efekti');
  const css = readFileSync(path.join(REPO_ROOT, 'css', 'style.css'), 'utf8');
  assert.doesNotMatch(css, /JetBrains|Space Grotesk/);
  assert.match(await page.$eval('nav .logo-mark', el => el.getAttribute('src')), /img\/logo-mark\.svg$/);
  await close();
});

test('İngilizce metinler en.js ile aynı; sayfa beklemede kalmaz', async () => {
  const { page, close } = await openPage(ctx, '/?lang=en');
  assert.equal(await page.$eval('[data-i18n="hero.lead"]', el => el.textContent), EN.ui['hero.lead']);
  assert.equal(await page.title(), EN.ui['meta.title']);
  assert.deepEqual(await html(page), { lang: 'en', dir: 'ltr', theme: 'dark', pending: false });
  await close();
});

test('dil dosyası uygulanır: metin, başlık, lang ve bekleme sınıfı', async () => {
  const de = structuredClone(EN);
  de.meta = { code: 'de', dir: 'ltr', locale: 'de-DE', name: 'Deutsch' };
  de.ui['nav.work'] = 'Arbeiten';
  de.ui['meta.title'] = 'Testtitel';
  de.ui['form.namePh'] = 'Ihr Name';
  const { page, close } = await openPage(ctx, '/?lang=de', {
    beforeGoto: p => p.evaluateOnNewDocument(def => { window.OCS = { langs: { de: def } }; }, de)
  });
  assert.equal(await page.$eval('.nav-links a[href="#work"]', el => el.textContent), 'Arbeiten');
  assert.equal(await page.title(), 'Testtitel');
  assert.equal(await page.$eval('#f-name', el => el.getAttribute('placeholder')), 'Ihr Name');
  const h = await html(page);
  assert.equal(h.lang, 'de');
  assert.equal(h.pending, false);
  assert.equal(await page.$eval('.page', el => getComputedStyle(el).visibility), 'visible');
  await close();
});

test('dil dosyası bulunamazsa İngilizceye düşer ve sayfa görünür', async () => {
  // Dil dosyası yüklenemiyor (ağ hatası ya da silinmiş dosya)
  const { page, close } = await openPage(ctx, '/?lang=ru', { block: ['/js/lang/ru.js'] });
  await page.waitForFunction(() => !document.documentElement.classList.contains('i18n-pending'), { timeout: 3000 });
  assert.equal(await page.$eval('.page', el => getComputedStyle(el).visibility), 'visible');
  assert.equal(await page.$eval('.nav-links a[href="#work"]', el => el.textContent), EN.ui['nav.work']);
  assert.equal((await html(page)).lang, 'en');
  await close();
});

test('tema: sistem ayarı, düğme, kayıt ve sistem değişimi', async () => {
  const dark = await openPage(ctx, '/?lang=en', { scheme: 'dark' });
  assert.equal((await html(dark.page)).theme, 'dark');
  assert.equal(await dark.page.$eval('nav .theme-toggle', b => b.getAttribute('aria-pressed')), 'true');
  await dark.page.click('nav .theme-toggle');
  assert.equal((await html(dark.page)).theme, 'light');
  assert.equal(await dark.page.evaluate(() => localStorage.getItem('ocs.theme')), 'light');
  assert.equal(await dark.page.$eval('nav .theme-toggle', b => b.getAttribute('aria-label')), EN.ui['controls.themeToDark']);
  // Elle seçim yapıldıysa sistem değişimi onu ezmez
  await dark.page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  await new Promise(r => setTimeout(r, 300));
  assert.equal((await html(dark.page)).theme, 'light');
  await dark.close();

  const light = await openPage(ctx, '/?lang=en', { scheme: 'light' });
  assert.equal((await html(light.page)).theme, 'light');
  await light.close();

  const sys = await openPage(ctx, '/?lang=en', { scheme: 'dark' });
  await sys.page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  await sys.page.waitForFunction(() => document.documentElement.dataset.theme === 'light', { timeout: 2000 });
  assert.equal(await sys.page.evaluate(() => localStorage.getItem('ocs.theme')), null);
  await sys.close();
});

test('arka plan: temaya göre görsel, mobilde dik kırpım, diğer tema sonradan yüklenir', async () => {
  const desk = await openPage(ctx, '/?lang=en', { scheme: 'dark' });
  assert.match(await desk.page.$eval('.bg-night', el => getComputedStyle(el).backgroundImage), /bg-night\.webp/);
  await new Promise(r => setTimeout(r, 1500));
  const timing = await desk.page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const res = performance.getEntriesByType('resource');
    const find = n => res.find(e => e.name.includes(n));
    return { load: nav.loadEventStart, night: find('bg-night.webp')?.startTime, day: find('bg-day.webp')?.startTime };
  });
  assert.ok(timing.night !== undefined && timing.night < timing.load, JSON.stringify(timing));
  assert.ok(timing.day !== undefined && timing.day >= timing.load, JSON.stringify(timing));
  await desk.close();
  const mob = await openPage(ctx, '/?lang=en', { scheme: 'dark', width: 390, height: 844 });
  assert.match(await mob.page.$eval('.bg-night', el => getComputedStyle(el).backgroundImage), /bg-night-m\.webp/);
  await mob.close();
});

test('menü: 1024 px ve altında hamburger, üstünde bağlantılar', async () => {
  for (const [width, mobile] of [[1440, false], [1025, false], [1024, true], [390, true]]) {
    const { page, close } = await openPage(ctx, '/?lang=en', { width, height: 844 });
    const vis = await page.evaluate(() => ({
      links: getComputedStyle(document.querySelector('.nav-links')).display !== 'none',
      burger: getComputedStyle(document.querySelector('#burger')).display !== 'none'
    }));
    assert.deepEqual(vis, { links: !mobile, burger: mobile }, `${width}px`);
    if (mobile) {
      await page.click('#burger');
      assert.equal(await page.$eval('#navMobile', el => el.classList.contains('open')), true);
      assert.equal(await page.$eval('#burger', el => el.getAttribute('aria-expanded')), 'true');
      await page.click('#navMobile a[href="#work"]');
      assert.equal(await page.$eval('#navMobile', el => el.classList.contains('open')), false);
    }
    await close();
  }
});

test('taşma yok: 6 genişlik × 2 tema', async () => {
  for (const width of [360, 390, 768, 1024, 1440, 1920]) {
    for (const scheme of ['dark', 'light']) {
      const { page, close } = await openPage(ctx, '/?lang=en', { width, height: 900, scheme });
      assert.deepEqual(await overflowReport(page), [], `${width}px ${scheme}`);
      await close();
    }
  }
});

test('e-posta kopyalama adresi panoya yazar ve bildirim gösterir', async () => {
  const { page, context, close } = await openPage(ctx, '/?lang=en');
  await context.overridePermissions(ctx.base, ['clipboard-read', 'clipboard-write', 'clipboard-sanitized-write']);
  // Kapalı bildirim görünmez (tam sayfa görüntülerde ve ekran okuyucularda da)
  assert.equal(await page.$eval('#toast', el => getComputedStyle(el).visibility), 'hidden');
  await page.click('.copy-btn');
  await page.waitForSelector('#toast.in', { timeout: 1500 });
  assert.equal(await page.$eval('#toastMsg', el => el.textContent), EN.ui['toast.copied']);
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'opticodestudio@gmail.com');
  await close();
});
