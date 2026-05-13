"use client";

import { AlertTriangle, CheckCircle2, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type InsightTone = "positive" | "warning" | "critical" | "neutral";

export function InsightCard({
  tone = "neutral",
  title,
  children,
  className
}: {
  tone?: InsightTone;
  title: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const config = {
    positive: { cls: "border-success/30 bg-success/5 text-success", icon: CheckCircle2 },
    warning: { cls: "border-warning/30 bg-warning/5 text-warning", icon: TrendingUp },
    critical: { cls: "border-destructive/30 bg-destructive/5 text-destructive", icon: AlertTriangle },
    neutral: { cls: "border-border/60 bg-card text-foreground", icon: Sparkles }
  } as const;
  const Cfg = config[tone];
  const Icon = Cfg.icon;

  return (
    <div className={cn("flex items-start gap-3 rounded-xl border p-3", Cfg.cls, className)}>
      <div className="mt-0.5 rounded-md bg-white/40 p-1.5 dark:bg-white/5">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 text-foreground">
        <div className="text-sm font-medium">{title}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}
