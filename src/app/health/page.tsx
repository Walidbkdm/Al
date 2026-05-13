"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  HeartPulse,
  PackageCheck,
  Percent,
  ScanLine,
  Sparkles,
  Target,
  TrendingUp
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { ChartContainer } from "@/components/charts/chart-container";
import { InsightCard } from "@/components/common/insight-card";
import { StatusPill } from "@/components/common/status-pill";
import { HealthGauge } from "@/components/health/health-gauge";
import { ExportMenu } from "@/components/common/export-menu";
import { useData } from "@/components/providers/data-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/ui/toaster";
import {
  calculateProfit,
  computeHealthScore,
  wilayaReturnRates
} from "@/lib/calculations";
import { wilayaName } from "@/lib/wilayas";
import { downloadBlob, formatPercent, toCSV } from "@/lib/utils";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer
} from "recharts";
import type { HealthScore } from "@/lib/types";

const FACTOR_META: {
  key: keyof HealthScore["factors"];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  explanation: string;
}[] = [
  {
    key: "profitability",
    label: "Profitability",
    icon: TrendingUp,
    explanation: "Gross margin after all order costs."
  },
  {
    key: "returnRate",
    label: "Return rate",
    icon: ScanLine,
    explanation: "Share of delivered orders vs returned/refused."
  },
  {
    key: "adEfficiency",
    label: "Ad efficiency",
    icon: Target,
    explanation: "Average ROAS across Meta and TikTok."
  },
  {
    key: "deliveryPerformance",
    label: "Delivery",
    icon: PackageCheck,
    explanation: "Carrier success rate weighted by volume."
  },
  {
    key: "confirmationRate",
    label: "Confirmation",
    icon: CheckCircle2,
    explanation: "Leads that convert to confirmed orders."
  },
  {
    key: "fakeOrderRatio",
    label: "Fake orders",
    icon: AlertTriangle,
    explanation: "Lower is better. Ghost buyers burn cash."
  }
];

function factorTone(score: number) {
  if (score >= 80) return "success" as const;
  if (score >= 60) return "info" as const;
  if (score >= 40) return "warning" as const;
  return "destructive" as const;
}

export default function HealthPage() {
  const { t } = useI18n();
  const { orderLogs, campaigns, profitInputs } = useData();
  const { toast } = useToast();

  const profit = React.useMemo(() => calculateProfit(profitInputs), [profitInputs]);
  const health = React.useMemo(
    () => computeHealthScore({ logs: orderLogs, campaigns, profit, inputs: profitInputs }),
    [orderLogs, campaigns, profit, profitInputs]
  );

  // Weekly score history (simulated from current data + small drift)
  const weeklyHistory = React.useMemo(() => {
    const weeks = ["W-5", "W-4", "W-3", "W-2", "W-1", "This"];
    return weeks.map((label, i) => {
      const delta = (i - 3) * 3 + ((i % 2 === 0 ? 1 : -1) * 2);
      return { week: label, score: Math.max(0, Math.min(100, health.score + delta)) };
    });
  }, [health.score]);

  const radarData = FACTOR_META.map((f) => ({
    factor: f.label,
    value: health.factors[f.key]
  }));

  const criticalWilayas = React.useMemo(() => {
    const rates = wilayaReturnRates(orderLogs);
    return rates
      .filter((r) => r.total >= 5 && r.returnRatePct > 35)
      .sort((a, b) => b.returnRatePct - a.returnRatePct)
      .slice(0, 5);
  }, [orderLogs]);

  const exportReport = () => {
    const rows = [
      { metric: "Overall score", value: health.score, label: health.label },
      ...FACTOR_META.map((f) => ({
        metric: f.label,
        value: health.factors[f.key],
        label: factorTone(health.factors[f.key])
      }))
    ];
    downloadBlob(toCSV(rows), `health-report-${new Date().toISOString().slice(0, 10)}.csv`);
    toast({ title: "Health report exported", variant: "success" });
  };

  const scoreStatus =
    health.color === "success"
      ? "healthy"
      : health.color === "info"
        ? "stable"
        : health.color === "warning"
          ? "warning"
          : "critical";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={<>Module 5</>}
        title={t("module.health.title")}
        subtitle={t("module.health.subtitle")}
        actions={<ExportMenu onCsv={exportReport} label={t("common.export")} />}
      />

      {/* Hero: gauge + big status */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-border/60 bg-card"
      >
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl"
          style={{
            background:
              scoreStatus === "healthy"
                ? "hsl(var(--success) / 0.25)"
                : scoreStatus === "stable"
                  ? "hsl(var(--info) / 0.25)"
                  : scoreStatus === "warning"
                    ? "hsl(var(--warning) / 0.25)"
                    : "hsl(var(--destructive) / 0.3)"
          }}
        />
        <div className="relative grid gap-6 p-6 md:grid-cols-[minmax(240px,1fr)_2fr] md:p-8">
          <div className="flex flex-col items-center justify-center">
            <HealthGauge score={health.score} tone={health.color} label={health.label} size={240} />
            <div className="mt-4">
              <StatusPill status={scoreStatus} label={`${health.label} · ${health.score}/100`} />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Weekly business health
              </div>
              <h2 className="mt-1 font-display text-2xl font-semibold">
                {health.score >= 80
                  ? "You are winning this week."
                  : health.score >= 60
                    ? "Operations are stable, watch these levers."
                    : health.score >= 40
                      ? "Warning signs. Fix what bleeds margin now."
                      : "Critical. Stop scaling until you stabilize."}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Composite of profitability, returns, ad efficiency, delivery, confirmation, and fake-order exposure.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {health.recommendations.slice(0, 4).map((r, i) => (
                <InsightCard
                  key={i}
                  tone={i === 0 ? "warning" : i === 1 ? "critical" : "neutral"}
                  title={`Action ${i + 1}`}
                >
                  {r}
                </InsightCard>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Factor breakdown */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartContainer className="lg:col-span-2" title="Factor breakdown" description="Each lever on a 0-100 scale">
          <div className="grid gap-3 p-2 sm:grid-cols-2">
            {FACTOR_META.map((f) => {
              const score = health.factors[f.key];
              const tone = factorTone(score);
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.key}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-border/60 bg-background/60 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          tone === "success"
                            ? "bg-success/10 text-success"
                            : tone === "info"
                              ? "bg-info/10 text-info"
                              : tone === "warning"
                                ? "bg-warning/10 text-warning"
                                : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{f.label}</div>
                        <div className="text-[11px] text-muted-foreground">{f.explanation}</div>
                      </div>
                    </div>
                    <div className="numeric text-lg font-semibold">{score}</div>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, score)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`h-full rounded-full ${
                        tone === "success"
                          ? "bg-success"
                          : tone === "info"
                            ? "bg-info"
                            : tone === "warning"
                              ? "bg-warning"
                              : "bg-destructive"
                      }`}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </ChartContainer>

        <ChartContainer title="360° view" description="Radar across all health levers">
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData} outerRadius="70%">
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis
                dataKey="factor"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              />
              <Radar
                name="Score"
                dataKey="value"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.35}
              />
            </RadarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Weekly trend + critical regions */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartContainer
          className="lg:col-span-2"
          title="Score trajectory"
          description="Six-week rolling business health"
        >
          <div className="p-2">
            <div className="relative grid grid-cols-6 items-end gap-3 rounded-xl border border-border/60 bg-background/60 p-4">
              {weeklyHistory.map((p, i) => {
                const tone = factorTone(p.score);
                const color =
                  tone === "success"
                    ? "hsl(var(--success))"
                    : tone === "info"
                      ? "hsl(var(--info))"
                      : tone === "warning"
                        ? "hsl(var(--warning))"
                        : "hsl(var(--destructive))";
                return (
                  <motion.div
                    key={p.week}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    transition={{ delay: i * 0.07, duration: 0.35 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="relative h-40 w-full">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(8, p.score)}%` }}
                        transition={{ delay: i * 0.07, duration: 0.6, ease: "easeOut" }}
                        className="absolute inset-x-0 bottom-0 rounded-lg"
                        style={{ background: `linear-gradient(180deg, ${color}, ${color}55)` }}
                      />
                    </div>
                    <div className="numeric text-sm font-semibold">{p.score}</div>
                    <div className="text-[11px] text-muted-foreground">{p.week}</div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </ChartContainer>

        <ChartContainer
          title="Critical regions"
          description="Wilayas with >35% return rate"
          action={<Percent className="h-4 w-4 text-muted-foreground" />}
        >
          <div className="space-y-2 p-2">
            {criticalWilayas.length === 0 && (
              <div className="rounded-xl border border-success/30 bg-success/5 p-3 text-xs text-success">
                No wilaya above 35% returns. Keep it up.
              </div>
            )}
            {criticalWilayas.map((w) => (
              <div
                key={w.wilayaCode}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 p-3"
              >
                <div>
                  <div className="text-sm font-medium">
                    <span className="me-1 text-xs text-muted-foreground">{w.wilayaCode}</span>
                    {wilayaName(w.wilayaCode, "fr")}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{w.total} orders tracked</div>
                </div>
                <StatusPill status="critical" label={formatPercent(w.returnRatePct)} />
              </div>
            ))}
          </div>
        </ChartContainer>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <InsightCard tone="neutral" title="How the score is calculated">
          28% profitability, 22% return rate, 20% ad efficiency, 15% delivery, 10% confirmation, 5% fake-order ratio.
          Aim for every lever above 70 to sustain scale.
        </InsightCard>
        <InsightCard tone="positive" title="Playbook">
          Keep running what works. Push ad spend only on the best-scoring creative and the top-5 wilayas you have verified.
        </InsightCard>
        <InsightCard tone="warning" title="Risk radar">
          If your health drops below 60 for two consecutive weeks, pause scaling and spend a full week cleaning up ops.
        </InsightCard>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-gradient-to-r from-brand-500/10 via-transparent to-brand-800/10 p-4"
      >
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm">
          <span className="font-semibold">{health.label}</span> — overall score{" "}
          <span className="numeric font-semibold">{health.score}/100</span>. Top lever:{" "}
          <span className="font-semibold">
            {
              FACTOR_META.reduce(
                (min, f) =>
                  health.factors[f.key] < min.score ? { label: f.label, score: health.factors[f.key] } : min,
                { label: FACTOR_META[0].label, score: 100 }
              ).label
            }
          </span>
          .
        </span>
        <HeartPulse className="ms-auto h-4 w-4 text-primary" />
      </motion.div>
    </div>
  );
}
