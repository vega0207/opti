// Gerçek Chrome ile sayfa testleri için ortak yardımcılar.
import puppeteer from 'puppeteer-core';
import { startServer } from '../../tools/serve.mjs';

export const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'POST, OPTIONS'
};

export async function setup() {
  const server = await startServer({ port: 0 });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: [
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-component-update',
      '--disable-sync'
    ]
  });
  return {
    browser,
    base: server.url,
    async close() {
      await browser.close();
      await server.close();
    }
  };
}

export async function openPage(ctx, path, opts = {}) {
  const {
    width = 1440,
    height = 900,
    scheme = 'dark',
    reducedMotion = false,
    skipSplash = true,
    consent = 'accepted',
    blockStorage = false,
    local = {},
    session = {},
    wait = 'networkidle0',
    beforeGoto = null            // async page => {}: sayfa açılmadan önce çalışır (evaluateOnNewDocument vb.)
  } = opts;

  const context = await ctx.browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width, height });
  await page.emulateMediaFeatures([
    { name: 'prefers-color-scheme', value: scheme },
    { name: 'prefers-reduced-motion', value: reducedMotion ? 'reduce' : 'no-preference' }
  ]);

  const external = [];
  const formRequests = [];
  const errors = [];
  page.on('pageerror', e => errors.push(String(e?.message ?? e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

  const seedLocal = { ...local };
  const seedSession = { ...session };
  if (consent) seedLocal['ocs.consent'] = JSON.stringify({ choice: consent, at: '2026-10-24T00:00:00.000Z' });
  if (skipSplash) seedSession['ocs.splash'] = '1';

  await page.evaluateOnNewDocument((L, S, block) => {
    if (block) {
      const deny = () => { throw new DOMException('The operation is insecure.', 'SecurityError'); };
      Object.defineProperty(window, 'localStorage', { get: deny, configurable: true });
      Object.defineProperty(window, 'sessionStorage', { get: deny, configurable: true });
      return;
    }
    // Tohum yalnız sekmenin ilk yüklemesinde yazılır; yenilemede testin değiştirdiği değerler korunur.
    if (sessionStorage.getItem('__seeded')) return;
    for (const [k, v] of Object.entries(L)) localStorage.setItem(k, v);
    for (const [k, v] of Object.entries(S)) sessionStorage.setItem(k, v);
    sessionStorage.setItem('__seeded', '1');
  }, seedLocal, seedSession, blockStorage);

  const origin = new URL(ctx.base).origin;
  await page.setRequestInterception(true);
  page.on('request', req => {
    const url = req.url();
    if (url.startsWith('data:') || url.startsWith('blob:')) return req.continue();
    const u = new URL(url);
    if (u.origin === origin) return req.continue();
    if (u.hostname === 'formsubmit.co') {
      if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers: CORS, body: '' });
      let body;
      try { body = JSON.parse(req.postData() || '{}'); } catch { body = { _raw: req.postData() }; }
      formRequests.push(body);
      return req.respond({ status: 200, headers: CORS, contentType: 'application/json', body: '{"success":"true","message":"ok"}' });
    }
    external.push(url);
    return req.abort('blockedbyclient');
  });

  if (beforeGoto) await beforeGoto(page);
  await page.goto(ctx.base + path, { waitUntil: wait });
  return { page, context, external, formRequests, errors, close: () => context.close() };
}

// Ekranın soluna/sağına taşan görünür öğeleri listeler. body'deki overflow-x: clip
// scrollWidth'i körleştirdiği için öğeler tek tek ölçülür. Sayılmayanlar: boyutsuz,
// saydam ya da gizli öğeler ve body altındaki bir kapsayıcının bilerek kırptıkları.
export function overflowReport(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const vw = root.clientWidth;
    const out = [];
    if (root.scrollWidth > vw + 1) out.push(`document scrollWidth ${root.scrollWidth} > ${vw}`);
    const clipsX = el => /^(hidden|clip|auto|scroll)$/.test(getComputedStyle(el).overflowX);
    for (const el of document.body.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.left >= -1 && r.right <= vw + 1) continue;
      if (!el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true, opacityProperty: true, visibilityProperty: true })) continue;
      let clipped = false;
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
        if (clipsX(a)) { clipped = true; break; }
      }
      if (clipped) continue;
      const name = el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '') +
        (el.classList.length ? '.' + [...el.classList].join('.') : '');
      out.push(`${name} left=${Math.round(r.left)} right=${Math.round(r.right)} vw=${vw}`);
    }
    return out;
  });
}

export async function hasHorizontalOverflow(page) {
  return (await overflowReport(page)).length > 0;
}
