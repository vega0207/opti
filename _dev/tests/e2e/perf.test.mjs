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
