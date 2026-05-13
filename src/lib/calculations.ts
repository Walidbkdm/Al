import type {
  AdCampaign,
  AdMetrics,
  HealthFactors,
  HealthScore,
  OrderLog,
  ProfitInputs,
  ProfitResult
} from "./types";
import { average, clamp, safeDivide, sum } from "./utils";

// --- PROFIT CALCULATIONS ---
export function calculateProfit(inputs: ProfitInputs): ProfitResult {
  const {
    sellingPrice,
    sourcingCost,
    packagingCost,
    deliveryCost,
    returnShippingCost,
    adSpendPerOrder,
    confirmationRate,
    returnRate,
    fakeOrderRate,
    upsellRevenue,
    averageBasketValue,
    dailyOrders
  } = inputs;

  const basket = Math.max(sellingPrice, averageBasketValue || sellingPrice) + upsellRevenue;
  const costPerDelivered = sourcingCost + packagingCost + deliveryCost;
  const grossRevenuePerDeliveredOrder = basket;
  const netProfitPerDeliveredOrder = basket - costPerDelivered - adSpendPerOrder;

  // For every 100 leads:
  // - confirmed = confirmationRate
  // - of those confirmed, delivered = confirmed * (1 - returnRate)
  // - returned = confirmed * returnRate (adds return shipping cost)
  // - fakeOrders add waste cost proportional to fakeOrderRate (ads, confirmation effort)
  const confirmed = clamp(confirmationRate, 0, 100) / 100;
  const returned = clamp(returnRate, 0, 100) / 100;
  const fake = clamp(fakeOrderRate, 0, 100) / 100;
  const deliveredShare = confirmed * (1 - returned);

  const adSpendPerLead = adSpendPerOrder; // input is per lead/order in ad campaigns
  const fakeOrderWastePerLead = fake * adSpendPerLead * 0.5; // half of ad waste attributed to fake orders
  const returnShippingPerLead = confirmed * returned * returnShippingCost;

  const revenuePerLead = deliveredShare * basket;
  const costPerLead =
    deliveredShare * (sourcingCost + packagingCost + deliveryCost) +
    adSpendPerLead +
    returnShippingPerLead +
    fakeOrderWastePerLead;

  const realProfitPerLeadOrder = revenuePerLead - costPerLead;
  const profitMarginPct = safeDivide(realProfitPerLeadOrder, revenuePerLead, 0) * 100;

  const contributionPerDelivered = basket - costPerDelivered;
  const breakEvenRoas = safeDivide(basket, contributionPerDelivered, 0); // ratio on ad spend
  const maxAcceptableCpa = Math.max(0, contributionPerDelivered * deliveredShare);

  // Danger threshold: return rate at which real profit per lead becomes zero,
  // given current inputs. Solve deliveredShare = confirmed * (1 - r)
  // Then: confirmed*(1-r)*basket - confirmed*(1-r)*costPerDelivered - adSpend - confirmed*r*returnShip - fakeWaste = 0
  // Let A = confirmed*(basket - costPerDelivered)
  // Let B = confirmed*returnShippingCost
  // Equation: A*(1-r) - adSpend - B*r - fakeWaste = 0
  //        => A - A*r - B*r = adSpend + fakeWaste
  //        => A - r(A+B) = adSpend + fakeWaste
  //        => r = (A - adSpend - fakeWaste) / (A+B)
  const A = confirmed * (basket - costPerDelivered);
  const B = confirmed * returnShippingCost;
  const dangerR = safeDivide(A - adSpendPerLead - fakeOrderWastePerLead, A + B, 0);
  const returnRateDangerThreshold = clamp(dangerR * 100, 0, 100);

  const daily = realProfitPerLeadOrder * Math.max(0, dailyOrders);
  const projections = {
    daily,
    weekly: daily * 7,
    monthly: daily * 30
  };

  let status: ProfitResult["status"] = "healthy";
  if (realProfitPerLeadOrder < 0) status = "losing";
  else if (profitMarginPct < 12) status = "risky";

  return {
    grossRevenuePerDeliveredOrder,
    netProfitPerDeliveredOrder,
    realProfitPerLeadOrder,
    profitMarginPct,
    breakEvenRoas,
    maxAcceptableCpa,
    returnRateDangerThreshold,
    projections,
    status
  };
}

// --- AD METRICS ---
export function computeAdMetrics(campaign: AdCampaign): AdMetrics {
  const roas = safeDivide(campaign.revenue, campaign.spend);
  const cpa = safeDivide(campaign.spend, campaign.purchases);
  const cpp = safeDivide(campaign.spend, campaign.purchases);
  const convRatePct = safeDivide(campaign.purchases, campaign.clicks) * 100;
  const funnelDropPct =
    campaign.addToCarts === 0
      ? 0
      : (1 - safeDivide(campaign.purchases, campaign.addToCarts)) * 100;
  const revenueEfficiency = safeDivide(campaign.revenue - campaign.spend, campaign.spend) * 100;
  return { roas, cpa, cpp, convRatePct, funnelDropPct, revenueEfficiency };
}

export function aggregateAdsByPlatform(campaigns: AdCampaign[]) {
  const groups: Record<"meta" | "tiktok", AdCampaign[]> = { meta: [], tiktok: [] };
  for (const c of campaigns) groups[c.platform].push(c);
  const totalsFor = (arr: AdCampaign[]) => {
    const spend = sum(arr, (a) => a.spend);
    const revenue = sum(arr, (a) => a.revenue);
    const purchases = sum(arr, (a) => a.purchases);
    const clicks = sum(arr, (a) => a.clicks);
    const addToCarts = sum(arr, (a) => a.addToCarts);
    return {
      spend,
      revenue,
      purchases,
      clicks,
      addToCarts,
      roas: safeDivide(revenue, spend),
      cpa: safeDivide(spend, purchases),
      ctr: average(arr.map((c) => c.ctrPct)),
      cpm: average(arr.map((c) => c.cpm)),
      cpc: average(arr.map((c) => c.cpc)),
      convRatePct: safeDivide(purchases, clicks) * 100,
      count: arr.length
    };
  };
  return {
    meta: totalsFor(groups.meta),
    tiktok: totalsFor(groups.tiktok)
  };
}

// --- ORDER LOG AGGREGATIONS ---
export function wilayaReturnRates(logs: OrderLog[]) {
  const byWilaya = new Map<string, { total: number; returned: number; refused: number; delivered: number; confirmed: number }>();
  for (const log of logs) {
    const cur = byWilaya.get(log.wilayaCode) ?? {
      total: 0,
      returned: 0,
      refused: 0,
      delivered: 0,
      confirmed: 0
    };
    cur.total += log.count;
    if (log.status === "returned") cur.returned += log.count;
    if (log.status === "refused") cur.refused += log.count;
    if (log.status === "delivered") cur.delivered += log.count;
    if (log.status === "confirmed") cur.confirmed += log.count;
    byWilaya.set(log.wilayaCode, cur);
  }
  const out: { wilayaCode: string; returnRatePct: number; successRatePct: number; total: number }[] = [];
  byWilaya.forEach((v, k) => {
    const resolved = v.delivered + v.returned + v.refused;
    const returnRatePct =
      resolved === 0 ? 0 : ((v.returned + v.refused) / resolved) * 100;
    const successRatePct = resolved === 0 ? 0 : (v.delivered / resolved) * 100;
    out.push({ wilayaCode: k, returnRatePct, successRatePct, total: v.total });
  });
  return out.sort((a, b) => b.total - a.total);
}

export function companyPerformance(logs: OrderLog[]) {
  const byCompany = new Map<string, { delivered: number; returned: number; refused: number; total: number }>();
  for (const log of logs) {
    const cur = byCompany.get(log.company) ?? { delivered: 0, returned: 0, refused: 0, total: 0 };
    cur.total += log.count;
    if (log.status === "delivered") cur.delivered += log.count;
    if (log.status === "returned") cur.returned += log.count;
    if (log.status === "refused") cur.refused += log.count;
    byCompany.set(log.company, cur);
  }
  const out: { company: string; successRatePct: number; total: number }[] = [];
  byCompany.forEach((v, k) => {
    const resolved = v.delivered + v.returned + v.refused;
    const successRatePct = resolved === 0 ? 0 : (v.delivered / resolved) * 100;
    out.push({ company: k, successRatePct, total: v.total });
  });
  return out.sort((a, b) => b.successRatePct - a.successRatePct);
}

// --- HEALTH SCORE ---
export function computeHealthScore(params: {
  logs: OrderLog[];
  campaigns: AdCampaign[];
  profit: ProfitResult;
  inputs: ProfitInputs;
}): HealthScore {
  const { logs, campaigns, profit, inputs } = params;

  // Profitability: map margin 0%-40% to 0-100
  const profitability = clamp((profit.profitMarginPct / 40) * 100, 0, 100);

  // Return rate: compute global return rate, map 0%-50% -> 100-0
  const totalResolved = sum(logs, (l) =>
    l.status === "delivered" || l.status === "returned" || l.status === "refused" ? l.count : 0
  );
  const totalReturned = sum(logs, (l) =>
    l.status === "returned" || l.status === "refused" ? l.count : 0
  );
  const returnRatePct = totalResolved > 0 ? (totalReturned / totalResolved) * 100 : inputs.returnRate;
  const returnRateScore = clamp(100 - (returnRatePct / 50) * 100, 0, 100);

  // Ad efficiency: average ROAS mapped 0-5 -> 0-100
  const avgRoas = campaigns.length > 0
    ? average(campaigns.map((c) => safeDivide(c.revenue, c.spend)))
    : profit.breakEvenRoas > 0 ? Math.max(1, 1 / profit.breakEvenRoas) : 1;
  const adEfficiency = clamp((avgRoas / 5) * 100, 0, 100);

  // Delivery performance: avg successRate
  const cPerf = companyPerformance(logs);
  const deliveryPerformance = cPerf.length > 0 ? average(cPerf.map((c) => c.successRatePct)) : 70;

  // Confirmation rate: map 0-100
  const confirmationRate = clamp(inputs.confirmationRate, 0, 100);

  // Fake order ratio: lower is better; 0%-40% -> 100-0
  const fakeOrderRatio = clamp(100 - (inputs.fakeOrderRate / 40) * 100, 0, 100);

  const factors: HealthFactors = {
    profitability: Math.round(profitability),
    returnRate: Math.round(returnRateScore),
    adEfficiency: Math.round(adEfficiency),
    deliveryPerformance: Math.round(deliveryPerformance),
    confirmationRate: Math.round(confirmationRate),
    fakeOrderRatio: Math.round(fakeOrderRatio)
  };

  // Weighted score
  const score = Math.round(
    factors.profitability * 0.28 +
      factors.returnRate * 0.22 +
      factors.adEfficiency * 0.2 +
      factors.deliveryPerformance * 0.15 +
      factors.confirmationRate * 0.1 +
      factors.fakeOrderRatio * 0.05
  );

  let label: HealthScore["label"] = "Critical";
  let color: HealthScore["color"] = "destructive";
  if (score >= 80) {
    label = "Healthy";
    color = "success";
  } else if (score >= 60) {
    label = "Stable";
    color = "info";
  } else if (score >= 40) {
    label = "Warning";
    color = "warning";
  }

  const recommendations: string[] = [];
  if (factors.profitability < 50) {
    recommendations.push("Margin is thin. Increase AOV via upsells or reduce cost per delivered order.");
  }
  if (factors.returnRate < 55) {
    recommendations.push(`Global return rate (${returnRatePct.toFixed(1)}%) is high. Exclude wilayas above 35%.`);
  }
  if (factors.adEfficiency < 55) {
    recommendations.push(`Average ROAS (${avgRoas.toFixed(2)}x) is below target. Pause worst campaigns and reallocate.`);
  }
  if (factors.deliveryPerformance < 60) {
    recommendations.push("Delivery success is below target. Test a secondary carrier for at-risk regions.");
  }
  if (factors.confirmationRate < 55) {
    recommendations.push("Confirmation rate is low. Improve call-center scripts and speed.");
  }
  if (factors.fakeOrderRatio < 60) {
    recommendations.push("Fake order ratio too high. Add form validation and filter targeting.");
  }
  if (recommendations.length === 0) {
    recommendations.push("Operations look stable. Scale spend on your best-performing campaigns.");
  }

  return { score, label, color, factors, recommendations };
}
