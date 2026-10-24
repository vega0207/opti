// Parça 3: baştan tasarlanan Golden Crust, Luma Dental, Northform ve Nesmina sayfaları.
// Yazı tipleri ve fotoğraflar siteyle birlikte sunulur; bir dosya eksikse sayfa yedek yazı tipine düşer
// ya da kırık görsel gösterir.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from './load.mjs';

const read = rel => readFileSync(path.join(REPO_ROOT, rel), 'utf8');

// Her görev kendi sayfasını bu listeye ekler.
const REDESIGNED = ['golden-crust.html', 'meridian-law.html'];

const FAMILIES = ['Young Serif', 'Figtree', 'Instrument Serif', 'Hanken Grotesk', 'Unbounded', 'Chivo', 'Newsreader', 'Mulish'];

// "U+0100-02BA, U+0304" → [[0x100, 0x2BA], [0x304, 0x304]]
const ranges = s => s.split(',').map(r => r.trim().replace(/^U\+/i, '').split('-').map(h => parseInt(h, 16)))
  .map(([a, b]) => [a, b ?? a]);
const covers = (list, cp) => list.some(([a, b]) => cp >= a && cp <= b);

test('yeni yazı tipi aileleri fonts.css içinde, Newsreader ve Mulish Türkçe harfleri kapsıyor', () => {
  const css = read('fonts/demo/fonts.css');
  const faces = (css.match(/@font-face\s*{[^}]*}/g) || []).map(f => ({
    family: f.match(/font-family:\s*"([^"]+)"/)[1],
    file: f.match(/url\("([^"]+)"\)/)[1],
    range: ranges(f.match(/unicode-range:\s*([^;]+)/)[1])
  }));
  for (const family of FAMILIES) {
    const mine = faces.filter(f => f.family === family);
    assert.ok(mine.length > 0, `${family} yok`);
    for (const f of mine) assert.ok(existsSync(path.join(REPO_ROOT, 'fonts', 'demo', f.file)), `${f.file} yok`);
  }
  // Ğ, İ, Ş (ı ve ğ/ş küçükleri aynı aralıkta)
  for (const family of ['Newsreader', 'Mulish']) {
    for (const cp of [0x11E, 0x130, 0x15E, 0x131]) {
      assert.ok(faces.some(f => f.family === family && covers(f.range, cp)), `${family} U+${cp.toString(16)} kapsamıyor`);
    }
  }
});

test('yeniden tasarlanan sayfaların fotoğrafları WebP, ≤ 260 KB ve kaynakları kayıtlı', () => {
  const sources = JSON.parse(read('_dev/demo-photos.json'));
  for (const page of REDESIGNED) {
    const refs = [...new Set([...read(page).matchAll(/img\/demo\/[a-z0-9-]+\/[a-z0-9-]+\.[a-z]+/g)].map(m => m[0]))];
    assert.ok(refs.length >= 4, `${page}: ${refs.length} fotoğraf`);
    for (const ref of refs) {
      assert.match(ref, /\.webp$/, `${page}: ${ref}`);
      const file = path.join(REPO_ROOT, ref);
      assert.ok(existsSync(file), `${ref} yok`);
      assert.ok(statSync(file).size <= 260 * 1024, `${ref} ${Math.round(statSync(file).size / 1024)} KB`);
      assert.ok(sources[ref], `${ref} demo-photos.json'da yok`);
      assert.match(sources[ref].license, /^(CC0|Public domain|PD)/i, `${ref} lisansı ${sources[ref].license}`);
    }
  }
});
