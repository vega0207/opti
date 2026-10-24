// Sekme ve ana ekran simgelerini logo işaretinden (img/logo-mark.svg) üretir:
//   favicon.svg (kare), favicon.png (48 px, eski tarayıcılar), apple-touch-icon.png (180 px, iPhone).
// Kullanım: node _dev/tools/favicon.mjs   (logo değişince yeniden çalıştırın)
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { REPO_ROOT } from './serve.mjs';

const BG = '#06131C';   // gece temasının zemini (css --bg); iPhone saydam simgeyi siyaha boyar

const mark = await readFile(path.join(REPO_ROOT, 'img', 'logo-mark.svg'), 'utf8');
const [x, y, w, h] = mark.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
const side = Math.max(w, h);
const square = `${x - (side - w) / 2} ${y - (side - h) / 2} ${side} ${side}`;
const svg = mark
  .replace(/viewBox="[^"]+"/, `viewBox="${square}"`)
  .replace(/\swidth="[\d.]+"/, ` width="${side}"`)
  .replace(/\sheight="[\d.]+"/, ` height="${side}"`);
await writeFile(path.join(REPO_ROOT, 'favicon.svg'), svg);

const render = size => sharp(Buffer.from(svg), { density: 72 * size / side * 4 }).resize(size, size);
await render(48).png({ compressionLevel: 9, palette: true }).toFile(path.join(REPO_ROOT, 'favicon.png'));

const inner = 140;      // 180 px içinde kenarlarda nefes payı
await sharp({ create: { width: 180, height: 180, channels: 4, background: BG } })
  .composite([{ input: await render(inner).png().toBuffer(), left: (180 - inner) / 2, top: (180 - inner) / 2 }])
  .png({ compressionLevel: 9, palette: true })
  .toFile(path.join(REPO_ROOT, 'apple-touch-icon.png'));

console.log('favicon.svg, favicon.png (48), apple-touch-icon.png (180)');
