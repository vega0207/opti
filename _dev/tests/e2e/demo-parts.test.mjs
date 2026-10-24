// Baştan tasarlanan demoların çalışan parçaları (Parça 3). Saat ve tarih fixedClock ile sabitlenir:
// 2026-10-26 pazartesi, 2026-10-27 salı.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setup, openPage, fixedClock } from './helpers.mjs';

let ctx;
before(async () => { ctx = await setup(); });
after(async () => { await ctx?.close(); });

const at = (path, when, opts = {}) => openPage(ctx, path, { beforeGoto: p => fixedClock(p, when), ...opts });
const text = (page, sel) => page.$eval(sel, el => el.textContent.trim().replace(/\s+/g, ' '));
const visible = (page, sel) => page.$eval(sel, el => el.checkVisibility());
// Kullanıcının yazıp kutudan çıkması gibi: input + change
const setValue = (page, sel, value) => page.$eval(sel, (el, v) => {
  el.value = v;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}, value);

/* ---------------- Golden Crust Bakery ---------------- */
const GC = '/golden-crust.html';
const qty = id => `#preorder [data-order-id="${id}"] input[type="number"]`;

test('Golden Crust: açık/kapalı göstergesi ve öğleden sonra tükenenler', async () => {
  const morning = await at(GC, [2026, 10, 27, 8, 0]);
  assert.equal(await text(morning.page, '#open-status'), 'Open now · closes 7 PM');
  assert.deepEqual(await morning.page.$$eval('.item.is-sold', els => els.map(e => e.dataset.id)), []);
  await morning.close();

  const afternoon = await at(GC, [2026, 10, 27, 15, 0]);
  const sold = await afternoon.page.$$eval('.item.is-sold', els => els.map(e => e.dataset.id));
  assert.ok(sold.includes('sourdough'), sold.join());
  assert.ok(sold.includes('croissant'), sold.join());
  assert.ok(!sold.includes('cardamom'), sold.join());
  assert.match(await text(afternoon.page, '.item[data-id="sourdough"]'), /Sold out/);
  await afternoon.close();

  const monday = await at(GC, [2026, 10, 26, 10, 0]);
  assert.equal(await text(monday.page, '#open-status'), 'Closed · opens Tue 7 AM');
  await monday.close();
});

test('Golden Crust: ön sipariş toplamı, adet sınırları ve onay', async () => {
  const { page, close } = await at(GC, [2026, 10, 27, 8, 0]);
  await setValue(page, qty('sourdough'), '2');
  await setValue(page, qty('cardamom'), '1');
  assert.equal(await text(page, '#po-total'), '$19.00');
  await setValue(page, qty('sourdough'), '-3');
  assert.equal(await page.$eval(qty('sourdough'), el => el.value), '0');
  assert.equal(await text(page, '#po-total'), '$4.00');
  await setValue(page, qty('sourdough'), 'abc');
  assert.equal(await text(page, '#po-total'), '$4.00');
  await setValue(page, qty('sourdough'), '50');
  assert.equal(await page.$eval(qty('sourdough'), el => el.value), '20');
  assert.equal(await text(page, '#po-total'), '$154.00');
  assert.equal(await page.$eval('#po-time option', o => o.textContent.trim()), '8:30 AM');
  assert.equal(await visible(page, '#po-done'), false);
  await page.type('#po-name', 'Ada Brooks');
  await page.type('#po-phone', '503 555 0148');
  await page.click('#preorder [type="submit"]');
  await page.waitForSelector('#po-done', { visible: true, timeout: 2000 });
  const done = await text(page, '#po-done');
  assert.match(done, /Country Sourdough/);
  assert.match(done, /\$154\.00/);
  await close();
});

test('Golden Crust: kapalı günde teslim sonraki açık günden, tükenen sipariş edilemez', async () => {
  const monday = await at(GC, [2026, 10, 26, 10, 0]);
  assert.equal(await monday.page.$eval('#po-time option', o => o.textContent.trim()), 'Tue 7:30 AM');
  await monday.close();
  const afternoon = await at(GC, [2026, 10, 27, 15, 0]);
  assert.equal(await afternoon.page.$eval(qty('sourdough'), el => el.disabled), true);
  assert.equal(await afternoon.page.$eval(qty('cardamom'), el => el.disabled), false);
  await afternoon.close();
});

test('Golden Crust: menü sekmeleri', async () => {
  const { page, close } = await at(GC, [2026, 10, 27, 8, 0]);
  const shown = () => page.$$eval('[data-panel]', ps => ps.filter(p => p.checkVisibility()).map(p => p.dataset.panel));
  assert.deepEqual(await shown(), ['breads']);
  await page.click('button[data-tab="pastries"]');
  assert.deepEqual(await shown(), ['pastries']);
  assert.equal(await visible(page, '.item[data-id="croissant"]'), true);
  assert.equal(await page.$eval('button[data-tab="pastries"]', b => b.getAttribute('aria-selected')), 'true');
  await close();
});
