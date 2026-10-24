// Ana site dosyalarında eski siteden kalan bağımlılık ve kırık yerel bağlantı olmamalı.
// Demo sayfaları (golden-crust.html vb.) Parça 2'de ayrıca ele alınır.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from './load.mjs';

const walk = dir => readdirSync(path.join(REPO_ROOT, dir), { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const FILES = ['index.html', 'privacy.html', 'terms.html', 'cookies.html',
  ...walk('css').filter(f => f.endsWith('.css')),
  ...walk('js').filter(f => f.endsWith('.js'))];
const read = f => readFileSync(path.join(REPO_ROOT, f), 'utf8');

test('eski bağımlılıklar ve eski görsel adları yok', () => {
  const OLD = ['fonts.googleapis', 'lucide@', 'unpkg.com', 'cdn.jsdelivr', 'termBody', 'JetBrains', 'Space Grotesk',
    'sea-bg.jpg', 'demo1.png', 'demo2.png', 'demo3.png', 'demo4.png', 'caseStudy'];
  for (const f of FILES) {
    const src = read(f);
    for (const word of OLD) assert.ok(!src.includes(word), `${f}: "${word}"`);
  }
});

test('eski görsel dosyaları silindi', () => {
  for (const f of ['demo1.png', 'demo2.png', 'demo3.png', 'demo4.png', 'sea-bg.jpg']) {
    assert.equal(existsSync(path.join(REPO_ROOT, f)), false, f);
  }
});

test('kırık yerel bağlantı yok', () => {
  const missing = [];
  for (const f of FILES) {
    const src = read(f);
    const base = path.dirname(f);
    const refs = [
      ...[...src.matchAll(/(?:src|href)=\\?"([^"\\]+)\\?"/g)].map(m => m[1]),
      ...[...src.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)].map(m => m[1]),
      ...[...src.matchAll(/(?:thumb|url):\s*"([^"]+)"/g)].map(m => m[1])
    ];
    for (const ref of refs) {
      if (/^(#|mailto:|tel:|https?:|data:|blob:)/.test(ref) || ref.includes('${')) continue;
      const clean = ref.split('#')[0].split('?')[0];
      if (!clean) continue;
      // JS içindeki yollar sayfaya göre, CSS içindekiler CSS dosyasına göre çözülür
      const from = f.endsWith('.css') ? base : '.';
      if (!existsSync(path.join(REPO_ROOT, from, clean))) missing.push(`${f}: ${ref}`);
    }
  }
  assert.deepEqual(missing, []);
});
