"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function ChartContainer({
  title,
  description,
  action,
  children,
  className,
  bodyClassName
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-border/60 bg-card shadow-soft", className)}>
      {(title || description || action) && (
        <div className="flex items-start justify-between gap-4 border-b border-border/60 px-5 py-4">
          <div className="min-w-0">
            {title && <div className="text-sm font-semibold">{title}</div>}
            {description && (
              <div className="mt-0.5 text-xs text-muted-foreground">{description}</div>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn("p-3", bodyClassName)}>{children}</div>
    </div>
  );
}
