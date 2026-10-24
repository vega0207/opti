// Arapça (sağdan sola) düzen: yön, rakamlar, harf aralığı, ayna animasyonlar, kayan şerit.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setup, openPage } from './helpers.mjs';

let ctx;
before(async () => { ctx = await setup(); });
after(async () => { await ctx?.close(); });

test('yön: html rtl, logo sağ yarıda', async () => {
  const { page, close } = await openPage(ctx, '/?lang=ar');
  const r = await page.evaluate(() => ({
    dir: document.documentElement.dir,
    lang: document.documentElement.lang,
    logoLeft: document.querySelector('nav .logo').getBoundingClientRect().left,
    half: innerWidth / 2
  }));
  assert.equal(r.dir, 'rtl');
  assert.equal(r.lang, 'ar');
  assert.ok(r.logoLeft > r.half, `logo solda: ${r.logoLeft}`);
  await close();
});

test('fiyatlar Batı rakamlı ve dinar işaretli', async () => {
  const { page, close } = await openPage(ctx, '/?lang=ar');
  const price = await page.$eval('article.pkg[data-pkg="essential"] .pkg-price', el => el.textContent);
  assert.match(price, /[0-9]/);
  assert.ok(price.includes('د.ك'), price);
  assert.doesNotMatch(price, /[٠-٩]/);
  await close();
});

test('harf aralığı sıfır', async () => {
  const { page, close } = await openPage(ctx, '/?lang=ar');
  const spacing = await page.$$eval('h1, .btn, .nav-links a, .mq-item', els => [...new Set(els.map(el => getComputedStyle(el).letterSpacing))]);
  for (const s of spacing) assert.ok(s === 'normal' || s === '0px', s);
  await close();
});

test('ayna animasyonlar ve oklar', async () => {
  const { page, close } = await openPage(ctx, '/?lang=ar');
  const r = await page.evaluate(() => ({
    slide: new DOMMatrixReadOnly(getComputedStyle(document.querySelector('#faq .sec-head[data-anim="left"]')).transform).m41,
    marquee: getComputedStyle(document.querySelector('.marquee-track')).animationDirection,
    flip: new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.hero .flip')).transform).a
  }));
  assert.ok(r.slide > 0, `sola kayan öğe sağdan gelmeli: ${r.slide}`);
  assert.equal(r.marquee, 'reverse');
  assert.equal(r.flip, -1);
  await close();
});

test('kayan şerit döngüde boşluk bırakmaz (en ve ar)', async () => {
  for (const lang of ['en', 'ar']) {
    for (const width of [390, 1920]) {
      const { page, close } = await openPage(ctx, `/?lang=${lang}`, { width, height: 900 });
      const gaps = await page.evaluate(() => {
        const box = document.querySelector('.marquee').getBoundingClientRect();
        const track = document.querySelector('.marquee-track');
        const anim = track.getAnimations()[0];
        anim.pause();
        const out = [];
        const total = anim.effect.getComputedTiming().duration;
        for (const at of [0, 0.25, 0.5, 0.75, 0.999]) {
          anim.currentTime = total * at;
          const r = track.getBoundingClientRect();
          if (r.left > box.left + 1 || r.right < box.right - 1) out.push(`${at}: ${Math.round(r.left)}..${Math.round(r.right)}`);
        }
        return out;
      });
      assert.deepEqual(gaps, [], `${lang} ${width}px`);
      await close();
    }
  }
});

test('e-posta ve Instagram adı soldan sağa yazılır', async () => {
  const { page, close } = await openPage(ctx, '/?lang=ar');
  const dirs = await page.$$eval('#mailText, #igHandle, #f-email, #a-email', els => els.map(el => `${el.id}:${getComputedStyle(el).direction}`).sort());
  assert.deepEqual(dirs, ['a-email:ltr', 'f-email:ltr', 'igHandle:ltr', 'mailText:ltr']);
  await close();
});
