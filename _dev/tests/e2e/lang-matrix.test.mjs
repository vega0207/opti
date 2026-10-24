// Her dil × her sayfa × 6 genişlik × 2 tema: yana taşma yok, menü ve düğme yazıları sığar.
// LANGS=de,ru gibi verilirse yalnız o diller denenir (dosyası yoksa test başarısız olur);
// verilmezse js/lang/ içinde dosyası olan bütün diller denenir.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { setup, openPage, overflowReport } from './helpers.mjs';
import { REPO_ROOT } from '../../tools/serve.mjs';

const langDir = path.join(REPO_ROOT, 'js', 'lang');
const LANGS = process.env.LANGS
  ? process.env.LANGS.split(',').map(s => s.trim()).filter(Boolean)
  : readdirSync(langDir).filter(f => f.endsWith('.js')).map(f => f.slice(0, -3));
const PAGES = ['/', '/privacy.html', '/terms.html', '/cookies.html'];
const WIDTHS = [360, 390, 768, 1024, 1440, 1920];
const THEMES = ['dark', 'light'];

let ctx;
before(async () => { ctx = await setup(); });
after(async () => { await ctx?.close(); });

// Menü satırı, görünür düğmeler ve sekmeler: yazı kutusundan taşıyorsa listeler.
const fitReport = page => page.evaluate(() => {
  const out = [];
  for (const bar of document.querySelectorAll('nav .nav-in, .legal-bar-in')) {
    if (bar.scrollWidth > bar.clientWidth) out.push(`${bar.className}: ${bar.scrollWidth} > ${bar.clientWidth}`);
  }
  for (const btn of document.querySelectorAll('.btn, .tab')) {
    if (!btn.getClientRects().length || getComputedStyle(btn).visibility === 'hidden') continue;
    if (btn.scrollWidth > btn.clientWidth + 1) out.push(`.${btn.classList[0]} "${btn.textContent.trim()}": ${btn.scrollWidth} > ${btn.clientWidth}`);
  }
  return out;
});

for (const lang of LANGS) {
  test(`${lang}: 4 sayfa × 6 genişlik × 2 tema, taşma yok, menü ve düğmeler sığar`, async () => {
    assert.ok(existsSync(path.join(langDir, `${lang}.js`)), `js/lang/${lang}.js yok`);
    for (const theme of THEMES) {
      const { page, external, errors, close } = await openPage(ctx, `/?lang=${lang}`, { scheme: theme });
      try {
        for (const p of PAGES) {
          for (const width of WIDTHS) {
            const label = `${lang} ${theme} ${p} ${width}px`;
            await page.setViewport({ width, height: 900 });
            await page.goto(`${ctx.base}${p}?lang=${lang}`, { waitUntil: 'load' });
            await page.evaluate(() => window.OCS.i18n.ready);
            await page.evaluate(() => document.fonts.ready);
            assert.equal(await page.evaluate(() => document.documentElement.lang), lang, label);
            assert.deepEqual(await overflowReport(page), [], label);
            assert.deepEqual(await fitReport(page), [], label);
          }
        }
        assert.deepEqual(external, [], `${lang} ${theme}`);
        assert.deepEqual(errors, [], `${lang} ${theme}`);
      } finally {
        await close();
      }
    }
  });
}
