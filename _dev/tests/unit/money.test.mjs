import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadWithFixture, norm } from './fixtures/i18n-fixture.mjs';

test('format: ondalıksız, yerel biçimde', () => {
  const { run } = loadWithFixture();
  const f = (amount, cur, loc) => norm(run(`OCS.money.format(${amount}, '${cur}', '${loc}')`));
  assert.equal(f(1350, 'USD', 'en-US'), '$1,350');
  assert.equal(f(57000, 'TRY', 'tr-TR'), '₺57.000');
  assert.equal(f(1150, 'EUR', 'de-DE'), '1.150 €');
  assert.equal(f(108000, 'RUB', 'ru-RU'), '108 000 ₽');
  assert.equal(f(410, 'KWD', 'en-US'), 'KWD 410');
  const ar = f(410, 'KWD', 'ar-KW-u-nu-latn');
  assert.match(ar, /410/);
  assert.match(ar, /د\.ك/);
  assert.doesNotMatch(ar, /[٠-٩]/);
  assert.doesNotMatch(ar, /410[.,]0/);
});

test('format: varsayılan para ve yerel ayar etkin dilden gelir', () => {
  const { run } = loadWithFixture({ url: 'https://x/?lang=tr' });
  assert.equal(norm(run(`OCS.money.format(57000)`)), '₺57.000');
});

test('current: kayıtlı geçerli seçim, yoksa dilin parası', () => {
  assert.equal(loadWithFixture({ url: 'https://x/?lang=tr' }).run(`OCS.money.current()`), 'TRY');
  assert.equal(loadWithFixture({ url: 'https://x/?lang=tr', session: { 'ocs.currency': 'EUR' } }).run(`OCS.money.current()`), 'EUR');
  assert.equal(loadWithFixture({ url: 'https://x/?lang=tr', session: { 'ocs.currency': 'XYZ' } }).run(`OCS.money.current()`), 'TRY');
});

test('current: Türkçe tarayıcıda da ilk açılışta USD', () => {
  assert.equal(loadWithFixture({ languages: ['tr-TR'] }).run(`OCS.money.current()`), 'USD');
});

test('set: seçimi kaydeder ve ocs:currency yayınlar; geçersiz kod yok sayılır', () => {
  const { run, session } = loadWithFixture({ url: 'https://x/?lang=tr' });
  run(`OCS.money.set('EUR')`);
  assert.equal(session.getItem('ocs.currency'), 'EUR');
  assert.equal(run(`OCS.money.current()`), 'EUR');
  assert.deepEqual(run(`__events`), [{ type: 'ocs:currency', detail: { code: 'EUR' } }]);
  run(`OCS.money.set('XYZ')`);
  assert.equal(session.getItem('ocs.currency'), 'EUR');
  assert.equal(run(`__events.length`), 1);
});

test('syncToLang: elle seçimi siler, olay yayınlamaz', () => {
  const { run, session } = loadWithFixture({ url: 'https://x/?lang=tr', session: { 'ocs.currency': 'EUR' } });
  run(`OCS.money.syncToLang('de')`);
  assert.equal(session.getItem('ocs.currency'), null);
  assert.equal(run(`OCS.money.current()`), 'TRY');
  assert.equal(run(`__events.length`), 0);
});

test('price: etkin parada biçimli fiyat', () => {
  assert.equal(norm(loadWithFixture({ url: 'https://x/?lang=en' }).run(`OCS.money.price('essential')`)), '$1,350');
  assert.equal(norm(loadWithFixture({ url: 'https://x/?lang=tr' }).run(`OCS.money.price('essential')`)), '₺57.000');
});

test('price: geçersiz ya da eksik değerlerde null (fiyat yerine "Teklif alın" gösterilir)', () => {
  const { run } = loadWithFixture({ url: 'https://x/?lang=en' });
  for (const cur of ['USD', 'TRY', 'EUR', 'RUB', 'KWD']) {
    run(`OCS.money.set('${cur}')`);
    assert.equal(run(`OCS.money.price('broken')`), null, cur);
  }
  assert.equal(run(`OCS.money.price('custom')`), null);
  assert.equal(run(`OCS.money.price('nope')`), null);
});

test('fill: fiyat işaretlerini doldurur, dolduramadığını bırakır', () => {
  const { run } = loadWithFixture({ url: 'https://x/?lang=en' });
  assert.equal(norm(run(`OCS.money.fill('From {price:essential}, care {price:essential}')`)), 'From $1,350, care $1,350');
  assert.equal(run(`OCS.money.fill('X {price:nope} Y {price:broken}')`), 'X {price:nope} Y {price:broken}');
});

test('budgetOptions: geçerli sınırlarla 6 seçenek, etkin dil ve parada', () => {
  const en = loadWithFixture({ url: 'https://x/?lang=en' }).run(`OCS.money.budgetOptions()`);
  assert.deepEqual(en.map(o => ({ value: o.value, label: norm(o.label) })), [
    { value: 'none', label: 'Prefer not to say' },
    { value: 'lt-1000', label: 'Under $1,000' },
    { value: '1000-2500', label: '$1,000 – $2,500' },
    { value: '2500-5000', label: '$2,500 – $5,000' },
    { value: '5000-10000', label: '$5,000 – $10,000' },
    { value: 'gte-10000', label: '$10,000+' }
  ]);
  const tr = loadWithFixture({ url: 'https://x/?lang=tr' }).run(`OCS.money.budgetOptions()`);
  assert.equal(norm(tr[1].label), '₺42.000 altı');
  assert.equal(norm(tr[5].label), '₺420.000 ve üzeri');
});

test('budgetOptions: geçersiz sınırlarda yalnız "belirtmek istemiyorum"', () => {
  for (const cur of ['RUB', 'KWD', 'EUR']) { // artmayan, tam sayı olmayan, eksik
    const { run } = loadWithFixture({ url: 'https://x/?lang=en' });
    run(`OCS.money.set('${cur}')`);
    const opts = run(`OCS.money.budgetOptions()`);
    assert.deepEqual(opts.map(o => o.value), ['none'], cur);
  }
});
