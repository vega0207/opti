// Dosyaların tarayıcıda gerçekten çalıştığını dener: bozuk bir sprite ya da dış dosyaya başvuru
// ikonları siler, metin araması bunu göremez.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { setup, openPage } from './helpers.mjs';
import { REQUIRED_ICONS } from '../../tools/icons-list.mjs';
import { REPO_ROOT } from '../../tools/serve.mjs';

let ctx;
before(async () => { ctx = await setup(); });
after(async () => { await ctx?.close(); });

test('gömülü sprite içindeki her ikon çiziliyor', async () => {
  const { page } = await openPage(ctx, '/');
  const sizes = await page.evaluate(async names => {
    const box = document.createElement('div');
    box.innerHTML = names.map(n => `<svg width="24" height="24" data-n="${n}"><use href="#i-${n}"></use></svg>`).join('');
    document.body.appendChild(box);
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    return Object.fromEntries([...box.querySelectorAll('svg')].map(s => {
      const b = s.querySelector('use').getBBox();
      return [s.dataset.n, b.width * b.height];
    }));
  }, REQUIRED_ICONS);
  for (const n of REQUIRED_ICONS) assert.ok(sizes[n] > 0, `i-${n} çizilmedi`);
});

// Site sahibi sayfaları dosyaya çift tıklayarak açıyor. Chrome file:// adresinde dış dosyadaki
// <use href="img/icons.svg#..."> başvurularını engeller; ikonlar sayfanın içinde olmalı.
test('dosyadan açılınca (file://) görünen her ikon çiziliyor', async () => {
  for (const file of ['index.html', 'privacy.html', 'terms.html', 'cookies.html']) {
    const context = await ctx.browser.createBrowserContext();
    const page = await context.newPage();
    try {
      await page.setViewport({ width: 1440, height: 900 });
      await page.evaluateOnNewDocument(() => {
        sessionStorage.setItem('ocs.splash', '1');
        localStorage.setItem('ocs.consent', JSON.stringify({ choice: 'accepted', at: '2026-10-24T00:00:00.000Z' }));
      });
      await page.goto(pathToFileURL(path.join(REPO_ROOT, file)).href, { waitUntil: 'load' });
      await page.waitForFunction(() => !document.documentElement.classList.contains('i18n-pending'));
      await new Promise(r => setTimeout(r, 400));
      const report = await page.evaluate(() => {
        const shown = [...document.querySelectorAll('svg use')].filter(u =>
          u.closest('svg').checkVisibility({ checkVisibilityCSS: true }));
        const blank = shown.filter(u => { const b = u.getBBox(); return b.width * b.height === 0; })
          .map(u => u.getAttribute('href'));
        return { shown: shown.length, blank };
      });
      assert.ok(report.shown >= 4, `${file}: yalnız ${report.shown} görünür ikon`);
      assert.deepEqual(report.blank, [], file);
    } finally {
      await context.close();
    }
  }
});

test('logo işareti tarayıcıda görüntü olarak açılıyor', async () => {
  const { page } = await openPage(ctx, '/');
  const size = await page.evaluate(() => new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve({ w: 0, h: 0 });
    img.src = 'img/logo-mark.svg';
  }));
  assert.ok(size.w > 0 && size.h > 0, JSON.stringify(size));
});

test('yazı tipleri tarayıcıda yükleniyor', async () => {
  const { page } = await openPage(ctx, '/');
  const status = await page.evaluate(async () => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'css/style.css';
    document.head.appendChild(link);
    await new Promise(r => { link.onload = r; link.onerror = r; });
    // fonts.check() yüklenemeyen dosyada da true dönebilir; yüklenen yüzlerin durumuna bakılır.
    const probes = [['Manrope', 'Hello'], ['Manrope', 'ğüşıİ'], ['Manrope', 'Привет'], ['IBM Plex Sans Arabic', 'مرحبا']];
    const out = {};
    for (const [family, text] of probes) {
      try {
        const faces = await document.fonts.load(`700 16px "${family}"`, text);
        out[`${family}:${text}`] = faces.length > 0 && faces.every(f => f.status === 'loaded');
      } catch (e) {
        out[`${family}:${text}`] = false;
      }
    }
    return out;
  });
  for (const [k, ok] of Object.entries(status)) assert.equal(ok, true, k);
});
