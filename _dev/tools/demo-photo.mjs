// Demo fotoğrafı hazırlar: photo-candidates.mjs listesinden seçilen fotoğrafı Commons'tan indirir,
// istenen boyuta kırpar, sıkıştırır ve kaynağını _dev/demo-photos.json'a yazar (CC0 / kamu malı,
// atıf gerekmez ama kaynak kayıtlı kalsın).
// Kullanım: node _dev/tools/demo-photo.mjs <liste> <no> <çıktı.webp|.jpg> <genişlik>x<yükseklik> [--focus=0.5,0.5] [--q=76]
//   --focus: kırpımın merkezi (0,0 = sol üst; 1,1 = sağ alt)
import path from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import sharp from 'sharp';
import { REPO_ROOT } from './serve.mjs';

const UA = 'OptiCodeStudioSiteBuild/1.0 (opticodestudio@gmail.com)';
const [list, no, out, size, ...rest] = process.argv.slice(2);
if (!list || !no || !out || !/^\d+x\d+$/.test(size || '')) {
  throw new Error('Kullanım: demo-photo.mjs <liste> <no> <çıktı.jpg> <genişlik>x<yükseklik> [--focus=x,y] [--q=76]');
}
const opt = Object.fromEntries(rest.filter(a => a.startsWith('--')).map(a => a.slice(2).split('=')));
const [fx, fy] = (opt.focus || '0.5,0.5').split(',').map(Number);
const quality = Number(opt.q || 76);
const [W, H] = size.split('x').map(Number);

const candidates = JSON.parse(await readFile(path.join(REPO_ROOT, '_dev', 'shots', 'candidates', `${list}.json`), 'utf8'));
const item = candidates[Number(no)];
if (!item) throw new Error(`${list}.json içinde #${no} yok`);
if (!/^(CC0|Public domain|PD|PDM)/i.test(item.license)) throw new Error(`${item.title}: lisans ${item.license}, atıfsız kullanılamaz`);

// Büyük dosyalar için Commons'un 1920 px küçük resmi yeter; küçükse özgün dosya
const source = item.width > 1920 ? item.thumb.split('?')[0].replace(/\/\d+px-/, '/1920px-') : item.original.split('?')[0];
const res = await fetch(source, { headers: { 'User-Agent': UA } });
if (!res.ok) throw new Error(`${source} → ${res.status}`);
const input = sharp(Buffer.from(await res.arrayBuffer())).rotate();
const meta = await input.metadata();

// Kırpım: önce W×H'yi tamamen kaplayacak kadar ölçeklenir, sonra odak noktası etrafından kesilir
const scale = Math.max(W / meta.width, H / meta.height);
const rw = Math.round(meta.width * scale);
const rh = Math.round(meta.height * scale);
const left = Math.max(0, Math.min(rw - W, Math.round(rw * fx - W / 2)));
const top = Math.max(0, Math.min(rh - H, Math.round(rh * fy - H / 2)));
const file = path.join(REPO_ROOT, out);
await mkdir(path.dirname(file), { recursive: true });
// Çıktı .webp ise WebP (yeni demolar; aynı kalitede ~%30 küçük), değilse JPG
const cropped = input.resize(rw, rh).extract({ left, top, width: W, height: H });
await (file.endsWith('.webp')
  ? cropped.webp({ quality, effort: 6 })
  : cropped.jpeg({ quality, mozjpeg: true, progressive: true })).toFile(file);

const manifestFile = path.join(REPO_ROOT, '_dev', 'demo-photos.json');
const manifest = existsSync(manifestFile) ? JSON.parse(await readFile(manifestFile, 'utf8')) : {};
manifest[out.replace(/\\/g, '/')] = { title: item.title, page: item.page, license: item.license, artist: item.artist };
await writeFile(manifestFile, JSON.stringify(Object.fromEntries(Object.entries(manifest).sort()), null, 1) + '\n');
const kb = Math.round((await sharp(file).toBuffer()).length / 1024);
console.log(`${out} ${W}×${H} ${kb} KB ← ${item.title} (${item.license})`);
