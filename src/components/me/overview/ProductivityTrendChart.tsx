"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chart } from "@/lib/chart-theme";
import type { ActivityPoint } from "./ProductivityHeatmap";

// Single series, so no legend is needed (the chart title names it).

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
          <CartesianGrid stroke={chart.grid} vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: chart.muted }} axisLine={{ stroke: chart.grid }} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: chart.muted }} axisLine={false} tickLine={false} width={28} />
          <Tooltip
            cursor={{ fill: "rgba(42,120,214,0.08)" }}
            formatter={(value) => [`${value} completed`, "Tasks"]}
          />
          <Bar dataKey="count" fill={chart.series1} radius={[4, 4, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
