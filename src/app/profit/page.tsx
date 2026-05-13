"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Banknote,
  Coins,
  RotateCcw,
  Scale,
  Target,
  TrendingUp,
  Wallet
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { KpiCard } from "@/components/common/kpi-card";
import { ChartContainer } from "@/components/charts/chart-container";
import { StatusPill } from "@/components/common/status-pill";
import { InsightCard } from "@/components/common/insight-card";
import { NumberField, SliderField } from "@/components/common/field";
import { ExportMenu } from "@/components/common/export-menu";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useData } from "@/components/providers/data-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/ui/toaster";
import { calculateProfit } from "@/lib/calculations";
import type { ProfitInputs } from "@/lib/types";
import { DEFAULT_PROFIT_INPUTS } from "@/lib/seed";
import { downloadBlob, formatCurrency, formatPercent, toCSV } from "@/lib/utils";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const AXIS = { stroke: "hsl(var(--muted-foreground))", fontSize: 11 } as const;

function statusTone(s: "healthy" | "risky" | "losing") {
  if (s === "healthy") return { label: "Healthy", tone: "success" as const, bg: "from-success/10" };
  if (s === "risky") return { label: "Risky", tone: "warning" as const, bg: "from-warning/10" };
  return { label: "Losing money", tone: "destructive" as const, bg: "from-destructive/10" };
}

export default function ProfitPage() {
  const { t } = useI18n();
  const { profitInputs, setProfitInputs } = useData();
  const { toast } = useToast();

  const update = <K extends keyof ProfitInputs>(key: K, value: ProfitInputs[K]) =>
    setProfitInputs((p) => ({ ...p, [key]: value }));

  const result = React.useMemo(() => calculateProfit(profitInputs), [profitInputs]);
  const status = statusTone(result.status);

  // Sensitivity series
  const returnRateSeries = React.useMemo(() => {
    const out: { x: number; profit: number; projection: number }[] = [];
    for (let r = 0; r <= 60; r += 2) {
      const res = calculateProfit({ ...profitInputs, returnRate: r });
      out.push({ x: r, profit: Math.round(res.realProfitPerLeadOrder), projection: Math.round(res.projections.monthly) });
    }
    return out;
  }, [profitInputs]);

  const cpaSeries = React.useMemo(() => {
    const base = Math.max(400, profitInputs.adSpendPerOrder);
    const step = Math.max(50, Math.round(base / 20));
    const out: { x: number; profit: number }[] = [];
    for (let cpa = 100; cpa <= base * 2 + 100; cpa += step) {
      const res = calculateProfit({ ...profitInputs, adSpendPerOrder: cpa });
      out.push({ x: cpa, profit: Math.round(res.realProfitPerLeadOrder) });
    }
    return out;
  }, [profitInputs]);

  const projection = React.useMemo(() => {
    return [
      { bucket: "Day", value: result.projections.daily },
      { bucket: "Week", value: result.projections.weekly },
      { bucket: "Month", value: result.projections.monthly }
    ];
  }, [result]);

  const onExport = () => {
    const rows = [
      {
        sellingPrice: profitInputs.sellingPrice,
        sourcingCost: profitInputs.sourcingCost,
        packagingCost: profitInputs.packagingCost,
        deliveryCost: profitInputs.deliveryCost,
        returnShippingCost: profitInputs.returnShippingCost,
        adSpendPerOrder: profitInputs.adSpendPerOrder,
        confirmationRate: profitInputs.confirmationRate,
        returnRate: profitInputs.returnRate,
        fakeOrderRate: profitInputs.fakeOrderRate,
        upsellRevenue: profitInputs.upsellRevenue,
        averageBasketValue: profitInputs.averageBasketValue,
        dailyOrders: profitInputs.dailyOrders,
        realProfitPerLeadOrder: result.realProfitPerLeadOrder.toFixed(0),
        profitMarginPct: result.profitMarginPct.toFixed(2),
        breakEvenRoas: result.breakEvenRoas.toFixed(2),
        maxAcceptableCpa: result.maxAcceptableCpa.toFixed(0),
        returnRateDangerThreshold: result.returnRateDangerThreshold.toFixed(2),
        dailyProjection: result.projections.daily.toFixed(0),
        weeklyProjection: result.projections.weekly.toFixed(0),
        monthlyProjection: result.projections.monthly.toFixed(0)
      }
    ];
    downloadBlob(toCSV(rows), `profit-calc-${new Date().toISOString().slice(0, 10)}.csv`);
    toast({ title: "Profit report exported", description: "CSV downloaded", variant: "success" });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={<>Module 1</>}
        title={t("module.profit.title")}
        subtitle={t("module.profit.subtitle")}
        actions={
          <>
            <Button variant="outline" onClick={() => setProfitInputs(DEFAULT_PROFIT_INPUTS)}>
              <RotateCcw className="h-4 w-4" /> {t("common.reset")}
            </Button>
            <ExportMenu onCsv={onExport} label={t("common.export")} />
          </>
        }
      />

      {/* KPI strip */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Real profit / order"
          value={formatCurrency(result.realProfitPerLeadOrder)}
          sublabel={<StatusPill status={result.status} label={status.label} />}
          icon={Banknote}
          tone={status.tone}
        />
        <KpiCard
          label="Profit margin"
          value={formatPercent(result.profitMarginPct)}
          sublabel={<>Net per delivered order {formatCurrency(result.netProfitPerDeliveredOrder)}</>}
          icon={Scale}
          tone={result.profitMarginPct >= 20 ? "success" : result.profitMarginPct >= 12 ? "warning" : "destructive"}
        />
        <KpiCard
          label="Break-even ROAS"
          value={`${result.breakEvenRoas.toFixed(2)}x`}
          sublabel={<>Above this ratio, you are profitable</>}
          icon={Target}
          tone="info"
        />
        <KpiCard
          label="Max acceptable CPA"
          value={formatCurrency(result.maxAcceptableCpa)}
          sublabel={<>Beyond this, ads burn margin</>}
          icon={Coins}
          tone="default"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* INPUTS */}
        <ChartContainer
          className="lg:col-span-2"
          title="Inputs"
          description="All values in DZD unless labeled otherwise"
        >
          <div className="space-y-4 p-2">
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Selling price" value={profitInputs.sellingPrice} onChange={(v) => update("sellingPrice", v)} suffix="DA" />
              <NumberField label="Sourcing cost" value={profitInputs.sourcingCost} onChange={(v) => update("sourcingCost", v)} suffix="DA" />
              <NumberField label="Packaging cost" value={profitInputs.packagingCost} onChange={(v) => update("packagingCost", v)} suffix="DA" />
              <NumberField label="Delivery cost" value={profitInputs.deliveryCost} onChange={(v) => update("deliveryCost", v)} suffix="DA" />
              <NumberField label="Return shipping" value={profitInputs.returnShippingCost} onChange={(v) => update("returnShippingCost", v)} suffix="DA" />
              <NumberField label="Ad spend per order" value={profitInputs.adSpendPerOrder} onChange={(v) => update("adSpendPerOrder", v)} suffix="DA" />
              <NumberField label="Upsell revenue" value={profitInputs.upsellRevenue} onChange={(v) => update("upsellRevenue", v)} suffix="DA" />
              <NumberField label="Average basket" value={profitInputs.averageBasketValue} onChange={(v) => update("averageBasketValue", v)} suffix="DA" />
              <NumberField label="Daily orders" value={profitInputs.dailyOrders} onChange={(v) => update("dailyOrders", v)} suffix="/day" className="col-span-2" />
            </div>

            <div className="hairline my-3" />

            <div className="space-y-3">
              <SliderField label="Confirmation rate" value={profitInputs.confirmationRate} onChange={(v) => update("confirmationRate", v)} />
              <SliderField
                label="Return rate"
                value={profitInputs.returnRate}
                onChange={(v) => update("returnRate", v)}
                tone={profitInputs.returnRate > 35 ? "destructive" : profitInputs.returnRate > 20 ? "warning" : "default"}
              />
              <SliderField
                label="Fake order rate"
                value={profitInputs.fakeOrderRate}
                onChange={(v) => update("fakeOrderRate", v)}
                tone={profitInputs.fakeOrderRate > 15 ? "destructive" : profitInputs.fakeOrderRate > 8 ? "warning" : "default"}
              />
            </div>
          </div>
        </ChartContainer>

        {/* RESULTS + CHARTS */}
        <div className="space-y-4 lg:col-span-3">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br ${status.bg} via-transparent to-transparent p-5`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Monthly projection
                </div>
                <div className="mt-1 font-display text-3xl font-semibold tracking-tight">
                  {formatCurrency(result.projections.monthly)}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {formatCurrency(result.projections.daily)} / day ·{" "}
                  {formatCurrency(result.projections.weekly)} / week
                </div>
              </div>
              <StatusPill
                status={result.status === "healthy" ? "healthy" : result.status === "risky" ? "warning" : "critical"}
                label={status.label}
              />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {projection.map((p) => (
                <div key={p.bucket} className="rounded-xl bg-background/70 p-3">
                  <div className="text-[11px] uppercase text-muted-foreground">{p.bucket}</div>
                  <div className="numeric font-semibold">{formatCurrency(p.value)}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <Tabs defaultValue="return">
            <TabsList className="w-full">
              <TabsTrigger value="return" className="flex-1">
                <TrendingUp className="h-3.5 w-3.5" />
                If return rate rises
              </TabsTrigger>
              <TabsTrigger value="cpa" className="flex-1">
                <Wallet className="h-3.5 w-3.5" />
                If CPA rises
              </TabsTrigger>
            </TabsList>
            <TabsContent value="return">
              <ChartContainer
                title="Return-rate sensitivity"
                description={`Danger threshold: ${formatPercent(result.returnRateDangerThreshold)}`}
              >
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={returnRateSeries} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="x" tickLine={false} axisLine={false} unit="%" {...AXIS} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      {...AXIS}
                      tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 10,
                        fontSize: 12
                      }}
                      formatter={(v: number) => formatCurrency(v)}
                      labelFormatter={(l: number) => `Return rate ${l}%`}
                    />
                    <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="4 4" />
                    <ReferenceLine
                      x={Math.round(result.returnRateDangerThreshold)}
                      stroke="hsl(var(--warning))"
                      strokeDasharray="4 4"
                      label={{ value: "Danger", fill: "hsl(var(--warning))", fontSize: 10 }}
                    />
                    <ReferenceLine
                      x={profitInputs.returnRate}
                      stroke="hsl(var(--primary))"
                      label={{ value: "You", fill: "hsl(var(--primary))", fontSize: 10 }}
                    />
                    <Area type="monotone" dataKey="profit" stroke="hsl(var(--primary))" strokeWidth={2.2} fill="url(#rr)" name="Real profit / order" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </TabsContent>
            <TabsContent value="cpa">
              <ChartContainer
                title="CPA sensitivity"
                description={`Max acceptable CPA: ${formatCurrency(result.maxAcceptableCpa)}`}
              >
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={cpaSeries} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="x" tickLine={false} axisLine={false} unit=" DA" {...AXIS} />
                    <YAxis tickLine={false} axisLine={false} {...AXIS} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 10,
                        fontSize: 12
                      }}
                      formatter={(v: number) => formatCurrency(v)}
                      labelFormatter={(l: number) => `CPA ${formatCurrency(l)}`}
                    />
                    <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="4 4" />
                    <ReferenceLine
                      x={Math.round(result.maxAcceptableCpa)}
                      stroke="hsl(var(--warning))"
                      strokeDasharray="4 4"
                      label={{ value: "Ceiling", fill: "hsl(var(--warning))", fontSize: 10 }}
                    />
                    <ReferenceLine
                      x={profitInputs.adSpendPerOrder}
                      stroke="hsl(var(--primary))"
                      label={{ value: "You", fill: "hsl(var(--primary))", fontSize: 10 }}
                    />
                    <Line type="monotone" dataKey="profit" stroke="hsl(var(--info))" strokeWidth={2.2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </TabsContent>
          </Tabs>

          <div className="grid gap-3 sm:grid-cols-2">
            <InsightCard tone={result.returnRateDangerThreshold < profitInputs.returnRate ? "critical" : "positive"} title="Return-rate danger threshold">
              {result.returnRateDangerThreshold < profitInputs.returnRate
                ? `Your current ${profitInputs.returnRate}% return rate already crosses the profitability line (${formatPercent(result.returnRateDangerThreshold)}). Rework your targeting.`
                : `You can absorb up to ${formatPercent(result.returnRateDangerThreshold)} returns before profit turns negative. Buffer: ${formatPercent(result.returnRateDangerThreshold - profitInputs.returnRate)}.`}
            </InsightCard>
            <InsightCard tone={result.maxAcceptableCpa < profitInputs.adSpendPerOrder ? "critical" : "warning"} title="CPA ceiling">
              {result.maxAcceptableCpa < profitInputs.adSpendPerOrder
                ? `You are paying ${formatCurrency(profitInputs.adSpendPerOrder)} per order but the economics cap at ${formatCurrency(result.maxAcceptableCpa)}.`
                : `Your current CPA leaves ${formatCurrency(result.maxAcceptableCpa - profitInputs.adSpendPerOrder)} of headroom per order.`}
            </InsightCard>
            <InsightCard tone="neutral" title="Break-even ROAS">
              Keep your campaigns above{" "}
              <span className="numeric font-semibold">{result.breakEvenRoas.toFixed(2)}x</span> to stay profitable at the current cost structure.
            </InsightCard>
            <InsightCard tone={result.status === "healthy" ? "positive" : "warning"} title="Scale guidance">
              {result.status === "healthy"
                ? "Economics look healthy. Reinvest profit into the top-performing creative."
                : "Fix operations first: improve confirmation rate, cut fake orders, or renegotiate delivery before scaling spend."}
            </InsightCard>
          </div>
        </div>
      </div>
    </div>
  );
}
