/* OptiCodeStudio — ana sayfa davranışları.
   İçerik js/config.js ve js/lang/ dosyalarından gelir; bu dosyada metin yok. */
(function (w, d) {
  'use strict';

  const OCS = w.OCS;
  const $ = (sel, root = d) => root.querySelector(sel);
  const $$ = (sel, root = d) => [...root.querySelectorAll(sel)];
  const t = (key, vars) => OCS.i18n.t(key, vars);

  /* ---------- Bildirim (toast) ---------- */
  let toastTimer;
  function showToast(message) {
    const toast = $('#toast');
    $('#toastMsg').textContent = message;
    toast.classList.add('in');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('in'), 3400);
  }

  /* ---------- Pencereler ---------- */
  function openModal(modal) {
    modal.classList.add('open');
    d.body.style.overflow = 'hidden';
    const panel = $('.modal-panel', modal);
    if (panel) panel.scrollTop = 0;
  }

  function closeModal(modal) {
    modal.classList.remove('open');
    if (!$('.modal.open')) d.body.style.overflow = '';
  }

  function initModals() {
    d.addEventListener('click', e => {
      const closer = e.target.closest('[data-close]');
      if (closer) closeModal(d.getElementById(closer.dataset.close));
    });
    d.addEventListener('keydown', e => {
      if (e.key === 'Escape') $$('.modal.open').forEach(closeModal);
    });
    // Arka plan katmanında tekerlek sayfayı kaydırmasın
    $$('.modal-bg').forEach(bg => bg.addEventListener('wheel', e => e.preventDefault(), { passive: false }));
  }

  /* ---------- Menü ---------- */
  function initNav() {
    const nav = $('#nav');
    const onScroll = () => nav.classList.toggle('scrolled', w.scrollY > 30);
    w.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const burger = $('#burger');
    const mobile = $('#navMobile');
    const setOpen = open => {
      mobile.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
    };
    burger.addEventListener('click', () => setOpen(!mobile.classList.contains('open')));
    $$('a', mobile).forEach(a => a.addEventListener('click', () => setOpen(false)));
  }

  /* ---------- İletişim bağlantıları ve e-posta kopyalama ---------- */
  function initContact() {
    $('#igLink').href = CONFIG.instagramUrl;
    $('#footIg').href = CONFIG.instagramUrl;
    $('#footMail').href = `mailto:${CONFIG.email}`;
    $('#igHandle').textContent = CONFIG.instagramHandle;
    $('#mailText').textContent = CONFIG.email;

    $('.copy-btn').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(CONFIG.email);
        showToast(t('toast.copied'));
      } catch (e) {
        showToast(t('toast.copyFail'));
      }
    });
  }

  function init() {
    if (d.documentElement.dataset.page !== 'home') return;
    // Sayfa yenilenince en üstten başlar (eski sitedeki davranış)
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    w.addEventListener('load', () => w.scrollTo(0, 0));

    OCS.ui.bindThemeToggles();
    OCS.theme.watchSystem();
    OCS.ui.lazyBackground();
    initNav();
    initModals();
    initContact();
    OCS.i18n.init();
  }

  OCS.site = { showToast, openModal, closeModal };

  // Tüm "defer" betikler çalıştıktan sonra başlar (açılış animasyonu dahil).
  if (d.readyState === 'complete') init();
  else d.addEventListener('DOMContentLoaded', init);
})(window, document);
