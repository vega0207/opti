// CC BY-SA fotoğraf kullanılıyorsa her sayfada yazar, kaynak ve lisans görünür olmalı (lisans şartı).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from './load.mjs';

const PAGES = ['index.html', 'privacy.html', 'terms.html', 'cookies.html'];
const NEEDED = [
  'data-i18n="footer.photos"',
  'https://commons.wikimedia.org/wiki/File:Thunersee_Sonnenuntergang_(48141634611).jpg',
  'https://creativecommons.org/licenses/by-sa/2.0/',
  'https://commons.wikimedia.org/wiki/File:Mountain_Niesen_-_View_from_Merligen_Thunersee.jpg'
];

test('arka plan fotoğraflarının atfı her sayfanın alt bilgisinde', () => {
  for (const f of PAGES) {
    const footer = readFileSync(path.join(REPO_ROOT, f), 'utf8').split('<footer')[1] || '';
    for (const s of NEEDED) assert.ok(footer.includes(s), `${f}: ${s}`);
  }
});
