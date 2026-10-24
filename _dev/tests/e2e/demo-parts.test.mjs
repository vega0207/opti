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

/* ---------------- Luma Dental Studio ---------------- */
const LUMA = '/meridian-law.html';
const slotFree = (page, hhmm) => page.$eval(`#booking button[data-slot="${hhmm}"]`, b => !b.disabled);

test('Luma: randevu adımları, pazar kapalı, geçmiş ve dolu saatler seçilemez, özet doğru', async () => {
  const { page, close } = await at(LUMA, [2026, 10, 26, 10, 0]);
  await page.click('#booking [data-step="1"] [data-next]');
  assert.equal(await visible(page, '#booking [data-step="1"]'), true, 'tedavi seçmeden ilerlememeli');
  await page.click('#booking input[name="treatment"][value="checkup"]');
  await page.click('#booking [data-step="1"] [data-next]');
  assert.equal(await page.$eval('#booking button[data-day="2026-11-01"]', b => b.disabled), true, 'pazar');
  await page.click('#booking button[data-day="2026-10-26"]');
  assert.equal(await slotFree(page, '10:00'), false, 'geçmiş saat');
  assert.equal(await slotFree(page, '10:30'), true);
  assert.equal(await slotFree(page, '11:00'), false, 'dolu saat');
  await page.click('#booking [data-step="3"] [data-back]');
  await page.click('#booking button[data-day="2026-10-27"]');
  const busy = await page.$$eval('#booking button[data-slot]', bs => bs.filter(b => b.disabled).map(b => b.dataset.slot));
  assert.deepEqual(busy, ['09:00', '11:30', '14:00', '16:30']);
  await page.click('#booking button[data-slot="10:00"]');
  await page.click('#booking [data-step="3"] [data-next]');
  await page.type('#bk-name', 'Maya Chen');
  await page.type('#bk-email', 'maya@example.com');
  await page.type('#bk-phone', '416 555 0199');
  await page.click('#booking [data-step="4"] [type="submit"]');
  await page.waitForSelector('#bk-done', { visible: true, timeout: 2000 });
  const done = await text(page, '#bk-done');
  assert.match(done, /Check-up/);
  assert.match(done, /Tue 27 Oct/);
  assert.match(done, /10:00/);
  await close();
});

test('Luma: aylık ödeme hesaplayıcı', async () => {
  const { page, close } = await at(LUMA, [2026, 10, 26, 10, 0]);
  await page.select('#calc-treat', 'aligners');
  await setValue(page, '#calc-months', '12');
  assert.equal(await text(page, '#calc-monthly'), '$400/mo');
  await page.select('#calc-treat', 'whitening');
  assert.equal(await text(page, '#calc-monthly'), '$55/mo');
  await page.select('#calc-treat', 'aligners');
  await setValue(page, '#calc-months', '24');
  assert.equal(await text(page, '#calc-monthly'), '$200/mo');
  await close();
});

test('Luma: tedavi kartındaki düğme randevuda o tedaviyi seçer', async () => {
  const { page, close } = await at(LUMA, [2026, 10, 26, 10, 0]);
  await page.click('.treat[data-treat="whitening"] [data-book]');
  assert.equal(await page.$eval('#booking input[name="treatment"][value="whitening"]', i => i.checked), true);
  await close();
});
