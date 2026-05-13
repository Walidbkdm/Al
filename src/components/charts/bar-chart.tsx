"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const AXIS = { stroke: "hsl(var(--muted-foreground))", fontSize: 11 } as const;

export function CategoricalBar({
  data,
  xKey,
  yKey,
  height = 240,
  colorFn
}: {
  data: Array<Record<string, unknown>>;
  xKey: string;
  yKey: string;
  height?: number;
  colorFn?: (v: number, row: Record<string, unknown>) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} tickLine={false} axisLine={false} {...AXIS} interval={0} angle={0} />
        <YAxis tickLine={false} axisLine={false} {...AXIS} />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 10,
            fontSize: 12
          }}
        />
        <Bar dataKey={yKey} radius={[8, 8, 0, 0]}>
          {data.map((row, i) => {
            const value = Number((row as Record<string, unknown>)[yKey]) || 0;
            const color = colorFn ? colorFn(value, row) : "hsl(var(--primary))";
            return <Cell key={i} fill={color} />;
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
