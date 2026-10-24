import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setup, openPage, overflowReport } from './helpers.mjs';
import { loadScripts } from '../unit/load.mjs';

let ctx;
before(async () => { ctx = await setup(); });
after(async () => { await ctx?.close(); });

const TR = loadScripts(['js/boot.js', 'js/lang/tr.js']).run('OCS.langs.tr');

test('Türkçe sayfa: dil, menü, fiyatlar TL', async () => {
  const { page, errors, close } = await openPage(ctx, '/?lang=tr');
  assert.equal(await page.evaluate(() => document.documentElement.lang), 'tr');
  assert.equal(await page.$eval('.nav-links a[href="#work"]', el => el.textContent), TR.ui['nav.work']);
  assert.equal(await page.title(), TR.ui['meta.title']);
  // 67000 TRY, tr-TR biçimi + "{p} ve üzeri"
  assert.equal(await page.$eval('[data-pkg="essential"] .pkg-price', el => el.textContent.trim().replace(/\s/g, ' ')), '₺67.000 ve üzeri');
  assert.equal(await page.$eval('[data-pkg="monthly-starter"] .pkg-price', el => el.textContent.trim().replace(/\s/g, ' ')), 'Aylık ₺23.500');
  assert.deepEqual(errors, []);
  await close();
});

test('Türkçe: 360 ve 1024 px taşma yok', async () => {
  for (const width of [360, 1024]) {
    const { page, close } = await openPage(ctx, '/?lang=tr', { width, height: 900 });
    assert.deepEqual(await overflowReport(page), [], `${width}px`);
    await close();
  }
});
