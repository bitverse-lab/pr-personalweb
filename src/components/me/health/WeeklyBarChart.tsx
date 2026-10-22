"use client";

import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chart } from "@/lib/chart-theme";
import { fmtDate } from "@/features/health/format";


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
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid stroke={chart.grid} vertical={false} />
          <XAxis dataKey="weekStart" tickFormatter={(d) => fmtDate(String(d))} tick={{ fontSize: 11, fill: chart.muted }} axisLine={{ stroke: chart.grid }} tickLine={false} interval={0} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: chart.muted }} axisLine={false} tickLine={false} width={44} />
          <Tooltip
            cursor={{ fill: "rgba(42,120,214,0.08)" }}
            labelFormatter={(d) => `Week of ${fmtDate(String(d), { month: "short", day: "numeric" })}`}
            formatter={(v) => [`${Number(v).toLocaleString("en-US")} ${unit}`, label]}
          />
          {target ? <ReferenceLine y={target} stroke={chart.muted} strokeDasharray="5 4" label={{ value: `Target ${target}`, position: "insideTopRight", fontSize: 11, fill: chart.muted }} /> : null}
          <Bar dataKey={dataKey} fill={chart.series1} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
