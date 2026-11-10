"use client";

import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtDate } from "@/features/health/format";
import { chart } from "@/lib/chart-theme";
import type { WeightChartPoint } from "@/server/services/weight-service";


export default function WeightChart({ data, targetKg }: { data: WeightChartPoint[]; targetKg: number | null }) {
  return (
    <div style={{ width: "100%", height: 300 }} role="img" aria-label="Weight over time with 7-day average">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={chart.grid} vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(d) => fmtDate(String(d))}
            tick={{ fontSize: 11, fill: chart.muted }}
            axisLine={{ stroke: chart.grid }}
            tickLine={false}
            minTickGap={28}
          />
          <YAxis
            domain={[
              (min: number) => Math.floor(Math.min(min, targetKg ?? min) - 1),
              (max: number) => Math.ceil(Math.max(max, targetKg ?? max) + 1),
            ]}
            tick={{ fontSize: 11, fill: chart.muted }}
            axisLine={false}
            tickLine={false}
            width={52}
            unit=" kg"
          />
          <Tooltip labelFormatter={(d) => fmtDate(String(d), { weekday: "short", month: "short", day: "numeric", year: "numeric" })} formatter={(value) => [`${value} kg`]} />
          <Legend verticalAlign="top" height={28} iconType="plainline" />
          {targetKg && <ReferenceLine y={targetKg} stroke={chart.muted} strokeDasharray="5 4" label={{ value: `Target ${targetKg} kg`, position: "insideBottomRight", fontSize: 11, fill: chart.muted }} />}
          <Line name="Weight" dataKey="weightKg" stroke={chart.series1} strokeWidth={1.5} dot={{ r: 3, fill: chart.series1 }} activeDot={{ r: 5 }} isAnimationActive={false} />
          <Line name="7-day average" dataKey="average" stroke={chart.series2} strokeWidth={2.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
