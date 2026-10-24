/* OptiCodeStudio — açılış animasyonu (yalnız ana sayfa, ziyaret başına bir kez).
   Zaman çizelgesi css/style.css içinde; bu dosya çıkışı yönetir: dil dosyasını bekler,
   logoyu menüdeki yerine uçurur, tıklama/tuşla hemen geçer. */
(function (w, d) {
  'use strict';

  const OCS = w.OCS = w.OCS || {};
  const html = d.documentElement;
  const el = d.querySelector('.splash-screen');

  if (!el || !html.classList.contains('splash')) {
    if (el) el.remove();
    OCS.splashDone = Promise.resolve();
    OCS.splash = { run: () => OCS.splashDone };
    return;
  }

  try { w.sessionStorage.setItem('ocs.splash', '1'); } catch (e) { /* boot.js zaten kontrol etti */ }

  const reduced = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let resolveDone;
  OCS.splashDone = new Promise(r => { resolveDone = r; });

  const finish = () => {
    el.remove();
    html.classList.remove('splash');
    resolveDone();
  };

  // İşaret, menüdeki logonun konumuna ve boyutuna küçülerek uçar (FLIP)
  const flyToNav = () => {
    const mark = el.querySelector('.splash-mark');
    const target = d.querySelector('nav .logo-mark');
    if (!mark || !target) return;
    const a = mark.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    if (!a.width || !b.width) return;
    const dx = (b.left + b.width / 2) - (a.left + a.width / 2);
    const dy = (b.top + b.height / 2) - (a.top + a.height / 2);
    mark.style.transform = `translate(${dx}px, ${dy}px) scale(${b.width / a.width})`;
  };

  let exiting = false;
  const exit = () => {
    if (exiting) return;
    exiting = true;
    const ready = OCS.i18n && OCS.i18n.ready ? OCS.i18n.ready : Promise.resolve();
    Promise.race([ready, new Promise(r => setTimeout(r, 2500))]).then(() => {
      if (reduced) {
        el.classList.add('splash-fade');
        setTimeout(finish, 300);
        return;
      }
      flyToNav();
      el.classList.add('splash-out');
      setTimeout(finish, 420);
    });
  };

  // Çıkış, CSS'teki son adımın (yazının belirmesi) bitişine bağlıdır: animasyon ilk boyamada
  // başladığı için sabit bir süre yazıyı yarıda keserdi.
  let timer = null;
  const word = el.querySelector('.splash-word');
  const wordAnim = !reduced && word && word.getAnimations ? word.getAnimations()[0] : null;
  if (wordAnim) wordAnim.finished.then(() => { timer = setTimeout(exit, 150); }, () => exit());
  else timer = setTimeout(exit, reduced ? 400 : 1800);
  const skip = () => {
    clearTimeout(timer);
    el.classList.add('splash-skip');
    exit();
  };
  w.addEventListener('pointerdown', skip, { once: true });
  w.addEventListener('keydown', skip, { once: true });

  OCS.splash = { run: () => OCS.splashDone };
})(window, document);
