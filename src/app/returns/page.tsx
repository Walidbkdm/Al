"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Plus,
  Search,
  Sparkles,
  Trash2
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { KpiCard } from "@/components/common/kpi-card";
import { ChartContainer } from "@/components/charts/chart-container";
import { InsightCard } from "@/components/common/insight-card";
import { WilayaHeatmap } from "@/components/returns/wilaya-heatmap";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { useData } from "@/components/providers/data-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/ui/toaster";
import { DELIVERY_COMPANIES } from "@/lib/delivery-companies";
import { WILAYAS, wilayaName } from "@/lib/wilayas";
import type { DeliveryCompanyId, OrderLog, OrderStatus } from "@/lib/types";
import { companyPerformance, wilayaReturnRates } from "@/lib/calculations";
import { downloadBlob, fmtDate, formatPercent, toCSV, uid } from "@/lib/utils";
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
import { CategoricalBar } from "@/components/charts/bar-chart";

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "delivered", label: "Delivered" },
  { value: "returned", label: "Returned" },
  { value: "refused", label: "Refused" },
  { value: "unreachable", label: "Unreachable" }
];

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "hsl(var(--muted-foreground))",
  confirmed: "hsl(var(--info))",
  delivered: "hsl(var(--success))",
  returned: "hsl(var(--warning))",
  refused: "hsl(var(--destructive))",
  unreachable: "hsl(var(--muted-foreground) / 0.7)"
};

export default function ReturnsPage() {
  const { t, lang } = useI18n();
  const { orderLogs, setOrderLogs } = useData();
  const { toast } = useToast();

  const [search, setSearch] = React.useState("");
  const [companyFilter, setCompanyFilter] = React.useState<DeliveryCompanyId | "all">("all");
  const [selectedWilaya, setSelectedWilaya] = React.useState<string | undefined>(undefined);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<Partial<OrderLog>>({
    date: new Date().toISOString().slice(0, 10),
    wilayaCode: "16",
    company: "yalidine",
    product: "Montre Luxe",
    status: "delivered",
    count: 1
  });

  const filteredLogs = React.useMemo(() => {
    return orderLogs.filter((l) => {
      if (companyFilter !== "all" && l.company !== companyFilter) return false;
      if (selectedWilaya && l.wilayaCode !== selectedWilaya) return false;
      if (search) {
        const q = search.toLowerCase();
        const name = wilayaName(l.wilayaCode, lang === "en" ? "fr" : lang).toLowerCase();
        if (
          !name.includes(q) &&
          !l.product.toLowerCase().includes(q) &&
          !l.company.toLowerCase().includes(q) &&
          !l.status.includes(q)
        )
          return false;
      }
      return true;
    });
  }, [orderLogs, companyFilter, selectedWilaya, search, lang]);

  const heatmap = React.useMemo(() => wilayaReturnRates(filteredLogs), [filteredLogs]);
  const companies = React.useMemo(() => companyPerformance(filteredLogs), [filteredLogs]);

  const totalReturn = heatmap.reduce((acc, h) => acc + h.total * (h.returnRatePct / 100), 0);
  const totalOrders = heatmap.reduce((acc, h) => acc + h.total, 0);
  const avgReturnRate = totalOrders > 0 ? (totalReturn / totalOrders) * 100 : 0;

  // Weekly trend
  const weeklyTrend = React.useMemo(() => {
    const buckets = new Map<string, { week: string; returned: number; delivered: number }>();
    for (const l of filteredLogs) {
      const d = new Date(l.date);
      const year = d.getUTCFullYear();
      const week = Math.ceil(
        (((d as unknown as number) - (new Date(Date.UTC(year, 0, 1)) as unknown as number)) /
          86400000 +
          new Date(Date.UTC(year, 0, 1)).getUTCDay() +
          1) /
          7
      );
      const key = `${year}-W${String(week).padStart(2, "0")}`;
      const cur = buckets.get(key) ?? { week: key, returned: 0, delivered: 0 };
      if (l.status === "delivered") cur.delivered += l.count;
      if (l.status === "returned" || l.status === "refused") cur.returned += l.count;
      buckets.set(key, cur);
    }
    return Array.from(buckets.values()).sort((a, b) => (a.week < b.week ? -1 : 1));
  }, [filteredLogs]);

  const worstWilayas = [...heatmap]
    .filter((h) => h.total >= 5)
    .sort((a, b) => b.returnRatePct - a.returnRatePct)
    .slice(0, 6);
  const bestWilayas = [...heatmap]
    .filter((h) => h.total >= 5)
    .sort((a, b) => a.returnRatePct - b.returnRatePct)
    .slice(0, 6);

  const insights = React.useMemo(() => {
    const msgs: { tone: "positive" | "warning" | "critical" | "neutral"; title: string; body: string }[] = [];
    for (const w of worstWilayas.slice(0, 3)) {
      if (w.returnRatePct >= 35) {
        msgs.push({
          tone: "critical",
          title: `${wilayaName(w.wilayaCode, lang === "en" ? "fr" : lang)}: ${w.returnRatePct.toFixed(1)}% return rate`,
          body: `Dangerous. Exclude this wilaya or switch carriers before next campaign.`
        });
      } else if (w.returnRatePct >= 25) {
        msgs.push({
          tone: "warning",
          title: `${wilayaName(w.wilayaCode, lang === "en" ? "fr" : lang)}: ${w.returnRatePct.toFixed(1)}% returns`,
          body: `Above safe threshold. Tighten scripts and confirm before ship.`
        });
      }
    }
    if (bestWilayas.length > 0) {
      const b = bestWilayas[0];
      msgs.push({
        tone: "positive",
        title: `${wilayaName(b.wilayaCode, lang === "en" ? "fr" : lang)} is your best region`,
        body: `${b.successRatePct.toFixed(1)}% delivery success on ${b.total} orders. Scale spend here.`
      });
    }
    if (companies[0]) {
      msgs.push({
        tone: "neutral",
        title: `${companies[0].company} leads with ${companies[0].successRatePct.toFixed(1)}% success`,
        body: `Consider moving volume from weaker carriers in your risk regions.`
      });
    }
    return msgs.slice(0, 4);
  }, [worstWilayas, bestWilayas, companies, lang]);

  const addLog = () => {
    const log: OrderLog = {
      id: uid("log"),
      date: form.date || new Date().toISOString().slice(0, 10),
      wilayaCode: form.wilayaCode || "16",
      company: (form.company as DeliveryCompanyId) || "yalidine",
      product: form.product || "Produit",
      status: (form.status as OrderStatus) || "delivered",
      count: Number(form.count) || 1
    };
    setOrderLogs((prev) => [log, ...prev]);
    setOpen(false);
    toast({ title: "Order log added", description: "Analytics updated.", variant: "success" });
  };

  const removeLog = (id: string) => {
    setOrderLogs((prev) => prev.filter((l) => l.id !== id));
  };

  const exportCsv = () => {
    const rows = filteredLogs.map((l) => ({
      date: l.date,
      wilaya: wilayaName(l.wilayaCode, lang === "en" ? "fr" : lang),
      wilayaCode: l.wilayaCode,
      company: l.company,
      product: l.product,
      status: l.status,
      count: l.count
    }));
    downloadBlob(toCSV(rows), `order-logs-${new Date().toISOString().slice(0, 10)}.csv`);
    toast({ title: "Logs exported", description: `${rows.length} rows`, variant: "success" });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={<>Module 2</>}
        title={t("module.returns.title")}
        subtitle={t("module.returns.subtitle")}
        actions={
          <>
            <ExportMenu onCsv={exportCsv} label={t("common.export")} />
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4" /> {t("common.add")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New order log</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Wilaya</Label>
                    <Select
                      value={form.wilayaCode}
                      onValueChange={(v) => setForm((f) => ({ ...f, wilayaCode: v }))}
                    >
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
                  <div className="flex flex-col gap-1.5">
                    <Label>Company</Label>
                    <Select
                      value={form.company}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, company: v as DeliveryCompanyId }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DELIVERY_COMPANIES.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Product</Label>
                    <Input
                      value={form.product}
                      onChange={(e) => setForm((f) => ({ ...f, product: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Status</Label>
                    <Select
                      value={form.status}
                      onValueChange={(v) => setForm((f) => ({ ...f, status: v as OrderStatus }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min={1}
                      value={form.count}
                      onChange={(e) => setForm((f) => ({ ...f, count: Number(e.target.value) }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addLog}>Save log</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Avg return rate"
          value={formatPercent(avgReturnRate)}
          tone={avgReturnRate > 25 ? "destructive" : avgReturnRate > 15 ? "warning" : "success"}
          icon={AlertTriangle}
        />
        <KpiCard
          label="Total orders"
          value={totalOrders.toLocaleString()}
          tone="default"
          icon={Sparkles}
        />
        <KpiCard
          label="Best wilaya"
          value={bestWilayas[0] ? wilayaName(bestWilayas[0].wilayaCode, lang === "en" ? "fr" : lang) : "—"}
          sublabel={bestWilayas[0] ? `${bestWilayas[0].successRatePct.toFixed(1)}% success` : "No data"}
          tone="success"
          icon={CheckCircle2}
        />
        <KpiCard
          label="Worst wilaya"
          value={
            worstWilayas[0] ? wilayaName(worstWilayas[0].wilayaCode, lang === "en" ? "fr" : lang) : "—"
          }
          sublabel={worstWilayas[0] ? `${worstWilayas[0].returnRatePct.toFixed(1)}% returns` : "No data"}
          tone="destructive"
          icon={AlertTriangle}
        />
      </div>

      {/* Filters + Heatmap */}
      <ChartContainer
        title="Algeria return heatmap"
        description="Click a wilaya to drill into its orders"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("common.search")}
                className="h-9 w-44 pl-8 text-xs"
              />
            </div>
            <Select value={companyFilter} onValueChange={(v) => setCompanyFilter(v as DeliveryCompanyId | "all")}>
              <SelectTrigger className="h-9 w-40 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All carriers</SelectItem>
                {DELIVERY_COMPANIES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedWilaya && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedWilaya(undefined)}>
                Clear wilaya
              </Button>
            )}
          </div>
        }
      >
        <div className="p-2">
          <WilayaHeatmap
            cells={heatmap}
            lang={lang}
            selected={selectedWilaya}
            onSelect={(code) =>
              setSelectedWilaya((prev) => (prev === code ? undefined : code))
            }
          />
        </div>
      </ChartContainer>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartContainer
          className="lg:col-span-2"
          title="Top 6 worst wilayas"
          description="Sorted by return rate with ≥ 5 resolved orders"
        >
          <CategoricalBar
            data={worstWilayas.map((w) => ({
              name: wilayaName(w.wilayaCode, lang === "en" ? "fr" : lang),
              returnRate: Number(w.returnRatePct.toFixed(1))
            }))}
            xKey="name"
            yKey="returnRate"
            height={240}
            colorFn={(v) =>
              v > 35 ? "hsl(var(--destructive))" : v > 20 ? "hsl(var(--warning))" : "hsl(var(--success))"
            }
          />
        </ChartContainer>
        <ChartContainer title="Delivery carriers" description="Success rate on current filter">
          <div className="space-y-2 p-2">
            {companies.map((c) => (
              <div key={c.company} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-2.5">
                <div>
                  <div className="text-sm font-medium capitalize">{c.company}</div>
                  <div className="text-xs text-muted-foreground">{c.total} orders</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, c.successRatePct)}%` }}
                    />
                  </div>
                  <span className="numeric w-12 text-right text-sm font-semibold">
                    {c.successRatePct.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ChartContainer>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartContainer className="lg:col-span-2" title="Weekly trend" description="Delivered vs returned volume by week">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weeklyTrend} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <RTooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 10,
                  fontSize: 12
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="delivered" stackId="a" fill="hsl(var(--success))" radius={[6, 6, 0, 0]} name="Delivered" />
              <Bar dataKey="returned" stackId="a" fill="hsl(var(--destructive))" radius={[6, 6, 0, 0]} name="Returned" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
        <ChartContainer title="Smart insights" description="Auto-generated from your data">
          <div className="space-y-2 p-2">
            {insights.map((i, idx) => (
              <InsightCard key={idx} tone={i.tone} title={i.title}>
                {i.body}
              </InsightCard>
            ))}
            {insights.length === 0 && <div className="text-xs text-muted-foreground">Add more logs to see insights.</div>}
          </div>
        </ChartContainer>
      </div>

      <ChartContainer
        title="Recent order logs"
        description={
          selectedWilaya
            ? `Filtered to ${wilayaName(selectedWilaya, lang === "en" ? "fr" : lang)}`
            : `${filteredLogs.length} entries`
        }
      >
        <div className="max-h-[420px] overflow-auto p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Wilaya</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.slice(0, 120).map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs text-muted-foreground">{fmtDate(l.date)}</TableCell>
                  <TableCell className="text-sm">
                    <span className="text-xs text-muted-foreground">{l.wilayaCode}</span>{" "}
                    {wilayaName(l.wilayaCode, lang === "en" ? "fr" : lang)}
                  </TableCell>
                  <TableCell className="text-sm capitalize">{l.company}</TableCell>
                  <TableCell className="text-sm">{l.product}</TableCell>
                  <TableCell>
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
                      style={{ color: STATUS_COLORS[l.status], background: `${STATUS_COLORS[l.status]}1A` }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: STATUS_COLORS[l.status] }}
                      />
                      {l.status}
                    </span>
                  </TableCell>
                  <TableCell className="numeric text-right font-medium">{l.count}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => removeLog(l.id)} aria-label="Delete log">
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    No logs match the current filter.
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
