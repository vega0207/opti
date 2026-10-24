import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setup, openPage, overflowReport } from './helpers.mjs';

let ctx;
before(async () => { ctx = await setup(); });
after(async () => { await ctx?.close(); });

const sleep = ms => new Promise(r => setTimeout(r, ms));
const translateX = page => page.$eval('#faq .sec-head[data-anim="left"]', el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41);

test('görünür olunca belirir, ekrandan tamamen çıkınca kaybolur', async () => {
  const { page, close } = await openPage(ctx, '/?lang=en');
  const faqHead = '#faq .sec-head[data-anim]';
  assert.equal(await page.$eval(faqHead, el => el.classList.contains('in')), false);
  await page.$eval('#faq', el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.waitForFunction(s => document.querySelector(s).classList.contains('in'), { timeout: 1500 }, faqHead);
  // Kart ızgaraları sırayla gelir: çocuklara sıra numarası yazılır
  assert.deepEqual(await page.$$eval('#faqList > *', els => els.slice(0, 3).map(e => e.style.getPropertyValue('--i'))), ['0', '1', '2']);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForFunction(s => !document.querySelector(s).classList.contains('in'), { timeout: 1500 }, faqHead);
  await close();
});

test('sonradan çizilen kartlar da gözlenir (sekme değişimi)', async () => {
  const { page, close } = await openPage(ctx, '/?lang=en');
  await page.$eval('#work', el => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await page.click('[data-work-filter="client"]');
  await page.waitForFunction(() => {
    const card = document.querySelector('#workGrid .work');
    return card && card.dataset.anim === 'up' && card.classList.contains('in');
  }, { timeout: 1500 });
  await close();
});

test('hareketi azalt: her şey baştan görünür, dönüşüm yok', async () => {
  const { page, close } = await openPage(ctx, '/?lang=en', { reducedMotion: true });
  const hidden = await page.$$eval('[data-anim]', els => els.filter(el => {
    const s = getComputedStyle(el);
    return s.opacity !== '1' || s.transform !== 'none';
  }).length);
  assert.equal(hidden, 0);
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains('no-motion')), true);
  await close();
});

test('kayma mesafesi ekran kenar boşluğunu aşmaz', async () => {
  for (const [width, expected] of [[1440, -48], [1024, -24], [390, -16]]) {
    const { page, close } = await openPage(ctx, '/?lang=en', { width, height: 900 });
    assert.equal(await translateX(page), expected, `${width}px`);
    await close();
  }
});

test('kaydırırken yana taşma yok (360 px)', async () => {
  const { page, close } = await openPage(ctx, '/?lang=en', { width: 360, height: 740 });
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += Math.ceil(height / 10)) {
    await page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), y);
    await sleep(250);
    assert.deepEqual(await overflowReport(page), [], `y=${y}`);
  }
  await close();
});
