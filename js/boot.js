/* OptiCodeStudio — sayfa ekrana gelmeden önce çalışan küçük betik.
   Dili, temayı ve açılış animasyonunun oynayıp oynamayacağını belirler ve <html> etiketine yazar.
   <head> içinde, CSS'ten önce ve "defer" olmadan yüklenmelidir. */
(function (w, d) {
  'use strict';

  const OCS = w.OCS = w.OCS || {};
  const SUPPORTED = OCS.SUPPORTED_LANGS = ['tr', 'en', 'de', 'ar', 'ru'];
  const RTL = OCS.RTL_LANGS = ['ar'];
  const isSupported = code => SUPPORTED.includes(code);

  const read = (area, key) => {
    try { return w[area].getItem(key); } catch (e) { return null; }
  };
  const sessionWorks = () => {
    try { w.sessionStorage.getItem('ocs.splash'); return true; } catch (e) { return false; }
  };

  OCS.readPref = key => {
    const value = read('sessionStorage', key);
    return value !== null ? value : read('localStorage', key);
  };

  OCS.detectLang = (search, stored, navLangs) => {
    let param = null;
    try { param = new URLSearchParams(search || '').get('lang'); } catch (e) { param = null; }
    if (param) {
      param = param.toLowerCase();
      if (/^[a-z]{2}(-[a-z]{2})?$/.test(param) && isSupported(param.slice(0, 2))) return param.slice(0, 2);
    }
    if (stored && isSupported(stored)) return stored;
    for (const tag of navLangs || []) {
      const code = String(tag || '').slice(0, 2).toLowerCase();
      if (isSupported(code)) return code;
    }
    return 'en';
  };

  OCS.detectTheme = (stored, prefersDark) =>
    stored === 'dark' || stored === 'light' ? stored : (prefersDark ? 'dark' : 'light');

  OCS.langs = OCS.langs || {};
  OCS.addLang = def => { OCS.langs[def.meta.code] = def; };

  const html = d.documentElement;
  let prefersDark = false;
  try { prefersDark = w.matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) { prefersDark = false; }

  const storedTheme = OCS.readPref('ocs.theme');
  const nav = w.navigator || {};
  const lang = OCS.detectLang(w.location.search, OCS.readPref('ocs.lang'), nav.languages || [nav.language]);
  const theme = OCS.detectTheme(storedTheme, prefersDark);
  // Oynadığı oturumda hatırlanamıyorsa (depolama kapalı) açılış hiç oynamaz.
  const splash = html.getAttribute('data-page') === 'home' && sessionWorks() && read('sessionStorage', 'ocs.splash') === null;

  html.setAttribute('lang', lang);
  html.setAttribute('dir', RTL.includes(lang) ? 'rtl' : 'ltr');
  html.setAttribute('data-theme', theme);
  if (lang !== 'en') html.classList.add('i18n-pending');
  if (splash) html.classList.add('splash');

  // Ön yükleme: sayfanın beklediği dil dosyası (core.js'in yükleyeceği adresle aynı) ve etkin temanın
  // arka plan fotoğrafı, betikleri ve CSS'i beklemeden istenir. Fotoğrafın adı ve 720 px sınırı
  // css/style.css'teki .bg-night / .bg-day kurallarıyla aynı olmalı, yoksa fotoğraf iki kez iner.
  const preload = (as, href) => {
    try {
      const link = d.createElement('link');
      link.rel = 'preload';
      link.as = as;
      link.href = href;
      d.head.appendChild(link);
    } catch (e) { /* ön yükleme yalnız hız içindir; olmazsa dosya yine normal yolla yüklenir */ }
  };
  preload('script', `js/lang/${lang}.js`);
  let mobile = false;
  try { mobile = w.matchMedia('(max-width: 720px)').matches; } catch (e) { mobile = false; }
  preload('image', `img/bg-${theme === 'dark' ? 'night' : 'day'}${mobile ? '-m' : ''}.webp`);

  OCS.boot = {
    lang,
    theme,
    themeExplicit: storedTheme === 'dark' || storedTheme === 'light',
    splash
  };
})(window, document);
