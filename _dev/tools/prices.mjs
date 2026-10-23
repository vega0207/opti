// Fiyat tablosunun İLK değerlerini hesaplar: eski £ fiyatlar güncel kurla 5 para birimine çevrilip yuvarlanır.
// Yalnız başlangıç içindir; sonrasında fiyatlar js/config.js içinde elle düzenlenir.
// Kullanım: node _dev/tools/prices.mjs
const SOURCE_GBP = {
  essential: 1000,
  redesign: 1500,
  'monthly-starter': 350,
  'monthly-business': 550,
  'care-standard': 350
};
const MONTHLY = new Set(['monthly-starter', 'monthly-business', 'care-standard']);
const BUDGETS_GBP = [1000, 2500, 5000, 10000];
const CURRENCIES = ['USD', 'TRY', 'EUR', 'RUB', 'KWD'];
const STEP = {
  oneTime: { USD: 50, EUR: 50, TRY: 1000, RUB: 1000, KWD: 10 },
  monthly: { USD: 10, EUR: 10, TRY: 500, RUB: 500, KWD: 5 }
};

const roundTo = (value, step) => Math.round(value / step) * step;

const res = await fetch('https://open.er-api.com/v6/latest/GBP');
if (!res.ok) throw new Error(`Kur servisi yanıt vermedi: ${res.status}`);
const data = await res.json();
const rates = Object.fromEntries(CURRENCIES.map(c => {
  const r = data.rates?.[c];
  if (typeof r !== 'number') throw new Error(`${c} kuru yok`);
  return [c, r];
}));

const prices = {};
for (const [id, gbp] of Object.entries(SOURCE_GBP)) {
  const steps = MONTHLY.has(id) ? STEP.monthly : STEP.oneTime;
  prices[id] = Object.fromEntries(CURRENCIES.map(c => [c, roundTo(gbp * rates[c], steps[c])]));
}
const budgets = Object.fromEntries(CURRENCIES.map(c => [c, BUDGETS_GBP.map(v => roundTo(v * rates[c], STEP.oneTime[c]))]));

const date = new Date(data.time_last_update_unix * 1000).toISOString().slice(0, 10);
console.log(`// ${date} kurlarıyla hesaplandı: 1 GBP = ${CURRENCIES.map(c => `${rates[c]} ${c}`).join(', ')}`);
console.log(JSON.stringify({ prices, budgets }, null, 2));
