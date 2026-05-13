"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Award,
  CircleDollarSign,
  Package,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Timer,
  Truck
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { ChartContainer } from "@/components/charts/chart-container";
import { InsightCard } from "@/components/common/insight-card";
import { StatusPill } from "@/components/common/status-pill";
import { NumberField } from "@/components/common/field";
import { ExportMenu } from "@/components/common/export-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/ui/toaster";
import {
  DELIVERY_COMPANIES,
  DEFAULT_DELIVERY_QUOTES
} from "@/lib/delivery-companies";
import type { DeliveryCompanyId, DeliveryCompanyQuote } from "@/lib/types";
import { WILAYAS, wilayaName } from "@/lib/wilayas";
import { downloadBlob, formatCurrency, toCSV } from "@/lib/utils";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis
} from "recharts";

type Focus = "cheapest" | "fastest" | "fragile" | "highticket";

function scoreQuote(q: DeliveryCompanyQuote, focus: Focus): number {
  // higher is better, 0-100
  const priceScore = 100 - Math.min(100, (q.deliveryPriceDZD - 400) / 15);
  const speedScore = 100 - Math.min(100, q.avgDeliveryDays * 12);
  const payoutScore = 100 - Math.min(100, q.codPayoutDays * 9);
  const returnScore = q.returnHandlingScore;
  const successScore = q.successRatePct;
  switch (focus) {
    case "cheapest":
      return priceScore * 0.55 + successScore * 0.25 + speedScore * 0.2;
    case "fastest":
      return speedScore * 0.55 + successScore * 0.25 + payoutScore * 0.2;
    case "fragile":
      return returnScore * 0.45 + successScore * 0.3 + speedScore * 0.1 + priceScore * 0.15;
    case "highticket":
      return successScore * 0.4 + returnScore * 0.25 + payoutScore * 0.2 + priceScore * 0.15;
  }
}

function companyColor(id: DeliveryCompanyId): string {
  return DELIVERY_COMPANIES.find((c) => c.id === id)?.brandColor ?? "#888";
}

export default function DeliveryPage() {
  const { t, lang } = useI18n();
  const { toast } = useToast();

  const [wilayaCode, setWilayaCode] = React.useState<string>("16");
  const [focus, setFocus] = React.useState<Focus>("cheapest");
  const [returnRatePct, setReturnRatePct] = React.useState<number>(18);
  const [basket, setBasket] = React.useState<number>(4500);

  const quotesForWilaya = React.useMemo(
    () => DEFAULT_DELIVERY_QUOTES.filter((q) => q.wilayaCode === wilayaCode),
    [wilayaCode]
  );

  const scored = React.useMemo(() => {
    return quotesForWilaya
      .map((q) => {
        // Real cost after returns: price + expected loss per returned order
        const returned = Math.max(0, Math.min(80, returnRatePct)) / 100;
        // expected shipping cost per order = price + returned * price (re-ship/return fee)
        const realCost = q.deliveryPriceDZD * (1 + returned);
        return {
          ...q,
          realCost,
          score: scoreQuote(q, focus)
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [quotesForWilaya, returnRatePct, focus]);

  const best = scored[0];

  // Overall ranking across ALL wilayas, per company
  const overall = React.useMemo(() => {
    return DELIVERY_COMPANIES.map((c) => {
      const qs = DEFAULT_DELIVERY_QUOTES.filter((q) => q.companyId === c.id);
      const avgPrice = qs.reduce((a, q) => a + q.deliveryPriceDZD, 0) / qs.length;
      const avgSpeed = qs.reduce((a, q) => a + q.avgDeliveryDays, 0) / qs.length;
      const avgPayout = qs.reduce((a, q) => a + q.codPayoutDays, 0) / qs.length;
      const avgReturn = qs.reduce((a, q) => a + q.returnHandlingScore, 0) / qs.length;
      const avgSuccess = qs.reduce((a, q) => a + q.successRatePct, 0) / qs.length;
      return {
        id: c.id,
        name: c.name,
        color: c.brandColor,
        description: c.description,
        strengths: c.strengths,
        weaknesses: c.weaknesses,
        avgPrice,
        avgSpeed,
        avgPayout,
        avgReturn,
        avgSuccess
      };
    });
  }, []);

  const bestPerCategory = React.useMemo(() => {
    return {
      cheapest: [...overall].sort((a, b) => a.avgPrice - b.avgPrice)[0],
      fastest: [...overall].sort((a, b) => a.avgSpeed - b.avgSpeed)[0],
      success: [...overall].sort((a, b) => b.avgSuccess - a.avgSuccess)[0],
      returns: [...overall].sort((a, b) => b.avgReturn - a.avgReturn)[0]
    };
  }, [overall]);

  const comparisonChart = React.useMemo(
    () =>
      scored.map((s) => ({
        name: DELIVERY_COMPANIES.find((c) => c.id === s.companyId)?.name ?? s.companyId,
        price: s.deliveryPriceDZD,
        realCost: Math.round(s.realCost),
        score: Math.round(s.score)
      })),
    [scored]
  );

  const exportCsv = () => {
    const rows = DELIVERY_COMPANIES.flatMap((c) =>
      WILAYAS.map((w) => {
        const q = DEFAULT_DELIVERY_QUOTES.find(
          (q) => q.companyId === c.id && q.wilayaCode === w.code
        );
        if (!q) return null;
        return {
          company: c.name,
          wilayaCode: w.code,
          wilaya: w.nameFr,
          region: w.region,
          priceDZD: q.deliveryPriceDZD,
          avgDays: q.avgDeliveryDays,
          codPayoutDays: q.codPayoutDays,
          successRatePct: q.successRatePct,
          returnHandlingScore: q.returnHandlingScore
        };
      }).filter(Boolean) as Record<string, unknown>[]
    );
    downloadBlob(toCSV(rows), `delivery-matrix-${new Date().toISOString().slice(0, 10)}.csv`);
    toast({ title: "Matrix exported", variant: "success" });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={<>Module 4</>}
        title={t("module.delivery.title")}
        subtitle={t("module.delivery.subtitle")}
        actions={<ExportMenu onCsv={exportCsv} label={t("common.export")} />}
      />

      {/* Company overview cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overall.map((c) => {
          const isWinner = best?.companyId === c.id;
          return (
            <motion.div
              key={c.id}
              whileHover={{ y: -3 }}
              className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5"
            >
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-30 blur-3xl"
                style={{ background: c.color }}
              />
              <div className="relative flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-glow"
                    style={{ background: c.color }}
                  >
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-display font-semibold">{c.name}</div>
                    <div className="text-[11px] text-muted-foreground line-clamp-1">
                      {c.description}
                    </div>
                  </div>
                </div>
                {isWinner && (
                  <StatusPill status="healthy" label="Winner" />
                )}
              </div>
              <div className="relative mt-4 grid grid-cols-2 gap-2 text-xs">
                <Stat label="Avg price" value={formatCurrency(c.avgPrice)} />
                <Stat label="Avg days" value={`${c.avgSpeed.toFixed(1)}d`} />
                <Stat label="Success" value={`${c.avgSuccess.toFixed(0)}%`} />
                <Stat label="Returns" value={`${c.avgReturn.toFixed(0)}/100`} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Filter bar + comparator */}
      <ChartContainer
        title="Wilaya comparator"
        description="Compare carriers for one wilaya and a specific goal"
      >
        <div className="grid gap-3 p-2 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Wilaya
            </div>
            <Select value={wilayaCode} onValueChange={setWilayaCode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WILAYAS.map((w) => (
                  <SelectItem key={w.code} value={w.code}>
                    {w.code} - {w.nameFr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Optimize for
            </div>
            <Select value={focus} onValueChange={(v) => setFocus(v as Focus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cheapest">Cheapest</SelectItem>
                <SelectItem value="fastest">Fastest</SelectItem>
                <SelectItem value="fragile">Best for fragile products</SelectItem>
                <SelectItem value="highticket">Best for high-ticket</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <NumberField
            label="Return rate"
            value={returnRatePct}
            onChange={setReturnRatePct}
            suffix="%"
            step={1}
            max={80}
          />
          <NumberField
            label="Basket"
            value={basket}
            onChange={setBasket}
            suffix="DA"
            step={100}
          />
        </div>

        {best && (
          <motion.div
            key={`${wilayaCode}-${focus}-${best.companyId}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-2 mb-3 mt-1 rounded-2xl border border-border/60 bg-gradient-to-br from-success/5 via-transparent to-transparent p-4"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-glow"
                  style={{ background: companyColor(best.companyId) }}
                >
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Recommendation for {wilayaName(wilayaCode, lang === "en" ? "fr" : lang)}
                  </div>
                  <div className="font-display text-lg font-semibold">
                    {DELIVERY_COMPANIES.find((c) => c.id === best.companyId)?.name} — score{" "}
                    {Math.round(best.score)}/100
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <Mini label="Price" value={formatCurrency(best.deliveryPriceDZD)} icon={CircleDollarSign} />
                <Mini label="Days" value={`${best.avgDeliveryDays}d`} icon={Timer} />
                <Mini label="Success" value={`${best.successRatePct}%`} icon={PackageCheck} />
                <Mini label="Real cost" value={formatCurrency(Math.round(best.realCost))} icon={Package} />
              </div>
            </div>
          </motion.div>
        )}

        <div className="max-h-[460px] overflow-auto p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Carrier</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Days</TableHead>
                <TableHead className="text-right">COD payout</TableHead>
                <TableHead className="text-right">Success</TableHead>
                <TableHead className="text-right">Returns</TableHead>
                <TableHead className="text-right">Real cost</TableHead>
                <TableHead className="text-right">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scored.map((s, idx) => {
                const comp = DELIVERY_COMPANIES.find((c) => c.id === s.companyId)!;
                return (
                  <TableRow key={s.companyId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className="flex h-6 w-6 items-center justify-center rounded-md text-white"
                          style={{ background: comp.brandColor }}
                        >
                          <Truck className="h-3 w-3" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-medium">{comp.name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {idx === 0 ? "Recommended" : comp.description.slice(0, 40)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="numeric text-right">
                      {formatCurrency(s.deliveryPriceDZD)}
                    </TableCell>
                    <TableCell className="numeric text-right">{s.avgDeliveryDays}d</TableCell>
                    <TableCell className="numeric text-right">{s.codPayoutDays}d</TableCell>
                    <TableCell className="numeric text-right">{s.successRatePct}%</TableCell>
                    <TableCell className="numeric text-right">{s.returnHandlingScore}/100</TableCell>
                    <TableCell className="numeric text-right">
                      {formatCurrency(Math.round(s.realCost))}
                    </TableCell>
                    <TableCell className="text-right">
                      <StatusPill
                        status={s.score >= 75 ? "healthy" : s.score >= 55 ? "warning" : "critical"}
                        label={Math.round(s.score).toString()}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </ChartContainer>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartContainer
          className="lg:col-span-2"
          title="Price vs real cost"
          description="After factoring the current return rate"
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={comparisonChart} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <RTooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 10,
                  fontSize: 12
                }}
                formatter={(v: number) => formatCurrency(v)}
              />
              <Bar dataKey="price" name="Sticker price" fill="hsl(var(--info))" radius={[6, 6, 0, 0]} />
              <Bar dataKey="realCost" name="Real cost" fill="hsl(var(--destructive))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Best for each category" description="Across all 58 wilayas">
          <div className="space-y-2 p-2">
            <CategoryRow
              label="Cheapest"
              icon={CircleDollarSign}
              name={bestPerCategory.cheapest.name}
              value={formatCurrency(bestPerCategory.cheapest.avgPrice)}
              color={bestPerCategory.cheapest.color}
            />
            <CategoryRow
              label="Fastest"
              icon={Timer}
              name={bestPerCategory.fastest.name}
              value={`${bestPerCategory.fastest.avgSpeed.toFixed(1)} days`}
              color={bestPerCategory.fastest.color}
            />
            <CategoryRow
              label="Fragile / high-ticket"
              icon={ShieldCheck}
              name={bestPerCategory.returns.name}
              value={`${bestPerCategory.returns.avgReturn.toFixed(0)}/100 returns`}
              color={bestPerCategory.returns.color}
            />
            <CategoryRow
              label="Success rate"
              icon={Award}
              name={bestPerCategory.success.name}
              value={`${bestPerCategory.success.avgSuccess.toFixed(0)}% delivered`}
              color={bestPerCategory.success.color}
            />
          </div>
        </ChartContainer>
      </div>

      <ChartContainer
        title="Cost calculator"
        description="Estimate cost per 100 orders on the selected wilaya"
      >
        <div className="grid gap-3 p-2 md:grid-cols-4">
          {scored.map((s) => {
            const comp = DELIVERY_COMPANIES.find((c) => c.id === s.companyId)!;
            const costPer100 = s.realCost * 100;
            const revenue = basket * 100 * (s.successRatePct / 100);
            const netMarginSignal =
              revenue - costPer100 > 0
                ? "healthy"
                : revenue - costPer100 > -basket * 5
                  ? "warning"
                  : "critical";
            return (
              <div key={s.companyId} className="rounded-2xl border border-border/60 bg-background/60 p-4">
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-white"
                    style={{ background: comp.brandColor }}
                  >
                    <Truck className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold">{comp.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {wilayaName(wilayaCode, lang === "en" ? "fr" : lang)}
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <Stat label="Shipping" value={formatCurrency(Math.round(costPer100))} />
                  <Stat label="Revenue" value={formatCurrency(Math.round(revenue))} />
                </div>
                <div className="mt-3">
                  <StatusPill
                    status={netMarginSignal as "healthy" | "warning" | "critical"}
                    label={
                      revenue - costPer100 >= 0
                        ? `+${formatCurrency(Math.round(revenue - costPer100))} proxy margin`
                        : `${formatCurrency(Math.round(revenue - costPer100))}`
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      </ChartContainer>

      <div className="grid gap-4 lg:grid-cols-2">
        <InsightCard tone="positive" title="Recommendation engine">
          For <strong>{wilayaName(wilayaCode, lang === "en" ? "fr" : lang)}</strong>, optimize for{" "}
          <strong>{focus}</strong>:{" "}
          <strong>{DELIVERY_COMPANIES.find((c) => c.id === best?.companyId)?.name}</strong> scores{" "}
          <strong>{Math.round(best?.score ?? 0)}/100</strong> with{" "}
          {formatCurrency(best?.deliveryPriceDZD ?? 0)} per order and{" "}
          {best?.avgDeliveryDays}d delivery.
        </InsightCard>
        <InsightCard tone="neutral" title="Reminder">
          Real cost after returns is what matters. A 600 DA carrier with 18% returns costs{" "}
          {formatCurrency(Math.round(600 * 1.18))} per order on average.
        </InsightCard>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-muted/60 p-2">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="numeric mt-0.5 text-sm font-semibold">{value}</div>
    </div>
  );
}

function Mini({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-background/80 px-2 py-1.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <div>
        <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
        <div className="numeric text-xs font-semibold">{value}</div>
      </div>
    </div>
  );
}

function CategoryRow({
  label,
  name,
  value,
  icon: Icon,
  color
}: {
  label: string;
  name: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 p-3">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: color }}>
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <div className="text-[11px] uppercase text-muted-foreground">{label}</div>
          <div className="text-sm font-semibold">{name}</div>
        </div>
      </div>
      <div className="numeric text-sm font-semibold">{value}</div>
    </div>
  );
}
