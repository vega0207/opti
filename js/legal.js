/* ============================================================
   OptiCodeStudio — hukuki sayfalar (privacy.html, terms.html, cookies.html)
   Metinler dil dosyalarının legal bölümünden gelir; sayfalar yalnız iskelet taşır.
   ============================================================ */
(function (w, d) {
  'use strict';
  const OCS = w.OCS;
  let scrolledToHash = false;

  // Her [data-legal-doc] bölümüne başlığı ve metni yazar; sekme başlığı sayfanın kendi metninden gelir.
  function render() {
    const legal = OCS.i18n.dict().legal || {};
    d.querySelectorAll('[data-legal-doc]').forEach(section => {
      const entry = legal[section.dataset.legalDoc];
      if (!entry) return;
      section.querySelector('[data-legal-title]').textContent = entry.title;
      section.querySelector('[data-legal-body]').innerHTML = OCS.legalText(section.dataset.legalDoc);
    });
    const main = d.querySelector('main[data-doc]');
    const own = main && legal[main.dataset.doc];
    if (own) d.title = `${own.title.replace(/\u00AD/g, '')} | OptiCodeStudio`;

    // privacy.html#consent gibi bağlantılar: metin yazıldıktan sonra doğru yere kaydırılır.
    if (!scrolledToHash && w.location.hash) {
      scrolledToHash = true;
      const target = d.getElementById(decodeURIComponent(w.location.hash.slice(1)));
      if (target) target.scrollIntoView();
    }
  }

  function init() {
    if (d.documentElement.dataset.page !== 'legal') return;
    OCS.ui.renderControls(d.getElementById('legalControls'), { currency: false });
    OCS.ui.bindThemeToggles();
    OCS.theme.watchSystem();
    OCS.ui.lazyBackground();
    d.getElementById('footMail').href = `mailto:${CONFIG.email}`;
    d.getElementById('footIg').href = CONFIG.instagramUrl;
    d.addEventListener('ocs:lang', render);
    OCS.consentBanner.init();
    OCS.i18n.init();
  }

  OCS.legalPage = { init, render };
  d.addEventListener('DOMContentLoaded', init);
})(window, document);
