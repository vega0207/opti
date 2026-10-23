import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadScripts } from './load.mjs';

test('betikler aynı bağlamda sırayla çalışır', () => {
  const { run } = loadScripts(['_dev/tests/unit/fixtures/a.js', '_dev/tests/unit/fixtures/b.js']);
  assert.equal(run('B'), 2);
});

test('depolama tohumlanır', () => {
  assert.equal(loadScripts([], { local: { x: '1' } }).run('localStorage.getItem("x")'), '1');
  assert.equal(loadScripts([], { session: { y: '2' } }).run('sessionStorage.getItem("y")'), '2');
});

test('throwingStorage fırlatır', () => {
  const { run } = loadScripts([], { throwingStorage: true });
  assert.equal(run('(()=>{try{localStorage.getItem("x");return "no"}catch(e){return "threw"}})()'), 'threw');
});

test('sahte ortam: konum, dil, sayfa ve renk şeması', () => {
  const { run } = loadScripts([], {
    url: 'https://opticodestudio.com/?lang=de',
    languages: ['tr-TR', 'en'],
    page: 'legal',
    prefersDark: true
  });
  assert.equal(run('location.search'), '?lang=de');
  assert.deepEqual(run('[...navigator.languages]'), ['tr-TR', 'en']);
  assert.equal(run('document.documentElement.dataset.page'), 'legal');
  assert.equal(run('matchMedia("(prefers-color-scheme: dark)").matches'), true);
  assert.equal(run('matchMedia("(prefers-reduced-motion: reduce)").matches'), false);
});
