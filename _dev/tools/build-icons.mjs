// Kullanılan Lucide ikonlarını tek bir SVG sprite dosyasında toplar: _dev/icons.svg
// Sonra node _dev/tools/inline-icons.mjs ile sayfalara gömülür.
// Kullanım: node _dev/tools/build-icons.mjs
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { REPO_ROOT } from './serve.mjs';
import { REQUIRED_ICONS } from './icons-list.mjs';

const VERSION = '1.55.0';
const BASE = `https://cdn.jsdelivr.net/npm/lucide-static@${VERSION}`;
const INSTAGRAM_FALLBACK = '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>';

const get = async url => {
  const res = await fetch(url);
  return res.ok ? res.text() : null;
};

const license = await get(`${BASE}/LICENSE`);
if (!license) throw new Error('Lucide lisans metni alınamadı');

const symbols = [];
for (const name of REQUIRED_ICONS) {
  const svg = await get(`${BASE}/icons/${name}.svg`);
  let inner;
  if (svg) {
    inner = svg.replace(/<!--[\s\S]*?-->/g, '').match(/<svg[^>]*>([\s\S]*?)<\/svg>/)[1]
      .replace(/\s*\n\s*/g, '').replace(/\s*\/>/g, '/>');
  } else if (name === 'instagram') {
    inner = INSTAGRAM_FALLBACK;
  } else {
    throw new Error(`İkon bulunamadı: ${name}`);
  }
  symbols.push(`  <symbol id="i-${name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</symbol>`);
}

// XML yorumunda "--" geçemez: art arda gelen her tirenin arasına boşluk konur ("---" → "- - -").
const comment = `<!-- Icons from Lucide v${VERSION} (https://lucide.dev)\n${license.trim().replace(/-(?=-)/g, '- ')}\n-->`;
const out = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n${comment}\n${symbols.join('\n')}\n</svg>\n`;
await writeFile(path.join(REPO_ROOT, '_dev', 'icons.svg'), out);
console.log(`_dev/icons.svg: ${symbols.length} ikon`);
