// logo.png'deki işaret ile img/logo-mark.svg'yi yan yana (beyaz ve koyu zeminde) ve üst üste çizer.
// Çıktı: _dev/shots/logo-compare.png
// Kullanım: node _dev/tools/compare-logo.mjs
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { setup } from '../tests/e2e/helpers.mjs';
import { REPO_ROOT } from './serve.mjs';

// SVG viewBox'ı (50 55 832 628) logo.png'den 2 kat büyütülmüş ve (300,240) kaydırılmış kırpımın koordinatlarındadır.
const VB = { x: 50, y: 55, w: 832, h: 628 };
const H = 400;
const scale = H / (VB.h / 2);              // logo.png pikselinden ekrana
const W = Math.round((VB.w / 2) * scale);
const png = `background:url(/logo.png) no-repeat;background-size:${1080 * scale}px auto;` +
  `background-position:${-(300 + VB.x / 2) * scale}px ${-(240 + VB.y / 2) * scale}px;width:${W}px;height:${H}px`;

const cell = (bg, inner) => `<div style="background:${bg};padding:16px;display:flex;gap:16px">${inner}</div>`;
const html = `<body style="margin:0;font:12px sans-serif">
${cell('#fff', `<div style="${png}"></div><img src="/img/logo-mark.svg" style="height:${H}px">`)}
${cell('#06131C', `<div style="${png}"></div><img src="/img/logo-mark.svg" style="height:${H}px">`)}
${cell('#fff', `<div style="position:relative;width:${W}px;height:${H}px"><div style="${png};position:absolute;inset:0"></div>` +
  `<img src="/img/logo-mark.svg" style="position:absolute;inset:0;height:${H}px;mix-blend-mode:difference"></div>` +
  `<div style="position:relative;width:${W}px;height:${H}px"><div style="${png};position:absolute;inset:0;opacity:.45"></div>` +
  `<img src="/img/logo-mark.svg" style="position:absolute;inset:0;height:${H}px;opacity:.6"></div>`)}
</body>`;

const ctx = await setup();
const page = await ctx.browser.newPage();
await page.setViewport({ width: W * 2 + 48, height: (H + 32) * 3 });
await page.goto(ctx.base + '/');
await page.setContent(html, { waitUntil: 'networkidle0' });
await mkdir(path.join(REPO_ROOT, '_dev', 'shots'), { recursive: true });
await page.screenshot({ path: path.join(REPO_ROOT, '_dev', 'shots', 'logo-compare.png') });
await ctx.close();
console.log('_dev/shots/logo-compare.png');
