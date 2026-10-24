// İkon ve bayrak sprite'larını (_dev/icons.svg, _dev/flags.svg) kullanan sayfaların içine gömer
// ve başvuruları "#i-<ad>" yapar.
// Neden: Chrome, dosyaya çift tıklanarak açılan (file://) sayfada dış dosyadaki <use> başvurularını engeller.
// Kullanım: node _dev/tools/inline-icons.mjs   (build-icons.mjs / flags.mjs'ten sonra ya da sprite değişince)
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REPO_ROOT } from './serve.mjs';

export const ICON_PAGES = ['index.html', 'privacy.html', 'terms.html', 'cookies.html'];
export const SPRITE_FILES = ['icons.svg', 'flags.svg'].map(f => path.join(REPO_ROOT, '_dev', f));

const START = '<!-- ikonlar: _dev/tools/inline-icons.mjs yazar, elle değiştirmeyin -->';
const END = '<!-- /ikonlar -->';

// Her sprite'ın içi (lisans yorumu + <symbol>'ler) tek, görünmez bir <svg> içinde sayfaya girer.
export function spriteBlock(spriteSources) {
  const inners = spriteSources.map(src => {
    const inner = src.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
    if (!inner) throw new Error('sprite içinde <svg> yok');
    return inner[1].replace(/\s+$/, '');
  });
  return `${START}\n<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">${inners.join('')}\n</svg>\n${END}`;
}

const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const EXISTING = new RegExp(`${escRe(START)}[\\s\\S]*?${escRe(END)}`);

// İlk çalıştırmada <body> açılışının hemen ardına ekler, sonrakilerde aynı bloğu yeniler.
export function inlineSprite(html, spriteSources) {
  const block = spriteBlock(spriteSources);
  const out = EXISTING.test(html)
    ? html.replace(EXISTING, () => block)
    : html.replace(/<body([^>]*)>\n?/, (m, attrs) => `<body${attrs}>\n${block}\n`);
  return out.replace(/href="img\/icons\.svg#/g, 'href="#');
}

export const readSprites = () => Promise.all(SPRITE_FILES.map(f => readFile(f, 'utf8')));

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const sprites = await readSprites();
  for (const page of ICON_PAGES) {
    const file = path.join(REPO_ROOT, page);
    await writeFile(file, inlineSprite(await readFile(file, 'utf8'), sprites));
    console.log(`${page}: ikonlar ve bayraklar gömüldü`);
  }
}
