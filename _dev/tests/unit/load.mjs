// Sitenin klasik <script> dosyalarını Node içinde, sahte bir tarayıcı ortamında çalıştırır.
// Yalnız birim testleri içindir; DOM davranışı e2e testlerinde gerçek Chrome ile denenir.
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

class FakeStorage {
  #map;
  #throwing;
  constructor(initial, throwing) {
    this.#map = new Map(Object.entries(initial).map(([k, v]) => [k, String(v)]));
    this.#throwing = throwing;
  }
  #guard() {
    if (this.#throwing) throw new DOMException('The operation is insecure.', 'SecurityError');
  }
  get length() { this.#guard(); return this.#map.size; }
  key(i) { this.#guard(); return [...this.#map.keys()][i] ?? null; }
  getItem(k) { this.#guard(); return this.#map.has(String(k)) ? this.#map.get(String(k)) : null; }
  setItem(k, v) { this.#guard(); this.#map.set(String(k), String(v)); }
  removeItem(k) { this.#guard(); this.#map.delete(String(k)); }
  clear() { this.#guard(); this.#map.clear(); }
}

function makeClassList() {
  const set = new Set();
  return {
    add: (...names) => names.forEach(n => set.add(n)),
    remove: (...names) => names.forEach(n => set.delete(n)),
    contains: n => set.has(n),
    toggle(n, force) {
      const on = force === undefined ? !set.has(n) : Boolean(force);
      if (on) set.add(n); else set.delete(n);
      return on;
    },
    get value() { return [...set].join(' '); },
    toString() { return [...set].join(' '); }
  };
}

const camel = s => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

function makeDocumentElement(page) {
  const attrs = new Map();
  const el = {
    lang: '',
    dir: '',
    dataset: page && page !== 'none' ? { page } : {},
    classList: makeClassList(),
    setAttribute(name, value) {
      const v = String(value);
      if (name === 'lang' || name === 'dir') el[name] = v;
      else if (name.startsWith('data-')) el.dataset[camel(name.slice(5))] = v;
      else attrs.set(name, v);
    },
    getAttribute(name) {
      if (name === 'lang' || name === 'dir') return el[name] || null;
      if (name === 'class') return el.classList.value;
      if (name.startsWith('data-')) return el.dataset[camel(name.slice(5))] ?? null;
      return attrs.has(name) ? attrs.get(name) : null;
    },
    removeAttribute(name) {
      if (name === 'lang' || name === 'dir') el[name] = '';
      else if (name.startsWith('data-')) delete el.dataset[camel(name.slice(5))];
      else attrs.delete(name);
    }
  };
  return el;
}

// Nesne sonuçları ana ortamın nesnelerine kopyalanır; böylece assert.deepEqual farklı
// vm "realm"lerinin prototiplerine takılmaz. Kopyalanamayanlar (fonksiyon vb.) olduğu gibi döner.
function toHost(value) {
  if (value === null || typeof value !== 'object') return value;
  try { return structuredClone(value); } catch { return value; }
}

export function loadScripts(files, opts = {}) {
  const {
    url = 'https://opticodestudio.com/',
    local = {},
    session = {},
    languages = ['en-US'],
    prefersDark = false,
    page = 'home',
    throwingStorage = false
  } = opts;

  const warnings = [];
  const localStorage = new FakeStorage(local, throwingStorage);
  const sessionStorage = new FakeStorage(session, throwingStorage);
  const documentElement = makeDocumentElement(page);
  const document = {
    documentElement,
    readyState: 'loading',
    head: { appendChild() {} },
    body: null,
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() { return true; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    getElementById() { return null; }
  };

  const context = {
    document,
    localStorage,
    sessionStorage,
    location: new URL(url),
    navigator: { languages: Object.freeze([...languages]), language: languages[0] || 'en-US', userAgent: 'node-test' },
    history: {
      replaceState(_state, _title, next) { if (next != null) context.location = new URL(String(next), context.location.href); },
      pushState(_state, _title, next) { if (next != null) context.location = new URL(String(next), context.location.href); }
    },
    matchMedia: query => ({
      matches: /prefers-color-scheme:\s*dark/.test(query) ? prefersDark : false,
      media: query,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {}
    }),
    console: {
      log: console.log,
      info: console.info,
      error: console.error,
      warn: (...args) => warnings.push(args.map(String).join(' '))
    },
    CustomEvent,
    Event,
    URL,
    URLSearchParams,
    DOMException,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    queueMicrotask,
    requestAnimationFrame: fn => setTimeout(() => fn(Date.now()), 0),
    requestIdleCallback: fn => setTimeout(() => fn({ didTimeout: false, timeRemaining: () => 50 }), 0)
  };
  context.window = context;
  context.self = context;
  vm.createContext(context);

  for (const file of files) {
    const abs = path.join(REPO_ROOT, file);
    vm.runInContext(readFileSync(abs, 'utf8'), context, { filename: abs });
  }

  return {
    window: context,
    document,
    local: localStorage,
    session: sessionStorage,
    warnings,
    run: expr => toHost(vm.runInContext(expr, context))
  };
}
