// Google Fonts'tan Manrope ve IBM Plex Sans Arabic'in gerekli alt kümelerini indirip fonts/ klasörüne koyar
// ve css/style.css'in başına konacak @font-face kurallarını yazdırır. Site yayındayken Google'a bağlanmaz.
// Kullanım: node _dev/tools/fetch-fonts.mjs > fonts.css
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { REPO_ROOT } from './serve.mjs';

const CSS_URL = 'https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const WANT = {
  Manrope: { latin: 'manrope-latin', 'latin-ext': 'manrope-latin-ext', cyrillic: 'manrope-cyrillic' },
  'IBM Plex Sans Arabic': { arabic: 'plex-arabic' }
};
const LICENSES = [
  'https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/OFL.txt',
  'https://raw.githubusercontent.com/google/fonts/main/ofl/ibmplexsansarabic/OFL.txt'
];

const get = async (url, as = 'text') => {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return as === 'buffer' ? Buffer.from(await res.arrayBuffer()) : res.text();
};

const fontsDir = path.join(REPO_ROOT, 'fonts');
await mkdir(fontsDir, { recursive: true });

const css = await get(CSS_URL);
const blocks = [...css.matchAll(/\/\*\s*([a-z-]+)\s*\*\/\s*(@font-face\s*{[^}]*})/g)];
const out = [];
for (const [, subset, block] of blocks) {
  const family = block.match(/font-family:\s*'([^']+)'/)[1];
  const base = WANT[family]?.[subset];
  if (!base) continue;
  const weight = block.match(/font-weight:\s*([0-9 ]+);/)[1].trim();
  const file = family === 'Manrope' ? `${base}.woff2` : `${base}-${weight}.woff2`;
  const url = block.match(/url\((https:[^)]+\.woff2)\)/)[1];
  await writeFile(path.join(fontsDir, file), await get(url, 'buffer'));
  const range = block.match(/unicode-range:\s*([^;]+);/)[1].trim();
  out.push(
    `/* ${family} — ${subset} */\n@font-face {\n  font-family: "${family}";\n  font-style: normal;\n  font-weight: ${weight};\n` +
    `  font-display: swap;\n  src: url("../fonts/${file}") format("woff2");\n  unicode-range: ${range};\n}`
  );
}

const licenses = await Promise.all(LICENSES.map(u => get(u)));
await writeFile(path.join(fontsDir, 'OFL.txt'),
  'Fonts in this folder are licensed under the SIL Open Font License, Version 1.1.\n\n' +
  '==== Manrope ====\n' + licenses[0] + '\n\n==== IBM Plex Sans Arabic ====\n' + licenses[1]);

console.log(out.join('\n\n'));
