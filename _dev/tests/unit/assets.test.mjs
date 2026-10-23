// Sitenin kendi içinden sunduğu dosyalar: yazı tipleri, ikonlar (ve sonraki görevlerde logo, görseller).
// Kırık bir referans sitede görünmeyen yazı tipi ya da boş ikon demektir.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from './load.mjs';
import { REQUIRED_ICONS } from '../../tools/icons-list.mjs';

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
  const svg = read('img/icons.svg');
  for (const name of REQUIRED_ICONS) {
    const m = svg.match(new RegExp(`<symbol id="i-${name}" viewBox="0 0 24 24"[^>]*>([\\s\\S]*?)</symbol>`));
    assert.ok(m, `i-${name} yok`);
    assert.match(m[1], /<(path|circle|rect|line|polyline|polygon|ellipse)\b/, `i-${name} boş`);
  }
});

test('kodda kullanılan her ikon sprite içinde', () => {
  const svg = read('img/icons.svg');
  const used = new Set();
  const files = [
    ...readdirSync(REPO_ROOT).filter(f => f.endsWith('.html')),
    ...(existsSync(path.join(REPO_ROOT, 'js')) ? readdirSync(path.join(REPO_ROOT, 'js')).filter(f => f.endsWith('.js')).map(f => `js/${f}`) : [])
  ];
  for (const f of files) {
    const src = read(f);
    for (const m of src.matchAll(/icons\.svg#i-([a-z0-9-]+)/g)) used.add(m[1]);
    for (const m of src.matchAll(/ui\.icon\('([a-z0-9-]+)'/g)) used.add(m[1]);
  }
  const missing = [...used].filter(n => !svg.includes(`id="i-${n}"`));
  assert.deepEqual(missing, []);
});
