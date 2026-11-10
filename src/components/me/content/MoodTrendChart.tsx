"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtDate } from "@/features/health/format";
import { chart } from "@/lib/chart-theme";
import { moodLabel } from "@/features/content/journal-meta";


// Daily mood swings by nature; the average of the last (up to) seven entries shows where it is heading.
function withTrend(data: { date: string; mood: number }[]) {
  return data.map((d, i) => {
    const window = data.slice(Math.max(0, i - 6), i + 1);
    return { ...d, trend: Math.round((window.reduce((n, w) => n + w.mood, 0) / window.length) * 10) / 10 };
  });
}

export default function MoodTrendChart({ data }: { data: { date: string; mood: number }[] }) {
  const points = withTrend(data);
  return (
    <div style={{ width: "100%", height: 180 }} role="img" aria-label="Mood over the last 30 days">
      <ResponsiveContainer>
        <LineChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={chart.grid} vertical={false} />
          <XAxis dataKey="date" tickFormatter={(d) => fmtDate(String(d))} tick={{ fontSize: 11, fill: chart.muted }} axisLine={{ stroke: chart.grid }} tickLine={false} minTickGap={28} />
          <YAxis domain={[1, 5]} ticks={[1, 3, 5]} tickFormatter={(v) => moodLabel(Number(v)) ?? ""} tick={{ fontSize: 11, fill: chart.muted }} axisLine={false} tickLine={false} width={48} />
          <Tooltip
            labelFormatter={(d) => fmtDate(String(d), { weekday: "short", month: "short", day: "numeric" })}
            formatter={(v, name) => (name === "trend" ? [`${v} / 5`, "7-entry average"] : [moodLabel(Number(v)) ?? v, "Mood"])}
          />
          <Line dataKey="mood" stroke="none" dot={{ r: 3, fill: chart.series1Recede, stroke: "none" }} activeDot={{ r: 5 }} isAnimationActive={false} />
          <Line dataKey="trend" type="monotone" stroke={chart.series1} strokeWidth={2.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
