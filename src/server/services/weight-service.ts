import { weightRepository } from "@/server/repositories/weight-repository";
import { healthProfileRepository } from "@/server/repositories/health-profile-repository";
import {
  addDays,
  bmiCategory,
  calcBmi,
  goalProgress,
  monthlyAverages,
  movingAverage,
  weeklyAverages,
  type PeriodAverage,
} from "@/features/health/calc";
import type { WeightRange } from "@/features/health/schema";

export interface WeightChartPoint {
  date: string;
  weightKg: number;
  average: number;
}

export interface WeightEntryDto {
  id: string;
  date: string;
  weightKg: number;
  bodyFatPct: number | null;
  note: string | null;
}

export interface WeightOverview {
  entries: WeightEntryDto[]; // newest first, within range
  chart: WeightChartPoint[]; // oldest first, within range
  weekly: PeriodAverage[];
  monthly: PeriodAverage[];
  latest: WeightEntryDto | null;
  sevenDayAverage: number | null;
  weekDelta: number | null; // this week's average vs last week's
  bmi: { value: number; category: string } | null;
  target: { weightKg: number; startKg: number; progress: number | null } | null;
}

const RANGE_DAYS: Record<WeightRange, number | null> = { "30d": 30, "90d": 90, "1y": 365, all: null };

const toDto = (r: { id: string; date: string; weightKg: number; bodyFatPct: number | null; note: string | null }): WeightEntryDto => ({
  id: r.id,
  date: r.date,
  weightKg: r.weightKg,
  bodyFatPct: r.bodyFatPct,
  note: r.note,
});

export const weightService = {
  async overview(userId: string, range: WeightRange, today: string): Promise<WeightOverview> {
    // Averages must not be distorted by the range toggle only when full history is asked; we always
    // compute them from the whole history so week/month rows are stable, and slice the chart by range.
    const [all, profile] = await Promise.all([weightRepository.list(userId), healthProfileRepository.find(userId)]);
    const days = RANGE_DAYS[range];
    const since = days ? addDays(today, -days) : null;
    const inRange = since ? all.filter((e) => e.date >= since) : all;

    const ma = movingAverage(all, 7);
    const chart = inRange.map((e) => ({ date: e.date, weightKg: e.weightKg, average: ma.get(e.date) ?? e.weightKg }));

    const weekly = weeklyAverages(all);
    const monthly = monthlyAverages(all);
    const latest = all.length ? toDto(all[all.length - 1]) : null;

    const from7 = addDays(today, -6);
    const last7 = all.filter((e) => e.date >= from7 && e.date <= today);
    const sevenDayAverage = last7.length
      ? Math.round((last7.reduce((s, e) => s + e.weightKg, 0) / last7.length) * 10) / 10
      : null;

    const bmi =
      latest && profile?.heightCm
        ? { value: calcBmi(latest.weightKg, profile.heightCm), category: bmiCategory(calcBmi(latest.weightKg, profile.heightCm)) }
        : null;

    const target =
      latest && profile?.targetWeightKg
        ? {
            weightKg: profile.targetWeightKg,
            startKg: all[0].weightKg,
            progress: goalProgress(all[0].weightKg, latest.weightKg, profile.targetWeightKg),
          }
        : null;

    return {
      entries: [...inRange].reverse().map(toDto),
      chart,
      weekly,
      monthly,
      latest,
      sevenDayAverage,
      weekDelta: weekly[0]?.delta ?? null,
      bmi,
      target,
    };
  },
};
