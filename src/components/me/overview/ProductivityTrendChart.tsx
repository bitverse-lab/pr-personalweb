"use client";

import { addDaysTo } from "@/features/tasks/dates";
import { useMemo } from "react";
import { Bar, BarChart, Cell, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chart } from "@/lib/chart-theme";
import type { ActivityPoint } from "./ProductivityHeatmap";

// Single series, so no legend is needed (the chart title names it).

interface WeekBucket {
  label: string;
  count: number;
}

function toWeeklyBuckets(activity: ActivityPoint[], weeks: number, today: string): WeekBucket[] {
  const countByDay = new Map(activity.map((point) => [point.day, point.count]));
  const buckets: WeekBucket[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const weekEnd = addDaysTo(today, -w * 7);
    let total = 0;
    for (let d = 0; d < 7; d++) total += countByDay.get(addDaysTo(weekEnd, -d)) ?? 0;
    buckets.push({
      label: new Date(`${weekEnd}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
      count: total,
    });
  }
  return buckets;
}

export default function ProductivityTrendChart({ activity, today }: { activity: ActivityPoint[]; today: string }) {
  const data = useMemo(() => toWeeklyBuckets(activity, 10, today), [activity, today]);

  return (
    <div style={{ width: "100%", height: 180 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={chart.grid} vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: chart.muted }} axisLine={{ stroke: chart.grid }} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: chart.muted }} axisLine={false} tickLine={false} width={28} />
          <Tooltip
            cursor={{ fill: "rgba(42,120,214,0.08)" }}
            formatter={(value) => [`${value} completed`, "Tasks"]}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={20}>
            {data.map((_, i) => <Cell key={i} fill={i === data.length - 1 ? chart.series1 : chart.series1Recede} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
