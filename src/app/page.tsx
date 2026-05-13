"use client";

import * as React from "react";
import Link from "next/link";
import {
  Banknote,
  HeartPulse,
  Map as MapIcon,
  Megaphone,
  PackageCheck,
  ReceiptText,
  Truck,
  TrendingUp,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/common/page-header";
import { KpiCard } from "@/components/common/kpi-card";
import { ChartContainer } from "@/components/charts/chart-container";
import { TrendArea, TrendLine } from "@/components/charts/trend-chart";
import { CategoricalBar } from "@/components/charts/bar-chart";
import { HealthGauge } from "@/components/health/health-gauge";
import { StatusPill } from "@/components/common/status-pill";
import { InsightCard } from "@/components/common/insight-card";
import { Button } from "@/components/ui/button";
import { useData } from "@/components/providers/data-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import {
  aggregateAdsByPlatform,
  calculateProfit,
  companyPerformance,
  computeHealthScore,
  wilayaReturnRates
} from "@/lib/calculations";
import { wilayaName } from "@/lib/wilayas";
import { formatCurrency, formatPercent, formatNumber, sum } from "@/lib/utils";
import { CardSkeleton, Skeleton } from "@/components/common/loading";

export default function DashboardPage() {
  const { profitInputs, orderLogs, campaigns, hydrated } = useData();
  const { t, lang } = useI18n();

  const profit = React.useMemo(() => calculateProfit(profitInputs), [profitInputs]);
  const adAgg = React.useMemo(() => aggregateAdsByPlatform(campaigns), [campaigns]);
  const health = React.useMemo(
    () => computeHealthScore({ logs: orderLogs, campaigns, profit, inputs: profitInputs }),
    [orderLogs, campaigns, profit, profitInputs]
  );

  // Revenue / spend trend by date (last 10 days)
  const trendByDate = React.useMemo(() => {
    const map = new Map<string, { date: string; spend: number; revenue: number; purchases: number }>();
    for (const c of campaigns) {
      const cur = map.get(c.date) ?? { date: c.date, spend: 0, revenue: 0, purchases: 0 };
      cur.spend += c.spend;
      cur.revenue += c.revenue;
      cur.purchases += c.purchases;
      map.set(c.date, cur);
    }
    return Array.from(map.values()).sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [campaigns]);

  const topWilayas = React.useMemo(() => {
    const rates = wilayaReturnRates(orderLogs);
    return rates
      .filter((r) => r.total >= 5)
      .sort((a, b) => b.returnRatePct - a.returnRatePct)
      .slice(0, 8)
      .map((r) => ({
        name: wilayaName(r.wilayaCode, lang === "en" ? "fr" : lang),
        returnRate: Number(r.returnRatePct.toFixed(1)),
        total: r.total
      }));
  }, [orderLogs, lang]);

  const companies = React.useMemo(() => companyPerformance(orderLogs), [orderLogs]);

  const totalRevenue = sum(campaigns, (c) => c.revenue);
  const totalSpend = sum(campaigns, (c) => c.spend);
  const totalPurchases = sum(campaigns, (c) => c.purchases);
  const roas = totalSpend === 0 ? 0 : totalRevenue / totalSpend;
  const totalDelivered = sum(
    orderLogs.filter((l) => l.status === "delivered"),
    (l) => l.count
  );
  const totalResolved = sum(
    orderLogs.filter(
      (l) => l.status === "delivered" || l.status === "returned" || l.status === "refused"
    ),
    (l) => l.count
  );
  const returnedRate =
    totalResolved > 0
      ? (sum(
          orderLogs.filter((l) => l.status === "returned" || l.status === "refused"),
          (l) => l.count
        ) /
          totalResolved) *
        100
      : 0;
  const successRate = totalResolved > 0 ? (totalDelivered / totalResolved) * 100 : 0;

  const toneForStatus = (): "success" | "info" | "warning" | "destructive" => {
    if (profit.status === "healthy") return "success";
    if (profit.status === "risky") return "warning";
    return "destructive";
  };

  if (!hydrated) {
    return (
      <>
        <Skeleton className="mb-6 h-12 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          <>
            <Sparkles className="h-3.5 w-3.5" /> {t("app.title")}
          </>
        }
        title={
          <span>
            Good to go. <span className="shimmer-text">Your ops, in one page.</span>
          </span>
        }
        subtitle={t("app.tagline")}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/profit">
                {t("nav.profit")} <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild>
              <Link href="/health">
                {t("nav.health")} <HeartPulse className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </>
        }
      />

      {/* KPI ROW */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Real profit / order"
          icon={Banknote}
          tone={toneForStatus()}
          value={formatCurrency(profit.realProfitPerLeadOrder)}
          sublabel={<>Margin {formatPercent(profit.profitMarginPct)}</>}
          trend={{ value: profit.profitMarginPct - 15 }}
        />
        <KpiCard
          label="Delivery success"
          icon={PackageCheck}
          tone={successRate >= 75 ? "success" : successRate >= 60 ? "warning" : "destructive"}
          value={formatPercent(successRate)}
          sublabel={<>{formatNumber(totalDelivered)} delivered (21d)</>}
          trend={{ value: successRate - 70 }}
        />
        <KpiCard
          label="Global ROAS"
          icon={Megaphone}
          tone={roas >= 2 ? "success" : roas >= 1.5 ? "warning" : "destructive"}
          value={`${roas.toFixed(2)}x`}
          sublabel={
            <>
              Spend {formatCurrency(totalSpend)} • Rev {formatCurrency(totalRevenue)}
            </>
          }
          trend={{ value: (roas - 2) * 10, suffix: "pt" }}
        />
        <KpiCard
          label="Return rate"
          icon={ReceiptText}
          tone={returnedRate <= 15 ? "success" : returnedRate <= 28 ? "warning" : "destructive"}
          value={formatPercent(returnedRate)}
          sublabel={<>{formatNumber(totalResolved)} resolved orders</>}
          trend={{ value: -(returnedRate - 20) }}
        />
      </div>

      {/* TREND + HEALTH */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartContainer
          className="lg:col-span-2"
          title="Ad spend vs revenue"
          description="Last 10 days across Meta and TikTok"
        >
          <TrendLine
            data={trendByDate}
            xKey="date"
            series={[
              { key: "spend", color: "hsl(var(--destructive))", label: "Spend" },
              { key: "revenue", color: "hsl(var(--success))", label: "Revenue" }
            ]}
            height={260}
          />
        </ChartContainer>

        <ChartContainer
          title="Business health"
          description={health.label}
          action={<StatusPill status={health.color === "info" ? "info" : health.color === "success" ? "healthy" : health.color === "warning" ? "warning" : "critical"} label={health.label} />}
        >
          <div className="flex flex-col items-center gap-4 py-2">
            <HealthGauge score={health.score} tone={health.color} label={`${health.label}`} />
            <div className="w-full space-y-2">
              {health.recommendations.slice(0, 2).map((r, i) => (
                <InsightCard key={i} tone={i === 0 ? "warning" : "neutral"} title={`Recommendation ${i + 1}`}>
                  {r}
                </InsightCard>
              ))}
            </div>
          </div>
        </ChartContainer>
      </div>

      {/* MIDDLE ROW */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartContainer
          className="lg:col-span-2"
          title="Top wilayas by return rate"
          description="Zones with the biggest operational risk"
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/returns">
                <MapIcon className="h-4 w-4" /> Heatmap
              </Link>
            </Button>
          }
        >
          <CategoricalBar
            data={topWilayas}
            xKey="name"
            yKey="returnRate"
            height={260}
            colorFn={(v) =>
              v > 35 ? "hsl(var(--destructive))" : v > 20 ? "hsl(var(--warning))" : "hsl(var(--success))"
            }
          />
        </ChartContainer>

        <ChartContainer title="Delivery carriers" description="Success rate across all wilayas">
          <div className="space-y-3 p-2">
            {companies.map((c) => (
              <div
                key={c.company}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 p-3"
              >
                <div>
                  <div className="text-sm font-medium capitalize">{c.company}</div>
                  <div className="text-xs text-muted-foreground">{formatNumber(c.total)} orders</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-28 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, c.successRatePct)}%` }}
                      transition={{ duration: 0.9, ease: "easeOut" }}
                    />
                  </div>
                  <div className="numeric w-14 text-right text-sm font-semibold">
                    {c.successRatePct.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
            <Button asChild className="w-full" variant="outline">
              <Link href="/delivery">
                <Truck className="h-4 w-4" /> Compare carriers
              </Link>
            </Button>
          </div>
        </ChartContainer>
      </div>

      {/* BOTTOM ROW */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartContainer
          className="lg:col-span-2"
          title="Meta vs TikTok"
          description="Net efficiency by platform"
        >
          <div className="grid gap-3 p-2 sm:grid-cols-2">
            {(["meta", "tiktok"] as const).map((p) => {
              const agg = adAgg[p];
              const tone =
                agg.roas >= 2 ? "success" : agg.roas >= 1.5 ? "warning" : "destructive";
              return (
                <motion.div
                  key={p}
                  whileHover={{ y: -2 }}
                  className="rounded-xl border border-border/60 bg-background/60 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
                        style={{ background: p === "meta" ? "#1877f2" : "#000" }}
                      >
                        {p === "meta" ? "M" : "T"}
                      </div>
                      <div>
                        <div className="text-sm font-semibold capitalize">{p}</div>
                        <div className="text-xs text-muted-foreground">{agg.count} campaigns</div>
                      </div>
                    </div>
                    <StatusPill
                      status={tone === "success" ? "healthy" : tone === "warning" ? "warning" : "critical"}
                      label={`${agg.roas.toFixed(2)}x ROAS`}
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-lg bg-muted/60 p-2">
                      <div className="text-[10px] uppercase text-muted-foreground">Spend</div>
                      <div className="numeric font-medium">{formatCurrency(agg.spend)}</div>
                    </div>
                    <div className="rounded-lg bg-muted/60 p-2">
                      <div className="text-[10px] uppercase text-muted-foreground">Revenue</div>
                      <div className="numeric font-medium">{formatCurrency(agg.revenue)}</div>
                    </div>
                    <div className="rounded-lg bg-muted/60 p-2">
                      <div className="text-[10px] uppercase text-muted-foreground">CPA</div>
                      <div className="numeric font-medium">{formatCurrency(agg.cpa)}</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </ChartContainer>

        <ChartContainer title="Purchases trend" description="Orders acquired via ads">
          <TrendArea
            data={trendByDate}
            xKey="date"
            yKey="purchases"
            color="hsl(var(--info))"
            height={220}
            formatter={(v) => formatNumber(v)}
          />
          <div className="mx-2 mb-2 mt-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>Total purchases</span>
            <span className="numeric font-semibold text-foreground">{formatNumber(totalPurchases)}</span>
          </div>
        </ChartContainer>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-gradient-to-r from-brand-500/10 via-brand-400/5 to-brand-800/10 p-4"
      >
        <TrendingUp className="h-4 w-4 text-primary" />
        <span className="text-sm">
          Your real profit per order is{" "}
          <span className="numeric font-semibold">{formatCurrency(profit.realProfitPerLeadOrder)}</span>
          . Monthly projection at current volume:{" "}
          <span className="numeric font-semibold">{formatCurrency(profit.projections.monthly)}</span>.
        </span>
        <Button asChild size="sm" variant="outline" className="ms-auto">
          <Link href="/profit">Tune</Link>
        </Button>
      </motion.div>
    </div>
  );
}
