"use client";

import { Bar, BarChart, Cell, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chart } from "@/lib/chart-theme";
import { fmtDate } from "@/features/health/format";


// 12000 → "12k": volume ticks otherwise outgrow the axis.
const compact = (v: number) => (Math.abs(v) >= 1000 ? `${Number((v / 1000).toFixed(1))}k` : String(v));

export default function WeeklyBarChart({
  data,
  dataKey,
  label,
  unit,
  target,
  height = 200,
}: {
  data: { weekStart: string; count: number; volumeKg: number }[];
  dataKey: "count" | "volumeKg";
  label: string;
  unit: string;
  target?: number | null;
  height?: number;
}) {
  return (
    <div style={{ width: "100%", height }} role="img" aria-label={`${label} per week`}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={chart.grid} vertical={false} />
          <XAxis dataKey="weekStart" tickFormatter={(d) => fmtDate(String(d))} tick={{ fontSize: 11, fill: chart.muted }} axisLine={{ stroke: chart.grid }} tickLine={false} interval="preserveStartEnd" minTickGap={16} />
          <YAxis allowDecimals={false} tickFormatter={compact} tick={{ fontSize: 11, fill: chart.muted }} axisLine={false} tickLine={false} width={44} />
          <Tooltip
            cursor={{ fill: "rgba(42,120,214,0.08)" }}
            labelFormatter={(d) => `Week of ${fmtDate(String(d), { month: "short", day: "numeric" })}`}
            formatter={(v) => [`${Number(v).toLocaleString("en-US")} ${unit}`, label]}
          />
          {target ? <ReferenceLine y={target} stroke={chart.muted} strokeDasharray="5 4" label={{ value: `Target ${target}`, position: "insideTopRight", fontSize: 11, fill: chart.muted }} /> : null}
          <Bar dataKey={dataKey} radius={[4, 4, 0, 0]} maxBarSize={22} isAnimationActive={false}>
            {data.map((_, i) => <Cell key={i} fill={i === data.length - 1 ? chart.series1 : chart.series1Recede} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
