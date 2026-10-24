import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setup, openPage } from './helpers.mjs';

let ctx;
before(async () => { ctx = await setup(); });
after(async () => { await ctx?.close(); });

const sleep = ms => new Promise(r => setTimeout(r, ms));
const splashShown = page => page.evaluate(() => {
  const el = document.querySelector('.splash-screen');
  return Boolean(el) && getComputedStyle(el).display !== 'none';
});
const fresh = (opts = {}) => openPage(ctx, '/?lang=en', { skipSplash: false, wait: 'domcontentloaded', ...opts });

test('ilk girişte oynar, ~2,2 sn içinde biter ve oturuma yazılır', async () => {
  const { page, close } = await fresh();
  await sleep(100);
  assert.equal(await splashShown(page), true);
  // Kök öğe asla gizlenmez (html.splash sınıfı bir kuralla çakışırsa tüm sayfa boş görünür)
  assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).display), 'block');
  await page.waitForFunction(() => !document.querySelector('.splash-screen'), { timeout: 3000 });
  assert.equal(await page.evaluate(() => document.documentElement.isConnected && !!document.body), true);
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains('splash')), false);
  assert.equal(await page.evaluate(() => sessionStorage.getItem('ocs.splash')), '1');
  assert.equal(await page.$eval('nav .logo-mark', el => getComputedStyle(el).opacity), '1');
  await close();
});

test('aynı ziyarette yenileyince oynamaz', async () => {
  const { page, close } = await fresh();
  await page.waitForFunction(() => !document.querySelector('.splash-screen'), { timeout: 3000 });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await sleep(50);
  assert.equal(await splashShown(page), false);
  await close();
});

test('tıklayınca hemen geçilir', async () => {
  const { page, close } = await fresh();
  await sleep(300);
  await page.mouse.click(200, 200);
  const t0 = Date.now();
  await page.waitForFunction(() => !document.querySelector('.splash-screen'), { timeout: 700 });
  assert.ok(Date.now() - t0 <= 700);
  await close();
});

test('hareketi azalt: kısa sürer', async () => {
  const { page, close } = await fresh({ reducedMotion: true });
  await page.waitForFunction(() => !document.querySelector('.splash-screen'), { timeout: 1000 });
  await close();
});

test('çerez bildirimi açılış bittikten sonra çıkar', async () => {
  const { page, close } = await fresh({ consent: null });
  await sleep(200);
  assert.equal(await page.$('#consentBanner'), null);
  await page.waitForFunction(() => !document.querySelector('.splash-screen'), { timeout: 3000 });
  await page.waitForSelector('#consentBanner', { timeout: 2000 });
  await close();
});
