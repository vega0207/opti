import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setup, openPage } from './helpers.mjs';

let ctx;
before(async () => { ctx = await setup(); });
after(async () => { await ctx?.close(); });

test('Rusça sayfa Manrope Kiril dosyasını gerçekten yükler', async () => {
  const { page, close } = await openPage(ctx, '/?lang=ru');
  const result = await page.evaluate(async () => {
    await document.fonts.ready;
    const faces = [...document.fonts].filter(f => f.family.replace(/["']/g, '') === 'Manrope' && /U\+0?400/i.test(f.unicodeRange));
    return {
      lang: document.documentElement.lang,
      cyrillicHero: /[Ѐ-ӿ]/.test(document.querySelector('h1').textContent),
      statuses: faces.map(f => f.status)
    };
  });
  assert.equal(result.lang, 'ru');
  assert.equal(result.cyrillicHero, true, 'başlık Rusça değil');
  assert.ok(result.statuses.includes('loaded'), `Kiril yüzü yüklenmedi: ${result.statuses.join(', ')}`);
  await close();
});

test('Arapça sayfa IBM Plex Sans Arabic dosyasını gerçekten yükler', async () => {
  const { page, close } = await openPage(ctx, '/?lang=ar');
  const result = await page.evaluate(async () => {
    await document.fonts.ready;
    const faces = [...document.fonts].filter(f => f.family.replace(/["']/g, '') === 'IBM Plex Sans Arabic');
    return {
      lang: document.documentElement.lang,
      arabicHero: /[؀-ۿ]/.test(document.querySelector('h1').textContent),
      statuses: faces.map(f => f.status)
    };
  });
  assert.equal(result.lang, 'ar');
  assert.equal(result.arabicHero, true, 'başlık Arapça değil');
  assert.ok(result.statuses.includes('loaded'), `Arapça yüz yüklenmedi: ${result.statuses.join(', ')}`);
  await close();
});
