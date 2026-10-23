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

  OCS.i18n = { lang: () => currentLang, dict, locale, t, fmt };

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
})(window, document);
