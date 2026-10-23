import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadWithFixture } from './fixtures/i18n-fixture.mjs';

test('t: etkin dilin metnini döndürür ve değişken yerleştirir', () => {
  const en = loadWithFixture({ url: 'https://x/?lang=en' });
  assert.equal(en.run(`OCS.i18n.t('hello', { name: 'Ada' })`), 'Hi Ada');
  const tr = loadWithFixture({ url: 'https://x/?lang=tr' });
  assert.equal(tr.run(`OCS.i18n.t('hello', { name: 'Ada' })`), 'Selam Ada');
  assert.equal(tr.run(`OCS.i18n.t('form.budget.none')`), 'Belirtmek istemiyorum');
});

test('t: eksik anahtar anahtarın kendisini döndürür ve bir kez uyarır', () => {
  const { run, warnings } = loadWithFixture({ url: 'https://x/?lang=en' });
  assert.equal(run(`OCS.i18n.t('missing.key')`), 'missing.key');
  assert.equal(run(`OCS.i18n.t('missing.key')`), 'missing.key');
  assert.equal(warnings.filter(w => w.includes('missing.key')).length, 1);
});

test('fmt: bilinen işaretleri doldurur, bilinmeyeni olduğu gibi bırakır', () => {
  const { run } = loadWithFixture();
  assert.equal(run(`OCS.i18n.fmt('{a} and {b}', { a: 1 })`), '1 and {b}');
  assert.equal(run(`OCS.i18n.fmt('no tokens', {})`), 'no tokens');
});

test('lang, dict ve locale: kayıtlı olmayan dil İngilizceye düşer', () => {
  const tr = loadWithFixture({ url: 'https://x/?lang=tr' });
  assert.equal(tr.run(`OCS.i18n.lang()`), 'tr');
  assert.equal(tr.run(`OCS.i18n.locale()`), 'tr-TR');
  const de = loadWithFixture({ url: 'https://x/?lang=de' });
  assert.equal(de.run(`OCS.i18n.dict().meta.code`), 'en');
  assert.equal(de.run(`OCS.i18n.locale()`), 'en-US');
});
