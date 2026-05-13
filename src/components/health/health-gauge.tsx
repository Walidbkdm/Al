"use client";

import * as React from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { cn } from "@/lib/utils";

export function HealthGauge({
  score,
  label,
  tone = "info",
  size = 220,
  stroke = 14
}: {
  score: number;
  label?: React.ReactNode;
  tone?: "success" | "info" | "warning" | "destructive";
  size?: number;
  stroke?: number;
}) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = (size - stroke) / 2;
  // Arc: 240deg total (from -210 to +30)
  const arcLen = 2 * Math.PI * radius * (240 / 360);
  const baseOffset = 2 * Math.PI * radius * (60 / 360); // invisible portion

  const mv = useMotionValue(0);
  const dashOffset = useTransform(mv, (v) => arcLen - (arcLen * v) / 100);
  const [displayed, setDisplayed] = React.useState(0);

  React.useEffect(() => {
    const controls = animate(mv, clamped, { duration: 1.2, ease: "easeOut" });
    const unsub = mv.on("change", (v) => setDisplayed(Math.round(v)));
    return () => {
      controls.stop();
      unsub();
    };
  }, [clamped, mv]);

  const toneColor = {
    success: "hsl(var(--success))",
    info: "hsl(var(--info))",
    warning: "hsl(var(--warning))",
    destructive: "hsl(var(--destructive))"
  }[tone];

  return (
    <div className="relative flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={size * 0.78} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        <defs>
          <linearGradient id="gauge-grad" x1="0" x2="1">
            <stop offset="0%" stopColor={toneColor} stopOpacity={0.4} />
            <stop offset="100%" stopColor={toneColor} stopOpacity={1} />
          </linearGradient>
          <filter id="gauge-glow">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${arcLen} ${2 * Math.PI * radius}`}
          strokeDashoffset={-baseOffset}
          transform={`rotate(150 ${size / 2} ${size / 2})`}
        />

        {/* Value arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#gauge-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${arcLen} ${2 * Math.PI * radius}`}
          style={{ strokeDashoffset: dashOffset }}
          transform={`rotate(150 ${size / 2} ${size / 2})`}
          filter="url(#gauge-glow)"
        />
      </svg>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <div className="numeric font-display text-5xl font-semibold tabular-nums">{displayed}</div>
        {label && (
          <div className={cn("mt-1 text-xs uppercase tracking-wider text-muted-foreground")}>{label}</div>
        )}
      </div>
    </div>
  );
}
