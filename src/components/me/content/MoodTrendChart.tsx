"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtDate } from "@/features/health/format";
import { moodLabel } from "@/features/content/journal-meta";

const LINE = "#2a78d6";
const MUTED = "#5f6368";
const GRID = "#e1e0d9";

export default function MoodTrendChart({ data }: { data: { date: string; mood: number }[] }) {
  return (
    <div style={{ width: "100%", height: 180 }} role="img" aria-label="Mood over the last 30 days">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="date" tickFormatter={(d) => fmtDate(String(d))} tick={{ fontSize: 11, fill: MUTED }} axisLine={{ stroke: GRID }} tickLine={false} minTickGap={28} />
          <YAxis domain={[1, 5]} ticks={[1, 3, 5]} tickFormatter={(v) => moodLabel(Number(v)) ?? ""} tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} width={48} />
          <Tooltip labelFormatter={(d) => fmtDate(String(d), { weekday: "short", month: "short", day: "numeric" })} formatter={(v) => [moodLabel(Number(v)) ?? v, "Mood"]} />
          <Line dataKey="mood" stroke={LINE} strokeWidth={2.5} dot={{ r: 3, fill: LINE }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
