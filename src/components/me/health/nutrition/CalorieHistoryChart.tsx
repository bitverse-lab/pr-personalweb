"use client";

import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chart } from "@/lib/chart-theme";
import { fmtDate } from "@/features/health/format";


export default function CalorieHistoryChart({ data, target, height = 200 }: { data: { date: string; calories: number }[]; target: number | null; height?: number }) {
  return (
    <div style={{ width: "100%", height }} role="img" aria-label="Calories per day">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid stroke={chart.grid} vertical={false} />
          <XAxis dataKey="date" tickFormatter={(d) => fmtDate(String(d), { day: "numeric" })} tick={{ fontSize: 11, fill: chart.muted }} axisLine={{ stroke: chart.grid }} tickLine={false} interval={0} />
          <YAxis tick={{ fontSize: 11, fill: chart.muted }} axisLine={false} tickLine={false} width={44} />
          <Tooltip cursor={{ fill: "rgba(42,120,214,0.08)" }} labelFormatter={(d) => fmtDate(String(d), { weekday: "short", month: "short", day: "numeric" })} formatter={(v) => [`${v} kcal`, "Calories"]} />
          {target && <ReferenceLine y={target} stroke={chart.muted} strokeDasharray="5 4" label={{ value: `Target ${target}`, position: "insideTopRight", fontSize: 11, fill: chart.muted }} />}
          <Bar dataKey="calories" fill={chart.series1} radius={[4, 4, 0, 0]} maxBarSize={22} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
