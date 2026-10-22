"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtDate } from "@/features/health/format";
import { chart } from "@/lib/chart-theme";
import { moodLabel } from "@/features/content/journal-meta";


export default function MoodTrendChart({ data }: { data: { date: string; mood: number }[] }) {
  return (
    <div style={{ width: "100%", height: 180 }} role="img" aria-label="Mood over the last 30 days">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
          <CartesianGrid stroke={chart.grid} vertical={false} />
          <XAxis dataKey="date" tickFormatter={(d) => fmtDate(String(d))} tick={{ fontSize: 11, fill: chart.muted }} axisLine={{ stroke: chart.grid }} tickLine={false} minTickGap={28} />
          <YAxis domain={[1, 5]} ticks={[1, 3, 5]} tickFormatter={(v) => moodLabel(Number(v)) ?? ""} tick={{ fontSize: 11, fill: chart.muted }} axisLine={false} tickLine={false} width={48} />
          <Tooltip labelFormatter={(d) => fmtDate(String(d), { weekday: "short", month: "short", day: "numeric" })} formatter={(v) => [moodLabel(Number(v)) ?? v, "Mood"]} />
          <Line dataKey="mood" stroke={chart.series1} strokeWidth={2.5} dot={{ r: 3, fill: chart.series1 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
