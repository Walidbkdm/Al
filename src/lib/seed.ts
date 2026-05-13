import type { AdCampaign, OrderLog, ProfitInputs } from "./types";
import { DELIVERY_COMPANIES } from "./delivery-companies";
import { WILAYAS } from "./wilayas";
import { daysAgoISO, uid } from "./utils";

export const DEFAULT_PROFIT_INPUTS: ProfitInputs = {
  sellingPrice: 4500,
  sourcingCost: 1200,
  packagingCost: 120,
  deliveryCost: 600,
  returnShippingCost: 450,
  adSpendPerOrder: 800,
  confirmationRate: 62,
  returnRate: 18,
  fakeOrderRate: 8,
  upsellRevenue: 300,
  averageBasketValue: 4800,
  dailyOrders: 35
};

// Deterministic pseudo-random helpers
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(123456);

const PRODUCTS = ["Montre Luxe", "Sac Premium", "Crème Beauté", "Chaussures Sport"];
const STATUSES: OrderLog["status"][] = [
  "pending",
  "confirmed",
  "delivered",
  "returned",
  "refused",
  "unreachable"
];

export function buildSeedOrderLogs(): OrderLog[] {
  const logs: OrderLog[] = [];
  const topWilayas = WILAYAS.slice(0, 28); // more realistic ops spread
  for (let d = 0; d < 21; d++) {
    const date = daysAgoISO(d);
    for (const w of topWilayas) {
      const company = DELIVERY_COMPANIES[Math.floor(rand() * DELIVERY_COMPANIES.length)].id;
      const product = PRODUCTS[Math.floor(rand() * PRODUCTS.length)];
      const base = 2 + Math.floor(rand() * 10);
      // Skew success rate: center/west higher, south lower
      const regionBias = w.region === "South" ? 0.55 : w.region === "Highlands" ? 0.7 : 0.85;
      const deliveredCount = Math.max(1, Math.round(base * regionBias));
      const returnedCount = Math.max(0, Math.round(base * (1 - regionBias) * 0.6));
      const refusedCount = Math.max(0, Math.round(base * (1 - regionBias) * 0.3));
      const confirmedCount = Math.max(0, Math.round(base * 0.15));
      const pendingCount = Math.max(0, Math.round(base * 0.1));
      const unreachableCount = Math.max(0, Math.round(base * (1 - regionBias) * 0.1));

      const additions: { status: OrderLog["status"]; count: number }[] = [
        { status: "delivered", count: deliveredCount },
        { status: "returned", count: returnedCount },
        { status: "refused", count: refusedCount },
        { status: "confirmed", count: confirmedCount },
        { status: "pending", count: pendingCount },
        { status: "unreachable", count: unreachableCount }
      ];

      for (const a of additions) {
        if (a.count <= 0) continue;
        logs.push({
          id: uid("log"),
          date,
          wilayaCode: w.code,
          company,
          product,
          status: a.status,
          count: a.count,
          revenue: a.status === "delivered" ? a.count * 4800 : 0,
          cost: a.count * 1800
        });
      }
    }
  }
  return logs;
}

export function buildSeedCampaigns(): AdCampaign[] {
  const campaigns: AdCampaign[] = [];
  const campaignNames = {
    meta: ["Meta / Watch - Broad", "Meta / Luxury Bag - Lookalike", "Meta / Retargeting"],
    tiktok: ["TikTok / UGC v3", "TikTok / Cream - 18-35", "TikTok / Sneakers Broad"]
  } as const;
  for (let d = 0; d < 10; d++) {
    const date = daysAgoISO(d);
    for (const platform of ["meta", "tiktok"] as const) {
      for (const name of campaignNames[platform]) {
        const spend = Math.round(3000 + rand() * 12000);
        const cpm = platform === "meta" ? 450 + rand() * 200 : 300 + rand() * 150;
        const impressions = (spend / cpm) * 1000;
        const ctrPct = platform === "meta" ? 1.6 + rand() * 1.4 : 2.0 + rand() * 1.6;
        const clicks = Math.max(1, Math.round((impressions * ctrPct) / 100));
        const cpc = spend / clicks;
        const addToCarts = Math.max(1, Math.round(clicks * (0.08 + rand() * 0.06)));
        const convBase = platform === "meta" ? 0.22 : 0.16;
        const purchases = Math.max(1, Math.round(addToCarts * (convBase + rand() * 0.1)));
        const aov = 4500 + rand() * 1500;
        const revenue = Math.round(purchases * aov);
        campaigns.push({
          id: uid("camp"),
          date,
          platform,
          name,
          spend,
          cpm: Math.round(cpm),
          cpc: Math.round(cpc),
          ctrPct: Math.round(ctrPct * 10) / 10,
          clicks,
          addToCarts,
          purchases,
          revenue
        });
      }
    }
  }
  return campaigns;
}
