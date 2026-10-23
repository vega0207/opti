// Birim testleri için küçük, elle yazılmış CONFIG ve dil sözlükleri (gerçek dosyalardan bağımsız).
import { loadScripts } from '../load.mjs';

export const FIXTURE = `
const CONFIG = {
  currencies: ['USD', 'TRY', 'EUR', 'RUB', 'KWD'],
  langCurrency: { en: 'USD', tr: 'TRY', de: 'EUR', ru: 'RUB', ar: 'KWD' },
  prices: {
    essential: { USD: 1350, TRY: 57000, EUR: 1150, RUB: 108000, KWD: 410 },
    broken: { USD: 'abc', TRY: -5, EUR: null, RUB: 12.5 }
  },
  budgets: {
    USD: [1000, 2500, 5000, 10000],
    TRY: [42000, 105000, 210000, 420000],
    RUB: [5000, 1000, 9000, 12000],
    KWD: [300, 760, 1520, 3040.5]
  }
};
OCS.addLang({
  meta: { code: 'en', dir: 'ltr', locale: 'en-US', name: 'English' },
  ui: {
    hello: 'Hi {name}',
    'form.budget.none': 'Prefer not to say',
    'form.budget.under': 'Under {x}',
    'form.budget.range': '{x} – {y}',
    'form.budget.over': '{x}+'
  }
});
OCS.addLang({
  meta: { code: 'tr', dir: 'ltr', locale: 'tr-TR', name: 'Türkçe' },
  ui: {
    hello: 'Selam {name}',
    'form.budget.none': 'Belirtmek istemiyorum',
    'form.budget.under': '{x} altı',
    'form.budget.range': '{x} – {y}',
    'form.budget.over': '{x} ve üzeri'
  }
});
var __events = [];
document.dispatchEvent = e => { __events.push({ type: e.type, detail: e.detail }); return true; };
`;

// Biçimlendirmedeki görünmez yön işaretleri ve bölünmez boşluklar karşılaştırma için sadeleştirilir.
export const norm = s => String(s).replace(/[‎‏؜]/g, '').replace(/[  ]/g, ' ');

export function loadWithFixture(opts = {}) {
  const env = loadScripts(['js/boot.js', 'js/core.js'], opts);
  env.run(FIXTURE);
  return env;
}
