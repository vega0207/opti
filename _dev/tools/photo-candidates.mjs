// Wikimedia Commons'tan (açık API, anahtar gerekmez) aday fotoğrafları toplar ve
// numaralı bir önizleme sayfası çeker: _dev/shots/candidates/<ad>.png + <ad>.json
// Kullanım:
//   node _dev/tools/photo-candidates.mjs <ad> --cat="Category:Views_of_Niesen" --cat="Category:Niesen"
//   node _dev/tools/photo-candidates.mjs <ad> --search="Niesen Thunersee"
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { REPO_ROOT } from './serve.mjs';
import { CHROME } from '../tests/e2e/helpers.mjs';

const UA = 'OptiCodeStudioSiteBuild/1.0 (opticodestudio@gmail.com)';
const [name, ...args] = process.argv.slice(2);
if (!name) throw new Error('Kullanım: photo-candidates.mjs <ad> --cat=... | --search=...');
const cats = args.filter(a => a.startsWith('--cat=')).map(a => a.slice(6));
const searches = args.filter(a => a.startsWith('--search=')).map(a => a.slice(9));
const minWidth = Number((args.find(a => a.startsWith('--min=')) || '--min=2400').slice(6));

const api = async params => {
  const url = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({ format: 'json', ...params });
  return (await fetch(url, { headers: { 'User-Agent': UA } })).json();
};
const info = { prop: 'imageinfo', iiprop: 'url|size|extmetadata', iiurlwidth: '360', iiextmetadatafilter: 'LicenseShortName|Artist' };

const files = new Map();
const add = pages => {
  for (const p of Object.values(pages || {})) {
    const i = p.imageinfo?.[0];
    if (!i || i.width < minWidth || i.width < i.height * 1.2) continue;
    files.set(p.title, {
      title: p.title.replace('File:', ''),
      thumb: i.thumburl,
      original: i.url,
      width: i.width,
      height: i.height,
      license: i.extmetadata?.LicenseShortName?.value || '?',
      artist: (i.extmetadata?.Artist?.value || '').replace(/<[^>]+>/g, '').trim(),
      page: i.descriptionurl
    });
  }
};
for (const c of cats) add((await api({ action: 'query', generator: 'categorymembers', gcmtitle: c, gcmtype: 'file', gcmlimit: '500', ...info })).query?.pages);
for (const s of searches) add((await api({ action: 'query', generator: 'search', gsrsearch: s, gsrnamespace: '6', gsrlimit: '50', ...info })).query?.pages);

const list = [...files.values()];
const dir = path.join(REPO_ROOT, '_dev', 'shots', 'candidates');
await mkdir(dir, { recursive: true });
await writeFile(path.join(dir, `${name}.json`), JSON.stringify(list, null, 1));

const html = `<body style="margin:8px;font:11px sans-serif;display:grid;grid-template-columns:repeat(5,1fr);gap:8px">` +
  list.map((f, n) => `<div><img src="${f.thumb}" style="width:100%;height:150px;object-fit:cover"><b>#${n}</b> ${f.license} · ${f.width}×${f.height}<br>${f.title.slice(0, 70)}</div>`).join('') + '</body>';
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
await page.setUserAgent(UA);
await page.setViewport({ width: 1400, height: 900 });
await page.setContent(html, { waitUntil: 'networkidle0', timeout: 90000 });
await page.screenshot({ path: path.join(dir, `${name}.png`), fullPage: true });
await browser.close();
console.log(`${list.length} aday → _dev/shots/candidates/${name}.png`);
