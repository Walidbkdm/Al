import type { DeliveryCompanyId, DeliveryCompanyQuote } from "./types";
import { WILAYAS } from "./wilayas";

export interface DeliveryCompany {
  id: DeliveryCompanyId;
  name: string;
  brandColor: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
}

export const DELIVERY_COMPANIES: DeliveryCompany[] = [
  {
    id: "yalidine",
    name: "Yalidine",
    brandColor: "#f0c000",
    description: "Largest nationwide network, strong in north and west regions.",
    strengths: ["National coverage", "Fast north delivery", "Reliable COD payout"],
    weaknesses: ["Return handling can be slow", "Higher price in the deep south"]
  },
  {
    id: "maystro",
    name: "Maystro Delivery",
    brandColor: "#1f7ae0",
    description: "Modern API-first platform popular with digital sellers.",
    strengths: ["API & dashboard", "Good urban performance", "Flexible pickup"],
    weaknesses: ["Weaker in rural south", "Occasional capacity issues"]
  },
  {
    id: "ecotrack",
    name: "Ecotrack",
    brandColor: "#10b981",
    description: "Strong performance in eastern Algeria and value pricing.",
    strengths: ["Best in east", "Competitive pricing", "Solid confirmation"],
    weaknesses: ["Smaller western network", "Payouts 1-2 days slower"]
  },
  {
    id: "procolis",
    name: "Procolis",
    brandColor: "#8b5cf6",
    description: "Good for fragile and high-ticket products with careful handling.",
    strengths: ["Fragile handling", "Insurance options", "Premium quality"],
    weaknesses: ["Higher price point", "Limited deep-south coverage"]
  }
];

// Deterministic pseudo-random generator for reproducible seed data
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 0xffffffff;
}

function regionalBias(region: string, companyId: DeliveryCompanyId): number {
  // Returns a bias in [0.8, 1.2] based on regional strengths
  const map: Record<DeliveryCompanyId, Record<string, number>> = {
    yalidine: { North: 1.05, Center: 1.05, West: 1.0, East: 0.95, Highlands: 0.95, South: 0.88 },
    maystro: { North: 1.02, Center: 1.08, West: 0.98, East: 0.95, Highlands: 0.9, South: 0.85 },
    ecotrack: { North: 0.98, Center: 0.95, West: 0.9, East: 1.12, Highlands: 1.02, South: 0.92 },
    procolis: { North: 1.0, Center: 1.02, West: 0.98, East: 0.98, Highlands: 0.95, South: 0.9 }
  };
  return map[companyId][region] ?? 1;
}

const BASE_PRICES_BY_REGION: Record<string, number> = {
  Center: 500,
  North: 600,
  East: 650,
  West: 650,
  Highlands: 800,
  South: 1100
};

const COMPANY_PRICE_MULTIPLIERS: Record<DeliveryCompanyId, number> = {
  yalidine: 1.0,
  maystro: 1.05,
  ecotrack: 0.95,
  procolis: 1.15
};

export function buildDeliveryQuotes(): DeliveryCompanyQuote[] {
  const quotes: DeliveryCompanyQuote[] = [];
  for (const wilaya of WILAYAS) {
    for (const company of DELIVERY_COMPANIES) {
      const seed = hash(`${company.id}-${wilaya.code}`);
      const bias = regionalBias(wilaya.region, company.id);
      const basePrice = BASE_PRICES_BY_REGION[wilaya.region] ?? 600;
      const priceMultiplier = COMPANY_PRICE_MULTIPLIERS[company.id];
      const price = Math.round((basePrice * priceMultiplier + seed * 120 - 60) / 10) * 10;

      const southPenalty = wilaya.region === "South" ? 2 : 0;
      const avgDeliveryDays = Math.max(
        1,
        Math.round((2.2 + (1 - bias) * 4 + southPenalty + seed * 1.5) * 10) / 10
      );
      const returnHandlingScore = Math.round(55 + bias * 25 + seed * 15);
      const codPayoutDays = Math.max(1, Math.round(3 + (1 - bias) * 3 + seed * 2));
      const successRatePct = Math.min(
        97,
        Math.max(55, Math.round(62 + bias * 25 + seed * 10))
      );

      quotes.push({
        companyId: company.id,
        wilayaCode: wilaya.code,
        deliveryPriceDZD: price,
        avgDeliveryDays,
        returnHandlingScore,
        codPayoutDays,
        successRatePct
      });
    }
  }
  return quotes;
}

export const DEFAULT_DELIVERY_QUOTES = buildDeliveryQuotes();

export function getCompany(id: DeliveryCompanyId): DeliveryCompany {
  return DELIVERY_COMPANIES.find((c) => c.id === id) ?? DELIVERY_COMPANIES[0];
}
