/* OptiCodeStudio — tüm sayfaların ortak sistemleri.
   Bu dosyada içerik yok; metinler js/lang/, ayarlar js/config.js içindedir. */
(function (w, d) {
  'use strict';

  const OCS = w.OCS = w.OCS || {};

  /* ---------- Depolama ----------
     Çerezler kabul edildiyse tercihler kalıcı (localStorage), değilse yalnız bu ziyaret
     boyunca (sessionStorage) saklanır. Tarayıcı depolamayı engellerse bellekte tutulur. */
  const PREF_KEYS = ['ocs.lang', 'ocs.currency', 'ocs.theme'];
  const CONSENT_KEY = 'ocs.consent';
  const memory = new Map();

  const area = name => {
    try { const s = w[name]; s.getItem(CONSENT_KEY); return s; } catch (e) { return null; }
  };
  const readFrom = (name, key) => {
    const s = area(name);
    if (!s) return null;
    try { return s.getItem(key); } catch (e) { return null; }
  };
  const writeTo = (name, key, value) => {
    const s = area(name);
    if (!s) return false;
    try { s.setItem(key, value); return true; } catch (e) { return false; }
  };
  const removeFrom = (name, key) => {
    const s = area(name);
    if (!s) return;
    try { s.removeItem(key); } catch (e) { /* yoksay */ }
  };

  const consent = () => {
    let raw = readFrom('localStorage', CONSENT_KEY);
    if (raw === null && memory.has(CONSENT_KEY)) raw = memory.get(CONSENT_KEY);
    if (!raw) return null;
    try {
      const choice = JSON.parse(raw).choice;
      return choice === 'accepted' || choice === 'rejected' ? choice : null;
    } catch (e) {
      return null;
    }
  };

  OCS.store = {
    PREF_KEYS,

    get(key) {
      const fromSession = readFrom('sessionStorage', key);
      if (fromSession !== null) return fromSession;
      const fromLocal = readFrom('localStorage', key);
      if (fromLocal !== null) return fromLocal;
      return memory.has(key) ? memory.get(key) : null;
    },

    set(key, value) {
      const v = String(value);
      if (consent() === 'accepted') {
        if (writeTo('localStorage', key, v)) {
          removeFrom('sessionStorage', key);
          memory.delete(key);
          return;
        }
      } else if (writeTo('sessionStorage', key, v)) {
        memory.delete(key);
        return;
      }
      memory.set(key, v);
    },

    remove(key) {
      removeFrom('sessionStorage', key);
      removeFrom('localStorage', key);
      memory.delete(key);
    },

    consent,

    setConsent(choice) {
      if (choice !== 'accepted' && choice !== 'rejected') return;
      const record = JSON.stringify({ choice, at: new Date().toISOString() });
      if (!writeTo('localStorage', CONSENT_KEY, record)) memory.set(CONSENT_KEY, record);
      for (const key of PREF_KEYS) {
        if (choice === 'accepted') {
          const value = readFrom('sessionStorage', key);
          if (value !== null && writeTo('localStorage', key, value)) removeFrom('sessionStorage', key);
        } else {
          // Ret: kalıcı kopya silinir; bu ziyaret boyunca oturumda kalır.
          const value = readFrom('localStorage', key);
          if (value !== null) {
            if (readFrom('sessionStorage', key) === null) writeTo('sessionStorage', key, value);
            removeFrom('localStorage', key);
          }
        }
      }
    }
  };

  /* ---------- Dil (metin bulma ve yerleştirme) ---------- */
  const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
  const EMPTY_LANG = { meta: { code: 'en', dir: 'ltr', locale: 'en-US' }, ui: {} };
  let currentLang = (OCS.boot && OCS.boot.lang) || 'en';
  const warned = new Set();

  // {ad} işaretlerini doldurur; {price:...} gibi iki noktalı işaretlere dokunmaz.
  const fmt = (str, vars) => String(str).replace(/\{([A-Za-z0-9_]+)\}/g,
    (token, name) => (vars && has(vars, name) ? String(vars[name]) : token));

  const dict = () => OCS.langs[currentLang] || OCS.langs.en || EMPTY_LANG;
  const locale = () => (dict().meta && dict().meta.locale) || 'en-US';
  const t = (key, vars) => {
    const ui = dict().ui || {};
    if (has(ui, key)) return fmt(ui[key], vars);
    if (!warned.has(key)) {
      warned.add(key);
      console.warn('[i18n] eksik metin: ' + key);
    }
    return key;
  };

  // Seçilen dilin dosyası yalnız gerektiğinde yüklenir.
  const loading = {};
  const load = code => {
    if (OCS.langs[code]) return Promise.resolve(OCS.langs[code]);
    if (loading[code]) return loading[code];
    loading[code] = new Promise((resolve, reject) => {
      const s = d.createElement('script');
      s.src = `js/lang/${code}.js`;
      s.onload = () => (OCS.langs[code] ? resolve(OCS.langs[code]) : reject(new Error(`lang ${code} missing`)));
      s.onerror = () => { delete loading[code]; reject(new Error(`lang ${code} failed`)); };
      d.head.appendChild(s);
    });
    return loading[code];
  };

  // data-i18n: düz metin · data-i18n-html: bizim dosyalarımızdaki HTML · data-i18n-attr="öznitelik:anahtar;..."
  const apply = (root = d) => {
    root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    root.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
    root.querySelectorAll('[data-i18n-attr]').forEach(el => {
      for (const pair of el.dataset.i18nAttr.split(';')) {
        const [attr, key] = pair.split(':').map(s => s.trim());
        if (attr && key) el.setAttribute(attr, t(key));
      }
    });
    if (root !== d) return;
    const meta = dict().meta || {};
    d.documentElement.setAttribute('lang', meta.code || currentLang);
    d.documentElement.setAttribute('dir', meta.dir || 'ltr');
    const ui = dict().ui || {};
    if (ui['meta.title']) d.title = ui['meta.title'];
    const desc = d.querySelector('meta[name="description"]');
    if (desc && ui['meta.description']) desc.setAttribute('content', ui['meta.description']);
  };

  let resolveReady;
  const ready = new Promise(r => { resolveReady = r; });
  const timeout = (promise, ms) => Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
  ]);

  // Sayfa açılışı: dil dosyası 2,5 sn içinde gelmezse İngilizce; o da yoksa HTML'deki İngilizce kalır.
  const init = async () => {
    const wanted = currentLang;
    try {
      await timeout(load(wanted), 2500);
      // Başka bir dille gelindiyse (ör. ?lang=de linki) elle seçilmiş para birimi bırakılır
      if (wanted !== OCS.store.get('ocs.lang')) OCS.money.syncToLang(wanted);
      OCS.store.set('ocs.lang', wanted);
    } catch (e) {
      currentLang = 'en';
      try { await load('en'); } catch (e2) { /* HTML'deki metin kalır */ }
    }
    if (OCS.langs[currentLang]) apply();
    d.documentElement.classList.remove('i18n-pending');
    resolveReady();
    d.dispatchEvent(new CustomEvent('ocs:lang', { detail: { code: currentLang } }));
  };

  // Dil menüsünden seçim: sayfa yenilenmeden yazılar, yön, adres ve para birimi değişir.
  const set = async code => {
    if (!OCS.SUPPORTED_LANGS.includes(code)) return;
    try { await load(code); } catch (e) { return; }
    OCS.money.syncToLang(code);
    currentLang = code;
    apply();
    OCS.store.set('ocs.lang', code);
    try {
      const url = new URL(w.location.href);
      url.searchParams.set('lang', code);
      w.history.replaceState(w.history.state, '', url.pathname + url.search + url.hash);
    } catch (e) { /* adres güncellenemezse sorun değil */ }
    d.dispatchEvent(new CustomEvent('ocs:lang', { detail: { code } }));
  };

  OCS.i18n = { lang: () => currentLang, dict, locale, t, fmt, load, apply, init, ready, set };

  /* ---------- Hukuki metinler ----------
     Metin dil dosyasında, şirket bilgileri config.js'te: {company}, {address}, {email}, {updated} */
  const escHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const LEGAL_FIELDS = { company: 'companyTitle', address: 'address', email: 'email', updated: 'updated' };
  OCS.legalText = doc => {
    const entry = (dict().legal || {})[doc];
    if (!entry) return '';
    const info = (typeof CONFIG !== 'undefined' && CONFIG.legal) || {};
    return entry.html.replace(/\{(company|address|email|updated)\}/g, (token, key) => {
      const value = escHtml(info[LEGAL_FIELDS[key]] || '');
      // Unvan ve adres metnin dilinden farklı yönde olabilir (Arapça metinde Latin harfli unvan)
      return key === 'company' || key === 'address' ? `<bdi>${value}</bdi>` : value;
    });
  };

  /* ---------- Para birimi ----------
     Fiyatlar config.js'teki tablodan gelir; kur hesabı yapılmaz. */
  const cfg = () => (typeof CONFIG !== 'undefined' ? CONFIG : null);
  const isCurrency = code => {
    const c = cfg();
    return Boolean(c && Array.isArray(c.currencies) && c.currencies.includes(code));
  };
  const isAmount = v => Number.isInteger(v) && v > 0;

  const current = () => {
    const stored = OCS.store.get('ocs.currency');
    if (isCurrency(stored)) return stored;
    const c = cfg();
    const byLang = c && c.langCurrency ? c.langCurrency[currentLang] : null;
    return isCurrency(byLang) ? byLang : 'USD';
  };

  const format = (amount, currency = current(), loc = locale()) =>
    new Intl.NumberFormat(loc, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);

  const price = pkgId => {
    const c = cfg();
    const row = c && c.prices ? c.prices[pkgId] : null;
    const amount = row ? row[current()] : null;
    return isAmount(amount) ? format(amount) : null;
  };

  OCS.money = {
    current,
    format,
    price,

    set(code) {
      if (!isCurrency(code)) return;
      OCS.store.set('ocs.currency', code);
      d.dispatchEvent(new CustomEvent('ocs:currency', { detail: { code } }));
    },

    // Dil değişince elle seçilen para birimi bırakılır; yeni dilin parası geçerli olur.
    syncToLang() {
      OCS.store.remove('ocs.currency');
    },

    fill: text => String(text).replace(/\{price:([a-z0-9-]+)\}/g, (token, id) => price(id) || token),

    budgetOptions() {
      const options = [{ value: 'none', label: t('form.budget.none') }];
      const c = cfg();
      const b = c && c.budgets ? c.budgets[current()] : null;
      const valid = Array.isArray(b) && b.length === 4 && b.every(isAmount) &&
        b.every((v, i) => i === 0 || v > b[i - 1]);
      if (!valid) return options;
      options.push({ value: `lt-${b[0]}`, label: t('form.budget.under', { x: format(b[0]) }) });
      for (let i = 0; i < 3; i++) {
        options.push({ value: `${b[i]}-${b[i + 1]}`, label: t('form.budget.range', { x: format(b[i]), y: format(b[i + 1]) }) });
      }
      options.push({ value: `gte-${b[3]}`, label: t('form.budget.over', { x: format(b[3]) }) });
      return options;
    }
  };

  /* ---------- Tema (gece / gündüz) ----------
     İlk değer boot.js'te yazılır; burada düğme ve cihaz ayarı değişimi yönetilir. */
  let themeTimer;
  const setTheme = (mode, persist) => {
    if (mode !== 'dark' && mode !== 'light') return;
    const html = d.documentElement;
    html.classList.add('theme-anim');
    clearTimeout(themeTimer);
    themeTimer = setTimeout(() => html.classList.remove('theme-anim'), 400);
    html.setAttribute('data-theme', mode);
    if (persist) OCS.store.set('ocs.theme', mode);
    d.dispatchEvent(new CustomEvent('ocs:theme', { detail: { mode } }));
  };

  OCS.theme = {
    current: () => (d.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'),
    set: mode => setTheme(mode, true),
    toggle: () => setTheme(OCS.theme.current() === 'dark' ? 'light' : 'dark', true),
    // Ziyaretçi elle seçim yapmadıysa cihazın gece/gündüz değişimini izler.
    watchSystem() {
      const mq = w.matchMedia('(prefers-color-scheme: dark)');
      const onChange = e => {
        const stored = OCS.store.get('ocs.theme');
        if (stored === 'dark' || stored === 'light') return;
        setTheme(e.matches ? 'dark' : 'light', false);
      };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
  };

  /* ---------- Arayüz yardımcıları ---------- */
  OCS.ui = OCS.ui || {};

  OCS.ui.icon = (name, cls = '') =>
    `<svg class="i${cls ? ' ' + cls : ''}" aria-hidden="true"><use href="img/icons.svg#i-${name}"></use></svg>`;

  OCS.ui.bindThemeToggles = () => {
    const buttons = () => d.querySelectorAll('.theme-toggle');
    const sync = () => buttons().forEach(b => {
      const dark = OCS.theme.current() === 'dark';
      b.setAttribute('aria-pressed', String(dark));
      b.setAttribute('aria-label', t(dark ? 'controls.themeToLight' : 'controls.themeToDark'));
    });
    buttons().forEach(b => b.addEventListener('click', () => OCS.theme.toggle()));
    d.addEventListener('ocs:theme', sync);
    d.addEventListener('ocs:lang', sync);
  };

  // Dil ve para menüleri: aynı sayfadaki tüm kopyalar (üst bar + mobil menü) birlikte güncellenir.
  const escAttr = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const syncControls = () => {
    d.querySelectorAll('select[data-ctl="lang"]').forEach(s => {
      s.value = currentLang;
      s.setAttribute('aria-label', t('controls.lang'));
    });
    d.querySelectorAll('select[data-ctl="currency"]').forEach(s => {
      s.value = OCS.money.current();
      s.setAttribute('aria-label', t('controls.currency'));
    });
  };
  let controlsBound = false;
  OCS.ui.renderControls = (container, { lang = true, currency = true } = {}) => {
    if (!container) return;
    const parts = [];
    if (lang) {
      parts.push(`<label class="ctl ctl-lang">${OCS.ui.icon('globe')}<select data-ctl="lang">` +
        CONFIG.languages.map(l => `<option value="${escAttr(l.code)}" lang="${escAttr(l.code)}">${escAttr(l.name)}</option>`).join('') +
        '</select></label>');
    }
    if (currency) {
      parts.push('<label class="ctl ctl-cur"><select data-ctl="currency">' +
        CONFIG.currencies.map(c => `<option value="${escAttr(c)}">${escAttr(CONFIG.currencySymbols[c] || '')} ${escAttr(c)}</option>`).join('') +
        '</select></label>');
    }
    container.innerHTML = parts.join('');
    const langSelect = container.querySelector('select[data-ctl="lang"]');
    const curSelect = container.querySelector('select[data-ctl="currency"]');
    if (langSelect) langSelect.addEventListener('change', () => OCS.i18n.set(langSelect.value));
    if (curSelect) curSelect.addEventListener('change', () => OCS.money.set(curSelect.value));
    if (!controlsBound) {
      controlsBound = true;
      d.addEventListener('ocs:lang', syncControls);
      d.addEventListener('ocs:currency', syncControls);
    }
    syncControls();
  };

  /* ---------- Çerez bildirimi ----------
     Sitede takip çerezi yok; bildirim yalnız tercihlerin kalıcı saklanıp saklanmayacağını sorar. */
  OCS.consentBanner = (() => {
    let el = null;
    let bound = false;
    const render = () => {
      if (!el) return;
      el.setAttribute('aria-label', t('consent.label'));
      el.innerHTML = `<p>${escHtml(t('consent.text'))} <a href="cookies.html">${escHtml(t('consent.policy'))}</a></p>
        <div class="consent-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-consent="rejected">${escHtml(t('consent.reject'))}</button>
          <button type="button" class="btn btn-primary btn-sm" data-consent="accepted">${escHtml(t('consent.accept'))}</button>
        </div>`;
    };
    const close = () => {
      if (el) el.remove();
      el = null;
    };
    const open = () => {
      if (el) return;
      el = d.createElement('div');
      el.id = 'consentBanner';
      el.className = 'consent';
      el.setAttribute('role', 'region');
      render();
      el.addEventListener('click', e => {
        const btn = e.target.closest('[data-consent]');
        if (!btn) return;
        OCS.store.setConsent(btn.dataset.consent);
        close();
      });
      d.body.appendChild(el);
    };
    const init = (after = Promise.resolve()) => {
      if (!bound) {
        bound = true;
        d.addEventListener('ocs:lang', render);
        d.addEventListener('click', e => {
          if (!e.target.closest('[data-open-consent]')) return;
          e.preventDefault();
          open();
        });
      }
      if (OCS.store.consent()) return;
      Promise.resolve(after).then(() => OCS.i18n.ready).then(open);
    };
    return { init, open, close };
  })();

  /* ---------- Kaydırma animasyonları ----------
     data-anim="up|left|right|zoom|fade": öğe görünür olunca belirir, ekrandan tamamen çıkınca kaybolur.
     data-anim-stagger="...": kapsayıcının çocukları sırayla (80 ms arayla) gelir. */
  OCS.motion = (() => {
    let observer = null;
    const prepare = root => {
      const containers = [];
      if (root.matches && root.matches('[data-anim-stagger]')) containers.push(root);
      if (root.querySelectorAll) containers.push(...root.querySelectorAll('[data-anim-stagger]'));
      for (const c of containers) {
        [...c.children].forEach((child, i) => {
          child.dataset.anim = c.dataset.animStagger;
          child.style.setProperty('--i', String(i));
        });
      }
      const els = [];
      if (root.matches && root.matches('[data-anim]')) els.push(root);
      if (root.querySelectorAll) els.push(...root.querySelectorAll('[data-anim]'));
      return els;
    };
    const observe = elements => {
      if (!observer) return;
      for (const el of elements) observer.observe(el);
    };
    const init = () => {
      const reduced = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
      d.addEventListener('ocs:rendered', e => observe(prepare((e.detail && e.detail.root) || d)));
      if (reduced || !('IntersectionObserver' in w)) {
        d.documentElement.classList.add('no-motion');
        prepare(d);
        return;
      }
      observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.15) entry.target.classList.add('in');
          else if (entry.intersectionRatio === 0) entry.target.classList.remove('in');
        }
      }, { threshold: [0, 0.15] });
      observe(prepare(d));
    };
    return { init, observe };
  })();

  // Etkin olmayan temanın fotoğrafı, sayfa yüklendikten sonra boşta yüklenir (geçiş anında hazır olsun).
  OCS.ui.lazyBackground = () => {
    const layer = d.querySelector('.bg-layer');
    if (!layer) return;
    const idle = w.requestIdleCallback || (fn => setTimeout(fn, 300));
    const go = () => idle(() => layer.classList.add('both'));
    if (d.readyState === 'complete') go();
    else w.addEventListener('load', go, { once: true });
  };
})(window, document);
