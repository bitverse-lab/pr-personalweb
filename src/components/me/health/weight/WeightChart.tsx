"use client";

import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtDate } from "@/features/health/format";
import type { WeightChartPoint } from "@/server/services/weight-service";

// Categorical slots 1 (blue) and 2 (orange) from the dataviz reference palette.
const RAW = "#2a78d6";
const AVERAGE = "#eb6834";
const TARGET = "#5f6368";
const GRIDLINE = "#e1e0d9";

export default function WeightChart({ data, targetKg }: { data: WeightChartPoint[]; targetKg: number | null }) {
  return (
    <div style={{ width: "100%", height: 300 }} role="img" aria-label="Weight over time with 7-day average">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <CartesianGrid stroke={GRIDLINE} vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(d) => fmtDate(String(d))}
            tick={{ fontSize: 11, fill: TARGET }}
            axisLine={{ stroke: GRIDLINE }}
            tickLine={false}
            minTickGap={28}
          />
          <YAxis
            domain={[
              (min: number) => Math.floor(Math.min(min, targetKg ?? min) - 1),
              (max: number) => Math.ceil(Math.max(max, targetKg ?? max) + 1),
            ]}
            tick={{ fontSize: 11, fill: TARGET }}
            axisLine={false}
            tickLine={false}
            width={44}
            unit=" kg"
          />
          <Tooltip labelFormatter={(d) => fmtDate(String(d), { weekday: "short", month: "short", day: "numeric", year: "numeric" })} formatter={(value) => [`${value} kg`]} />
          <Legend verticalAlign="top" height={28} iconType="plainline" />
          {targetKg && <ReferenceLine y={targetKg} stroke={TARGET} strokeDasharray="5 4" label={{ value: `Target ${targetKg} kg`, position: "insideBottomRight", fontSize: 11, fill: TARGET }} />}
          <Line name="Weight" dataKey="weightKg" stroke={RAW} strokeWidth={1.5} dot={{ r: 3, fill: RAW }} activeDot={{ r: 5 }} isAnimationActive={false} />
          <Line name="7-day average" dataKey="average" stroke={AVERAGE} strokeWidth={2.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
