"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const AXIS = { stroke: "hsl(var(--muted-foreground))", fontSize: 11 } as const;
const GRID_STROKE = "hsl(var(--border))";

export function TrendArea({
  data,
  xKey,
  yKey,
  color = "hsl(var(--primary))",
  height = 220,
  formatter
}: {
  data: Array<Record<string, unknown>>;
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
  formatter?: (v: number) => string;
}) {
  const id = React.useId();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`ta-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.32} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} tickLine={false} axisLine={false} {...AXIS} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => (formatter ? formatter(v) : String(v))}
          {...AXIS}
        />
        <Tooltip
          formatter={(v: number | string) => [
            typeof v === "number" && formatter ? formatter(v) : v,
            yKey
          ]}
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 10,
            fontSize: 12
          }}
        />
        <Area
          type="monotone"
          dataKey={yKey}
          stroke={color}
          strokeWidth={2.2}
          fill={`url(#ta-${id})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function TrendLine({
  data,
  xKey,
  series,
  height = 220
}: {
  data: Array<Record<string, unknown>>;
  xKey: string;
  series: { key: string; color: string; label?: string }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} tickLine={false} axisLine={false} {...AXIS} />
        <YAxis tickLine={false} axisLine={false} {...AXIS} />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 10,
            fontSize: 12
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label ?? s.key}
            stroke={s.color}
            strokeWidth={2.2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
