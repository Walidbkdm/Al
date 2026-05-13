"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Award,
  Facebook,
  Megaphone,
  Plus,
  Target,
  Trash2,
  TrendingUp
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { KpiCard } from "@/components/common/kpi-card";
import { ChartContainer } from "@/components/charts/chart-container";
import { InsightCard } from "@/components/common/insight-card";
import { StatusPill } from "@/components/common/status-pill";
import { NumberField } from "@/components/common/field";
import { ExportMenu } from "@/components/common/export-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useData } from "@/components/providers/data-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/ui/toaster";
import { aggregateAdsByPlatform, computeAdMetrics } from "@/lib/calculations";
import type { AdCampaign } from "@/lib/types";
import {
  downloadBlob,
  fmtDate,
  formatCurrency,
  formatNumber,
  formatPercent,
  toCSV,
  uid
} from "@/lib/utils";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis
} from "recharts";
import { TrendLine } from "@/components/charts/trend-chart";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M16.6 5.82c-1.15-.75-1.9-2.02-1.94-3.46h-3.11v12.98c-.04 1.9-1.6 3.43-3.5 3.43-1.92 0-3.5-1.57-3.5-3.5 0-1.92 1.58-3.5 3.5-3.5.38 0 .74.07 1.08.18v-3.18a6.73 6.73 0 0 0-1.08-.09C4.48 8.68 1 12.17 1 16.49S4.48 24.3 8.05 24.3c3.58 0 6.55-2.85 6.55-6.8V10.3c1.41 1 3.13 1.6 4.96 1.6V8.78c-1.15 0-2.17-.37-2.96-.95Z"
      />
    </svg>
  );
}

export default function AdsPage() {
  const { t } = useI18n();
  const { campaigns, setCampaigns } = useData();
  const { toast } = useToast();

  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<Partial<AdCampaign>>({
    platform: "meta",
    date: new Date().toISOString().slice(0, 10),
    name: "New Campaign",
    spend: 5000,
    cpm: 500,
    cpc: 30,
    ctrPct: 2.2,
    clicks: 800,
    addToCarts: 80,
    purchases: 16,
    revenue: 80000
  });

  const agg = React.useMemo(() => aggregateAdsByPlatform(campaigns), [campaigns]);
  const ranked = React.useMemo(() => {
    return [...campaigns]
      .map((c) => ({ c, m: computeAdMetrics(c) }))
      .sort((a, b) => b.m.roas - a.m.roas);
  }, [campaigns]);

  const trendByDate = React.useMemo(() => {
    const byDate = new Map<
      string,
      { date: string; metaSpend: number; metaRev: number; tiktokSpend: number; tiktokRev: number }
    >();
    for (const c of campaigns) {
      const cur =
        byDate.get(c.date) ??
        { date: c.date, metaSpend: 0, metaRev: 0, tiktokSpend: 0, tiktokRev: 0 };
      if (c.platform === "meta") {
        cur.metaSpend += c.spend;
        cur.metaRev += c.revenue;
      } else {
        cur.tiktokSpend += c.spend;
        cur.tiktokRev += c.revenue;
      }
      byDate.set(c.date, cur);
    }
    return Array.from(byDate.values())
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .map((d) => ({
        ...d,
        metaRoas: d.metaSpend > 0 ? +(d.metaRev / d.metaSpend).toFixed(2) : 0,
        tiktokRoas: d.tiktokSpend > 0 ? +(d.tiktokRev / d.tiktokSpend).toFixed(2) : 0
      }));
  }, [campaigns]);

  const totalSpend = agg.meta.spend + agg.tiktok.spend;
  const totalRevenue = agg.meta.revenue + agg.tiktok.revenue;
  const totalRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const totalPurchases = agg.meta.purchases + agg.tiktok.purchases;

  const insights = React.useMemo(() => {
    const res: { tone: "positive" | "warning" | "critical" | "neutral"; title: string; body: string }[] = [];
    if (agg.meta.roas > 0 && agg.tiktok.roas > 0) {
      const diff = agg.meta.roas - agg.tiktok.roas;
      if (Math.abs(diff) >= 0.3) {
        const winner = diff > 0 ? "Meta" : "TikTok";
        const loser = diff > 0 ? "TikTok" : "Meta";
        res.push({
          tone: "positive",
          title: `${winner} generates higher ROAS at your current AOV`,
          body: `${winner}: ${(diff > 0 ? agg.meta.roas : agg.tiktok.roas).toFixed(2)}x vs ${loser}: ${(diff > 0 ? agg.tiktok.roas : agg.meta.roas).toFixed(2)}x. Consider shifting 15-20% of ${loser} budget.`
        });
      }
    }
    if (agg.tiktok.cpm > 0 && agg.meta.cpm > 0 && agg.tiktok.cpm < agg.meta.cpm) {
      const convGap = agg.meta.convRatePct - agg.tiktok.convRatePct;
      res.push({
        tone: convGap > 0 ? "warning" : "neutral",
        title: "TikTok has lower CPM but different conversion rate",
        body: `TikTok CPM ${formatCurrency(agg.tiktok.cpm)} vs Meta ${formatCurrency(agg.meta.cpm)}. ${
          convGap > 0 ? `Meta still converts ${convGap.toFixed(1)}% higher.` : "TikTok's conversion keeps up."
        }`
      });
    }
    if (totalRoas > 0 && totalRoas < 1.6) {
      res.push({
        tone: "critical",
        title: "You are overspending relative to your margin",
        body: `Global ROAS is ${totalRoas.toFixed(2)}x. Pause the bottom-quartile campaigns and protect cash.`
      });
    }
    const worst = [...ranked].reverse()[0];
    if (worst && worst.m.roas < 1) {
      res.push({
        tone: "critical",
        title: `Pause "${worst.c.name}"`,
        body: `ROAS ${worst.m.roas.toFixed(2)}x — losing money on every DZD spent.`
      });
    }
    const best = ranked[0];
    if (best && best.m.roas > 2.5) {
      res.push({
        tone: "positive",
        title: `Scale "${best.c.name}"`,
        body: `ROAS ${best.m.roas.toFixed(2)}x — increase budget by 20% and watch CPA.`
      });
    }
    return res.slice(0, 4);
  }, [agg, totalRoas, ranked]);

  const addCampaign = () => {
    const c: AdCampaign = {
      id: uid("camp"),
      date: form.date || new Date().toISOString().slice(0, 10),
      platform: (form.platform as "meta" | "tiktok") || "meta",
      name: form.name || "Untitled",
      spend: Number(form.spend) || 0,
      cpm: Number(form.cpm) || 0,
      cpc: Number(form.cpc) || 0,
      ctrPct: Number(form.ctrPct) || 0,
      clicks: Number(form.clicks) || 0,
      addToCarts: Number(form.addToCarts) || 0,
      purchases: Number(form.purchases) || 0,
      revenue: Number(form.revenue) || 0
    };
    setCampaigns((prev) => [c, ...prev]);
    setOpen(false);
    toast({ title: "Campaign added", variant: "success" });
  };

  const removeCampaign = (id: string) => {
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  };

  const exportCsv = () => {
    const rows = campaigns.map((c) => {
      const m = computeAdMetrics(c);
      return {
        date: c.date,
        platform: c.platform,
        name: c.name,
        spend: c.spend,
        revenue: c.revenue,
        purchases: c.purchases,
        cpm: c.cpm,
        cpc: c.cpc,
        ctr: c.ctrPct,
        clicks: c.clicks,
        addToCarts: c.addToCarts,
        roas: m.roas.toFixed(2),
        cpa: m.cpa.toFixed(0),
        convRate: m.convRatePct.toFixed(2),
        funnelDrop: m.funnelDropPct.toFixed(2),
        revenueEfficiency: m.revenueEfficiency.toFixed(2)
      };
    });
    downloadBlob(toCSV(rows), `ads-report-${new Date().toISOString().slice(0, 10)}.csv`);
    toast({ title: "Ad report exported", variant: "success" });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={<>Module 3</>}
        title={t("module.ads.title")}
        subtitle={t("module.ads.subtitle")}
        actions={
          <>
            <ExportMenu onCsv={exportCsv} label={t("common.export")} />
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4" /> {t("common.add")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>New campaign</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label>Platform</Label>
                    <Select
                      value={form.platform}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, platform: v as "meta" | "tiktok" }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="meta">Meta (Facebook/Instagram)</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    />
                  </div>
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <Label>Campaign name</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <NumberField label="Spend" value={Number(form.spend)} onChange={(v) => setForm((f) => ({ ...f, spend: v }))} suffix="DA" />
                  <NumberField label="Revenue" value={Number(form.revenue)} onChange={(v) => setForm((f) => ({ ...f, revenue: v }))} suffix="DA" />
                  <NumberField label="CPM" value={Number(form.cpm)} onChange={(v) => setForm((f) => ({ ...f, cpm: v }))} suffix="DA" />
                  <NumberField label="CPC" value={Number(form.cpc)} onChange={(v) => setForm((f) => ({ ...f, cpc: v }))} suffix="DA" />
                  <NumberField label="CTR" value={Number(form.ctrPct)} onChange={(v) => setForm((f) => ({ ...f, ctrPct: v }))} suffix="%" step={0.1} />
                  <NumberField label="Clicks" value={Number(form.clicks)} onChange={(v) => setForm((f) => ({ ...f, clicks: v }))} />
                  <NumberField label="Add-to-carts" value={Number(form.addToCarts)} onChange={(v) => setForm((f) => ({ ...f, addToCarts: v }))} />
                  <NumberField label="Purchases" value={Number(form.purchases)} onChange={(v) => setForm((f) => ({ ...f, purchases: v }))} />
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addCampaign}>Save campaign</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      {/* KPI strip */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total spend"
          value={formatCurrency(totalSpend)}
          icon={Megaphone}
          tone="destructive"
        />
        <KpiCard
          label="Total revenue"
          value={formatCurrency(totalRevenue)}
          icon={TrendingUp}
          tone="success"
        />
        <KpiCard
          label="Global ROAS"
          value={`${totalRoas.toFixed(2)}x`}
          icon={Target}
          tone={totalRoas >= 2 ? "success" : totalRoas >= 1.5 ? "warning" : "destructive"}
          sublabel={<StatusPill status={totalRoas >= 2 ? "healthy" : totalRoas >= 1.5 ? "warning" : "critical"} label={totalRoas >= 2 ? "Profitable" : totalRoas >= 1.5 ? "Watch" : "Losing"} />}
        />
        <KpiCard
          label="Purchases"
          value={formatNumber(totalPurchases)}
          icon={Award}
          tone="info"
        />
      </div>

      {/* Platform side-by-side */}
      <div className="grid gap-4 lg:grid-cols-2">
        {(["meta", "tiktok"] as const).map((platform) => {
          const data = agg[platform];
          const tone = data.roas >= 2 ? "success" : data.roas >= 1.5 ? "warning" : "destructive";
          return (
            <motion.div
              key={platform}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5"
            >
              <div
                className="pointer-events-none absolute inset-x-0 -top-8 h-32 opacity-40 blur-3xl"
                style={{ background: platform === "meta" ? "#1877f2" : "#ff0050" }}
              />
              <div className="relative flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-glow"
                    style={{ background: platform === "meta" ? "#1877f2" : "#000" }}
                  >
                    {platform === "meta" ? (
                      <Facebook className="h-5 w-5" />
                    ) : (
                      <TikTokIcon className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="font-display text-lg font-semibold capitalize">{platform}</div>
                    <div className="text-xs text-muted-foreground">{data.count} campaigns</div>
                  </div>
                </div>
                <StatusPill
                  status={tone === "success" ? "healthy" : tone === "warning" ? "warning" : "critical"}
                  label={`${data.roas.toFixed(2)}x ROAS`}
                />
              </div>

              <div className="relative mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { label: "Spend", value: formatCurrency(data.spend) },
                  { label: "Revenue", value: formatCurrency(data.revenue) },
                  { label: "Purchases", value: formatNumber(data.purchases) },
                  { label: "CPA", value: formatCurrency(data.cpa) },
                  { label: "CPM", value: formatCurrency(data.cpm) },
                  { label: "Conv. rate", value: formatPercent(data.convRatePct) }
                ].map((m) => (
                  <div key={m.label} className="rounded-xl bg-muted/60 p-3">
                    <div className="text-[10px] uppercase text-muted-foreground">{m.label}</div>
                    <div className="numeric mt-0.5 font-semibold">{m.value}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      <ChartContainer title="ROAS trend" description="Daily Meta vs TikTok">
        <TrendLine
          data={trendByDate}
          xKey="date"
          height={240}
          series={[
            { key: "metaRoas", color: "#1877f2", label: "Meta ROAS" },
            { key: "tiktokRoas", color: "#ff0050", label: "TikTok ROAS" }
          ]}
        />
      </ChartContainer>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartContainer
          className="lg:col-span-2"
          title="Spend vs revenue"
          description="Daily totals across platforms"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={trendByDate} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <RTooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 10,
                  fontSize: 12
                }}
                formatter={(v: number) => formatCurrency(v)}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="metaSpend" name="Meta spend" fill="#1877f2" radius={[6, 6, 0, 0]} stackId="spend" />
              <Bar dataKey="tiktokSpend" name="TikTok spend" fill="#ff0050" radius={[6, 6, 0, 0]} stackId="spend" />
              <Bar dataKey="metaRev" name="Meta revenue" fill="#60a5fa" radius={[6, 6, 0, 0]} stackId="rev" />
              <Bar dataKey="tiktokRev" name="TikTok revenue" fill="#fda4af" radius={[6, 6, 0, 0]} stackId="rev" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="AI insights" description="Auto-analysis of your funnel">
          <div className="space-y-2 p-2">
            {insights.map((i, idx) => (
              <InsightCard key={idx} tone={i.tone} title={i.title}>
                {i.body}
              </InsightCard>
            ))}
            {insights.length === 0 && (
              <div className="text-xs text-muted-foreground">
                Add more campaigns to see insights.
              </div>
            )}
          </div>
        </ChartContainer>
      </div>

      <ChartContainer
        title="Campaign ranking"
        description="Sorted by ROAS"
        action={
          <div className="text-[11px] text-muted-foreground">
            <Activity className="mr-1 inline h-3 w-3" />
            {campaigns.length} campaigns
          </div>
        }
      >
        <div className="max-h-[460px] overflow-auto p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Spend</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">ROAS</TableHead>
                <TableHead className="text-right">CPA</TableHead>
                <TableHead className="text-right">Conv.</TableHead>
                <TableHead className="text-right">Drop-off</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranked.map(({ c, m }, idx) => {
                const tone = m.roas >= 2 ? "success" : m.roas >= 1.5 ? "warning" : "destructive";
                return (
                  <TableRow key={c.id}>
                    <TableCell className="text-xs text-muted-foreground">#{idx + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className="flex h-6 w-6 items-center justify-center rounded-md text-white"
                          style={{ background: c.platform === "meta" ? "#1877f2" : "#000" }}
                        >
                          {c.platform === "meta" ? (
                            <Facebook className="h-3 w-3" />
                          ) : (
                            <TikTokIcon className="h-3 w-3" />
                          )}
                        </span>
                        <span className="max-w-[220px] truncate text-sm font-medium">{c.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmtDate(c.date)}</TableCell>
                    <TableCell className="numeric text-right">{formatCurrency(c.spend)}</TableCell>
                    <TableCell className="numeric text-right">{formatCurrency(c.revenue)}</TableCell>
                    <TableCell className="text-right">
                      <StatusPill
                        status={tone === "success" ? "healthy" : tone === "warning" ? "warning" : "critical"}
                        label={`${m.roas.toFixed(2)}x`}
                      />
                    </TableCell>
                    <TableCell className="numeric text-right">{formatCurrency(m.cpa)}</TableCell>
                    <TableCell className="numeric text-right">{formatPercent(m.convRatePct)}</TableCell>
                    <TableCell className="numeric text-right">{formatPercent(m.funnelDropPct)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => removeCampaign(c.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {campaigns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="py-8 text-center text-sm text-muted-foreground">
                    No campaigns yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </ChartContainer>
    </div>
  );
}
