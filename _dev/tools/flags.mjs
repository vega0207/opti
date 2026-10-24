// Dil ve para menülerindeki bayraklar: _dev/flags.svg (inline-icons.mjs sayfalara gömer).
// Windows bayrak emojisini göstermediği için çizim. Hepsi 3:2 kutuda, menüde 21×14 px'te tanınacak
// kadar sade (Birleşik Krallık'ın kaydırılmış çaprazları, ABD'nin yıldızları gibi ayrıntılar yok).
// Kullanım: node _dev/tools/flags.mjs && node _dev/tools/inline-icons.mjs
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { REPO_ROOT } from './serve.mjs';

const r = n => Math.round(n * 1000) / 1000;
// Beş köşeli yıldız; ilk uç `angle` derece yönünde (0 = sağ, -90 = yukarı).
const star = (cx, cy, R, angle = -90) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = (angle + i * 36) * Math.PI / 180;
    const d = i % 2 ? R * 0.382 : R;
    pts.push(`${r(cx + d * Math.cos(a))},${r(cy + d * Math.sin(a))}`);
  }
  return pts.join(' ');
};
const stripes = (colors, w = 30, h = 20) => colors.map((c, i) =>
  `<rect y="${r(i * h / colors.length)}" width="${w}" height="${r(h / colors.length + 0.01)}" fill="${c}"/>`).join('');

const FLAGS = {
  // Türkiye: hilal 0,5G / 0,4G daireleri, yıldız 0,25G çemberinde, ucu hilale bakar (G = yükseklik)
  tr: ['0 0 30 20', `<rect width="30" height="20" fill="#E30A17"/><circle cx="10" cy="10" r="5" fill="#fff"/><circle cx="11.25" cy="10" r="4" fill="#E30A17"/><polygon points="${star(16.42, 10, 2.5, 180)}" fill="#fff"/>`],
  gb: ['0 0 30 20', '<rect width="30" height="20" fill="#012169"/><path d="M0 0L30 20M30 0L0 20" stroke="#fff" stroke-width="4"/><path d="M0 0L30 20M30 0L0 20" stroke="#C8102E" stroke-width="1.4"/><path d="M15 0V20M0 10H30" stroke="#fff" stroke-width="6.6"/><path d="M15 0V20M0 10H30" stroke="#C8102E" stroke-width="4"/>'],
  de: ['0 0 30 20', stripes(['#000', '#DD0000', '#FFCE00'])],
  ru: ['0 0 30 20', stripes(['#fff', '#0039A6', '#D52B1E'])],
  kw: ['0 0 30 20', `${stripes(['#007A3D', '#fff', '#CE1126'])}<path d="M0 0L7.5 6.667V13.333L0 20Z" fill="#000"/>`],
  us: ['0 0 30 20', (() => {
    let s = stripes(Array.from({ length: 13 }, (_, i) => (i % 2 ? '#fff' : '#B22234')));
    s += '<rect width="12" height="10.77" fill="#3C3B6E"/>';
    for (let row = 0; row < 5; row++) for (let col = 0; col < 6; col++) {
      s += `<circle cx="${r(1 + col * 2)}" cy="${r(1.1 + row * 2.15)}" r=".5" fill="#fff"/>`;
    }
    return s;
  })()],
  // AB: 12 yıldız, yarıçapı yüksekliğin 1/3'ü olan çemberde
  eu: ['0 0 30 20', (() => {
    let s = '<rect width="30" height="20" fill="#039"/>';
    for (let i = 0; i < 12; i++) {
      const a = i * 30 * Math.PI / 180;
      s += `<polygon points="${star(15 + 6.667 * Math.sin(a), 10 - 6.667 * Math.cos(a), 1.111)}" fill="#FC0"/>`;
    }
    return s;
  })()]
};

const symbols = Object.entries(FLAGS).map(([code, [box, body]]) =>
  `  <symbol id="f-${code}" viewBox="${box}">${body}</symbol>`);
const out = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n<!-- Bayraklar: _dev/tools/flags.mjs -->\n${symbols.join('\n')}\n</svg>\n`;
await writeFile(path.join(REPO_ROOT, '_dev', 'flags.svg'), out);
console.log(`_dev/flags.svg: ${symbols.length} bayrak`);
