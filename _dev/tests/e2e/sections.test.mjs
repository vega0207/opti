import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setup, openPage, overflowReport } from './helpers.mjs';
import { loadScripts } from '../unit/load.mjs';

let ctx;
before(async () => { ctx = await setup(); });
after(async () => { await ctx?.close(); });

const CFG = loadScripts(['js/boot.js', 'js/config.js']).run('CONFIG');
const EN = loadScripts(['js/boot.js', 'js/lang/en.js']).run('OCS.langs.en');
const text = (page, sel) => page.$eval(sel, el => el.textContent.trim());

test('kayan şerit: dil dosyasındaki 8 hizmet, iki eş yarı halinde tekrar', async () => {
  const { page, close } = await openPage(ctx, '/?lang=en');
  const items = await page.$$eval('#mqTrack .mq-item', els => els.map(e => e.textContent));
  const n = EN.marquee.length;
  assert.ok(items.length >= 2 * n && items.length % (2 * n) === 0, String(items.length));
  for (let i = 0; i < items.length; i += n) assert.deepEqual(items.slice(i, i + n), EN.marquee);
  await close();
});

test('hero kolajı: hero işaretli ilk 3 demonun görseli', async () => {
  const { page, close } = await openPage(ctx, '/?lang=en');
  const srcs = await page.$$eval('#heroCollage img', imgs => imgs.map(i => i.getAttribute('src')));
  assert.deepEqual(srcs, CFG.portfolio.filter(w => w.hero).slice(0, 3).map(w => w.thumb));
  await close();
});

test('çalışma sekmeleri: kartlar demoyu yeni sekmede açar', async () => {
  const { page, close } = await openPage(ctx, '/?lang=en');
  const cards = () => page.$$eval('#workGrid .work', els => els.map(a => ({
    href: a.getAttribute('href'), target: a.target, rel: a.rel, label: a.getAttribute('aria-label'),
    name: a.querySelector('.work-name').textContent, img: a.querySelector('img').getAttribute('src')
  })));
  const concept = await cards();
  assert.deepEqual(concept.map(c => c.href), CFG.portfolio.filter(w => w.type === 'concept').map(w => w.url));
  assert.equal(concept.length, 10);
  for (const c of concept) {
    assert.equal(c.target, '_blank');
    assert.match(c.rel, /noopener/);
  }
  assert.equal(concept[0].label, 'Open Golden Crust Bakery in a new tab');
  assert.equal(concept[0].img, 'img/work/golden-crust.jpg');
  await page.click('[data-work-filter="client"]');
  const client = await cards();
  assert.deepEqual(client.map(c => [c.name, c.href]), [['Nesmina', 'nesmina.html']]);
  const tabs = await page.$$eval('[data-work-filter]', bs => bs.map(b => [b.dataset.workFilter, b.getAttribute('aria-selected'), b.classList.contains('active')]));
  assert.deepEqual(tabs, [['concept', 'false', false], ['client', 'true', true]]);
  await close();
});

test('paketler: sekme başına kart, fiyatlar, rozetler', async () => {
  const { page, close } = await openPage(ctx, '/?lang=en');
  const counts = await page.evaluate(() => ['pkgGridNew', 'pkgGridMonthly', 'pkgGridCare']
    .map(id => document.getElementById(id).querySelectorAll('.pkg').length));
  assert.deepEqual(counts, [3, 2, 1]);
  assert.equal(await text(page, '[data-pkg="essential"] .pkg-price'), 'From $1,350');
  assert.equal(await text(page, '[data-pkg="custom"] .pkg-price'), EN.ui['pkg.customPrice']);
  assert.equal(await text(page, '[data-pkg="monthly-starter"] .pkg-price'), '$470 / month');
  const badges = await page.$$eval('.pkg', els => els.filter(e => e.querySelector('.pkg-badge')).map(e => e.dataset.pkg));
  assert.deepEqual(badges, ['redesign', 'monthly-business']);
  assert.equal(await text(page, '[data-pkg="redesign"] .pkg-badge'), EN.ui['pkg.popular']);
  assert.equal(await page.$$eval('[data-pkg="essential"] .check-list li', l => l.length), EN.packages.essential.short.length);

  await page.click('[data-pkg-tab="monthly"]');
  const panels = await page.$$eval('.pkg-panel', ps => ps.map(p => [p.id, p.classList.contains('active')]));
  assert.deepEqual(panels, [['pkgTabNew', false], ['pkgTabMonthly', true], ['pkgTabCare', false]]);
  assert.equal(await page.$eval('.pkg-tabs', el => el.dataset.active), 'monthly');
  await close();
});

test('paket detay penceresi: tam liste, notlar, kapatma ve teklif', async () => {
  const { page, close } = await openPage(ctx, '/?lang=en');
  await page.click('[data-modal="essential"]');
  assert.equal(await page.$eval('#pkgModal', el => el.classList.contains('open')), true);
  assert.equal(await text(page, '#mName'), EN.packages.essential.name);
  assert.equal(await page.$$eval('#mList li', l => l.length), EN.packages.essential.full.length);
  assert.equal(await page.$$eval('#mNotes li', l => l.length), EN.packages.essential.notes.length);
  assert.match(await text(page, '#mTag'), /\$1,350/);
  await page.keyboard.press('Escape');
  assert.equal(await page.$eval('#pkgModal', el => el.classList.contains('open')), false);

  await page.click('[data-modal="essential"]');
  await page.click('#mCta');
  assert.equal(await page.$eval('#pkgModal', el => el.classList.contains('open')), false);
  assert.equal(await page.$eval('#f-pkg', el => el.value), 'essential');
  await close();
});

test('teklif düğmesi paketi formda seçer ve bildirim gösterir', async () => {
  const { page, close } = await openPage(ctx, '/?lang=en');
  await page.click('[data-quote="redesign"]');
  assert.equal(await page.$eval('#f-pkg', el => el.value), 'redesign');
  await page.waitForSelector('#toast.in', { timeout: 1500 });
  assert.equal(await text(page, '#toastMsg'), 'Website Redesign selected. Tell us about your project.');
  await close();
});

test('form seçenekleri: paketler ve etkin paradaki bütçe aralıkları', async () => {
  const { page, close } = await openPage(ctx, '/?lang=en');
  const pkgs = await page.$$eval('#f-pkg option', os => os.map(o => [o.value, o.textContent]));
  assert.deepEqual(pkgs, [['notsure', EN.ui['form.packageNotSure']], ...CFG.packages.map(p => [p.id, EN.packages[p.id].name])]);
  const budgets = await page.$$eval('#f-budget option', os => os.map(o => o.textContent));
  assert.deepEqual(budgets, ['Prefer not to say', 'Under $1,350', '$1,350 – $3,350', '$3,350 – $6,700', '$6,700 – $13,400', '$13,400+']);
  await close();
});

test('SSS: 8 soru, tek açık cevap, fiyatlar dolu', async () => {
  const { page, close } = await openPage(ctx, '/?lang=en');
  const qs = await page.$$eval('#faqList .faq-q', bs => bs.map(b => b.textContent.trim()));
  assert.deepEqual(qs, EN.faqs.map(f => f.q));
  const [first, second] = await page.$$('#faqList .faq-q');
  await first.click();
  assert.equal(await first.evaluate(b => b.getAttribute('aria-expanded')), 'true');
  const answer = await page.$eval('#faqList .faq-item.open .faq-a', el => el.textContent);
  assert.match(answer, /\$1,350/);
  assert.match(answer, /\$2,000/);
  await second.click();
  assert.equal(await page.$$eval('#faqList .faq-item.open', l => l.length), 1);
  assert.equal(await first.evaluate(b => b.getAttribute('aria-expanded')), 'false');
  await close();
});

test('ücretsiz inceleme penceresi hero düğmesinden açılır', async () => {
  const { page, close } = await openPage(ctx, '/?lang=en');
  await page.click('.hero [data-open-audit]');
  assert.equal(await page.$eval('#auditModal', el => el.classList.contains('open')), true);
  await close();
});

test('bozuk fiyat: o paket "Custom quote" gösterir, sayfa çalışır (Review Focus 1)', async () => {
  const { page, errors, close } = await openPage(ctx, '/?lang=en', {
    override: { '/js/config.js': body => body.replace(/("essential":\s*\{\s*USD:\s*)1350/, '$1"abc"') }
  });
  assert.equal(await page.evaluate(() => CONFIG.prices.essential.USD), 'abc', 'değişiklik uygulanmadı');
  assert.equal(await text(page, '[data-pkg="essential"] .pkg-price'), EN.ui['pkg.customPrice']);
  assert.equal(await text(page, '[data-pkg="redesign"] .pkg-price'), 'From $2,000');
  const firstAnswer = await page.$eval('#faqList .faq-a', el => el.textContent);
  assert.doesNotMatch(firstAnswer, /\{price:/);
  assert.deepEqual(errors, []);
  await close();
});

test('taşma yok: dolu bölümlerle 6 genişlik × 2 tema', async () => {
  for (const width of [360, 390, 768, 1024, 1440, 1920]) {
    for (const scheme of ['dark', 'light']) {
      const { page, close } = await openPage(ctx, '/?lang=en', { width, height: 900, scheme });
      assert.deepEqual(await overflowReport(page), [], `${width}px ${scheme}`);
      await close();
    }
  }
});
