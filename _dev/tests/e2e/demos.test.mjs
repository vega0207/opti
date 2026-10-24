// Portföydeki her demo sayfası: dışarıya istek yok, hata yok, yana taşma yok, demo rozeti var,
// "fictional / concept" notları ve uzun tire yok, görseller yükleniyor.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setup, openPage, overflowReport } from './helpers.mjs';
import { loadScripts } from '../unit/load.mjs';

const CONFIG = loadScripts(['js/boot.js', 'js/config.js']).run('CONFIG');

let ctx;
before(async () => { ctx = await setup(); });
after(async () => { await ctx?.close(); });

for (const work of CONFIG.portfolio) {
  test(`${work.name} (${work.url})`, async () => {
    for (const width of [360, 768, 1440]) {
      const label = `${work.url} ${width}px`;
      const { page, external, errors, close } = await openPage(ctx, `/${work.url}`, { width, height: 900 });
      try {
        // Tembel görseller ve kaydırınca beliren bölümler için sayfa sonuna kadar inilir
        const height = await page.evaluate(() => document.documentElement.scrollHeight);
        // Her adımda kısa bekleme: tarayıcı ara konumları çizmezse tembel görseller hiç tetiklenmez
        for (let y = 0; y <= height; y += 700) {
          await page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), y);
          await new Promise(r => setTimeout(r, 60));
        }
        await page.waitForNetworkIdle({ idleTime: 500 });
        const info = await page.evaluate(() => {
          const badge = document.querySelector('a.ocs-demo-badge');
          const r = badge && badge.getBoundingClientRect();
          return {
            badge: badge ? { href: badge.getAttribute('href'), text: badge.textContent.trim(), visible: r.width > 0 && r.height > 0 } : null,
            text: document.body.innerText,
            broken: [...document.images].filter(img => !img.complete || img.naturalWidth === 0).map(img => img.getAttribute('src'))
          };
        });
        assert.deepEqual(info.badge, { href: 'index.html', text: 'Demo · OptiCodeStudio', visible: true }, label);
        assert.doesNotMatch(info.text, /fictional|concept site|design study|not a real/i, label);
        assert.ok(!info.text.includes('—'), `${label}: uzun tire`);
        assert.deepEqual(info.broken, [], label);
        assert.deepEqual(await overflowReport(page), [], label);
        assert.deepEqual(external, [], label);
        assert.deepEqual(errors, [], label);
      } finally {
        await close();
      }
    }
  });
}
