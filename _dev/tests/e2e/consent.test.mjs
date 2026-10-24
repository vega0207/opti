import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setup, openPage, openTab, choose } from './helpers.mjs';
import { loadScripts } from '../unit/load.mjs';

let ctx;
before(async () => { ctx = await setup(); });
after(async () => { await ctx?.close(); });

const TR = loadScripts(['js/boot.js', 'js/lang/tr.js']).run('OCS.langs.tr');
const bannerVisible = page => page.evaluate(() => {
  const el = document.querySelector('#consentBanner');
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
});
const theme = page => page.evaluate(() => document.documentElement.dataset.theme);

test('ilk ziyarette çerez bildirimi görünür ve dile göre yazılır', async () => {
  const { page, close } = await openPage(ctx, '/?lang=tr', { consent: null });
  await page.waitForSelector('#consentBanner', { timeout: 3000 });
  assert.equal(await bannerVisible(page), true);
  assert.ok((await page.$eval('#consentBanner', el => el.textContent)).includes(TR.ui['consent.text']));
  assert.equal(await page.$eval('#consentBanner [data-consent="accepted"]', b => b.textContent), TR.ui['consent.accept']);
  assert.equal(await page.$eval('#consentBanner [data-consent="rejected"]', b => b.textContent), TR.ui['consent.reject']);
  assert.equal(await page.$eval('#consentBanner a', a => a.getAttribute('href')), 'cookies.html');
  assert.equal(await page.$eval('#consentBanner', el => el.getAttribute('role')), 'region');
  await close();
});

test('ret: tercihler yalnız bu ziyarette, yeni sekmede sisteme döner', async () => {
  const { page, context, close } = await openPage(ctx, '/?lang=en', { consent: null, scheme: 'dark' });
  await page.waitForSelector('#consentBanner');
  await page.click('#consentBanner [data-consent="rejected"]');
  assert.equal(await bannerVisible(page), false);
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('ocs.consent')).choice), 'rejected');
  await page.click('nav .theme-toggle');
  assert.equal(await theme(page), 'light');
  assert.equal(await page.evaluate(() => localStorage.getItem('ocs.theme')), null);
  assert.equal(await page.evaluate(() => sessionStorage.getItem('ocs.theme')), 'light');
  const tab = await openTab(ctx, context, '/?lang=en', { scheme: 'dark' });
  assert.equal(await bannerVisible(tab), false);
  assert.equal(await theme(tab), 'dark');
  await close();
});

test('kabul: tercihler kalıcı, yeni sekmede korunur', async () => {
  const { page, context, close } = await openPage(ctx, '/?lang=en', { consent: null, scheme: 'dark' });
  await page.waitForSelector('#consentBanner');
  await page.click('#consentBanner [data-consent="accepted"]');
  await page.click('nav .theme-toggle');
  assert.equal(await page.evaluate(() => localStorage.getItem('ocs.theme')), 'light');
  const tab = await openTab(ctx, context, '/?lang=en', { scheme: 'dark' });
  assert.equal(await bannerVisible(tab), false);
  assert.equal(await theme(tab), 'light');
  await close();
});

test('alt bilgideki "Çerez tercihleri" bildirimi yeniden açar', async () => {
  const { page, close } = await openPage(ctx, '/?lang=tr');
  assert.equal(await bannerVisible(page), false);
  await page.click('footer [data-open-consent]');
  await page.waitForSelector('#consentBanner');
  assert.equal(await bannerVisible(page), true);
  await close();
});

// Site sahibi büyük kutu yerine ince bir şerit istedi: masaüstünde altta tek satır, telefonda ekranın ≤ %15'i.
test('bildirim ince şerit: masaüstünde altta tam genişlik tek satır, telefonda ekranın %15ini aşmaz', async () => {
  const sizes = [[1025, 800, 'desktop'], [1440, 900, 'desktop'], [360, 740, 'phone'], [390, 844, 'phone']];
  for (const lang of ['tr', 'en', 'de', 'ru', 'ar']) {
    for (const [width, height, kind] of sizes) {
      const label = `${lang} ${width}px`;
      const { page, close } = await openPage(ctx, `/?lang=${lang}`, { consent: null, width, height });
      await page.waitForSelector('#consentBanner');
      const r = await page.$eval('#consentBanner', el => {
        const b = el.getBoundingClientRect();
        return { top: b.top, left: b.left, right: b.right, bottom: b.bottom, h: b.height };
      });
      assert.ok(Math.abs(r.bottom - height) <= 1, `${label}: altta değil (${r.bottom})`);
      if (kind === 'desktop') {
        assert.ok(r.left <= 0 && r.right >= width, `${label}: tam genişlik değil`);
        assert.ok(r.h <= 72, `${label}: ${r.h}px`);
      } else {
        assert.ok(r.h <= height * 0.15, `${label}: ${r.h}px > ${height * 0.15}`);
      }
      await close();
    }
  }
});

test('depolama kapalıyken site çalışır, bildirim çıkar ve kapanır (Review Focus 2)', async () => {
  const { page, errors, close } = await openPage(ctx, '/?lang=en', { blockStorage: true });
  await page.waitForSelector('#consentBanner', { timeout: 3000 });
  await choose(page, '#navControls', 'lang', 'tr');
  await page.waitForFunction(() => document.documentElement.lang === 'tr', { timeout: 4000 });
  await page.click('#consentBanner [data-consent="accepted"]');
  assert.equal(await bannerVisible(page), false);
  await page.click('nav .theme-toggle');
  assert.deepEqual(errors, []);
  await close();
});
