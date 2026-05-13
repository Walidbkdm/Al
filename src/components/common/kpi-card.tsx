"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export type KpiTone = "default" | "success" | "warning" | "destructive" | "info";

export function KpiCard({
  label,
  value,
  sublabel,
  trend,
  icon: Icon,
  tone = "default",
  className
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  sublabel?: React.ReactNode;
  trend?: { value: number; suffix?: string };
  icon?: React.ComponentType<{ className?: string }>;
  tone?: KpiTone;
  className?: string;
}) {
  const toneClass: Record<KpiTone, string> = {
    default: "text-primary bg-primary/10",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
    destructive: "text-destructive bg-destructive/10",
    info: "text-info bg-info/10"
  };
  const trendDir =
    trend && trend.value > 0 ? "up" : trend && trend.value < 0 ? "down" : "flat";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn("kpi-card", className)}
    >
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        {Icon && (
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", toneClass[tone])}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <div className="numeric font-display text-2xl font-semibold tracking-tight md:text-[28px]">
          {value}
        </div>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium",
              trendDir === "up" && "bg-success/10 text-success",
              trendDir === "down" && "bg-destructive/10 text-destructive",
              trendDir === "flat" && "bg-muted text-muted-foreground"
            )}
          >
            {trendDir === "up" ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : trendDir === "down" ? (
              <ArrowDownRight className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
            {Math.abs(trend.value).toFixed(1)}
            {trend.suffix ?? "%"}
          </span>
        )}
      </div>
      {sublabel && <div className="mt-1 text-xs text-muted-foreground">{sublabel}</div>}
    </motion.div>
  );
}
