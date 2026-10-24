// Sayfa ağırlığı: ilk yükleme ve sayfanın sonuna kadar kaydırma (tembel görseller) dahil.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setup, openPage } from './helpers.mjs';

let ctx;
before(async () => { ctx = await setup(); });
after(async () => { await ctx?.close(); });

const LIMIT = 1_500_000;

async function measure(path, opts) {
  let bytes = 0;
  const { page, external, close } = await openPage(ctx, path, {
    ...opts,
    beforeGoto: async p => {
      const client = await p.createCDPSession();
      await client.send('Network.enable');
      client.on('Network.loadingFinished', e => { bytes += e.encodedDataLength; });
    }
  });
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= height; y += 600) await page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), y);
  await page.waitForNetworkIdle({ idleTime: 800 });
  await close();
  return { bytes, external };
}

test('ana sayfa 1,5 MB altında ve dış istek yok (en, ar; masaüstü ve telefon)', async () => {
  for (const [path, opts] of [['/?lang=en', {}], ['/?lang=ar', {}], ['/?lang=en', { width: 390, height: 844 }]]) {
    const { bytes, external } = await measure(path, opts);
    const label = `${path} ${opts.width || 1440}px: ${(bytes / 1e6).toFixed(2)} MB`;
    assert.ok(bytes > 0, label);
    assert.ok(bytes < LIMIT, label);
    assert.deepEqual(external, [], label);
  }
});

// Yavaş bağlantıda zincir kısalsın: görseller kendilerine gerekmeyen dosyaları beklemez.
const timings = (page, parts) => page.evaluate(names => {
  const res = performance.getEntriesByType('resource');
  return Object.fromEntries(names.map(n => [n, res.filter(e => e.name.includes(n)).map(e => ({ start: e.startTime, end: e.responseEnd }))]));
}, parts);

test('hero görselleri dil dosyasının gelmesini beklemeden istenir', async () => {
  const hero = ['golden-crust', 'luma-dental', 'northform'].map(n => `/img/work/${n}.`);
  const { page, close } = await openPage(ctx, '/?lang=tr', { delay: { '/js/lang/tr.js': 1500 }, wait: 'domcontentloaded' });
  await page.waitForFunction(() => !document.documentElement.classList.contains('i18n-pending'), { timeout: 5000 });
  const t = await timings(page, ['/js/lang/tr.js', ...hero]);
  const langEnd = t['/js/lang/tr.js'][0].end;
  for (const h of hero) {
    assert.equal(t[h].length, 1, `${h} bir kez istenmeli`);
    assert.ok(t[h][0].start < langEnd - 1000, `${h} ${Math.round(t[h][0].start)} ms, dil dosyası ${Math.round(langEnd)} ms`);
  }
  await close();
});

test('arka plan fotoğrafı CSS dosyasının gelmesini beklemeden istenir ve bir kez iner', async () => {
  for (const [width, bg] of [[1440, '/img/bg-night.'], [390, '/img/bg-night-m.']]) {
    const { page, close } = await openPage(ctx, '/?lang=en', { width, height: 844, scheme: 'dark', delay: { '/css/style.css': 1000 } });
    const t = await timings(page, ['/css/style.css', bg]);
    const cssEnd = t['/css/style.css'][0].end;
    assert.equal(t[bg].length, 1, `${width}px ${bg}: ${t[bg].length} kez`);
    assert.ok(t[bg][0].start < cssEnd - 800, `${width}px ${bg} ${Math.round(t[bg][0].start)} ms, css ${Math.round(cssEnd)} ms`);
    await close();
  }
});

// Sayfa, dil dosyası gelene kadar gizli bekler: dosya, onu yükleyen core.js'i beklemeden istenmeli.
test('dil dosyası betiklerin gelmesini beklemeden istenir ve bir kez iner', async () => {
  const { page, close } = await openPage(ctx, '/?lang=tr', { delay: { '/js/core.js': 1000 }, wait: 'domcontentloaded' });
  await page.waitForFunction(() => !document.documentElement.classList.contains('i18n-pending'), { timeout: 6000 });
  const t = await timings(page, ['/js/core.js', '/js/lang/tr.js']);
  const core = t['/js/core.js'][0];
  assert.equal(t['/js/lang/tr.js'].length, 1, `tr.js ${t['/js/lang/tr.js'].length} kez`);
  assert.ok(t['/js/lang/tr.js'][0].start < core.end - 800, `tr.js ${Math.round(t['/js/lang/tr.js'][0].start)} ms, core.js ${Math.round(core.end)} ms`);
  await close();
});
