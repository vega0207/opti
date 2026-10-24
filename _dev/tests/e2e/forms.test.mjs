import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setup, openPage } from './helpers.mjs';
import { loadScripts } from '../unit/load.mjs';

let ctx;
before(async () => { ctx = await setup(); });
after(async () => { await ctx?.close(); });

const TR = loadScripts(['js/boot.js', 'js/lang/tr.js']).run('OCS.langs.tr');
const count = (page, sel) => page.$$eval(sel, l => l.length);

async function fillQuote(page) {
  await page.type('#f-name', 'Ada Lovelace');
  await page.type('#f-email', 'ada@example.com');
  await page.type('#f-msg', 'Yeni bir web sitesi istiyorum.');
}

test('boş gönderimde hatalar görünür, istek gitmez', async () => {
  const { page, formRequests, close } = await openPage(ctx, '/?lang=tr');
  await page.click('#quoteForm [type="submit"]');
  assert.equal(await count(page, '#quoteForm .f-group.err'), 3);
  assert.equal(await count(page, '#quoteForm .f-check.err'), 2);
  await page.waitForSelector('#toast.in');
  assert.equal(await page.$eval('#toastMsg', el => el.textContent), TR.ui['toast.fix']);
  assert.equal(formRequests.length, 0);
  await close();
});

test('alanlar dolu ama kutucuklar boşsa gönderilmez', async () => {
  const { page, formRequests, close } = await openPage(ctx, '/?lang=tr');
  await fillQuote(page);
  await page.click('#quoteForm [type="submit"]');
  assert.equal(await count(page, '#quoteForm .f-group.err'), 0);
  assert.equal(await count(page, '#quoteForm .f-check.err'), 2);
  assert.equal(await page.$eval('#quoteForm .f-checks .f-msg', el => getComputedStyle(el).display), 'block');
  await page.click('#quoteForm input[name="kvkk"]');
  await page.click('#quoteForm [type="submit"]');
  assert.equal(await count(page, '#quoteForm .f-check.err'), 1);
  assert.equal(formRequests.length, 0);
  await close();
});

test('geçerli gönderim: tek istek, dil/para/onaylar mailde, çift tıklama tek istek', async () => {
  const { page, formRequests, close } = await openPage(ctx, '/?lang=tr');
  await fillQuote(page);
  await page.click('#quoteForm input[name="kvkk"]');
  await page.click('#quoteForm input[name="transfer"]');
  const btn = await page.$('#quoteForm [type="submit"]');
  await Promise.all([btn.click(), btn.click()]);
  await page.waitForFunction(t => document.querySelector('#toastMsg').textContent === t, { timeout: 4000 }, TR.ui['toast.sent']);
  assert.equal(formRequests.length, 1);
  const p = formRequests[0];
  assert.match(p._subject, /^\[TR\] Quote Request — /);
  assert.equal(p['Name'], 'Ada Lovelace');
  assert.equal(p['Interested in'], `${TR.ui['form.packageNotSure']} (notsure)`);
  assert.equal(p['Budget'], TR.ui['form.budget.none']);
  assert.equal(p['Language'], 'tr');
  assert.equal(p['Currency'], 'TRY');
  assert.equal(p['Privacy notice'], 'Acknowledged');
  assert.equal(p['Transfer consent'], 'Given');
  assert.match(p['Consent time'], /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(await page.$eval('#f-name', el => el.value), '', 'form temizlenmeli');
  await close();
});

test('inceleme formu: aynı kurallar ve başarı paneli', async () => {
  const { page, formRequests, close } = await openPage(ctx, '/?lang=tr');
  await page.click('.hero [data-open-audit]');
  await page.click('#auditForm [type="submit"]');
  assert.equal(await count(page, '#auditForm .f-group.err'), 3);
  assert.equal(await count(page, '#auditForm .f-check.err'), 2);
  await page.type('#a-name', 'Ada');
  await page.type('#a-email', 'ada@example.com');
  await page.type('#a-site', 'ornek.com');
  await page.click('#auditForm input[name="kvkk"]');
  await page.click('#auditForm input[name="transfer"]');
  await page.click('#auditForm [type="submit"]');
  await page.waitForSelector('#auditModal .audit-ok', { timeout: 4000 });
  assert.equal(await page.$eval('#auditModal .audit-ok h4', el => el.textContent), TR.ui['audit.ok.title']);
  assert.equal(formRequests.length, 1);
  assert.equal(formRequests[0]._subject, '[TR] Free Audit Request — ornek.com');
  assert.equal(formRequests[0]['Transfer consent'], 'Given');
  await close();
});

test('hukuki pencereler: aydınlatma ve açık rıza metni, kutucuğu değiştirmez', async () => {
  const { page, close } = await openPage(ctx, '/?lang=tr');
  await page.click('#quoteForm a[data-legal="privacy"]');
  assert.equal(await page.$eval('#legalModal', el => el.classList.contains('open')), true);
  assert.equal(await page.$eval('#legalTitle', el => el.textContent), TR.legal.privacy.title);
  const body = await page.$eval('#legalBody', el => el.textContent);
  assert.ok(body.includes('[DOLDURULACAK'));
  assert.ok(body.includes('opticodestudio@gmail.com'));
  assert.ok(body.includes('bir yıl'));
  assert.equal(await page.$eval('#quoteForm input[name="kvkk"]', el => el.checked), false);
  await page.keyboard.press('Escape');
  assert.equal(await page.$eval('#legalModal', el => el.classList.contains('open')), false);
  await page.click('#quoteForm a[data-legal="consent"]');
  assert.equal(await page.$eval('#legalTitle', el => el.textContent), TR.legal.consent.title);
  await close();
});
