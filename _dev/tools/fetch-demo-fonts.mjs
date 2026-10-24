// Demo sayfalarının yazı tiplerini (latin alt kümesi) Google Fonts'tan bir kez indirir:
// fonts/demo/*.woff2 + fonts/demo/fonts.css (@font-face kuralları) + fonts/demo/OFL.txt.
// Sayfalar yayındayken Google'a bağlanmaz; tarayıcı yalnız sayfanın kullandığı aileyi indirir.
// Kullanım: node _dev/tools/fetch-demo-fonts.mjs
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { REPO_ROOT } from './serve.mjs';

// [Google Fonts css2 aile tanımı, google/fonts deposundaki lisans klasörü, alt kümeler (varsayılan latin)]
const FAMILIES = [
  ['Cormorant+Garamond:ital,wght@0,400..700;1,400..700', 'cormorantgaramond'],
  ['Jost:wght@300..600', 'jost'],
  ['Plus+Jakarta+Sans:wght@400..800', 'plusjakartasans'],
  ['Bebas+Neue', 'bebasneue'],
  ['Work+Sans:wght@400..700', 'worksans'],
  ['Syne:wght@500..800', 'syne'],
  ['Marcellus', 'marcellus'],
  ['Nunito+Sans:opsz,wght@6..12,400..800', 'nunitosans'],
  ['Barlow+Condensed:wght@500;600;700', 'barlowcondensed'],
  ['Barlow:wght@400;500;600', 'barlow'],
  ['Fredoka:wght@400..700', 'fredoka'],
  ['Nunito:wght@400..800', 'nunito'],
  ['Young+Serif', 'youngserif'],
  ['Figtree:wght@400..700', 'figtree'],
  ['Instrument+Serif:ital@0;1', 'instrumentserif'],
  ['Hanken+Grotesk:wght@400..700', 'hankengrotesk'],
  ['Unbounded:wght@500..800', 'unbounded'],
  ['Chivo:wght@400..700', 'chivo'],
  // Nesmina Türkçe: ğ, ş, ı, İ latin-ext alt kümesinde
  ['Newsreader:ital,wght@0,400..600;1,400..600', 'newsreader', ['latin', 'latin-ext']],
  ['Mulish:wght@400..700', 'mulish', ['latin', 'latin-ext']]
];
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';

const get = async (url, as = 'text') => {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return as === 'buffer' ? Buffer.from(await res.arrayBuffer()) : res.text();
};
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const field = (block, re, spec) => {
  const m = block.match(re);
  if (!m) throw new Error(`${spec}: ${re} bulunamadı\n${block}`);
  return m[1].trim();
};

const dir = path.join(REPO_ROOT, 'fonts', 'demo');
await mkdir(dir, { recursive: true });

const rules = ['/* Demo sayfalarının yazı tipleri. Kaynak: Google Fonts (SIL OFL 1.1, bkz. OFL.txt).\n   Yeniden üretmek için: node _dev/tools/fetch-demo-fonts.mjs */'];
const licenses = [];
const seen = new Map();
let total = 0;
for (const [spec, licenseDir, subsets = ['latin']] of FAMILIES) {
  const css = await get(`https://fonts.googleapis.com/css2?family=${spec}&display=swap`);
  const blocks = [...css.matchAll(/\/\*\s*([a-z-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g)]
    .filter(([, subset]) => subsets.includes(subset)).map(m => ({ subset: m[1], block: m[2] }));
  for (const want of subsets) {
    if (!blocks.some(b => b.subset === want)) throw new Error(`${spec}: ${want} alt kümesi yok`);
  }
  for (const { subset, block } of blocks) {
    const family = field(block, /font-family:\s*'([^']+)'/, spec);
    const style = field(block, /font-style:\s*(\w+)/, spec);
    const weight = field(block, /font-weight:\s*([0-9 ]+)/, spec);
    const url = field(block, /url\((https:[^)]+)\)\s*format\('woff2'\)/, spec);
    const range = field(block, /unicode-range:\s*([^;]+)/, spec);
    // Değişken yazı tiplerinde aynı dosya birden çok ağırlıkla gelir: bir kez indirilir
    let file = seen.get(url);
    if (!file) {
      file = `${slug(family)}-${style === 'italic' ? 'italic-' : ''}${weight.replace(' ', '-')}${subset === 'latin' ? '' : `-${subset}`}.woff2`;
      const data = await get(url, 'buffer');
      total += data.length;
      await writeFile(path.join(dir, file), data);
      seen.set(url, file);
      console.log(file, `${Math.round(data.length / 1024)} KB`);
    }
    rules.push(`@font-face {\n  font-family: "${family}";\n  font-style: ${style};\n  font-weight: ${weight};\n  font-display: swap;\n  src: url("${file}") format("woff2");\n  unicode-range: ${range};\n}`);
  }
  const text = await get(`https://raw.githubusercontent.com/google/fonts/main/ofl/${licenseDir}/OFL.txt`);
  licenses.push(`==== ${spec.split(':')[0].replace(/\+/g, ' ')} ====\n${text.trim()}`);
}

await writeFile(path.join(dir, 'fonts.css'), rules.join('\n\n') + '\n');
await writeFile(path.join(dir, 'OFL.txt'),
  'Fonts in this folder are licensed under the SIL Open Font License, Version 1.1.\n\n' + licenses.join('\n\n') + '\n');
console.log(`toplam ${Math.round(total / 1024)} KB`);
