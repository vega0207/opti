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
})(window, document);
