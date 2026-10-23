// Dosyaların tarayıcıda gerçekten çalıştığını dener: geçersiz bir SVG sprite tüm ikonları siler,
// metin araması bunu göremez.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setup, openPage } from './helpers.mjs';
import { REQUIRED_ICONS } from '../../tools/icons-list.mjs';

let ctx;
before(async () => { ctx = await setup(); });
after(async () => { await ctx?.close(); });

test('icons.svg geçerli XML ve her ikon çiziliyor', async () => {
  const { page } = await openPage(ctx, '/');
  const sizes = await page.evaluate(async names => {
    const xml = await (await fetch('img/icons.svg')).text();
    const parsed = new DOMParser().parseFromString(xml, 'image/svg+xml');
    if (parsed.querySelector('parsererror')) return { error: parsed.querySelector('parsererror').textContent };
    const box = document.createElement('div');
    box.innerHTML = names.map(n => `<svg width="24" height="24" data-n="${n}"><use href="img/icons.svg#i-${n}"></use></svg>`).join('');
    document.body.appendChild(box);
    await new Promise(r => setTimeout(r, 800));
    return Object.fromEntries([...box.querySelectorAll('svg')].map(s => {
      const b = s.querySelector('use').getBBox();
      return [s.dataset.n, b.width * b.height];
    }));
  }, REQUIRED_ICONS);
  assert.equal(sizes.error, undefined, sizes.error);
  for (const n of REQUIRED_ICONS) assert.ok(sizes[n] > 0, `i-${n} çizilmedi`);
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
