// Sitenin kendi içinden sunduğu dosyalar: yazı tipleri, ikonlar (ve sonraki görevlerde logo, görseller).
// Kırık bir referans sitede görünmeyen yazı tipi ya da boş ikon demektir.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from './load.mjs';
import { REQUIRED_ICONS } from '../../tools/icons-list.mjs';
import { ICON_PAGES, inlineSprite, readSprites } from '../../tools/inline-icons.mjs';

const read = rel => readFileSync(path.join(REPO_ROOT, rel), 'utf8');

test('css içindeki yazı tipleri diskte, 60 KB altında ve font-display: swap', () => {
  const css = read('css/style.css');
  const faces = css.match(/@font-face\s*{[^}]*}/g) || [];
  assert.ok(faces.length >= 7, `@font-face sayısı ${faces.length}`);
  for (const face of faces) {
    assert.match(face, /font-display:\s*swap/);
    assert.match(face, /unicode-range:/);
    const m = face.match(/url\(\s*['"]?\.\.\/fonts\/([^'")]+)['"]?\s*\)/);
    assert.ok(m, `yerel url yok: ${face.slice(0, 80)}`);
    const file = path.join(REPO_ROOT, 'fonts', m[1]);
    assert.ok(existsSync(file), `${m[1]} yok`);
    assert.ok(statSync(file).size < 60 * 1024, `${m[1]} 60 KB üstü`);
  }
});

test('gerekli ikonlar sprite içinde ve her biri çizim içeriyor', () => {
  const svg = read('_dev/icons.svg');
  for (const name of REQUIRED_ICONS) {
    const m = svg.match(new RegExp(`<symbol id="i-${name}" viewBox="0 0 24 24"[^>]*>([\\s\\S]*?)</symbol>`));
    assert.ok(m, `i-${name} yok`);
    assert.match(m[1], /<(path|circle|rect|line|polyline|polygon|ellipse)\b/, `i-${name} boş`);
  }
});

test('logo işareti: animasyonun kullandığı parçalar, viewBox ve boyut', () => {
  const file = path.join(REPO_ROOT, 'img', 'logo-mark.svg');
  assert.ok(existsSync(file), 'img/logo-mark.svg yok');
  const svg = readFileSync(file, 'utf8');
  assert.match(svg, /<svg[^>]*\bviewBox="[\d.]+ [\d.]+ [\d.]+ [\d.]+"/);
  for (const id of ['frame', 'chevron', 'arrow', 'chip', 'pink']) assert.match(svg, new RegExp(`id="${id}"`), id);
  for (const id of ['g-frame', 'g-teal', 'g-pink']) assert.match(svg, new RegExp(`id="${id}"`), id);
  assert.doesNotMatch(svg, /<text|xlink:href="http|href="http/);
  assert.ok(statSync(file).size < 4096, `${statSync(file).size} bayt`);
});

// WebP: aynı kalitede JPG'den ~%30 küçük; yavaş bağlantıda fotoğraflar daha erken tamamlanır.
test('gece/gündüz arka planları WebP: masaüstü 1920 px ≤ 170 KB, mobil 900×1600 ≤ 100 KB', async () => {
  const sharp = (await import('sharp')).default;
  for (const name of ['bg-night', 'bg-day']) {
    for (const [suffix, w, h, max] of [['', 1920, null, 170], ['-m', 900, 1600, 100]]) {
      const rel = `img/${name}${suffix}.webp`;
      const file = path.join(REPO_ROOT, rel);
      assert.ok(existsSync(file), `${rel} yok`);
      assert.ok(statSync(file).size <= max * 1024, `${rel} ${Math.round(statSync(file).size / 1024)} KB`);
      const meta = await sharp(file).metadata();
      assert.equal(meta.format, 'webp', rel);
      assert.equal(meta.width, w, `${rel} genişlik`);
      if (h) assert.equal(meta.height, h, `${rel} yükseklik`);
    }
  }
});

test('çalışma kartı görselleri WebP: 720×1125 ve ≤ 85 KB', async () => {
  const sharp = (await import('sharp')).default;
  const { loadScripts } = await import('./load.mjs');
  const CONFIG = loadScripts(['js/boot.js', 'js/config.js']).run('CONFIG');
  for (const w of CONFIG.portfolio) {
    const file = path.join(REPO_ROOT, w.thumb);
    assert.ok(existsSync(file), `${w.thumb} yok`);
    assert.ok(statSync(file).size <= 85 * 1024, `${w.thumb} ${Math.round(statSync(file).size / 1024)} KB`);
    const meta = await sharp(file).metadata();
    assert.equal(meta.format, 'webp', w.thumb);
    assert.deepEqual([meta.width, meta.height], [720, 1125], w.thumb);
  }
});

test('açılış animasyonundaki logo, logo dosyasıyla aynı çizim', () => {
  const ds = src => [...src.matchAll(/\sd="([^"]+)"/g)].map(m => m[1]);
  const fileD = ds(read('img/logo-mark.svg'));
  const html = read('index.html');
  const block = html.match(/<svg class="splash-mark"[\s\S]*?<\/svg>/);
  assert.ok(block, 'index.html içinde splash-mark SVG yok');
  assert.ok(fileD.length >= 8);
  assert.deepEqual(ds(block[0]), fileD);
});

// Sayfalar ikonları gömülü sprite'tan alır (file:// açılışında dış dosya engellenir). Sprite değişip
// inline-icons.mjs çalıştırılmazsa sayfa eski ikonlarla kalır; bir ikon eksikse yerinde boşluk görünür.
test('ikon kullanan sayfalarda gömülü sprite güncel ve kullanılan her ikonu içeriyor', async () => {
  const sprites = await readSprites();
  const jsUsed = new Set();
  for (const f of readdirSync(path.join(REPO_ROOT, 'js')).filter(f => f.endsWith('.js'))) {
    for (const m of read(`js/${f}`).matchAll(/ui\.icon\('([a-z0-9-]+)'/g)) jsUsed.add(m[1]);
  }
  assert.ok(jsUsed.size > 0, "js içinde ikon bulunamadı (arama kalıbı bozuk)");
  for (const page of ICON_PAGES) {
    const html = read(page);
    assert.equal(html, inlineSprite(html, sprites), `${page}: node _dev/tools/inline-icons.mjs çalıştırılmalı`);
    const used = new Set([...html.matchAll(/<use href="#i-([a-z0-9-]+)"/g)].map(m => m[1]));
    assert.ok(used.size >= 4, `${page}: ${used.size} ikon`);
    for (const n of jsUsed) used.add(n);
    const missing = [...used].filter(n => !html.includes(`<symbol id="i-${n}"`));
    assert.deepEqual(missing, [], page);
  }
});

// Sekmedeki simge eskiden yazılı, beyaz zeminli 1080 px'lik eski logoydu; 16 px'te seçilmiyordu.
test('favicon sitedeki logo işaretiyle aynı çizim; png 48 px, iPhone simgesi 180 px', async () => {
  const sharp = (await import('sharp')).default;
  const ds = src => [...src.matchAll(/\sd="([^"]+)"/g)].map(m => m[1]);
  const mark = ds(read('img/logo-mark.svg'));
  assert.ok(existsSync(path.join(REPO_ROOT, 'favicon.svg')), 'favicon.svg yok');
  assert.deepEqual(ds(read('favicon.svg')), mark);
  const box = read('favicon.svg').match(/viewBox="[\d.-]+ [\d.-]+ ([\d.]+) ([\d.]+)"/);
  assert.ok(box && box[1] === box[2], 'favicon.svg kare değil');
  for (const [file, size, maxKb] of [['favicon.png', 48, 6], ['apple-touch-icon.png', 180, 24]]) {
    const meta = await sharp(path.join(REPO_ROOT, file)).metadata();
    assert.deepEqual([meta.format, meta.width, meta.height], ['png', size, size], file);
    assert.ok(statSync(path.join(REPO_ROOT, file)).size <= maxKb * 1024, `${file} ${statSync(path.join(REPO_ROOT, file)).size} bayt`);
  }
  for (const page of ICON_PAGES) {
    const head = read(page).match(/<head>[\s\S]*?<\/head>/)[0];
    assert.match(head, /<link rel="icon" type="image\/svg\+xml" href="favicon\.svg">/, page);
    assert.match(head, /<link rel="icon" type="image\/png" sizes="48x48" href="favicon\.png">/, page);
    assert.match(head, /<link rel="apple-touch-icon" href="apple-touch-icon\.png">/, page);
  }
});
