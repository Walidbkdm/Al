export type Lang = "fr" | "ar" | "en";

export type DeliveryCompanyId = "yalidine" | "maystro" | "ecotrack" | "procolis";

export interface Wilaya {
  code: string; // "01" ... "58"
  nameFr: string;
  nameAr: string;
  region: "North" | "Center" | "East" | "West" | "South" | "Highlands";
}

export interface ProfitInputs {
  sellingPrice: number;
  sourcingCost: number;
  packagingCost: number;
  deliveryCost: number;
  returnShippingCost: number;
  adSpendPerOrder: number;
  confirmationRate: number; // percent 0-100
  returnRate: number; // percent 0-100
  fakeOrderRate: number; // percent 0-100
  upsellRevenue: number;
  averageBasketValue: number;
  dailyOrders: number;
}

export interface ProfitResult {
  grossRevenuePerDeliveredOrder: number;
  netProfitPerDeliveredOrder: number;
  realProfitPerLeadOrder: number;
  profitMarginPct: number;
  breakEvenRoas: number;
  maxAcceptableCpa: number;
  returnRateDangerThreshold: number;
  projections: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  status: "healthy" | "risky" | "losing";
}

export type OrderStatus = "pending" | "confirmed" | "delivered" | "returned" | "refused" | "unreachable";

export interface OrderLog {
  id: string;
  date: string; // ISO YYYY-MM-DD
  wilayaCode: string;
  company: DeliveryCompanyId;
  product: string;
  status: OrderStatus;
  count: number;
  revenue?: number;
  cost?: number;
}

export interface AdCampaign {
  id: string;
  date: string;
  platform: "meta" | "tiktok";
  name: string;
  spend: number;
  cpm: number;
  cpc: number;
  ctrPct: number;
  clicks: number;
  addToCarts: number;
  purchases: number;
  revenue: number;
}

export interface AdMetrics {
  roas: number;
  cpa: number;
  cpp: number;
  convRatePct: number;
  funnelDropPct: number;
  revenueEfficiency: number;
}

export interface DeliveryCompanyQuote {
  companyId: DeliveryCompanyId;
  wilayaCode: string;
  deliveryPriceDZD: number;
  avgDeliveryDays: number;
  returnHandlingScore: number; // 0-100
  codPayoutDays: number;
  successRatePct: number; // 0-100
}

export interface HealthFactors {
  profitability: number;
  returnRate: number;
  adEfficiency: number;
  deliveryPerformance: number;
  confirmationRate: number;
  fakeOrderRatio: number;
}

export interface HealthScore {
  score: number;
  label: "Healthy" | "Stable" | "Warning" | "Critical";
  color: "success" | "info" | "warning" | "destructive";
  factors: HealthFactors;
  recommendations: string[];
}

export interface AppSettings {
  lang: Lang;
  currency: string;
  primaryProduct?: string;
}
