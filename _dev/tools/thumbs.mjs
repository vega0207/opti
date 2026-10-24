// Portföydeki her demonun uzun ekran görüntüsünü çeker (kart üzerine gelince aşağı kayan görsel).
// 1440×900 pencerede, sayfanın üst 2250 pikseli → 720 px genişliğe küçültülür → CONFIG.portfolio[].thumb
// Kullanım: node _dev/tools/thumbs.mjs
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import { setup } from '../tests/e2e/helpers.mjs';
import { loadScripts } from '../tests/unit/load.mjs';
import { REPO_ROOT } from './serve.mjs';

const CONFIG = loadScripts(['js/boot.js', 'js/config.js']).run('CONFIG');
const FREEZE = '*,*::before,*::after{animation:none!important;transition:none!important}' +
  '.reveal,[class*="reveal"]{opacity:1!important;transform:none!important}' +
  '.ocs-demo-badge{display:none!important}';

const ctx = await setup();
try {
  for (const w of CONFIG.portfolio) {
    const page = await ctx.browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.goto(`${ctx.base}/${w.url}`, { waitUntil: 'networkidle0', timeout: 90000 });
    await page.addStyleTag({ content: FREEZE });
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
      window.scrollTo(0, 0);
    });
    await page.waitForNetworkIdle({ idleTime: 800, timeout: 60000 }).catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    const png = await page.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 2250 }, captureBeyondViewport: true });
    const out = path.join(REPO_ROOT, w.thumb);
    await mkdir(path.dirname(out), { recursive: true });
    await sharp(png).resize({ width: 720 }).jpeg({ quality: 78, mozjpeg: true, progressive: true }).toFile(out);
    await page.close();
    console.log(w.thumb);
  }
} finally {
  await ctx.close();
}
