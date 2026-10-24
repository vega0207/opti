import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setup, openPage, hasHorizontalOverflow, overflowReport } from './helpers.mjs';

let ctx;
before(async () => { ctx = await setup(); });
after(async () => { await ctx?.close(); });

test('ana sayfa sunuluyor', async () => {
  const { page } = await openPage(ctx, '/');
  assert.match(await page.title(), /OptiCodeStudio/);
});

test('localhost dışı istekler kaydedilip engellenir', async () => {
  const { page, external } = await openPage(ctx, '/');
  const outcome = await page.evaluate(() =>
    fetch('https://example.com/probe.txt').then(() => 'loaded', () => 'blocked'));
  assert.equal(outcome, 'blocked');
  assert.ok(external.includes('https://example.com/probe.txt'), external.join('\n'));
});

test('tohum depolama ilk yüklemede yazılır, yenilemede ezilmez', async () => {
  const { page } = await openPage(ctx, '/', { local: { k: 'seed' } });
  assert.equal(await page.evaluate(() => localStorage.getItem('k')), 'seed');
  await page.evaluate(() => localStorage.setItem('k', 'changed'));
  await page.reload({ waitUntil: 'networkidle0' });
  assert.equal(await page.evaluate(() => localStorage.getItem('k')), 'changed');
});

test('consent ve skipSplash varsayılanları tohumlanır', async () => {
  const { page } = await openPage(ctx, '/');
  const consent = await page.evaluate(() => JSON.parse(localStorage.getItem('ocs.consent')));
  assert.equal(consent.choice, 'accepted');
  assert.equal(await page.evaluate(() => sessionStorage.getItem('ocs.splash')), '1');
  // Tohum yoksa: onay kaydı yok ve açılış animasyonu oynar (site ocs.splash'i kendisi yazar)
  const fresh = await openPage(ctx, '/', { consent: null, skipSplash: false, wait: 'domcontentloaded' });
  assert.equal(await fresh.page.evaluate(() => localStorage.getItem('ocs.consent')), null);
  assert.equal(await fresh.page.evaluate(() => document.documentElement.classList.contains('splash')), true);
});

test('blockStorage depolamayı fırlatır yapar', async () => {
  const { page } = await openPage(ctx, '/', { blockStorage: true });
  const r = await page.evaluate(() => { try { localStorage.getItem('x'); return 'no'; } catch (e) { return 'threw'; } });
  assert.equal(r, 'threw');
});

test('formsubmit istekleri sahte yanıtlanır ve kaydedilir', async () => {
  const { page, formRequests } = await openPage(ctx, '/');
  const res = await page.evaluate(async () => {
    const r = await fetch('https://formsubmit.co/ajax/test@example.com', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ Name: 'Ada' })
    });
    return r.json();
  });
  assert.equal(res.success, 'true');
  assert.equal(formRequests.length, 1);
  assert.equal(formRequests[0].Name, 'Ada');
});

// Site body'de overflow-x: clip kullandığı için scrollWidth taşmayı göstermez;
// ölçüm ekran dışına çıkan görünür öğeleri yakalamalı.
test('yatay taşma ölçümü: kırpılan body içinde taşan öğeyi yakalar', async () => {
  const { page } = await openPage(ctx, '/', { width: 1440 });
  assert.equal(await hasHorizontalOverflow(page), false);
  await page.evaluate(() => {
    const d = document.createElement('div');
    d.id = 'wide';
    d.style.cssText = 'width:3000px;height:10px';
    document.body.appendChild(d);
  });
  assert.equal(await hasHorizontalOverflow(page), true);
  assert.ok((await overflowReport(page)).some(s => s.includes('#wide')));
});

test('yatay taşma ölçümü: bilerek kırpılan ve saydam öğeleri saymaz', async () => {
  const { page } = await openPage(ctx, '/', { width: 1440 });
  await page.evaluate(() => {
    const box = document.createElement('div');
    box.style.cssText = 'width:200px;overflow:hidden';
    box.innerHTML = '<div style="width:3000px;height:10px"></div>';
    document.body.appendChild(box);
    const ghost = document.createElement('div');
    ghost.style.cssText = 'width:3000px;height:10px;opacity:0';
    document.body.appendChild(ghost);
  });
  assert.equal(await hasHorizontalOverflow(page), false, (await overflowReport(page)).join('\n'));
});
