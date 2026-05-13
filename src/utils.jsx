/* global window, React */
// Shared helpers: formatters, business calculations, localStorage hook.
// Attached to window.AppUtils.

(function () {

const { useState, useEffect } = React;

const STORAGE_PREFIX = 'aecc:v1:';

function loadLS(key, fallback) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}
function saveLS(key, value) {
  try { localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value)); } catch (e) {}
}

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => loadLS(key, initialValue));
  useEffect(() => { saveLS(key, value); }, [key, value]);
  return [value, setValue];
}

const fmtDA = (n) => {
  if (n == null || isNaN(n)) return '—';
  return new Intl.NumberFormat('fr-DZ').format(Math.round(n)) + ' DA';
};
const fmtNum = (n) => {
  if (n == null || isNaN(n)) return '—';
  return new Intl.NumberFormat('fr-DZ').format(Math.round(n));
};
const fmtPct = (n, digits = 1) => {
  if (n == null || isNaN(n)) return '—';
  return (n * 100).toFixed(digits) + '%';
};
const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};
const hoursSince = (iso) => {
  if (!iso) return 0;
  return (Date.now() - new Date(iso).getTime()) / 3600000;
};

function wilayaById(code) {
  const list = window.AppData.WILAYAS;
  return list.find(w => w.code === Number(code));
}

// ---------- Profit engine ----------
// Inputs can come either from the calculator form or aggregated from other data.
function computeProfit(input) {
  const {
    price = 0,
    cost = 0,
    adSpend = 0,
    deliveryCost = 0,
    packagingCost = 0,
    confirmationCost = 0,
    returnRate = 0,         // 0..1
    deliveryCompanyFee = 0, // absolute DA
    upsell = 0,
  } = input;

  const revenuePerOrder = price + upsell;
  const variableCostsConfirmed = cost + adSpend + deliveryCost + packagingCost + confirmationCost + deliveryCompanyFee;

  // A "confirmed" order that later gets returned still costs: delivery leg + return leg + packaging + ad + confirmation + COGS (most sellers lose product too / damages).
  // We approximate a returned-order loss as: adSpend + confirmationCost + deliveryCost + deliveryCompanyFee + packagingCost * 0.5 + cost * 0.2 (damaged / lost goods rate).
  const lossPerReturnedOrder = adSpend + confirmationCost + deliveryCost + deliveryCompanyFee + packagingCost * 0.5 + cost * 0.2;

  const grossPerOrder = revenuePerOrder - cost; // simple gross margin on goods
  const netPerConfirmedOrder = revenuePerOrder - variableCostsConfirmed; // if it delivers successfully
  // Expected net over a cohort of 100 confirmed orders, with returnRate returns:
  const expectedNet = netPerConfirmedOrder * (1 - returnRate) - lossPerReturnedOrder * returnRate;

  const marginPct = revenuePerOrder > 0 ? expectedNet / revenuePerOrder : 0;

  // Break-even return rate: expectedNet = 0
  // netPerConfirmed*(1 - r) - loss*r = 0  =>  r = netPerConfirmed / (netPerConfirmed + loss)
  let breakEvenReturnRate = null;
  const denom = netPerConfirmedOrder + lossPerReturnedOrder;
  if (denom > 0 && netPerConfirmedOrder > 0) {
    breakEvenReturnRate = netPerConfirmedOrder / denom;
  }

  // Sensitivity: extra profit if return rate drops by 1% / 5% / 10%
  const scenario = (delta) => {
    const r = Math.max(0, returnRate - delta);
    return netPerConfirmedOrder * (1 - r) - lossPerReturnedOrder * r - expectedNet;
  };

  return {
    revenuePerOrder,
    grossPerOrder,
    netPerConfirmedOrder,
    expectedNet,
    marginPct,
    breakEvenReturnRate,
    lossPerReturnedOrder,
    sensitivity: {
      drop1: scenario(0.01),
      drop5: scenario(0.05),
      drop10: scenario(0.10),
    },
    losingMoney: expectedNet < 0,
  };
}

// ---------- Ad recommendation ----------
function recommendAd(camp, marginPerDelivered) {
  const delivered = camp.delivered || 0;
  const spend = camp.spend || 0;
  const revenue = camp.revenue || 0;
  const roas = spend > 0 ? revenue / spend : 0;
  const cpa = camp.confirmed > 0 ? spend / camp.confirmed : Infinity;
  const confirmRate = camp.leads > 0 ? camp.confirmed / camp.leads : 0;
  const deliveryRate = camp.confirmed > 0 ? camp.delivered / camp.confirmed : 0;

  // Profit after ad spend (approx): delivered * marginPerDelivered - spend
  const netProfit = delivered * marginPerDelivered - spend;

  let action = 'Test';
  let reason = 'Gather more data before scaling.';
  if (delivered >= 50 && netProfit > 0 && roas > 1.8) {
    action = 'Scale';
    reason = 'Profitable with enough volume. Scale cautiously by 20–30% per day.';
  } else if (confirmRate < 0.45 && camp.leads >= 80) {
    action = 'Fix confirmation';
    reason = 'Leads are arriving but not converting on the phone. Improve script and speed to call.';
  } else if (netProfit < -5000 && spend > 10000) {
    action = 'Pause';
    reason = 'Losing money at current performance. Pause and review creative/audience.';
  } else if (deliveryRate < 0.6 && camp.confirmed >= 40) {
    action = 'Fix delivery';
    reason = 'High drop-off between confirmed and delivered. Review wilaya mix and courier.';
  }

  return { roas, cpa, confirmRate, deliveryRate, netProfit, action, reason };
}

// ---------- Wilaya risk ----------
function computeWilayaRisk(code, overrides) {
  const base = window.AppData.WILAYA_BASELINE[code];
  const b = Object.assign({}, base, overrides || {});
  // Score 0..100 (higher = safer)
  const confirmScore = b.conf * 100;              // conf 0.4-0.8 -> 40-80
  const returnScore = (1 - b.ret) * 100;          // ret 0.10-0.45 -> 55-90
  const dsrScore = b.dsr * 100;                   // dsr 0.55-0.95
  const speedScore = Math.max(0, 100 - b.days * 8); // days 2-12 -> 84-4
  const safetyScore = 0.30 * confirmScore + 0.35 * returnScore + 0.25 * dsrScore + 0.10 * speedScore;
  let level = 'green';
  if (safetyScore < 55) level = 'red';
  else if (safetyScore < 70) level = 'yellow';
  return { score: Math.round(safetyScore), level, ...b };
}

// ---------- Business health score ----------
function computeHealth(metrics) {
  const { marginPct = 0, returnRate = 0, confirmRate = 0, roas = 0, dsr = 0, pendingShare = 0 } = metrics;
  // Subscores 0..100
  const s1 = Math.min(100, Math.max(0, marginPct * 400));             // 25% margin -> 100
  const s2 = Math.min(100, Math.max(0, (1 - returnRate) * 130 - 30)); // 0%->100, 40%->22, 60%->-8
  const s3 = Math.min(100, Math.max(0, confirmRate * 125));           // 80% -> 100
  const s4 = Math.min(100, Math.max(0, (roas - 1) * 40));             // ROAS 3.5 -> 100
  const s5 = Math.min(100, Math.max(0, dsr * 115 - 15));              // 85% -> 82, 95% -> 94
  const s6 = Math.min(100, Math.max(0, 100 - pendingShare * 200));    // 10% pending -> 80
  const score = Math.round(s1 * 0.22 + s2 * 0.22 + s3 * 0.18 + s4 * 0.15 + s5 * 0.13 + s6 * 0.10);
  let status, color;
  if (score >= 80) { status = 'Healthy'; color = 'emerald'; }
  else if (score >= 60) { status = 'Needs attention'; color = 'amber'; }
  else if (score >= 40) { status = 'At risk'; color = 'orange'; }
  else { status = 'Bleeding money'; color = 'rose'; }

  // Diagnosis: pick weakest sub-score
  const parts = [
    { k: 'margin', label: 'Profit margin',       v: s1 },
    { k: 'ret',    label: 'Return rate',         v: s2 },
    { k: 'conf',   label: 'Confirmation rate',   v: s3 },
    { k: 'roas',   label: 'ROAS',                v: s4 },
    { k: 'dsr',    label: 'Delivery success',    v: s5 },
    { k: 'pend',   label: 'Pending volume',      v: s6 },
  ].sort((a, b) => a.v - b.v);

  const recommendations = [];
  const weakest = parts[0];
  if (weakest.k === 'ret') recommendations.push('Pause shipping to high-return wilayas and require double confirmation in red zones.');
  if (weakest.k === 'conf') recommendations.push('Tighten the call script and respond to new orders within 2 hours to protect confirmation rate.');
  if (weakest.k === 'margin') recommendations.push('Reprice or trim delivery/packaging cost — the margin is too thin to absorb returns.');
  if (weakest.k === 'roas') recommendations.push('Pause the worst-ROAS campaigns and reallocate spend to those with a delivered ROAS above 2.');
  if (weakest.k === 'dsr') recommendations.push('Switch delivery company in the wilayas where the current courier has the lowest success rate.');
  if (weakest.k === 'pend') recommendations.push('Clear the pending pile with follow-up calls today — older than 24h orders rarely confirm.');
  // Always add 2 standard recs to total 3
  if (recommendations.length < 3) recommendations.push('Review yesterday’s returns — identify 1 wilaya and 1 product to protect this week.');
  if (recommendations.length < 3) recommendations.push('Coach the lowest-performing agent on objection handling and price framing.');

  return {
    score, status, color,
    diagnosis: `${weakest.label} is the weakest area and is pulling the score down.`,
    recommendations,
    subscores: parts,
  };
}

// ---------- Delivery comparator ----------
function trueCostPerConfirmed(row) {
  // A confirmed order with returnRate r: you pay delivery once, plus on returns pay returnCost + packaging hit. We use the row's deliveryCost + returnCost*r as a proxy (excluding product cost — see profit engine).
  return row.deliveryCost + row.returnCost * row.ret;
}

// ---------- Call-script / WhatsApp generators (Algerian Darija) ----------
function buildCallScript({ scenario, client, product, price, wilaya, days = 3 }) {
  const w = wilaya ? wilayaById(wilaya) : null;
  const wName = w ? `${w.name}` : 'ولايتك';
  const p = price ? `${price} دج` : 'السعر المتّفق عليه';
  const name = client || 'الكليان';
  const prod = product || 'المنتوج';

  const greeting = `السلام عليكم، نحضر السيد/السيدة ${name} ؟`;
  const intro = `معاك فلان من خدمة الطلبيات، راني نعيط بخصوص الطلبية تاعك على ${prod}.`;
  const confirmLine = `نحب نأكد معاك السعر ${p}، والعنوان في ${wName}.`;
  const timing = `إن شاء الله الطلبية توصلك في ${days} ${days <= 2 ? 'يوم' : 'أيام'}، وتقدر تخلص عند التسليم.`;
  const ctaClose = `واش نأكدو الطلبية كيما هي ؟`;
  const end = `شكرا على ثقتك، مرحبا بيك دايماً. سلام.`;

  const scripts = {
    first: [
      greeting,
      intro,
      confirmLine,
      timing,
      ctaClose,
      end,
    ],
    second: [
      `السلام عليكم ${name}، عاودنا ليك بخصوص الطلبية تاع ${prod}.`,
      `حبينا نتأكدو بلي بقيت راغب/ة فيها، السعر ${p} و التوصيل ل${wName}.`,
      `إذا كلش خير نأكدو الطلبية دابا و نرسلوها ليك.`,
      end,
    ],
    angry: [
      `السلام عليكم ${name}، سامحنا على الإزعاج.`,
      `فهمت بلي فاتك الوقت، نحبو نسهلوها عليك. واش نحافظو على نفس السعر ${p} ونديرو التوصيل ف وقت يناسبك ؟`,
      `رأيك معانا مهم، غير قولنا آش اللي يعجبك ونديرو بيه.`,
      end,
    ],
    wrong_number: [
      `السلام عليكم، سامحنا على الإزعاج، يظهر الرقم ماشي تاع صاحب الطلبية.`,
      `واش ممكن تفيدنا برقم آخر تاع ${name} باش نأكدو معاه ${prod} ؟`,
      `بركة الله فيك، سلام.`,
    ],
    expensive: [
      `نفهم ${name}، السعر مهم، بصح ${prod} يجي معاه ضمان وتوصيل ل${wName}.`,
      `نقدر نعرض عليك عرض خاص اليوم ب${price ? (price - 300) + ' دج' : 'سعر تخفيض'} في حالة أكدت دابا.`,
      `واش نأكدو بهذا العرض ؟`,
      end,
    ],
    not_interested: [
      `ماشي مشكل ${name}، شكراً على وقتك.`,
      `حبيت فقط نستفسر: واش كاين حاجة ما عجبتكش في ${prod} ولا كاين منتوج آخر تحب تشوفو ؟`,
      `معلوماتك تعاوننا نحسنو الخدمة. سلام.`,
    ],
    delay: [
      `ماشي مشكل ${name}، نأجلوها ليك.`,
      `نديرو التوصيل بعد ${days + 2} أيام ل${wName}، السعر يبقى ${p}.`,
      `واش هذا الوقت يناسبك ؟ نأكدو عليه ؟`,
      end,
    ],
    upsell: [
      `بما أنك أكدت ${prod}، عندنا عرض يلائمك: قطعة إضافية بـ -15% غير اليوم.`,
      `تزيد واحدة ل${name} أو كادو لواحد قريب ?`,
      `نكمل نأكد الطلبية بالعرض ؟`,
    ],
  };

  return (scripts[scenario] || scripts.first).join('\n');
}

function buildWhatsAppMessage({ template, client, product, price, wilaya, days = 3 }) {
  const w = wilaya ? wilayaById(wilaya) : null;
  const wName = w ? w.name : 'ولايتك';
  const p = price ? `${price} دج` : '';
  const name = client || 'العميل';
  const prod = product || 'المنتوج';
  const map = {
    first_confirm:
      `السلام عليكم ${name} 👋\nشكراً على طلبك لـ ${prod}.\nالسعر: ${p}\nالتوصيل إلى ${wName} في ${days} أيام، الدفع عند الاستلام.\nواش نأكدو الطلبية ؟ 📦`,
    no_answer:
      `السلام عليكم ${name}، عيّطنا عليك عدة مرات بخصوص طلبية ${prod} (${p}) إلى ${wName}.\nواش نقدرو نأكدوها اليوم باش نرسلوها ؟`,
    final_warning:
      `${name}، هذه آخر محاولة للتأكيد على طلبية ${prod} إلى ${wName} بسعر ${p}.\nإذا ما تلقيناش رد اليوم راح نلغوها.\nردّ "أكد" باش نكمّلو 🙏`,
    delivery_reminder:
      `مرحبا ${name} 🚚\nطلبيتك ${prod} راهي في الطريق إلى ${wName}.\nحضّر ${p} للتسليم، وشكراً على ثقتك.`,
    upsell:
      `${name}، بمناسبة تأكيد ${prod} عندنا عرض: قطعة ثانية بخصم 15٪ غير اليوم.\nتحب نزيدوها معاك ؟ 🎁`,
    delay_apology:
      `${name}، نعتذر على التأخير في طلبية ${prod} إلى ${wName}.\nراح توصل قريب إن شاء الله، وشكراً على صبرك 🙏`,
    confirmed:
      `${name}، تم تأكيد طلبيتك لـ ${prod} إلى ${wName}.\nالسعر: ${p}. راح نعلموك بكل تحديث ✅`,
  };
  return map[template] || map.first_confirm;
}

window.AppUtils = {
  useLocalStorage, STORAGE_PREFIX, loadLS, saveLS,
  fmtDA, fmtNum, fmtPct, fmtDate, hoursSince,
  wilayaById,
  computeProfit, recommendAd, computeWilayaRisk, computeHealth,
  trueCostPerConfirmed,
  buildCallScript, buildWhatsAppMessage,
};

})();
