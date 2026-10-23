import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadScripts } from './load.mjs';

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const load = (opts = {}) => loadScripts(['js/boot.js', 'js/core.js'], opts);
const accepted = JSON.stringify({ choice: 'accepted', at: '2026-10-24T00:00:00.000Z' });

test('onay yokken tercih oturuma yazılır', () => {
  const { run, local, session } = load();
  run(`OCS.store.set('ocs.theme', 'light')`);
  assert.equal(session.getItem('ocs.theme'), 'light');
  assert.equal(local.getItem('ocs.theme'), null);
  assert.equal(run(`OCS.store.consent()`), null);
});

test('kabul: oturumdaki tercihleri kalıcıya taşır, diğer anahtarları taşımaz', () => {
  const { run, local, session } = load({
    session: { 'ocs.theme': 'light', 'ocs.lang': 'tr', 'ocs.currency': 'EUR', 'ocs.splash': '1' }
  });
  run(`OCS.store.setConsent('accepted')`);
  assert.equal(local.getItem('ocs.theme'), 'light');
  assert.equal(local.getItem('ocs.lang'), 'tr');
  assert.equal(local.getItem('ocs.currency'), 'EUR');
  assert.equal(session.getItem('ocs.theme'), null);
  assert.equal(session.getItem('ocs.lang'), null);
  assert.equal(local.getItem('ocs.splash'), null);
  assert.equal(session.getItem('ocs.splash'), '1');
  const record = JSON.parse(local.getItem('ocs.consent'));
  assert.equal(record.choice, 'accepted');
  assert.match(record.at, ISO);
  assert.equal(run(`OCS.store.consent()`), 'accepted');
});

test('kabul sonrası set kalıcıya yazar ve oturumdaki kopyayı siler', () => {
  const { run, local, session } = load({ local: { 'ocs.consent': accepted }, session: { 'ocs.currency': 'TRY' } });
  run(`OCS.store.set('ocs.currency', 'EUR')`);
  assert.equal(local.getItem('ocs.currency'), 'EUR');
  assert.equal(session.getItem('ocs.currency'), null);
  assert.equal(run(`OCS.store.get('ocs.currency')`), 'EUR');
});

test('ret: kalıcı tercihleri siler, sonraki kayıtlar oturuma gider', () => {
  const { run, local, session } = load({ local: { 'ocs.consent': accepted, 'ocs.lang': 'de', 'ocs.theme': 'dark' } });
  run(`OCS.store.setConsent('rejected')`);
  assert.equal(local.getItem('ocs.lang'), null);
  assert.equal(local.getItem('ocs.theme'), null);
  assert.equal(run(`OCS.store.consent()`), 'rejected');
  // Bu ziyaret boyunca seçimler korunur (oturuma geçer)
  assert.equal(session.getItem('ocs.theme'), 'dark');
  assert.equal(run(`OCS.store.get('ocs.lang')`), 'de');
  run(`OCS.store.set('ocs.lang', 'ru')`);
  assert.equal(session.getItem('ocs.lang'), 'ru');
  assert.equal(local.getItem('ocs.lang'), null);
});

test('get önce oturuma, sonra kalıcıya bakar', () => {
  const both = load({ session: { 'ocs.lang': 'tr' }, local: { 'ocs.lang': 'de' } });
  assert.equal(both.run(`OCS.store.get('ocs.lang')`), 'tr');
  const onlyLocal = load({ local: { 'ocs.lang': 'de' } });
  assert.equal(onlyLocal.run(`OCS.store.get('ocs.lang')`), 'de');
  assert.equal(onlyLocal.run(`OCS.store.get('ocs.none')`), null);
});

test('remove her iki depodan siler', () => {
  const { run, local, session } = load({ session: { 'ocs.theme': 'dark' }, local: { 'ocs.theme': 'light' } });
  run(`OCS.store.remove('ocs.theme')`);
  assert.equal(session.getItem('ocs.theme'), null);
  assert.equal(local.getItem('ocs.theme'), null);
  assert.equal(run(`OCS.store.get('ocs.theme')`), null);
});

test('bozuk onay kaydı yok sayılır', () => {
  const { run } = load({ local: { 'ocs.consent': '{not json' } });
  assert.equal(run(`OCS.store.consent()`), null);
  const odd = load({ local: { 'ocs.consent': JSON.stringify({ choice: 'maybe' }) } });
  assert.equal(odd.run(`OCS.store.consent()`), null);
});

test('fırlatan depolama: bellekte devam eder, hata vermez', () => {
  const { run } = load({ throwingStorage: true });
  run(`OCS.store.set('ocs.theme', 'dark')`);
  assert.equal(run(`OCS.store.get('ocs.theme')`), 'dark');
  assert.equal(run(`OCS.store.consent()`), null);
  run(`OCS.store.setConsent('accepted')`);
  assert.equal(run(`OCS.store.consent()`), 'accepted');
  assert.equal(run(`OCS.store.get('ocs.theme')`), 'dark');
  run(`OCS.store.remove('ocs.theme')`);
  assert.equal(run(`OCS.store.get('ocs.theme')`), null);
});
