"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export function NumberField({
  label,
  value,
  onChange,
  suffix,
  min = 0,
  max,
  step = 1,
  hint,
  className
}: {
  label: React.ReactNode;
  value: number;
  onChange: (v: number) => void;
  suffix?: React.ReactNode;
  min?: number;
  max?: number;
  step?: number;
  hint?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label>{label}</Label>
      <div className="relative">
        <Input
          type="number"
          inputMode="decimal"
          value={Number.isFinite(value) ? value : 0}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const next = Number(e.target.value);
            onChange(Number.isFinite(next) ? next : 0);
          }}
          className={cn(suffix ? "pe-14" : "")}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function SliderField({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  suffix = "%",
  tone = "default"
}: {
  label: React.ReactNode;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  tone?: "default" | "warning" | "destructive";
}) {
  const clamped = Math.min(max, Math.max(min, value));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-[11px]">{label}</Label>
        <div
          className={cn(
            "numeric rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold",
            tone === "warning" && "bg-warning/10 text-warning",
            tone === "destructive" && "bg-destructive/10 text-destructive"
          )}
        >
          {clamped}
          {suffix}
        </div>
      </div>
      <Slider
        value={[clamped]}
        onValueChange={(vs) => onChange(vs[0] ?? 0)}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
}
