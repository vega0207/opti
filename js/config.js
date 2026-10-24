/* ================================================================
   AYARLAR — değiştireceğin her şey burada
   ----------------------------------------------------------------
   Nasıl kullanılır:
   - Sadece tırnak içindeki yazıları ve sayıları değiştir.
   - Sitedeki metinler (başlıklar, paket açıklamaları, SSS, KVKK metni)
     bu dosyada değil, js/lang/ klasöründeki dil dosyalarındadır:
     tr.js (Türkçe), en.js (İngilizce), de.js (Almanca), ar.js (Arapça), ru.js (Rusça)
   ================================================================ */
const CONFIG = {

  // ---- İLETİŞİM BİLGİLERİ --------------------------------------
  email: "opticodestudio@gmail.com",                 // Formlar bu adrese gider
  instagramUrl: "https://www.instagram.com/opticodestudio/",
  instagramHandle: "@opticodestudio",

  // ---- KVKK / GİZLİLİK METNİNDEKİ ŞİRKET BİLGİLERİ -------------
  // Yayına almadan önce ilk iki alanı doldur; tüm dillerdeki metinlerde otomatik görünür.
  legal: {
    companyTitle: "OptiCodeStudio",                 // Şirket kurulunca ticaret unvanı yazılır
    address: "",                                    // Boş bırakılırsa metinde adres yer almaz
    email: "opticodestudio@gmail.com",
    updated: "2026-10"                               // Metinlerin "son güncelleme" tarihi (yıl-ay)
  },

  // ---- DİLLER ---------------------------------------------------
  // Menüde bu sırayla görünür. Kodlara (tr, en, ...) dokunma.
  languages: [
    { code: "tr", name: "Türkçe" },
    { code: "en", name: "English" },
    { code: "de", name: "Deutsch" },
    { code: "ar", name: "العربية" },
    { code: "ru", name: "Русский" }
  ],

  // ---- PARA BİRİMLERİ -------------------------------------------
  currencies: ["USD", "TRY", "EUR", "RUB", "KWD"],
  currencySymbols: { USD: "$", TRY: "₺", EUR: "€", RUB: "₽", KWD: "د.ك" },
  // Ziyaretçi bir dil seçince otomatik gelen para birimi:
  langCurrency: { en: "USD", tr: "TRY", de: "EUR", ru: "RUB", ar: "KWD" },

  // ---- PAKETLER -------------------------------------------------
  // Paket adları ve açıklamaları dil dosyalarında. Burada sadece sıra, sekme ve rozet var.
  // category: "new" = Yeni site sekmesi, "monthly" = Aylık planlar, "care" = Site bakımı
  // popular: true olan pakette "En popüler" rozeti çıkar.
  packages: [
    { id: "essential",        category: "new",     popular: false },   // Yeni Web Sitesi
    { id: "redesign",         category: "new",     popular: true  },   // Site Yenileme
    { id: "custom",           category: "new",     popular: false },   // Özel Proje (fiyat yok, "Teklif alın")
    { id: "monthly-starter",  category: "monthly", popular: false },   // Başlangıç Aylık
    { id: "monthly-business", category: "monthly", popular: true  },   // İşletme Aylık
    { id: "care-standard",    category: "care",    popular: false }    // Site Bakımı
  ],

  // ---- FİYAT TABLOSU --------------------------------------------
  // Her para birimindeki fiyatı ayrı ayrı yaz: tam sayı, nokta/virgül yok (67000 gibi).
  // Bir fiyatı yanlış yazarsan (boş, yazı, eksi sayı) o paket fiyat yerine "Teklif alın" gösterir.
  // İlk değerler 23.10.2026 kurlarıyla eski £ fiyatlardan hesaplandı ve yuvarlandı:
  // 1 GBP = 1.3393 USD = 66.5784 TRY = 1.1941 EUR = 108.7628 RUB = 0.4143 KWD
  // Kontrol edip istediğin gibi düzelt.
  prices: {
    "essential":        { USD: 1350, TRY: 67000,  EUR: 1200, RUB: 109000, KWD: 410 },  // başlangıç fiyatı
    "redesign":         { USD: 2000, TRY: 100000, EUR: 1800, RUB: 163000, KWD: 620 },  // başlangıç fiyatı
    "monthly-starter":  { USD: 470,  TRY: 23500,  EUR: 420,  RUB: 38000,  KWD: 145 },  // aylık
    "monthly-business": { USD: 740,  TRY: 36500,  EUR: 660,  RUB: 60000,  KWD: 230 },  // aylık
    "care-standard":    { USD: 470,  TRY: 23500,  EUR: 420,  RUB: 38000,  KWD: 145 }   // aylık
  },

  // ---- İLETİŞİM FORMUNDAKİ BÜTÇE ARALIKLARI --------------------
  // Her para birimi için küçükten büyüğe 4 sınır. Örneğin TRY için formda şunlar çıkar:
  // "67.000 ₺ altı", "67.000 – 166.000", "166.000 – 333.000", "333.000 – 666.000", "666.000 ve üzeri"
  budgets: {
    USD: [1350, 3350, 6700, 13400],
    TRY: [67000, 166000, 333000, 666000],
    EUR: [1200, 3000, 5950, 11950],
    RUB: [109000, 272000, 544000, 1088000],
    KWD: [410, 1040, 2070, 4140]
  },

  // ---- ÇALIŞMALAR (PORTFÖY) -------------------------------------
  // type: "concept" = Konseptler sekmesi, "client" = Müşteri projeleri sekmesi
  // url: demo sayfasının dosya adı (yeni sekmede açılır)
  // thumb: kartta görünen ekran görüntüsü
  // hero: true olan ilk 3 tanesi ana sayfanın en üstündeki görsellerde kullanılır
  portfolio: [
    { type: "concept", name: "Golden Crust Bakery",     url: "golden-crust.html",    thumb: "img/work/golden-crust.jpg", hero: true },
    { type: "concept", name: "Luma Dental Studio",      url: "meridian-law.html",    thumb: "img/work/luma-dental.jpg",  hero: true },
    { type: "concept", name: "Northform Training Club", url: "forge-athletics.html", thumb: "img/work/northform.jpg",    hero: true },
    { type: "concept", name: "Olive & Ember",           url: "olive-and-ember.html", thumb: "img/work/olive-and-ember.jpg", hero: false },
    { type: "concept", name: "Harbor & Hill Realty",    url: "harbor-homes.html",    thumb: "img/work/harbor-homes.jpg", hero: false },
    { type: "concept", name: "Sharp & Co. Barbers",     url: "sharp-and-co.html",    thumb: "img/work/sharp-and-co.jpg", hero: false },
    { type: "concept", name: "Atelier Linea",           url: "atelier-linea.html",   thumb: "img/work/atelier-linea.jpg", hero: false },
    { type: "concept", name: "Casa Olivo",              url: "casa-olivo.html",      thumb: "img/work/casa-olivo.jpg",   hero: false },
    { type: "concept", name: "Pitline Auto Care",       url: "pitline-auto.html",    thumb: "img/work/pitline-auto.jpg", hero: false },
    { type: "concept", name: "Willow Veterinary Clinic", url: "willow-vet.html",     thumb: "img/work/willow-vet.jpg",   hero: false },
    { type: "client",  name: "Nesmina",                 url: "nesmina.html",         thumb: "img/work/nesmina.jpg",      hero: false }
  ]
};
