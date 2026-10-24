// İkon sprite'ını (_dev/icons.svg) ikon kullanan sayfaların içine gömer ve başvuruları "#i-<ad>" yapar.
// Neden: Chrome, dosyaya çift tıklanarak açılan (file://) sayfada dış dosyadaki <use> başvurularını engeller.
// Kullanım: node _dev/tools/inline-icons.mjs   (build-icons.mjs'ten sonra ya da sprite değişince)
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REPO_ROOT } from './serve.mjs';

export const ICON_PAGES = ['index.html', 'privacy.html', 'terms.html', 'cookies.html'];
export const SPRITE_FILE = path.join(REPO_ROOT, '_dev', 'icons.svg');

const START = '<!-- ikonlar: _dev/tools/inline-icons.mjs yazar, elle değiştirmeyin -->';
const END = '<!-- /ikonlar -->';

// Sprite'ın içi (lisans yorumu + <symbol>'ler) görünmez bir <svg> içinde sayfaya girer.
export function spriteBlock(spriteSource) {
  const inner = spriteSource.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
  if (!inner) throw new Error('sprite içinde <svg> yok');
  return `${START}\n<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">${inner[1].replace(/\s+$/, '')}\n</svg>\n${END}`;
}

const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const EXISTING = new RegExp(`${escRe(START)}[\\s\\S]*?${escRe(END)}`);

// İlk çalıştırmada <body> açılışının hemen ardına ekler, sonrakilerde aynı bloğu yeniler.
export function inlineSprite(html, spriteSource) {
  const block = spriteBlock(spriteSource);
  const out = EXISTING.test(html)
    ? html.replace(EXISTING, () => block)
    : html.replace(/<body([^>]*)>\n?/, (m, attrs) => `<body${attrs}>\n${block}\n`);
  return out.replace(/href="img\/icons\.svg#/g, 'href="#');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const sprite = await readFile(SPRITE_FILE, 'utf8');
  for (const page of ICON_PAGES) {
    const file = path.join(REPO_ROOT, page);
    await writeFile(file, inlineSprite(await readFile(file, 'utf8'), sprite));
    console.log(`${page}: ikonlar gömüldü`);
  }
}
