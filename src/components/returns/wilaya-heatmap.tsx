"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { WILAYAS, wilayaName } from "@/lib/wilayas";
import { cn } from "@/lib/utils";
import type { Lang } from "@/lib/types";

type HeatCell = {
  wilayaCode: string;
  returnRatePct: number;
  successRatePct: number;
  total: number;
};

function heatColor(rate: number, total: number) {
  if (total === 0) return "hsl(var(--muted))";
  // 0% -> success, 20% -> warning, 40%+ -> destructive
  if (rate >= 40) return "hsl(var(--destructive) / 0.85)";
  if (rate >= 30) return "hsl(var(--destructive) / 0.55)";
  if (rate >= 20) return "hsl(var(--warning) / 0.8)";
  if (rate >= 10) return "hsl(var(--warning) / 0.4)";
  if (rate >= 5) return "hsl(var(--success) / 0.55)";
  return "hsl(var(--success) / 0.75)";
}

export function WilayaHeatmap({
  cells,
  lang = "fr",
  onSelect,
  selected
}: {
  cells: HeatCell[];
  lang?: Lang;
  onSelect?: (code: string) => void;
  selected?: string;
}) {
  const byCode = new Map(cells.map((c) => [c.wilayaCode, c]));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10 xl:grid-cols-12">
        {WILAYAS.map((w, i) => {
          const cell = byCode.get(w.code);
          const rate = cell?.returnRatePct ?? 0;
          const total = cell?.total ?? 0;
          const color = heatColor(rate, total);
          const isSelected = selected === w.code;
          return (
            <Tooltip key={w.code}>
              <TooltipTrigger asChild>
                <motion.button
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.008, duration: 0.25 }}
                  onClick={() => onSelect?.(w.code)}
                  className={cn(
                    "group relative aspect-square overflow-hidden rounded-lg border border-border/60 p-1.5 text-left transition-transform",
                    "hover:scale-[1.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                  style={{
                    backgroundColor: color,
                    color: rate >= 20 || total === 0 ? "#fff" : "rgba(17,24,39,0.88)"
                  }}
                >
                  <div className="flex h-full flex-col justify-between">
                    <span className="text-[9px] font-medium opacity-80">{w.code}</span>
                    <span className="text-[10px] font-semibold leading-tight line-clamp-2">
                      {wilayaName(w.code, lang === "en" ? "fr" : lang)}
                    </span>
                    <span className="numeric text-[10px] font-semibold">
                      {total === 0 ? "—" : `${rate.toFixed(0)}%`}
                    </span>
                  </div>
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-0.5">
                  <div className="font-semibold">
                    {w.nameFr} <span className="text-muted-foreground">· {w.code}</span>
                  </div>
                  <div>Return rate: {rate.toFixed(1)}%</div>
                  <div>Success: {(cell?.successRatePct ?? 0).toFixed(1)}%</div>
                  <div>Total orders: {total}</div>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span className="font-medium">Legend:</span>
        {[
          { label: "< 10%", color: "hsl(var(--success) / 0.75)" },
          { label: "10 – 20%", color: "hsl(var(--warning) / 0.4)" },
          { label: "20 – 30%", color: "hsl(var(--warning) / 0.8)" },
          { label: "30 – 40%", color: "hsl(var(--destructive) / 0.55)" },
          { label: "≥ 40%", color: "hsl(var(--destructive) / 0.85)" },
          { label: "No data", color: "hsl(var(--muted))" }
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm" style={{ background: l.color }} />
            <span>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
