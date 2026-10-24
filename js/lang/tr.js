/* Türkçe metinler. Anahtarlara dokunmayın; sadece tırnak içindeki yazıları değiştirin.
   {name}, {x}, {y}, {p} ve {price:...} otomatik doldurulur.
   Not: Fiyat işaretlerinin hemen arkasına ek koymayın ("{p}'den" gibi); sayıya göre yanlış okunabilir. */
OCS.addLang({
  meta: { code: "tr", dir: "ltr", locale: "tr-TR", name: "Türkçe" },

  ui: {
    "meta.title": "OptiCodeStudio | Küçük işletmeler için web siteleri",
    "meta.description": "Küçük işletmeler için hızlı, mobil uyumlu web siteleri tasarlıyor ve kuruyoruz; mevcut sitenizi de yeniliyoruz. Fiyatlar kendi para biriminizde.",

    "nav.work": "Çalışmalar",
    "nav.packages": "Paketler",
    "nav.process": "Süreç",
    "nav.faq": "SSS",
    "nav.cta": "Teklif al",
    "nav.menu": "Menü",

    "controls.lang": "Dil",
    "controls.currency": "Para birimi",
    "controls.themeToLight": "Gündüz moduna geç",
    "controls.themeToDark": "Gece moduna geç",

    "hero.title": "Daha iyi bir web sitesi,",
    "hero.accent": "sıfırdan ya da yenileyerek.",
    "hero.lead": "Küçük işletmeler için hızlı ve mobil uyumlu web siteleri tasarlıyor, kuruyoruz. İsterseniz mevcut sitenizi de yeniliyoruz.",
    "hero.ctaQuote": "Teklif al",
    "hero.ctaReview": "Ücretsiz site incelemesi",

    "work.title": "Son çalışmalar",
    "work.tab.concept": "Konseptler",
    "work.tab.client": "Müşteri projeleri",
    "work.open": "{name} sitesini yeni sekmede aç",

    "pkg.title": "Paketler",
    "pkg.lead": "Tek seferlik projeler, aylık planlar ya da sürekli bakım. Kapsamı ve fiyatı başlamadan önce netleştiriyoruz.",
    "pkg.tab.new": "Yeni site",
    "pkg.tab.monthly": "Aylık planlar",
    "pkg.tab.care": "Site bakımı",
    "pkg.note.new": "Tek seferlik her projede yayından sonra 7 günlük düzeltme süresi ve 30 gün teknik destek vardır.",
    "pkg.note.monthly": "Plan sürdüğü sürece web siteniz ve sınırlı sürekli bakım bir arada.",
    "pkg.note.care": "Tek seferde ödenen siteler için. Dahil olan 30 günlük destekten sonra bakım için aktif bir bakım planı gerekir.",
    "pkg.popular": "En popüler",
    "pkg.customPrice": "Teklif alın",
    "pkg.quote": "Teklif al",
    "pkg.details": "Tüm detaylar",
    "pkg.modal.included": "Neler dahil",
    "pkg.modal.notes": "Notlar ve istisnalar",
    "pkg.modal.cta": "Bu paket için teklif al",

    "process.title": "Nasıl çalışıyoruz",
    "process.s1.title": "Keşif",
    "process.s1.text": "İşinizi, müşterilerinizi ve mevcut sitenizi tanıyoruz.",
    "process.s2.title": "Tasarım",
    "process.s2.text": "Ne yaptığınızı net gösteren, iletişimi kolaylaştıran sade bir tasarım.",
    "process.s3.title": "Geliştirme",
    "process.s3.text": "Hızlı, mobil uyumlu bir site; geri bildirimlerinize göre düzenlenir.",
    "process.s4.title": "Yayın",
    "process.s4.text": "Kurulumu yapıyor, her şeyi test ediyor ve size teslim ediyoruz.",
    "why.b1": "2–4 iş gününde teslim",
    "why.b2": "Net fiyat, gizli ücret yok",
    "why.b3": "Şablon değil, sıfırdan kod",
    "why.b4": "Siteyi yapan kişiyle doğrudan iletişim",

    "faq.title": "Sık sorulan sorular",

    "contact.title": "Projenizi anlatın.",
    "contact.lead": "Genellikle 24 saat içinde bir öneri ve teklifle dönüyoruz.",
    "form.name": "Adınız",
    "form.namePh": "Adınız",
    "form.email": "E-posta",
    "form.emailPh": "siz@isletmeniz.com",
    "form.business": "İşletme ya da mevcut site (isteğe bağlı)",
    "form.businessPh": "İşletme adı ya da web sitesi",
    "form.package": "İlgilendiğiniz paket",
    "form.packageNotSure": "Henüz emin değilim",
    "form.budget": "Bütçe (isteğe bağlı)",
    "form.budget.none": "Belirtmek istemiyorum",
    "form.budget.under": "{x} altı",
    "form.budget.range": "{x} – {y}",
    "form.budget.over": "{x} ve üzeri",
    "form.details": "Proje detayları",
    "form.detailsPh": "İşletmeniz ne yapıyor, web sitesinin sizin için ne yapmasını istiyorsunuz?",
    "form.submit": "Gönder",
    "form.sending": "Gönderiliyor…",
    "form.sent": "Gönderildi",
    "form.hint": "Mesajınız doğrudan e-posta kutumuza gelir.",
    "form.err.name": "Lütfen adınızı yazın.",
    "form.err.email": "Lütfen geçerli bir e-posta adresi yazın.",
    "form.err.details": "Lütfen projenizden biraz bahsedin.",
    "form.err.site": "Lütfen web sitenizi ya da işletme adınızı yazın.",
    "form.kvkk1": "<a href=\"privacy.html\" data-legal=\"privacy\">Aydınlatma Metni</a>'ni okudum.",
    "form.kvkk2": "Talebimin yanıtlanması için kişisel verilerimin yurt dışındaki form ve e-posta hizmetlerine aktarılmasına <a href=\"privacy.html#consent\" data-legal=\"consent\">açık rıza</a> veriyorum.",
    "form.err.kvkk": "Formu göndermek için iki kutucuğu da işaretleyin.",

    "side.email.title": "E-postayı mı tercih edersiniz?",
    "side.email.text": "Bize doğrudan yazın.",
    "side.email.copy": "E-posta adresini kopyala",
    "side.ig.title": "Instagram",
    "side.ig.text": "Son işlerimize bakın ya da bize mesaj gönderin.",
    "side.ig.small": "İşler ve mesajlar",

    "audit.title": "Ücretsiz site incelemesi",
    "audit.sub": "Hızlı ve ücretsiz",
    "audit.text": "Sitenizin adresini gönderin, iyileştirilmesi gereken ana noktaları söyleyelim. Bu hızlı bir göz atmadır, tam bir denetim değildir.",
    "audit.site": "Web siteniz ya da işletmeniz",
    "audit.sitePh": "siteniz.com",
    "audit.note": "Özellikle bakmamızı istediğiniz bir şey var mı? (isteğe bağlı)",
    "audit.notePh": "Örneğin: telefonda eski görünüyor",
    "audit.submit": "İnceleme iste",
    "audit.hint": "Ücretsiz, hiçbir yükümlülük yok.",
    "audit.ok.title": "Talebiniz alındı",
    "audit.ok.text": "Sitenize bakıp e-postayla dönüş yapacağız. Ne olur ne olmaz, gereksiz klasörünü de kontrol edin.",

    "toast.fix": "Lütfen işaretli alanları doldurun.",
    "toast.sent": "Mesajınız gönderildi. 24 saat içinde dönüş yapacağız.",
    "toast.fail": "Mesajınız şu an gönderilemedi. Lütfen biraz sonra tekrar deneyin.",
    "toast.auditSent": "İnceleme talebiniz gönderildi.",
    "toast.auditFail": "Talebiniz şu an gönderilemedi. Lütfen biraz sonra tekrar deneyin.",
    "toast.pkgSelected": "{name} seçildi. Şimdi projenizi anlatın.",
    "toast.copied": "E-posta adresi kopyalandı.",
    "toast.copyFail": "Kopyalanamadı; adres hemen yanda yazıyor.",

    "footer.tagline": "Küçük işletmeler için web sitesi tasarımı ve geliştirme.",
    "footer.email": "E-posta",
    "footer.instagram": "Instagram",
    "footer.privacy": "Gizlilik",
    "footer.terms": "Şartlar",
    "footer.rights": "© 2026 OptiCodeStudio. Tüm hakları saklıdır.",

    "modal.close": "Kapat"
  },

  marquee: [
    "Web sitesi tasarımı",
    "Site yenileme",
    "Açılış sayfaları",
    "İletişim formları",
    "Temel SEO",
    "Hızlı açılış",
    "Mobil uyum",
    "Site bakımı"
  ],

  packages: {
    "essential": {
      name: "Yeni Web Sitesi",
      tagline: "Profesyonel bir dijital vitrin",
      bestFor: "İlk web sitesine ya da sıfırdan bir başlangıca ihtiyacı olan küçük işletmeler için.",
      priceLabel: "{p} ve üzeri",
      short: [
        "Özel tasarım, genellikle 1–5 sayfa",
        "Telefon, tablet ve bilgisayarda düzgün çalışır",
        "İletişim formu ve arama düğmeleri",
        "Alan adı, barındırma ve SSL kurulumu"
      ],
      full: [
        "Özel web sitesi tasarımı",
        "Genellikle 1–5 sayfa; kesin kapsam başlamadan önce netleşir",
        "Ana sayfa, Hakkımızda, Hizmetler ve İletişim sayfaları",
        "Telefon, tablet ve bilgisayara uygun düzen",
        "İletişim formu",
        "Gerekirse telefon, e-posta ve WhatsApp düğmeleri",
        "Gerekirse Google Haritalar",
        "Sosyal medya bağlantıları",
        "Temel SEO kurulumu",
        "Sayfa başlıkları ve açıklamaları",
        "Optimize edilmiş görseller",
        "SSL / HTTPS kurulumu",
        "Alan adı bağlantısı",
        "Barındırma ve yayına alma kurulumu",
        "1–2 düzeltme turu",
        "Yayın desteği"
      ],
      notes: [
        "Metin yazarlığı, profesyonel fotoğraf, marka kimliği ve logo tasarımı varsayılan olarak dahil değildir.",
        "Alan adı ve barındırma, ücreti müşteriye ait üçüncü taraf hizmetlerdir.",
        "Gelişmiş entegrasyonlar ve özel özellikler ayrıca fiyatlandırılır."
      ]
    },

    "redesign": {
      name: "Site Yenileme",
      tagline: "Eskimiş bir siteyi modern hale getirin",
      bestFor: "Zaten bir sitesi olan ve özellikle telefonda daha iyi görünmesini, daha iyi çalışmasını isteyen işletmeler için.",
      priceLabel: "{p} ve üzeri",
      short: [
        "Mevcut sitenizin incelemesi",
        "Her cihazda çalışan modern tasarım",
        "Daha net iletişim ve talep akışı",
        "Temel SEO ve hız iyileştirmeleri"
      ],
      full: [
        "Mevcut sitenin incelemesi",
        "Sitenize ve hedeflerinize göre modern yeniden tasarım",
        "Telefon, tablet ve bilgisayara uygun düzen",
        "Daha net menü ve harekete geçiren düğmeler",
        "İletişim ve talep formları",
        "Gerekirse metin ve görsel güncellemeleri",
        "Görsel optimizasyonu",
        "Temel SEO iyileştirmeleri",
        "Gerekirse Google Analytics kurulumu",
        "Gerekirse Google Search Console kurulumu",
        "Hız iyileştirmeleri",
        "2–3 düzeltme turu",
        "Yayın desteği"
      ],
      notes: [
        "Kesin kapsam; mevcut sitenize, içeriğe ve gereken değişikliklere göre belirlenir.",
        "Karmaşık taşımalar, rezervasyon sistemleri ve gelişmiş entegrasyonlar ayrıca fiyatlandırılır.",
        "Üçüncü taraf yazılım, eklenti, API ve abonelik ücretleri müşteriye aittir."
      ]
    },

    "custom": {
      name: "Özel Proje",
      tagline: "Daha fazlasına ihtiyaç duyan siteler için",
      bestFor: "Ek özellik, daha fazla sayfa ya da özel gereksinimi olan projeler için.",
      priceLabel: null,
      short: [
        "Kapsam ve takvim sizinle birlikte planlanır",
        "Özel tasarım ve geliştirme",
        "Ek sayfalar, bölümler ve basit entegrasyonlar",
        "Anlaşılırsa destek ve eğitim"
      ],
      full: [
        "Projeye özel kapsam",
        "Özel tasarım ve geliştirme",
        "Ek sayfa ya da bölümler",
        "Mümkün olduğunca basit formlar ve entegrasyonlar",
        "Anlaşılırsa içerik taşıma",
        "Başlamadan önce ayrıntılı planlama",
        "Yayından önce test",
        "Anlaşılırsa destek ve eğitim"
      ],
      notes: [
        "Web uygulamaları, üyelik sistemleri, özel ödeme sistemleri ve gelişmiş sunucu tarafı işler ayrıca teknik değerlendirme gerektirir.",
        "Üçüncü taraf hizmet, API, lisans ve abonelik ücretleri müşteriye aittir.",
        "Takvim ve kesin fiyat, başlamadan önce yazılı olarak netleşir."
      ]
    },

    "monthly-starter": {
      name: "Başlangıç Aylık",
      tagline: "Web sitesi ve sürekli bakım",
      bestFor: "Basit bir web sitesi ve temel destek isteyen küçük işletmeler için.",
      priceLabel: "Aylık {p}",
      short: [
        "Basit 3–5 sayfalık site",
        "Mobil uyumlu tasarım",
        "Ayda 1 saate kadar güncelleme",
        "Güvenlik kontrolleri ve yedekleme"
      ],
      full: [
        "Basit 3–5 sayfalık site",
        "Mobil uyumlu tasarım",
        "İletişim formu ve arama düğmeleri",
        "Temel SEO kurulumu",
        "Alan adı bağlantısı ve SSL kurulumu",
        "Ayda 1 saate kadar güncelleme",
        "Güvenlik kontrolleri ve yedekleme",
        "Aylık durum bilgisi"
      ],
      notes: [
        "En az 6 ay süreli.",
        "Büyük yeniden tasarımlar, yeni sayfalar ve gelişmiş özellikler ek teklif gerektirebilir.",
        "Alan adı ve barındırma ücretleri müşteri tarafından ayrıca ödenir."
      ]
    },

    "monthly-business": {
      name: "İşletme Aylık",
      tagline: "Web sitesi, güncellemeler ve iyileştirmeler",
      bestFor: "Daha güçlü bir site, düzenli güncelleme ve destek isteyen işletmeler için.",
      priceLabel: "Aylık {p}",
      short: [
        "5–8 sayfalık site",
        "Ayda 3 saate kadar güncelleme",
        "Hız ve performans kontrolleri",
        "Öncelikli destek ve aylık görüşme"
      ],
      full: [
        "5–8 sayfalık site",
        "Ziyaretçiyi talebe dönüştürmeye uygun yapı",
        "Mobil uyumlu tasarım",
        "Gelişmiş iletişim ve talep formları",
        "Temel SEO kurulumu",
        "Ayda 3 saate kadar güncelleme",
        "Hız ve performans kontrolleri",
        "Öncelikli destek",
        "Aylık değerlendirme görüşmesi"
      ],
      notes: [
        "En az 6 ay süreli.",
        "Yeni açılış sayfaları ve gelişmiş entegrasyonlar ek teklif gerektirebilir.",
        "Alan adı ve barındırma ücretleri müşteri tarafından ayrıca ödenir."
      ]
    },

    "care-standard": {
      name: "Site Bakımı",
      tagline: "Yayından sonra bakım",
      bestFor: "Sitesini tek seferde ödeyip yayından sonra da destek isteyen müşteriler için.",
      priceLabel: "Aylık {p}",
      short: [
        "Güncellemeler ve güvenlik kontrolleri",
        "Yedekleme ve kesinti takibi",
        "Ayda 1 saate kadar küçük değişiklik",
        "Site sorunlarında öncelikli yardım"
      ],
      full: [
        "Site güncellemeleri ve güvenlik kontrolleri",
        "Yedekleme ve kesinti takibi",
        "Ayda 1 saate kadar küçük değişiklik",
        "Aylık durum bilgisi",
        "Site sorunlarında öncelikli destek",
        "Küçük metin ve görsel güncellemeleri"
      ],
      notes: [
        "Taahhüt yok: 30 gün önceden yazılı bildirimle iptal edebilirsiniz.",
        "Büyük yeniden tasarımlar, yeni sayfalar ve gelişmiş özellikler ayrıca fiyatlandırılır.",
        "Dahil olan 30 günlük destekten sonra bakım planı olmayan sitelere sürekli bakım yapılmaz."
      ]
    }
  },

  faqs: [
    {
      q: "Bir web sitesi ne kadar tutar?",
      a: "Yeni web sitesi fiyatlarımız {price:essential} seviyesinden, site yenileme fiyatlarımız {price:redesign} seviyesinden başlıyor. Kesin fiyat sayfa sayısına, içeriğinize ve ek özelliklere göre değişir. Bütçenizi söyleyin, o bütçeyle neyin mantıklı olduğunu önerelim. Fiyatı başlamadan önce netleştiriyoruz."
    },
    {
      q: "Ne kadar sürede hazır olur?",
      a: "Standart sitelerin ve yenilemelerin çoğu, içerik ve onaylar hazır olduğunda 2–4 iş gününde tamamlanır. Daha büyük projeler için başlamadan önce net bir takvim veriyoruz."
    },
    {
      q: "Başlamak için sizden ne gerekiyor?",
      a: "İşletmenizin ne yaptığı, müşterilerinizin kim olduğu ve sitenin neyi başarması gerektiği. Logonuz, metinleriniz ya da fotoğraflarınız varsa harika; yoksa neye ihtiyaç olduğunu biz söyleriz."
    },
    {
      q: "Mevcut sitemi yenileyebilir misiniz?",
      a: "Evet. Bağlantıyı gönderin; ana sorunlara bakar, neyi değiştireceğimizi anlatır ve bir teklif göndeririz."
    },
    {
      q: "Alan adı, barındırma ve bakım ne olacak?",
      a: "Alan adınızı bağlıyor, barındırma ve HTTPS kurulumunu yapıyoruz. Alan adı ve barındırma ücretleri size aittir. Sürekli bakım için bir bakım planı seçebilirsiniz."
    },
    {
      q: "Neler dahil değil?",
      a: "Web uygulamaları, üyelik sistemleri, özel ödeme sistemleri ve karmaşık entegrasyonlar ayrıca fiyatlandırılır. Logo tasarımı da ayrı bir hizmettir. Kapsamı başlamadan önce birlikte belirliyoruz."
    },
    {
      q: "Aylık plan var mı, iptal edebilir miyim?",
      a: "Aylık planlarda web sitesi ve sınırlı sürekli bakım bir arada; aylık {price:monthly-starter} ile başlar ve en az 6 ay sürelidir. Tek seferde ödenen siteler için Site Bakımı aylık {price:care-standard}. Bakım planlarında taahhüt yoktur: 30 gün önceden yazılı bildirimle iptal edebilirsiniz."
    },
    {
      q: "Yayından sonra ne oluyor?",
      a: "Her projede 7 günlük düzeltme süresi ve 30 gün teknik destek vardır. Sonrasında bir bakım planı ekleyebilir ya da siteyi kendiniz yönetebilirsiniz."
    }
  ],

  legal: {
    privacy: {
      title: "KVKK Aydınlatma Metni",
      html: `
<p>Bu metin, bu web sitesindeki formlar aracılığıyla gönderdiğiniz kişisel verilerin 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) ve Avrupa Birliği ile Birleşik Krallık'taki ziyaretçiler için GDPR ve UK GDPR kapsamında nasıl işlendiğini açıklar.</p>
<h3>Veri sorumlusu</h3>
<p>Veri sorumlusu: {company}, {address}. İletişim: <a href="mailto:{email}">{email}</a>. OptiCodeStudio, veri sorumlusunun marka adıdır.</p>
<h3>Hangi verileri işliyoruz</h3>
<ul>
<li>Adınız ve e-posta adresiniz</li>
<li>Yazdıysanız işletme adınız ya da web siteniz</li>
<li>Seçtiyseniz ilgilendiğiniz paket ve bütçe aralığınız</li>
<li>Mesajınız</li>
<li>Sitede kullandığınız dil ve para birimi, formdaki onayları verdiğiniz tarih ve saat</li>
</ul>
<h3>Hangi amaçla işliyoruz</h3>
<ul>
<li>Talebinize cevap vermek ve projenizi konuşmak</li>
<li>Öneri, kapsam ya da fiyat teklifi hazırlamak</li>
<li>İstediğiniz ücretsiz site incelemesini yapmak</li>
</ul>
<p>Form verilerini reklam için kullanmıyor ve hiçbir şekilde satmıyoruz.</p>
<h3>Hukuki sebep</h3>
<p>Verileriniz, talebiniz üzerine olası bir sözleşme öncesinde gerekli adımların atılması ve taleplere cevap vermedeki meşru menfaatimiz sebebiyle işlenir (KVKK m.5/2-c ve f; GDPR m.6/1-b ve f). Form mesajları yurt dışındaki hizmet sağlayıcılar aracılığıyla iletildiğinden yurt dışına aktarım, formdaki ikinci kutucukla verdiğiniz açık rızaya dayanır (KVKK m.9).</p>
<h3>Veriler kimlere aktarılır</h3>
<ul>
<li>Form mesajlarını e-posta kutumuza ileten FormSubmit (ABD)</li>
<li>E-postalarımızın barındırıldığı Google (Gmail)</li>
<li>Bu siteyi barındıran ve her web sunucusu gibi IP adresinizi teknik kayıtlarda tutabilen GitHub Pages (ABD)</li>
</ul>
<p>Verileri yalnızca kanunun gerektirdiği durumlarda yetkili kamu kurumlarıyla paylaşırız.</p>
<h3>Ne kadar süre saklıyoruz</h3>
<p>Talebiniz projeye dönüşmezse son yazışmamızdan bir yıl sonra sileriz. Birlikte çalışırsak proje kayıtlarını ticaret ve vergi mevzuatının gerektirdiği süre boyunca saklarız.</p>
<h3>Haklarınız</h3>
<p>KVKK m.11 ve GDPR m.15–22 kapsamında verilerinizin işlenip işlenmediğini öğrenme, bilgi ve kopya isteme, düzeltilmesini ya da silinmesini isteme, işlemeye itiraz etme veya kısıtlanmasını isteme, uygulanabildiği durumlarda veri taşınabilirliği ve verdiğiniz rızayı her zaman geri alma haklarına sahipsiniz. Başvurunuzu <a href="mailto:{email}">{email}</a> adresine gönderebilirsiniz; en geç 30 gün içinde cevaplıyoruz.</p>
<p>Ayrıca Kişisel Verileri Koruma Kurulu'na ya da AB veya Birleşik Krallık'ta yaşıyorsanız bulunduğunuz yerdeki veri koruma otoritesine şikâyette bulunabilirsiniz.</p>
<p class="legal-updated">Son güncelleme: {updated}</p>`
    },
    consent: {
      title: "Açık Rıza Metni",
      html: `
<p>Bu sitedeki formlarla gönderdiğiniz mesaja cevap verebilmemiz için adınız, e-posta adresiniz, işletme ya da web sitesi bilginiz, bütçe aralığınız ve mesajınız FormSubmit (ABD) aracılığıyla Google (Gmail) üzerinde barındırılan e-posta kutumuza iletilir ve orada saklanır.</p>
<p>Kutucuğu işaretleyerek, kişisel verilerinizin yalnızca talebinize cevap verilmesi amacıyla bu şekilde yurt dışına aktarılmasına açık rıza vermiş olursunuz (KVKK m.9). Türkiye dışındaki ülkeler aynı düzeyde veri koruması sağlamayabilir.</p>
<p>Rızanızı istediğiniz zaman <a href="mailto:{email}">{email}</a> adresine yazarak geri alabilirsiniz. Geri almanız, öncesinde yapılmış aktarımları etkilemez. Bu rıza olmadan form gönderilemez.</p>`
    }
  }
});
