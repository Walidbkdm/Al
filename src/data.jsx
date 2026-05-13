/* global window */
// Shared app data. Attached to window.AppData for other scripts to read.

(function () {

const WILAYAS = [
  { code: 1,  name: 'Adrar',            ar: 'أدرار' },
  { code: 2,  name: 'Chlef',            ar: 'الشلف' },
  { code: 3,  name: 'Laghouat',         ar: 'الأغواط' },
  { code: 4,  name: 'Oum El Bouaghi',   ar: 'أم البواقي' },
  { code: 5,  name: 'Batna',            ar: 'باتنة' },
  { code: 6,  name: 'Béjaïa',           ar: 'بجاية' },
  { code: 7,  name: 'Biskra',           ar: 'بسكرة' },
  { code: 8,  name: 'Béchar',           ar: 'بشار' },
  { code: 9,  name: 'Blida',            ar: 'البليدة' },
  { code: 10, name: 'Bouira',           ar: 'البويرة' },
  { code: 11, name: 'Tamanrasset',      ar: 'تمنراست' },
  { code: 12, name: 'Tébessa',          ar: 'تبسة' },
  { code: 13, name: 'Tlemcen',          ar: 'تلمسان' },
  { code: 14, name: 'Tiaret',           ar: 'تيارت' },
  { code: 15, name: 'Tizi Ouzou',       ar: 'تيزي وزو' },
  { code: 16, name: 'Alger',            ar: 'الجزائر' },
  { code: 17, name: 'Djelfa',           ar: 'الجلفة' },
  { code: 18, name: 'Jijel',            ar: 'جيجل' },
  { code: 19, name: 'Sétif',            ar: 'سطيف' },
  { code: 20, name: 'Saïda',            ar: 'سعيدة' },
  { code: 21, name: 'Skikda',           ar: 'سكيكدة' },
  { code: 22, name: 'Sidi Bel Abbès',   ar: 'سيدي بلعباس' },
  { code: 23, name: 'Annaba',           ar: 'عنابة' },
  { code: 24, name: 'Guelma',           ar: 'قالمة' },
  { code: 25, name: 'Constantine',      ar: 'قسنطينة' },
  { code: 26, name: 'Médéa',            ar: 'المدية' },
  { code: 27, name: 'Mostaganem',       ar: 'مستغانم' },
  { code: 28, name: "M'Sila",           ar: 'المسيلة' },
  { code: 29, name: 'Mascara',          ar: 'معسكر' },
  { code: 30, name: 'Ouargla',          ar: 'ورقلة' },
  { code: 31, name: 'Oran',             ar: 'وهران' },
  { code: 32, name: 'El Bayadh',        ar: 'البيض' },
  { code: 33, name: 'Illizi',           ar: 'إليزي' },
  { code: 34, name: 'Bordj Bou Arreridj',ar: 'برج بوعريريج' },
  { code: 35, name: 'Boumerdès',        ar: 'بومرداس' },
  { code: 36, name: 'El Tarf',          ar: 'الطارف' },
  { code: 37, name: 'Tindouf',          ar: 'تندوف' },
  { code: 38, name: 'Tissemsilt',       ar: 'تيسمسيلت' },
  { code: 39, name: 'El Oued',          ar: 'الوادي' },
  { code: 40, name: 'Khenchela',        ar: 'خنشلة' },
  { code: 41, name: 'Souk Ahras',       ar: 'سوق أهراس' },
  { code: 42, name: 'Tipaza',           ar: 'تيبازة' },
  { code: 43, name: 'Mila',             ar: 'ميلة' },
  { code: 44, name: 'Aïn Defla',        ar: 'عين الدفلى' },
  { code: 45, name: 'Naâma',            ar: 'النعامة' },
  { code: 46, name: 'Aïn Témouchent',   ar: 'عين تموشنت' },
  { code: 47, name: 'Ghardaïa',         ar: 'غرداية' },
  { code: 48, name: 'Relizane',         ar: 'غليزان' },
  { code: 49, name: 'Timimoun',         ar: 'تيميمون' },
  { code: 50, name: 'Bordj Badji Mokhtar', ar: 'برج باجي مختار' },
  { code: 51, name: 'Ouled Djellal',    ar: 'أولاد جلال' },
  { code: 52, name: 'Béni Abbès',       ar: 'بني عباس' },
  { code: 53, name: 'In Salah',         ar: 'عين صالح' },
  { code: 54, name: 'In Guezzam',       ar: 'عين قزام' },
  { code: 55, name: 'Touggourt',        ar: 'تقرت' },
  { code: 56, name: 'Djanet',           ar: 'جانت' },
  { code: 57, name: "El M'Ghair",       ar: 'المغير' },
  { code: 58, name: 'El Menia',         ar: 'المنيعة' },
];

const DELIVERY_COMPANIES = ['Yalidine', 'Procolis', 'Maystro', 'Ecotrack'];

const PRODUCTS = [
  { id: 'p1', name: 'Smart Watch Pro',      price: 7500, cost: 2800 },
  { id: 'p2', name: 'Wireless Earbuds X1',  price: 3900, cost: 1400 },
  { id: 'p3', name: 'Skincare Set Glow',    price: 5200, cost: 1900 },
  { id: 'p4', name: 'Kids Night Projector', price: 2900, cost: 900  },
  { id: 'p5', name: 'LED Ring Light 10"',   price: 4500, cost: 1600 },
];

// Per-wilaya baseline performance used by the risk engine and sample data
// return_rate and confirmation_rate are realistic ballparks for COD
const WILAYA_BASELINE = (function () {
  const overrides = {
    16: { conf: 0.78, ret: 0.12, dsr: 0.93, days: 2 }, // Alger
    31: { conf: 0.74, ret: 0.15, dsr: 0.90, days: 2 }, // Oran
    25: { conf: 0.72, ret: 0.17, dsr: 0.88, days: 3 }, // Constantine
    19: { conf: 0.70, ret: 0.18, dsr: 0.87, days: 3 }, // Sétif
    15: { conf: 0.73, ret: 0.14, dsr: 0.90, days: 3 }, // Tizi Ouzou
    9:  { conf: 0.76, ret: 0.13, dsr: 0.92, days: 2 }, // Blida
    6:  { conf: 0.69, ret: 0.19, dsr: 0.85, days: 4 }, // Béjaïa
    5:  { conf: 0.66, ret: 0.22, dsr: 0.82, days: 4 }, // Batna
    23: { conf: 0.68, ret: 0.21, dsr: 0.84, days: 4 }, // Annaba
    30: { conf: 0.58, ret: 0.32, dsr: 0.70, days: 6 }, // Ouargla
    11: { conf: 0.50, ret: 0.38, dsr: 0.62, days: 9 }, // Tamanrasset
    37: { conf: 0.48, ret: 0.40, dsr: 0.60, days: 10 }, // Tindouf
    33: { conf: 0.46, ret: 0.42, dsr: 0.58, days: 11 }, // Illizi
    53: { conf: 0.47, ret: 0.40, dsr: 0.60, days: 10 }, // In Salah
    54: { conf: 0.44, ret: 0.44, dsr: 0.55, days: 12 }, // In Guezzam
    56: { conf: 0.46, ret: 0.42, dsr: 0.58, days: 11 }, // Djanet
  };
  const out = {};
  WILAYAS.forEach(w => {
    const base = overrides[w.code] || {
      conf: 0.65 + (w.code % 5) * 0.015,
      ret:  0.22 + (w.code % 7) * 0.012,
      dsr:  0.80 + (w.code % 6) * 0.012,
      days: 3 + (w.code % 4),
    };
    out[w.code] = base;
  });
  return out;
})();

// Per-company per-wilaya cost/performance. We derive from baseline with small deltas.
function buildDeliveryMatrix() {
  const rows = [];
  const companyProfile = {
    Yalidine: { priceMul: 1.00, retMul: 0.9, dsrAdd: 0.02, days: 0 },
    Procolis: { priceMul: 0.95, retMul: 1.05, dsrAdd: 0.00, days: 1 },
    Maystro:  { priceMul: 0.90, retMul: 1.10, dsrAdd: -0.01, days: 1 },
    Ecotrack: { priceMul: 1.05, retMul: 0.85, dsrAdd: 0.03, days: 0 },
  };
  WILAYAS.forEach(w => {
    const base = WILAYA_BASELINE[w.code];
    DELIVERY_COMPANIES.forEach(c => {
      const p = companyProfile[c];
      // Base price depends on how far the wilaya is from Algiers (higher code ≈ further south on avg)
      const basePrice = 500 + Math.min(900, Math.round((w.code / 58) * 900));
      rows.push({
        wilaya: w.code,
        company: c,
        deliveryCost: Math.round(basePrice * p.priceMul),
        returnCost: Math.round(basePrice * p.priceMul * 0.5),
        days: base.days + p.days,
        dsr: Math.max(0.3, Math.min(0.98, base.dsr + p.dsrAdd)),
        ret: Math.max(0.05, Math.min(0.6, base.ret * p.retMul)),
      });
    });
  });
  return rows;
}

const DELIVERY_MATRIX = buildDeliveryMatrix();

// Sample orders (fresh list used when localStorage is empty)
function buildSampleOrders() {
  const firstNames = ['Amine','Sarah','Yacine','Mehdi','Lina','Anis','Karim','Nour','Ilyas','Rania','Ayoub','Imane','Walid','Sofia','Bilal'];
  const lastNames = ['Benali','Cherif','Meziane','Saadi','Hamidi','Belkacem','Boudiaf','Zidane','Fellah','Laroui','Kaci','Brahimi'];
  const communes = ['Bab Ezzouar','Hussein Dey','Kouba','Bouzareah','El Biar','Sidi Moussa','Es Senia','Bir El Djir','Boumerdes Ville','Akbou'];
  const stages = ['new','to_confirm','confirmed','shipped','done','returned','cancelled'];
  const stageDist = { new: 12, to_confirm: 18, confirmed: 10, shipped: 8, done: 20, returned: 6, cancelled: 4 };
  const orders = [];
  let i = 1;
  const now = Date.now();
  stages.forEach(stage => {
    for (let k = 0; k < stageDist[stage]; k++) {
      const wilaya = WILAYAS[(i * 7) % WILAYAS.length];
      const product = PRODUCTS[i % PRODUCTS.length];
      const hoursAgo = stage === 'new' ? k + Math.random() * 6
        : stage === 'to_confirm' ? 6 + k * 3 + Math.random() * 20
        : stage === 'confirmed' ? 30 + k * 6
        : stage === 'shipped' ? 72 + k * 12
        : stage === 'done' ? 96 + k * 14
        : stage === 'returned' ? 120 + k * 10
        : 48 + k * 6;
      const fn = firstNames[(i * 3) % firstNames.length];
      const ln = lastNames[(i * 5) % lastNames.length];
      orders.push({
        id: 'ORD-' + String(1000 + i).padStart(5, '0'),
        client: `${fn} ${ln}`,
        phone: '05' + String(10000000 + Math.floor(Math.random() * 89999999)).slice(0, 8),
        wilaya: wilaya.code,
        commune: communes[i % communes.length],
        productId: product.id,
        product: product.name,
        price: product.price,
        status: stage,
        attempts: stage === 'new' ? 0 : stage === 'to_confirm' ? 1 + (k % 3) : 1 + (k % 2),
        notes: '',
        deliveryCompany: DELIVERY_COMPANIES[i % DELIVERY_COMPANIES.length],
        agent: ['Nadia','Sami','Feriel','Hakim'][i % 4],
        createdAt: new Date(now - hoursAgo * 3600 * 1000).toISOString(),
        updatedAt: new Date(now - Math.max(0, hoursAgo - 2) * 3600 * 1000).toISOString(),
        callLog: [],
      });
      i++;
    }
  });
  return orders;
}

const SAMPLE_ORDERS = buildSampleOrders();

const SAMPLE_AD_CAMPAIGNS = [
  { id: 'c1', platform: 'Facebook', name: 'Watch Pro — Broad',   spend: 42000, impressions: 380000, clicks: 5600, leads: 320, confirmed: 210, delivered: 168, revenue: 168 * 7500, productId: 'p1' },
  { id: 'c2', platform: 'Facebook', name: 'Watch Pro — Retarget',spend: 18000, impressions: 95000,  clicks: 2100, leads: 180, confirmed: 140, delivered: 118, revenue: 118 * 7500, productId: 'p1' },
  { id: 'c3', platform: 'TikTok',   name: 'Earbuds X1 — Viral',  spend: 35000, impressions: 520000, clicks: 7100, leads: 410, confirmed: 260, delivered: 190, revenue: 190 * 3900, productId: 'p2' },
  { id: 'c4', platform: 'TikTok',   name: 'Earbuds X1 — UGC',    spend: 22000, impressions: 260000, clicks: 3200, leads: 180, confirmed: 95,  delivered: 68,  revenue: 68 * 3900,  productId: 'p2' },
  { id: 'c5', platform: 'Facebook', name: 'Glow Set — Women 25+',spend: 50000, impressions: 410000, clicks: 4800, leads: 260, confirmed: 175, delivered: 130, revenue: 130 * 5200, productId: 'p3' },
  { id: 'c6', platform: 'TikTok',   name: 'Projector — Parents', spend: 15000, impressions: 210000, clicks: 2900, leads: 220, confirmed: 150, delivered: 118, revenue: 118 * 2900, productId: 'p4' },
  { id: 'c7', platform: 'Facebook', name: 'Ring Light — Creators',spend: 12000, impressions: 140000, clicks: 1600, leads: 90,  confirmed: 55,  delivered: 42,  revenue: 42 * 4500,  productId: 'p5' },
];

const SAMPLE_AGENTS = [
  { id: 'a1', name: 'Nadia',  calls: 420, confirmed: 260, upsell: 48, cancelled: 38, avgAttempts: 1.8 },
  { id: 'a2', name: 'Sami',   calls: 380, confirmed: 210, upsell: 32, cancelled: 52, avgAttempts: 2.1 },
  { id: 'a3', name: 'Feriel', calls: 510, confirmed: 345, upsell: 61, cancelled: 40, avgAttempts: 1.7 },
  { id: 'a4', name: 'Hakim',  calls: 290, confirmed: 135, upsell: 14, cancelled: 65, avgAttempts: 2.5 },
];

// 21 days of daily return tracker sample
function buildSampleReturns() {
  const out = [];
  const now = new Date();
  for (let d = 20; d >= 0; d--) {
    const date = new Date(now);
    date.setDate(now.getDate() - d);
    for (let p = 0; p < 3; p++) {
      const w = WILAYAS[(d * 5 + p * 7) % WILAYAS.length];
      const product = PRODUCTS[p % PRODUCTS.length];
      const base = WILAYA_BASELINE[w.code];
      const orders = 6 + ((d + p) % 8);
      const delivered = Math.max(0, Math.round(orders * (0.5 + base.dsr / 2 - Math.random() * 0.15)));
      const returned = Math.max(0, Math.round(orders * (base.ret + (Math.random() - 0.5) * 0.05)));
      const pending = Math.max(0, orders - delivered - returned);
      out.push({
        id: 'R-' + d + '-' + p,
        date: date.toISOString().slice(0, 10),
        wilaya: w.code,
        productId: product.id,
        orders, delivered, returned, pending,
        company: DELIVERY_COMPANIES[(d + p) % DELIVERY_COMPANIES.length],
      });
    }
  }
  return out;
}

const SAMPLE_RETURNS = buildSampleReturns();

window.AppData = {
  WILAYAS,
  DELIVERY_COMPANIES,
  PRODUCTS,
  WILAYA_BASELINE,
  DELIVERY_MATRIX,
  SAMPLE_ORDERS,
  SAMPLE_AD_CAMPAIGNS,
  SAMPLE_AGENTS,
  SAMPLE_RETURNS,
};

})();
