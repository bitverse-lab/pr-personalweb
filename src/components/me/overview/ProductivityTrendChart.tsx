"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ActivityPoint } from "./ProductivityHeatmap";

// Categorical slot 1 (blue), validated default from the dataviz skill's reference
// palette — single series, so no legend is needed (the chart title names it).
const SERIES_COLOR = "#2a78d6";
const GRIDLINE = "#e1e0d9";
const MUTED_INK = "#5f6368";

interface WeekBucket {
  label: string;
  count: number;
}

function toWeeklyBuckets(activity: ActivityPoint[], weeks: number): WeekBucket[] {
  const countByDay = new Map(activity.map((point) => [point.day, point.count]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const buckets: WeekBucket[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const weekEnd = new Date(today.getTime() - w * 7 * 86400000);
    let total = 0;
    for (let d = 0; d < 7; d++) {
      const date = new Date(weekEnd.getTime() - d * 86400000);
      total += countByDay.get(date.toISOString().slice(0, 10)) ?? 0;
    }
    buckets.push({
      label: weekEnd.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      count: total,
    });
  }
  return buckets;
}

export default function ProductivityTrendChart({ activity }: { activity: ActivityPoint[] }) {
  const data = useMemo(() => toWeeklyBuckets(activity, 10), [activity]);

  return (
    <div style={{ width: "100%", height: 180 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke={GRIDLINE} vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: MUTED_INK }} axisLine={{ stroke: GRIDLINE }} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: MUTED_INK }} axisLine={false} tickLine={false} width={28} />
          <Tooltip
            cursor={{ fill: "rgba(42,120,214,0.08)" }}
            formatter={(value) => [`${value} completed`, "Tasks"]}
          />
          <Bar dataKey="count" fill={SERIES_COLOR} radius={[4, 4, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
