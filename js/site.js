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

  /* ---------- Çizim yardımcıları ---------- */
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const EMPTY_PKG = { name: '', tagline: '', bestFor: '', priceLabel: null, short: [], full: [], notes: [] };
  const pkgText = id => ({ ...EMPTY_PKG, ...((OCS.i18n.dict().packages || {})[id] || {}) });
  const priceText = id => {
    const label = pkgText(id).priceLabel;
    const amount = OCS.money.price(id);
    return label && amount ? OCS.i18n.fmt(label, { p: amount }) : t('pkg.customPrice');
  };
  // Fiyatı yazılamayan işaret kalırsa okunur bir metne döner
  const fillPrices = s => OCS.money.fill(s).replace(/\{price:[a-z0-9-]+\}/g, t('pkg.customPrice'));
  const checkList = items => items.map(s => `<li>${OCS.ui.icon('check')}<span>${esc(s)}</span></li>`).join('');

  /* ---------- Kayan şerit ve hero görselleri ---------- */
  function renderMarquee() {
    const items = (OCS.i18n.dict().marquee || []).map(m => `<div class="mq-item">${esc(m)}</div>`).join('');
    $('#mqTrack').innerHTML = items + items;
  }

  function renderHeroCollage() {
    $('#heroCollage').innerHTML = CONFIG.portfolio.filter(w => w.hero).slice(0, 3).map(w =>
      `<span class="shot"><span class="shot-bar"><i></i><i></i><i></i></span><img src="${esc(w.thumb)}" alt="" width="720" height="1125"></span>`
    ).join('');
  }

  /* ---------- Çalışmalar ---------- */
  let workFilter = 'concept';
  function renderPortfolio(filter = workFilter) {
    workFilter = filter;
    $('#workGrid').innerHTML = CONFIG.portfolio.filter(w => w.type === filter).map(w => `
      <a class="work" href="${esc(w.url)}" target="_blank" rel="noopener" aria-label="${esc(t('work.open', { name: w.name }))}">
        <span class="work-shot"><span class="shot-bar"><i></i><i></i><i></i></span><img src="${esc(w.thumb)}" alt="" width="720" height="1125" loading="lazy"></span>
        <span class="work-name">${esc(w.name)}</span>
      </a>`).join('');
    $$('[data-work-filter]').forEach(b => {
      const on = b.dataset.workFilter === filter;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', String(on));
    });
    d.dispatchEvent(new CustomEvent('ocs:rendered', { detail: { root: $('#workGrid') } }));
  }

  /* ---------- Paketler ---------- */
  function renderPackages() {
    const grids = { new: $('#pkgGridNew'), monthly: $('#pkgGridMonthly'), care: $('#pkgGridCare') };
    for (const [category, grid] of Object.entries(grids)) {
      grid.innerHTML = CONFIG.packages.filter(p => p.category === category).map(p => {
        const x = pkgText(p.id);
        return `<article class="pkg${p.popular ? ' pkg--pop' : ''}" data-pkg="${esc(p.id)}">
          ${p.popular ? `<span class="pkg-badge">${esc(t('pkg.popular'))}</span>` : ''}
          <h3 class="pkg-name">${esc(x.name)}</h3>
          <p class="pkg-best">${esc(x.bestFor)}</p>
          <div class="pkg-price">${esc(priceText(p.id))}</div>
          <ul class="check-list">${checkList(x.short)}</ul>
          <div class="pkg-actions">
            <button class="btn btn-primary btn-sm" type="button" data-quote="${esc(p.id)}">${esc(t('pkg.quote'))}</button>
            <button class="link-btn" type="button" data-modal="${esc(p.id)}">${esc(t('pkg.details'))}</button>
          </div>
        </article>`;
      }).join('');
      d.dispatchEvent(new CustomEvent('ocs:rendered', { detail: { root: grid } }));
    }
  }

  let modalPkg = null;
  function openPkgModal(id) {
    const x = pkgText(id);
    modalPkg = id;
    $('#mName').textContent = x.name;
    $('#mTag').textContent = `${x.tagline} · ${priceText(id)}`;
    $('#mBest').textContent = x.bestFor;
    $('#mList').innerHTML = checkList(x.full);
    $('#mNotes').innerHTML = x.notes.map(n => `<li>${esc(n)}</li>`).join('');
    $('#mCta').dataset.pkg = id;
    if (!$('#pkgModal').classList.contains('open')) openModal($('#pkgModal'));
  }

  function selectPackage(id, withToast) {
    const select = $('#f-pkg');
    if ([...select.options].some(o => o.value === id)) select.value = id;
    $('#contact').scrollIntoView({ behavior: 'smooth' });
    if (withToast) showToast(t('toast.pkgSelected', { name: pkgText(id).name }));
  }

  function initPackages() {
    const wrap = $('.pkg-tabs');
    $$('[data-pkg-tab]').forEach(tab => tab.addEventListener('click', () => {
      const target = tab.dataset.pkgTab;
      $$('[data-pkg-tab]').forEach(b => {
        const on = b === tab;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', String(on));
      });
      wrap.dataset.active = target;
      $$('.pkg-panel').forEach(p => p.classList.remove('active'));
      $(`#pkgTab${target[0].toUpperCase()}${target.slice(1)}`).classList.add('active');
    }));
    $('#packages').addEventListener('click', e => {
      const quote = e.target.closest('[data-quote]');
      if (quote) selectPackage(quote.dataset.quote, true);
      const more = e.target.closest('[data-modal]');
      if (more) openPkgModal(more.dataset.modal);
    });
    $('#mCta').addEventListener('click', () => {
      closeModal($('#pkgModal'));
      selectPackage($('#mCta').dataset.pkg, false);
    });
  }

  /* ---------- SSS ---------- */
  function renderFaq() {
    $('#faqList').innerHTML = (OCS.i18n.dict().faqs || []).map((f, i) => `
      <div class="faq-item">
        <button class="faq-q" type="button" id="faq-q-${i}" aria-expanded="false" aria-controls="faq-a-${i}"><span>${esc(f.q)}</span>${OCS.ui.icon('chevron-down')}</button>
        <div class="faq-a" id="faq-a-${i}" role="region" aria-labelledby="faq-q-${i}"><p>${esc(fillPrices(f.a))}</p></div>
      </div>`).join('');
    d.dispatchEvent(new CustomEvent('ocs:rendered', { detail: { root: $('#faqList') } }));
  }

  function initFaq() {
    $('#faqList').addEventListener('click', e => {
      const btn = e.target.closest('.faq-q');
      if (!btn) return;
      const item = btn.parentElement;
      const wasOpen = item.classList.contains('open');
      $$('.faq-item.open').forEach(other => {
        other.classList.remove('open');
        $('.faq-a', other).style.maxHeight = null;
        $('.faq-q', other).setAttribute('aria-expanded', 'false');
      });
      if (!wasOpen) {
        item.classList.add('open');
        const answer = $('.faq-a', item);
        answer.style.maxHeight = answer.scrollHeight + 'px';
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  }

  /* ---------- Form seçenekleri ---------- */
  function renderPackageSelect() {
    const select = $('#f-pkg');
    const previous = select.value || 'notsure';
    select.innerHTML = [`<option value="notsure">${esc(t('form.packageNotSure'))}</option>`,
      ...CONFIG.packages.map(p => `<option value="${esc(p.id)}">${esc(pkgText(p.id).name)}</option>`)].join('');
    select.value = [...select.options].some(o => o.value === previous) ? previous : 'notsure';
  }

  function renderBudget() {
    const select = $('#f-budget');
    const index = select.selectedIndex;
    select.innerHTML = OCS.money.budgetOptions().map(o => `<option value="${esc(o.value)}">${esc(o.label)}</option>`).join('');
    // Para birimi değişince aynı aralık seçili kalır
    if (index > 0 && index < select.options.length) select.selectedIndex = index;
  }

  function renderPrices() {
    renderPackages();
    renderFaq();
    renderBudget();
    if (modalPkg && $('#pkgModal').classList.contains('open')) openPkgModal(modalPkg);
  }

  function renderAll() {
    renderMarquee();
    renderHeroCollage();
    renderPortfolio();
    renderPackageSelect();
    renderPrices();
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

    OCS.ui.renderControls($('#navControls'));
    OCS.ui.renderControls($('#navMobileControls'));
    OCS.ui.bindThemeToggles();
    OCS.theme.watchSystem();
    OCS.ui.lazyBackground();
    initNav();
    initModals();
    initContact();
    initPackages();
    initFaq();
    $$('[data-work-filter]').forEach(b => b.addEventListener('click', () => renderPortfolio(b.dataset.workFilter)));
    $$('[data-open-audit]').forEach(b => b.addEventListener('click', () => openModal($('#auditModal'))));
    d.addEventListener('ocs:lang', renderAll);
    d.addEventListener('ocs:currency', renderPrices);
    OCS.i18n.init();
  }

  OCS.site = { showToast, openModal, closeModal, openPkgModal };

  // Tüm "defer" betikler çalıştıktan sonra başlar (açılış animasyonu dahil).
  if (d.readyState === 'complete') init();
  else d.addEventListener('DOMContentLoaded', init);
})(window, document);
