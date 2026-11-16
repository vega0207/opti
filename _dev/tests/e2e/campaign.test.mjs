// Kampanya (index.html #promo ve #offer): CONFIG.campaign açıkken en üstte şerit ve paketlerin üstünde teklif kartı görünür,
// "%50 / 50%" yazar; şerit teklif kartına, kartın ana düğmesi iletişim formuna, ikinci bağlantı Instagram'a gider.
// Kapalıyken (3 müşteri dolunca) ikisi de gizlenir.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setup, openPage, overflowReport } from './helpers.mjs';

let ctx;
before(async () => { ctx = await setup(); });
after(async () => { await ctx?.close(); });

const shown = (page, sel) => page.$eval(sel, el => !el.hidden && el.checkVisibility());

test('kampanya açık (EN): şerit ve kart görünür, 50% yazar, bağlantılar doğru', async () => {
  const { page, errors, close } = await openPage(ctx, '/?lang=en');
  assert.ok(await shown(page, '#promo'));
  assert.ok(await shown(page, '#offer'));
  assert.match(await page.$eval('#promo', el => el.textContent), /50%/);
  assert.match(await page.$eval('#offer', el => el.textContent), /50%/);
  assert.match(await page.$eval('#offer', el => el.textContent), /free preview/i);
  assert.equal(await page.$eval('#promo', el => el.getAttribute('href')), '#offer');
  assert.equal(await page.$eval('#offer a.btn-primary', el => el.getAttribute('href')), '#contact');
  assert.equal(await page.$eval('#offerDm', el => el.href), 'https://www.instagram.com/opticodestudio/');
  assert.deepEqual(errors, []);
  await close();
});

test('kampanya Türkçe: metin Türkçe ve "%50"', async () => {
  const { page, close } = await openPage(ctx, '/?lang=tr');
  const text = await page.$eval('#offer', el => el.textContent);
  assert.match(text, /%50/);
  assert.match(text, /önizleme/i);
  await close();
});

test('kampanya telefonda: şerit tek satır, sayfada yatay taşma yok (5 dil)', async () => {
  for (const lang of ['en', 'tr', 'de', 'ru', 'ar']) {
    const { page, close } = await openPage(ctx, `/?lang=${lang}`, { width: 390, height: 844 });
    const lines = await page.$eval('#promo .promo-short', el => Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight)));
    assert.equal(lines, 1, `${lang}: şerit tek satır olmalı`);
    assert.deepEqual(await overflowReport(page), [], lang);
    await close();
  }
});

test('kampanya kapalı (campaign: false): şerit ve kart gizli', async () => {
  const { page, close } = await openPage(ctx, '/?lang=en', { override: { '/js/config.js': body => body.replace(/campaign:\s*true/, 'campaign: false') } });
  assert.equal(await page.$eval('#promo', el => el.hidden), true);
  assert.equal(await page.$eval('#offer', el => el.hidden), true);
  await close();
});
