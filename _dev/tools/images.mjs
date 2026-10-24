// Arka plan fotoğrafını site için hazırlar (WebP): masaüstü (1920 px genişlik) ve mobil (900×1600 dik kırpım).
// Kullanım: node _dev/tools/images.mjs <kaynak> <ad> [--focus=0..1] [--out=klasör]
//   --focus: dik kırpımın yatay merkezi (0 = sol kenar, 1 = sağ kenar; varsayılan 0.5)
//   --out:   çıktı klasörü (varsayılan img/)
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import { REPO_ROOT } from './serve.mjs';

export async function processBackground(src, name, { focus = 0.5, out = path.join(REPO_ROOT, 'img') } = {}) {
  await mkdir(out, { recursive: true });
  const meta = await sharp(src).metadata();
  const webp = { quality: 70, effort: 6 };

  const desktop = path.join(out, `${name}.webp`);
  await sharp(src).rotate().resize({ width: 1920, withoutEnlargement: false }).webp(webp).toFile(desktop);

  // Dik kırpım: tam yükseklik, genişlik 9/16 oranında, merkez "focus" noktasında
  const cropW = Math.min(meta.width, Math.round(meta.height * 900 / 1600));
  const left = Math.max(0, Math.min(meta.width - cropW, Math.round(meta.width * focus - cropW / 2)));
  const mobile = path.join(out, `${name}-m.webp`);
  await sharp(src).rotate().extract({ left, top: 0, width: cropW, height: meta.height })
    .resize(900, 1600, { fit: 'cover' }).webp(webp).toFile(mobile);
  return { desktop, mobile };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))) {
  const [src, name, ...rest] = process.argv.slice(2);
  if (!src || !name) throw new Error('Kullanım: images.mjs <kaynak> <ad> [--focus=0.5] [--out=klasör]');
  const opt = Object.fromEntries(rest.filter(a => a.startsWith('--')).map(a => a.slice(2).split('=')));
  const r = await processBackground(src, name, {
    focus: opt.focus ? Number(opt.focus) : 0.5,
    ...(opt.out ? { out: path.resolve(opt.out) } : {})
  });
  console.log(r.desktop, r.mobile);
}
