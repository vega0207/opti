// config.js ve js/lang/*.js dosyalarının bütünlüğü: kullanıcı bu dosyaları elle düzenleyecek,
// bu testler eksik fiyat, bozuk bütçe, eksik çeviri ve kural dışı metni yakalar.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { loadScripts, REPO_ROOT } from './load.mjs';

const langDir = path.join(REPO_ROOT, 'js', 'lang');
const langFiles = existsSync(langDir)
  ? readdirSync(langDir).filter(f => f.endsWith('.js')).map(f => `js/lang/${f}`)
  : [];
const env = loadScripts(['js/boot.js', 'js/config.js', ...langFiles]);
const CONFIG = env.run('CONFIG');
const LANGS = env.run('OCS.langs');
const SUPPORTED = env.run('OCS.SUPPORTED_LANGS');
const en = LANGS.en;

test('İngilizce dil dosyası var', () => {
  assert.ok(en, 'js/lang/en.js yüklenmedi');
});

test('dil kodları boot ile aynı ve adları dolu', () => {
  assert.deepEqual(CONFIG.languages.map(l => l.code), SUPPORTED);
  for (const l of CONFIG.languages) assert.ok(l.name && l.name.trim(), l.code);
});

test('para birimleri ve dil eşleşmesi spec ile aynı', () => {
  assert.deepEqual(CONFIG.currencies, ['USD', 'TRY', 'EUR', 'RUB', 'KWD']);
  assert.deepEqual(CONFIG.langCurrency, { en: 'USD', tr: 'TRY', de: 'EUR', ru: 'RUB', ar: 'KWD' });
  for (const code of CONFIG.currencies) assert.ok(CONFIG.currencySymbols[code], code);
});

test('paketler spec sırasında', () => {
  assert.deepEqual(CONFIG.packages.map(p => [p.id, p.category]), [
    ['essential', 'new'], ['redesign', 'new'], ['custom', 'new'],
    ['monthly-starter', 'monthly'], ['monthly-business', 'monthly'], ['care-standard', 'care']
  ]);
  for (const p of CONFIG.packages) assert.equal(typeof p.popular, 'boolean', p.id);
});

test('fiyatlar tam: özel proje hariç her paket × 5 para pozitif tam sayı', () => {
  for (const p of CONFIG.packages) {
    if (p.id === 'custom') {
      assert.equal(CONFIG.prices.custom, undefined);
      continue;
    }
    for (const cur of CONFIG.currencies) {
      const v = CONFIG.prices[p.id]?.[cur];
      assert.ok(Number.isInteger(v) && v > 0, `${p.id} ${cur} = ${v}`);
    }
  }
});

test('bütçeler: her para biriminde artan 4 pozitif tam sayı', () => {
  for (const cur of CONFIG.currencies) {
    const b = CONFIG.budgets[cur];
    assert.ok(Array.isArray(b) && b.length === 4, cur);
    b.forEach((v, i) => {
      assert.ok(Number.isInteger(v) && v > 0, `${cur}[${i}] = ${v}`);
      if (i) assert.ok(v > b[i - 1], `${cur} artmıyor`);
    });
  }
});

test('portföy: tür geçerli, demo dosyası var, tam 3 hero', () => {
  for (const w of CONFIG.portfolio) {
    assert.ok(['concept', 'client'].includes(w.type), w.name);
    assert.ok(w.name && w.name.trim());
    assert.ok(existsSync(path.join(REPO_ROOT, w.url)), `${w.url} yok`);
    assert.match(w.thumb, /^img\/work\/[a-z0-9-]+\.webp$/);
    assert.equal(typeof w.hero, 'boolean');
  }
  assert.equal(CONFIG.portfolio.filter(w => w.hero).length, 3);
});

test('hukuki bilgiler alanları var', () => {
  for (const k of ['companyTitle', 'email', 'updated']) assert.ok(CONFIG.legal[k], k);
  assert.equal(typeof CONFIG.legal.address, 'string', 'adres yazı olmalı (boş olabilir)');
  for (const k of ['companyTitle', 'address']) assert.ok(!CONFIG.legal[k].includes('DOLDURULACAK'), `${k} yer tutucu`);
});

const pkgIds = () => CONFIG.packages.map(p => p.id).sort();

test('her dil dosyası İngilizceyle aynı yapıda', () => {
  const enKeys = Object.keys(en.ui).sort();
  for (const [code, def] of Object.entries(LANGS)) {
    assert.equal(def.meta.code, code);
    assert.equal(def.meta.dir, code === 'ar' ? 'rtl' : 'ltr', code);
    assert.ok(def.meta.locale && def.meta.name, code);
    assert.deepEqual(Object.keys(def.ui).sort(), enKeys, `${code}: ui anahtarları farklı`);
    assert.deepEqual(Object.keys(def.packages).sort(), pkgIds(), `${code}: paketler farklı`);
    for (const [id, p] of Object.entries(def.packages)) {
      for (const f of ['name', 'tagline', 'bestFor']) assert.ok(p[f] && p[f].trim(), `${code}.${id}.${f}`);
      if (id === 'custom') assert.equal(p.priceLabel, null, `${code}.custom.priceLabel`);
      else assert.match(p.priceLabel, /\{p\}/, `${code}.${id}.priceLabel`);
      assert.ok(p.short.length >= 3 && p.short.length <= 4, `${code}.${id}.short`);
      assert.ok(p.full.length > 0 && p.notes.length > 0, `${code}.${id}`);
    }
    assert.equal(def.faqs.length, 8, `${code}: SSS sayısı`);
    for (const f of def.faqs) assert.ok(f.q && f.a, code);
    assert.equal(def.marquee.length, 8, `${code}: şerit`);
    if (en.legal) {
      assert.deepEqual(Object.keys(def.legal || {}).sort(), Object.keys(en.legal).sort(), `${code}: hukuki metinler`);
      for (const [doc, v] of Object.entries(def.legal)) assert.ok(v.title && v.html, `${code}.legal.${doc}`);
    }
  }
});

test('her dilde SSS fiyat işaretleri İngilizceyle aynı', () => {
  const tokens = s => (s.match(/\{price:[a-z0-9-]+\}/g) || []).sort();
  for (const [code, def] of Object.entries(LANGS)) {
    def.faqs.forEach((f, i) => assert.deepEqual(tokens(f.a), tokens(en.faqs[i].a), `${code} SSS ${i + 1}`));
  }
});

const BANNED = ['seamless', 'elevate', 'cutting-edge', 'unlock', 'game-changer',
  'eşsiz', 'kusursuz', 'nahtlos', 'revolutionär', 'бесшовный', 'революционный'];

function copyStrings(def) {
  const out = [...Object.values(def.ui), ...def.marquee];
  for (const p of Object.values(def.packages)) {
    out.push(p.name, p.tagline, p.bestFor, ...(p.priceLabel ? [p.priceLabel] : []), ...p.short, ...p.full, ...p.notes);
  }
  for (const f of def.faqs) out.push(f.q, f.a);
  return out;
}

test('metin kuralları: uzun tire ve yasaklı kelime yok', () => {
  for (const [code, def] of Object.entries(LANGS)) {
    for (const s of copyStrings(def)) {
      assert.ok(!s.includes('—'), `${code}: uzun tire: "${s}"`);
      const low = s.toLowerCase();
      for (const w of BANNED) assert.ok(!low.includes(w), `${code}: "${w}" kelimesi: "${s}"`);
    }
  }
});

test('koddaki her metin anahtarı en.ui içinde', () => {
  const used = new Set();
  for (const f of ['index.html', 'privacy.html', 'terms.html', 'cookies.html']) {
    const file = path.join(REPO_ROOT, f);
    if (!existsSync(file)) continue;
    const html = readFileSync(file, 'utf8');
    for (const m of html.matchAll(/data-i18n(?:-html)?="([^"]+)"/g)) used.add(m[1]);
    for (const m of html.matchAll(/data-i18n-attr="([^"]+)"/g)) {
      for (const pair of m[1].split(';')) if (pair.includes(':')) used.add(pair.split(':')[1].trim());
    }
  }
  for (const f of readdirSync(path.join(REPO_ROOT, 'js')).filter(f => f.endsWith('.js'))) {
    const src = readFileSync(path.join(REPO_ROOT, 'js', f), 'utf8');
    for (const m of src.matchAll(/\bt\('([^']+)'/g)) used.add(m[1]);
  }
  const missing = [...used].filter(k => !(k in en.ui));
  assert.deepEqual(missing, []);
});

test('portföy: 10 demo (concept) ve Nesmina (client)', () => {
  assert.equal(CONFIG.portfolio.filter(w => w.type === 'concept').length, 10);
  assert.deepEqual(CONFIG.portfolio.filter(w => w.type === 'client').map(w => w.url), ['nesmina.html']);
  assert.equal(new Set(CONFIG.portfolio.map(w => w.url)).size, CONFIG.portfolio.length, 'aynı sayfa iki kez');
  for (const w of CONFIG.portfolio) assert.ok(existsSync(path.join(REPO_ROOT, w.thumb)), `${w.thumb} yok`);
});

// Site herkese hitap ediyor: metinler yalnız "küçük işletmeleri" hedef almasın (sahibinin isteği).
test('hiçbir dilde metin hedef kitleyi küçük işletmelerle sınırlamıyor', () => {
  const SMALL_BIZ = {
    en: /small business/i,
    tr: /küçük işletme/i,
    de: /kleine[nm]? Unternehmen/i,
    ru: /мал(ого|ый|ому|ым) бизнес/i,
    ar: /الشركات الصغيرة/
  };
  const strings = v => typeof v === 'string' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : [];
  for (const [code, re] of Object.entries(SMALL_BIZ)) {
    assert.ok(LANGS[code], `${code} yüklenmedi`);
    assert.deepEqual(strings(LANGS[code]).filter(s => re.test(s)), [], code);
  }
  const head = readFileSync(path.join(REPO_ROOT, 'index.html'), 'utf8').match(/<head>[\s\S]*?<\/head>/)[0];
  assert.doesNotMatch(head, SMALL_BIZ.en, 'index.html başlık/açıklama');
});

// Ayarlarda bir bayrak kodu yanlış yazılırsa menüde bayrağın yeri boş kalır.
test('her dilin ve para biriminin bayrağı çizimler arasında var', () => {
  const flags = readFileSync(path.join(REPO_ROOT, '_dev', 'flags.svg'), 'utf8');
  const has = code => flags.includes(`<symbol id="f-${code}"`);
  for (const l of CONFIG.languages) assert.ok(l.flag && has(l.flag), `${l.code}: bayrak "${l.flag}"`);
  for (const c of CONFIG.currencies) {
    const f = CONFIG.currencyFlags && CONFIG.currencyFlags[c];
    assert.ok(f && has(f), `${c}: bayrak "${f}"`);
  }
});
