// Görsel kontrol için tam sayfa ekran görüntüleri: _dev/shots/<sayfa>-<dil>-<tema>-<genişlik>.jpg
// Kullanım (repo kökünden): node _dev/tools/shoot.mjs [--pages=/,/privacy.html] [--langs=en,tr]
//   [--themes=dark,light] [--widths=360,390,768,1024,1440,1920]
// Açılış animasyonu atlanır, çerezler kabul edilmiş sayılır, hareket azaltılır (her şey görünür).
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { setup, openPage } from '../tests/e2e/helpers.mjs';
import { REPO_ROOT } from './serve.mjs';

const arg = (name, def) => {
  const hit = process.argv.find(a => a.startsWith(`--${name}=`));
  return (hit ? hit.slice(name.length + 3) : def).split(',').filter(Boolean);
};
const pages = arg('pages', '/');
const langs = arg('langs', 'en');
const themes = arg('themes', 'dark,light');
const widths = arg('widths', '360,390,768,1024,1440,1920').map(Number);

const outDir = path.join(REPO_ROOT, '_dev', 'shots');
await mkdir(outDir, { recursive: true });
const ctx = await setup();
try {
  for (const p of pages) {
    const pageName = p === '/' ? 'home' : p.replace(/^\//, '').replace(/\.html$/, '');
    for (const lang of langs) {
      for (const theme of themes) {
        for (const width of widths) {
          const height = width <= 420 ? 844 : 900;
          const { page, close } = await openPage(ctx, `${p}?lang=${lang}`, { width, height, scheme: theme, reducedMotion: true });
          await page.evaluate(() => document.fonts.ready);
          await new Promise(r => setTimeout(r, 300));
          const file = path.join(outDir, `${pageName}-${lang}-${theme}-${width}.jpg`);
          await page.screenshot({ path: file, fullPage: true, type: 'jpeg', quality: 70 });
          await close();
          console.log(path.relative(REPO_ROOT, file));
        }
      }
    }
  }
} finally {
  await ctx.close();
}
