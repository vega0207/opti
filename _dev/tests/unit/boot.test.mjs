import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadScripts } from './load.mjs';

const boot = (opts = {}) => loadScripts(['js/boot.js'], opts);

test('detectLang: parametre, kayıt, yoksa İngilizce', () => {
  const langCases = [ // [url, stored, expected]
    ['https://x/?lang=de', 'tr', 'de'],
    ['https://x/?lang=TR', null, 'tr'],
    ['https://x/?lang=de-DE', null, 'de'],
    ['https://x/?lang=xx', 'ru', 'ru'],
    ['https://x/?lang=%22%3E%3Cscript%3E', null, 'en'],
    ['https://x/', 'zz', 'en'],
    ['https://x/', null, 'en']
  ];
  const { run } = boot();
  for (const [url, stored, expected] of langCases) {
    const search = new URL(url).search;
    const got = run(`OCS.detectLang(${JSON.stringify(search)}, ${JSON.stringify(stored)})`);
    assert.equal(got, expected, `${url} stored=${stored}`);
  }
});

test('ilk açılış tarayıcı dili ne olursa olsun İngilizce', () => {
  for (const languages of [['tr-TR', 'tr'], ['de-DE'], ['ar-KW'], ['ru-RU'], ['pt-BR']]) {
    const { document, run } = boot({ languages });
    assert.equal(run('OCS.boot.lang'), 'en', languages.join(','));
    assert.equal(document.documentElement.lang, 'en', languages.join(','));
  }
});

test('detectTheme: kayıtlı geçerli tercih sistemi ezer', () => {
  const { run } = boot();
  assert.equal(run(`OCS.detectTheme('light', true)`), 'light');
  assert.equal(run(`OCS.detectTheme('dark', false)`), 'dark');
  assert.equal(run(`OCS.detectTheme(null, true)`), 'dark');
  assert.equal(run(`OCS.detectTheme(null, false)`), 'light');
  assert.equal(run(`OCS.detectTheme('purple', true)`), 'dark');
});

test('Arapça ana sayfa: lang, rtl, bekleme ve açılış sınıfları', () => {
  const { document, run } = boot({ url: 'https://opticodestudio.com/?lang=ar', page: 'home' });
  const html = document.documentElement;
  assert.equal(html.lang, 'ar');
  assert.equal(html.dir, 'rtl');
  assert.equal(html.classList.contains('i18n-pending'), true);
  assert.equal(html.classList.contains('splash'), true);
  assert.equal(run('OCS.boot.lang'), 'ar');
  assert.equal(run('OCS.boot.splash'), true);
});

test('açılış sınıfı: oturumda oynadıysa ya da sayfa ana sayfa değilse yok', () => {
  const played = boot({ session: { 'ocs.splash': '1' } }).document.documentElement;
  assert.equal(played.classList.contains('splash'), false);
  const legal = boot({ page: 'legal' });
  assert.equal(legal.document.documentElement.classList.contains('splash'), false);
  assert.equal(legal.run('OCS.boot.splash'), false);
});

test('İngilizce: bekleme sınıfı yok, yön ltr', () => {
  const html = boot({ url: 'https://opticodestudio.com/?lang=en' }).document.documentElement;
  assert.equal(html.classList.contains('i18n-pending'), false);
  assert.equal(html.dir, 'ltr');
  assert.equal(html.lang, 'en');
});

test('bozuk parametre sayfaya ham yazılmaz', () => {
  const html = boot({ url: 'https://opticodestudio.com/?lang=%22%3E%3Cscript%3E', languages: ['pt-BR'] }).document.documentElement;
  assert.equal(html.lang, 'en');
});

test('tema: kayıtlı tercih öznitelik olarak yazılır ve açık seçim sayılır', () => {
  const { document, run } = boot({ local: { 'ocs.theme': 'light' }, prefersDark: true });
  assert.equal(document.documentElement.getAttribute('data-theme'), 'light');
  assert.equal(run('OCS.boot.theme'), 'light');
  assert.equal(run('OCS.boot.themeExplicit'), true);
  const sys = boot({ prefersDark: true });
  assert.equal(sys.document.documentElement.getAttribute('data-theme'), 'dark');
  assert.equal(sys.run('OCS.boot.themeExplicit'), false);
});

test('kayıtlı dil: oturumdaki kalıcıdan önce gelir', () => {
  const { run } = boot({ session: { 'ocs.lang': 'de' }, local: { 'ocs.lang': 'ru' }, languages: ['tr-TR'] });
  assert.equal(run('OCS.boot.lang'), 'de');
  assert.equal(boot({ local: { 'ocs.lang': 'ru' }, languages: ['tr-TR'] }).run('OCS.boot.lang'), 'ru');
});

test('depolama fırlatsa da boot çalışır', () => {
  const { document, run } = boot({ url: 'https://opticodestudio.com/?lang=tr', throwingStorage: true, prefersDark: true });
  assert.equal(run('OCS.boot.lang'), 'tr');
  assert.equal(document.documentElement.getAttribute('data-theme'), 'dark');
  assert.equal(run('OCS.readPref("ocs.lang")'), null);
});

test('depolama kapalıyken açılış oynamaz (bir kez oynadığı hatırlanamaz)', () => {
  const { document, run } = boot({ throwingStorage: true, page: 'home' });
  assert.equal(document.documentElement.classList.contains('splash'), false);
  assert.equal(run('OCS.boot.splash'), false);
});

test('addLang dil tanımını koduna göre kaydeder', () => {
  const { run } = boot();
  run(`OCS.addLang({ meta: { code: 'tr' }, ui: { hi: 'Merhaba' } })`);
  assert.equal(run(`OCS.langs.tr.ui.hi`), 'Merhaba');
});
