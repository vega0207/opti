import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setup, openPage, overflowReport, choose } from './helpers.mjs';
import { loadScripts } from '../unit/load.mjs';

let ctx;
before(async () => { ctx = await setup(); });
after(async () => { await ctx?.close(); });

const LANGS = {
  en: loadScripts(['js/boot.js', 'js/lang/en.js']).run('OCS.langs.en'),
  tr: loadScripts(['js/boot.js', 'js/lang/tr.js']).run('OCS.langs.tr')
};
const PAGES = [['privacy', '/privacy.html'], ['terms', '/terms.html'], ['cookies', '/cookies.html']];

test('üç hukuki sayfa iki dilde: başlık, içerik, dış istek yok, taşma yok', async () => {
  for (const [doc, path] of PAGES) {
    for (const [code, L] of Object.entries(LANGS)) {
      for (const width of [360, 1440]) {
        const { page, external, errors, close } = await openPage(ctx, `${path}?lang=${code}`, { width, height: 900 });
        const label = `${doc} ${code} ${width}px`;
        assert.equal(await page.$eval('[data-legal-doc] [data-legal-title]', el => el.textContent), L.legal[doc].title, label);
        assert.equal(await page.title(), `${L.legal[doc].title} | OptiCodeStudio`, label);
        assert.ok((await page.$eval('[data-legal-doc] [data-legal-body]', el => el.textContent.trim().length)) > 300, label);
        assert.deepEqual(external, [], label);
        assert.deepEqual(errors, [], label);
        assert.deepEqual(await overflowReport(page), [], label);
        await close();
      }
    }
  }
});

test('hukuki sayfada açılış animasyonu yok', async () => {
  const { page, close } = await openPage(ctx, '/privacy.html?lang=en', { skipSplash: false, wait: 'domcontentloaded' });
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains('splash')), false);
  await close();
});

test('KVKK metni: veri sorumlusu, 1 yıl ve açık rıza bölümü', async () => {
  const { page, close } = await openPage(ctx, '/privacy.html?lang=tr');
  const text = await page.$eval('main', el => el.textContent);
  assert.ok(text.includes('Veri sorumlusu: OptiCodeStudio. İletişim:'));
  assert.ok(!text.includes('DOLDURULACAK'));
  assert.ok(text.includes('bir yıl'));
  assert.equal(await page.$eval('#consent [data-legal-title]', el => el.textContent), LANGS.tr.legal.consent.title);
  await close();
});

test('hizmet şartlarında para birimi maddesi', async () => {
  const { page, close } = await openPage(ctx, '/terms.html?lang=tr');
  assert.ok((await page.$eval('main', el => el.textContent)).includes('Fiyatlar birden çok para biriminde gösterilir. Geçerli olan, yazılı teklifte belirtilen tutar ve para birimidir.'));
  await close();
});

test('hukuki sayfada dil değişimi içeriği ve adresi günceller', async () => {
  const { page, close } = await openPage(ctx, '/cookies.html?lang=en');
  await choose(page, '#legalControls', 'lang', 'tr');
  await page.waitForFunction(t => document.querySelector('[data-legal-title]').textContent === t, { timeout: 4000 }, LANGS.tr.legal.cookies.title);
  assert.match(await page.evaluate(() => location.search), /lang=tr/);
  assert.equal(await page.$('#legalControls [data-ctl="currency"]'), null, 'hukuki sayfada para menüsü yok');
  await close();
});

test('çerez bildirimi hukuki sayfalarda da çıkar', async () => {
  const { page, close } = await openPage(ctx, '/terms.html?lang=en', { consent: null });
  await page.waitForSelector('#consentBanner', { timeout: 3000 });
  await close();
});

test('ana sayfanın alt bilgisi üç hukuki sayfaya bağlanır', async () => {
  const { page, close } = await openPage(ctx, '/?lang=en');
  const hrefs = await page.$$eval('footer a', as => as.map(a => a.getAttribute('href')));
  for (const h of ['privacy.html', 'terms.html', 'cookies.html']) assert.ok(hrefs.includes(h), h);
  await close();
});
